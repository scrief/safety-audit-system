import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schemas for validation
const fieldSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  type: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  aiEnabled: z.boolean(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1),
    value: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  settings: z.object({
    allowPhotos: z.boolean().optional(),
    allowNotes: z.boolean().optional(),
    maxPhotos: z.number().optional(),
    notesLabel: z.string().optional(),
    slider: z.object({
      min: z.number(),
      max: z.number(),
      step: z.number(),
    }).optional(),
  }).optional(),
  scoring: z.object({
    points: z.number().optional(),
    weight: z.number().optional(),
    scoringMethod: z.string().optional(),
    customScoring: z.any().nullable(),
  }).optional(),
});

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  weight: z.number(),
  fields: z.array(fieldSchema),
});

const templateUpdateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  userId: z.string().min(1),
  sections: z.array(sectionSchema),
});

// PUT handler
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
    console.log('[PUT] Incoming payload:', payload);

    // Validate payload with Zod
    let validatedPayload;
    try {
      validatedPayload = templateUpdateSchema.parse(payload);
    } catch (validationError) {
      console.error('[PUT] Validation error:', validationError);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationError },
        { status: 400 }
      );
    }

    const { id: templateId, name, description, userId, sections } = validatedPayload;

    console.log('[PUT] Sanitized sections:', JSON.stringify(sections, null, 2));

    // Update template with transaction
    try {
      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description.trim(),
          updatedAt: new Date(),
          userId: userId,
          sections: {
            upsert: sections.map(section => ({
              where: { id: section.id || '' }, // Update existing or create new
              create: {
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
              },
              update: {
                title: section.title,
                description: section.description || '',
                order: section.order,
                weight: section.weight,
                fields: {
                  upsert: section.fields.map(field => ({
                    where: { id: field.id || '' },
                    create: {
                      question: field.question,
                      type: field.type,
                      description: field.description || '',
                      required: field.required,
                      aiEnabled: field.aiEnabled,
                      order: field.order,
                      options: field.options || {},
                      settings: field.settings || {},
                      scoring: field.scoring || {}
                    },
                    update: {
                      question: field.question,
                      type: field.type,
                      description: field.description || '',
                      required: field.required,
                      aiEnabled: field.aiEnabled,
                      order: field.order,
                      options: field.options || {},
                      settings: field.settings || {},
                      scoring: field.scoring || {}
                    }
                  }))
                }
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

// GET handler
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    console.log('[GET] Fetching template...');
    const id = await Promise.resolve(context.params.id); // Await params.id
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('[GET] No authenticated user found');
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            fields: true
          }
        }
      }
    });

    if (!template) {
      console.log('[GET] Template not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Template not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('[GET] Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : null
    }, { status: 500 });
  }
}
