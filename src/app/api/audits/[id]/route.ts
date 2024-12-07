import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the ID from the URL instead of params
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Audit ID is required' 
      }, { status: 400 });
    }

    // Authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get the audit with all its related data
    console.log(`[GET Audit] Searching for audit with ID: ${id} for user: ${user.id}`);
    const audit = await prisma.audit.findFirst({
      where: {
        id,
        auditorId: user.id
      },
      include: {
        template: {
          include: {
            sections: {
              include: {
                fields: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        client: true,
        responses: {
          include: {
            field: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!audit) {
      console.log(`[GET Audit] No audit found with ID: ${id} for user: ${user.id}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Audit not found or you don\'t have access to it' 
      }, { status: 404 });
    }

    console.log(`[GET Audit] Successfully found audit: ${audit.id}`);

    return NextResponse.json({ 
      success: true, 
      data: audit 
    });

  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
) {
  try {
    // Get the ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Audit ID is required' 
      }, { status: 400 });
    }

    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get the update data
    const updates = await request.json();

    // Check if the audit exists and belongs to the user
    const audit = await prisma.audit.findFirst({
      where: {
        id,
        auditorId: user.id
      }
    });

    if (!audit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Audit not found or you don\'t have access to it' 
      }, { status: 404 });
    }

    // Update the audit
    const updatedAudit = await prisma.audit.update({
      where: { id },
      data: {
        status: updates.status,
        scoring: updates.scoring,
        completedAt: updates.status === 'COMPLETED' ? new Date() : null,
        responses: {
          upsert: updates.responses?.map((response: any) => ({
            where: {
              auditId_fieldId: {
                auditId: id,
                fieldId: response.fieldId
              }
            },
            create: {
              fieldId: response.fieldId,
              value: response.value,
              notes: response.notes,
              photos: response.photos || [],
              aiRecommendation: response.aiRecommendation
            },
            update: {
              value: response.value,
              notes: response.notes,
              photos: response.photos || [],
              aiRecommendation: response.aiRecommendation
            }
          })) || []
        }
      },
      include: {
        template: {
          include: {
            sections: {
              include: {
                fields: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        client: true,
        responses: {
          include: {
            field: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedAudit 
    });

  } catch (error) {
    console.error('Error updating audit:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return jsonResponse({ 
        success: false, 
        error: 'Authentication required' 
      }, 401);
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return jsonResponse({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    // 3. Find the audit
    const audit = await prisma.audit.findUnique({
      where: { id: params.id }
    });

    if (!audit) {
      return jsonResponse({ 
        success: false, 
        error: 'Audit not found' 
      }, 404);
    }

    // 4. Check ownership
    if (audit.auditorId !== user.id) {
      return jsonResponse({ 
        success: false, 
        error: 'Not authorized to delete this audit' 
      }, 403);
    }

    // 5. Delete the audit
    await prisma.audit.delete({
      where: { id: params.id }
    });

    return jsonResponse({ 
      success: true,
      message: 'Audit deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting audit:', error);
    return jsonResponse({ 
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, 500);
  }
}