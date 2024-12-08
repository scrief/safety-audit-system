import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Template, Section, Field, FieldType } from '@/types';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function isValidTemplateData(data: any): ValidationResult {
  try {
    // Basic data validation
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Template data must be an object' };
    }

    // Required fields validation
    if (!data.name?.trim()) {
      return { isValid: false, error: 'Template name is required' };
    }

    if (!data.description?.trim()) {
      return { isValid: false, error: 'Template description is required' };
    }

    // Sections validation
    if (!Array.isArray(data.sections)) {
      return { isValid: false, error: 'Template sections must be an array' };
    }

    if (data.sections.length === 0) {
      return { isValid: false, error: 'Template must have at least one section' };
    }

    // Validate each section
    for (const section of data.sections) {
      if (!section.title?.trim()) {
        return { isValid: false, error: 'Each section must have a title' };
      }

      if (!Array.isArray(section.fields)) {
        return { isValid: false, error: 'Section fields must be an array' };
      }

      // Validate each field
      for (const field of section.fields) {
        if (!field.question?.trim()) {
          return { isValid: false, error: 'Each field must have a question' };
        }

        if (!field.type) {
          return { isValid: false, error: 'Each field must have a type' };
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Validation error:', error);
    return { isValid: false, error: 'Invalid template structure' };
  }
}

export async function POST(request: Request) {
  try {
    // 1. Session Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let data: any;
    try {
      data = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 3. Get or create user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Validate template data
    const validationResult = isValidTemplateData(data);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // 5. Create template with transaction
    const template = await prisma.$transaction(async (tx) => {
      // Create template
      const newTemplate = await tx.template.create({
        data: {
          name: data.name.trim(),
          description: data.description.trim(),
          userId: user.id,
          disclaimer: data.disclaimer,
          sections: {
            create: data.sections.map((section: Section, sIndex: number) => ({
              title: section.title.trim(),
              order: section.order ?? sIndex,
              weight: section.weight ?? 1,
              fields: {
                create: section.fields.map((field: Field, fIndex: number) => ({
                  question: field.question.trim(),
                  type: field.type,
                  required: Boolean(field.required),
                  order: field.order ?? fIndex,
                  options: field.options ?? null,
                  settings: {
                    ...field.settings,
                    allowPhotos: Boolean(field.settings?.allowPhotos),
                    allowNotes: Boolean(field.settings?.allowNotes),
                    maxPhotos: field.settings?.maxPhotos || 5,
                    notesLabel: field.settings?.notesLabel || 'Additional Notes'
                  },
                  aiEnabled: Boolean(field.aiEnabled),
                  scoring: field.scoring ?? null,
                })),
              },
            })),
          },
        },
        include: {
          sections: {
            include: {
              fields: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return newTemplate;
    });

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: template
    }, { 
      status: 201 // Created
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templates = await prisma.template.findMany({
      where: {
        user: {
          email: session.user.email
        },
        isArchived: false
      },
      include: {
        sections: {
          include: {
            fields: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { 
      status: 500 
    });
  }
}