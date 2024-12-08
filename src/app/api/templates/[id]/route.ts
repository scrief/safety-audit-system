import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

function sanitizeField(field: any) {
  return {
    question: field.question.trim(),
    type: field.type,
    description: field.description?.trim() || '',
    required: Boolean(field.required),
    aiEnabled: Boolean(field.aiEnabled),
    order: Number(field.order) || 0,
    options: field.type === 'MULTIPLE_CHOICE' && Array.isArray(field.options) 
      ? field.options.map(opt => ({
          id: String(opt.id),
          text: String(opt.text).trim(),
          value: String(opt.value),
          isCorrect: Boolean(opt.isCorrect)
        }))
      : undefined,
    settings: {
      allowPhotos: Boolean(field.settings?.allowPhotos),
      allowNotes: Boolean(field.settings?.allowNotes),
      maxPhotos: Number(field.settings?.maxPhotos) || 5,
      notesLabel: String(field.settings?.notesLabel || 'Additional Notes'),
      slider: field.settings?.slider ? {
        min: Number(field.settings.slider.min) || 0,
        max: Number(field.settings.slider.max) || 100,
        step: Number(field.settings.slider.step) || 1
      } : undefined
    },
    scoring: field.scoring ? {
      points: Number(field.scoring.points) || 0,
      weight: Number(field.scoring.weight) || 1,
      scoringMethod: field.scoring.scoringMethod || 'binary',
      customScoring: field.scoring.customScoring || null
    } : undefined
  };
}

function sanitizeSection(section: any) {
  return {
    title: section.title.trim(),
    description: section.description || '',
    weight: Number(section.weight) || 1,
    fields: Array.isArray(section.fields) 
      ? section.fields.map((field: any, index: number) => ({
          ...sanitizeField(field),
          order: index
        }))
      : []
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[GET] Starting template fetch...');

    // Get template ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      console.log('[GET] Missing template ID');
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 });
    }

    // Get session and validate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[GET] No authenticated session');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('[GET] User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Fetch template with all related data
    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: user.id,
        isArchived: false
      },
      include: {
        sections: {
          include: {
            fields: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!template) {
      console.log('[GET] Template not found or unauthorized');
      return NextResponse.json({ 
        success: false, 
        error: 'Template not found or unauthorized access' 
      }, { status: 404 });
    }

    console.log('[GET] Template found successfully');
    return NextResponse.json({ 
      success: true, 
      data: template 
    });

  } catch (error) {
    console.error('[GET] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PUT] Starting template update...');
    const { id } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('[PUT] No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      console.log('[PUT] User not found in database');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const payload = await request.json();
    console.log('[PUT] Received payload:', JSON.stringify(payload, null, 2));

    const { name, description, sections } = payload;

    if (!name || !sections) {
      console.log('[PUT] Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Sanitize sections and fields
    console.log('[PUT] Sanitizing sections and fields...');
    const sanitizedSections = sections.map((section: any) => ({
      ...section,
      title: section.title.trim(),
      description: section.description?.trim() || '',
      fields: section.fields.map((field: any) => ({
        ...field,
        question: field.question.trim(),
        description: field.description?.trim() || '',
        required: Boolean(field.required),
        aiEnabled: Boolean(field.aiEnabled),
        options: field.type === 'MULTIPLE_CHOICE' && Array.isArray(field.options)
          ? field.options.map((opt: any) => ({
              id: opt.id,
              text: String(opt.text).trim(),
              value: opt.value,
              isCorrect: Boolean(opt.isCorrect)
            }))
          : {},
        settings: field.settings || {},
        scoring: field.scoring || {}
      }))
    }));

    console.log('[PUT] Starting database transaction...');
    // Update template with transaction
    try {
      const updatedTemplate = await prisma.$transaction(async (tx) => {
        // Delete existing sections
        await tx.section.deleteMany({
          where: { templateId: id }
        });

        // Update template with new data
        return await tx.template.update({
          where: {
            id,
            userId: user.id,
            isArchived: false
          },
          data: {
            name: name.trim(),
            description: description?.trim() || '',
            updatedAt: new Date(),
            sections: {
              create: sanitizedSections.map(section => ({
                title: section.title,
                description: section.description || '',
                order: section.order,
                weight: section.weight,
                fields: {
                  create: section.fields.map(field => ({
                    question: field.question,
                    type: field.type,
                    description: field.description || '',
                    required: field.required,
                    aiEnabled: field.aiEnabled,
                    order: field.order,
                    options: field.options || {},
                    settings: field.settings || {},
                    scoring: field.scoring || {}
                  }))
                }
              }))
            }
          },
          include: {
            sections: {
              include: {
                fields: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        });
      });

      console.log('[PUT] Template updated successfully');
      return NextResponse.json({ 
        success: true, 
        data: updatedTemplate 
      });

    } catch (error) {
      console.error('[PUT] Database transaction failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update template in database',
        details: process.env.NODE_ENV === 'development' ? String(error) : null
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[PUT] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : null
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request
) {
  try {
    console.log('[DELETE] Starting template deletion...');

    // Get template ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      console.log('[DELETE] Missing template ID');
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 });
    }

    // Get session and validate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[DELETE] No authenticated session');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('[DELETE] User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Soft delete the template
    const deletedTemplate = await prisma.template.update({
      where: {
        id,
        userId: user.id,
        isArchived: false
      },
      data: {
        isArchived: true,
        updatedAt: new Date()
      }
    });

    if (!deletedTemplate) {
      console.log('[DELETE] Template not found or unauthorized');
      return NextResponse.json({ 
        success: false, 
        error: 'Template not found or unauthorized access' 
      }, { status: 404 });
    }

    console.log('[DELETE] Template archived successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Template archived successfully'
    });

  } catch (error) {
    console.error('[DELETE] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}