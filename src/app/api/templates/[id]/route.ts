import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

async function getTemplate(id: string, userEmail: string) {
  console.log(`[getTemplate] Getting template. ID: ${id}, User: ${userEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true }
  });

  if (!user?.id) {
    console.log('[getTemplate] User not found');
    return { success: false, error: 'User not found' };
  }

  try {
    const template = await prisma.template.findFirst({
      where: {
        id,
        OR: [
          // Templates created by the user
          {
            userId: user.id,
            isArchived: false
          },
          // Templates assigned to any client
          {
            isArchived: false,
            assignedClients: {
              some: {} // At least one client assignment
            }
          }
        ]
      },
      include: {
        sections: {
          include: {
            fields: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      console.log('[getTemplate] Template not found or no access');
      return { success: false, error: 'Template not found or you don\'t have access to it' };
    }

    return { success: true, data: template };

  } catch (error) {
    console.error('[getTemplate] Database error:', error);
    return { success: false, error: 'Database error occurred while fetching template' };
  }
}

export async function GET(request: Request) {
  try {
    // Get template ID from the URL
    const pathname = new URL(request.url).pathname;
    const id = pathname.split('/').pop();

    if (!id) {
      console.log('[GET] No template ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[GET] No session or email');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const result = await getTemplate(id, session.user.email);
    console.log('[GET] Template fetch result:', { success: result.success, error: result.error });
    
    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.error === 'Template not found' || result.error.includes('access') ? 404 : 500 
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[GET] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Get template ID from the URL
    const pathname = new URL(request.url).pathname;
    const id = pathname.split('/').pop();

    if (!id) {
      console.log('[PUT] No template ID provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[PUT] No session or email');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      console.log('[PUT] User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get the request body
    const updatedTemplate = await request.json();

    // Update the template
    const template = await prisma.template.update({
      where: {
        id,
        userId: user.id, // Ensure the user owns the template
        isArchived: false
      },
      data: {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        sections: {
          deleteMany: {},
          create: updatedTemplate.sections.map((section: any, sectionIndex: number) => ({
            title: section.title,
            order: sectionIndex,
            fields: {
              create: section.fields.map((field: any, fieldIndex: number) => ({
                type: field.type,
                question: field.question,
                required: field.required,
                order: fieldIndex,
                aiEnabled: field.aiEnabled,
                options: field.options,
                settings: field.settings,
                scoring: field.scoring
              }))
            }
          }))
        },
        updatedAt: new Date()
      },
      include: {
        sections: {
          include: {
            fields: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    console.log('[PUT] Template updated successfully');
    return NextResponse.json({ success: true, data: template });

  } catch (error) {
    console.error('[PUT] Error updating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update template',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get template ID from the URL
    const pathname = new URL(request.url).pathname;
    const id = pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if template exists and belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        audits: {
          select: { id: true }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found or you don\'t have permission to delete it' },
        { status: 404 }
      );
    }

    // Check if template has any audits
    if (template.audits.length > 0) {
      // If template has audits, we mark it as archived instead of deleting
      await prisma.template.update({
        where: { id },
        data: { isArchived: true }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Template has been archived because it has associated audits'
      });
    }

    // If no audits exist, proceed with deletion
    // Thanks to onDelete: Cascade in our schema, this will automatically delete:
    // - All sections (which will delete their fields)
    // - All client template assignments
    // - All template tags
    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Template has been permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete template',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}