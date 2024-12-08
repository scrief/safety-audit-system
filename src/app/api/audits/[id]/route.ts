import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({ 
      success: true, 
      data: audit 
    });

  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
) {
  try {
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

    const updates = await request.json();
    console.log('Received update data:', updates);

    const audit = await prisma.audit.findFirst({
      where: {
        id,
        auditorId: user.id
      },
      include: {
        responses: true
      }
    });

    if (!audit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Audit not found or you don\'t have access to it' 
      }, { status: 404 });
    }

    // Update using transaction for data consistency
    const updatedAudit = await prisma.$transaction(async (prisma) => {
      // Handle existing responses
      if (updates.responses) {
        // Delete existing responses that aren't in the update
        const updatedFieldIds = updates.responses.map(r => r.fieldId);
        await prisma.response.deleteMany({
          where: {
            auditId: id,
            NOT: {
              fieldId: {
                in: updatedFieldIds
              }
            }
          }
        });

        // Update or create responses
        for (const response of updates.responses) {
          await prisma.response.upsert({
            where: {
              auditId_fieldId: {
                auditId: id,
                fieldId: response.fieldId
              }
            },
            create: {
              auditId: id,
              fieldId: response.fieldId,
              value: response.value?.toString() || '',
              notes: response.notes || '',
              photos: response.photos || [],
              aiRecommendation: response.aiRecommendation || null
            },
            update: {
              value: response.value?.toString() || '',
              notes: response.notes || '',
              photos: response.photos || [],
              aiRecommendation: response.aiRecommendation || null
            }
          });
        }
      }

      // Update the audit
      return prisma.audit.update({
        where: { id },
        data: {
          status: updates.status,
          scoring: updates.scoring,
          completedAt: updates.status === 'COMPLETED' ? new Date() : null
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
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const audit = await prisma.audit.findFirst({
      where: {
        id: params.id,
        auditorId: user.id
      }
    });

    if (!audit) {
      return NextResponse.json({ 
        success: false, 
        error: 'Audit not found or you don\'t have access to it' 
      }, { status: 404 });
    }

    await prisma.audit.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Audit deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting audit:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}