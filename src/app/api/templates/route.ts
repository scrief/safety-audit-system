// src/app/api/templates/route.ts
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
  // Basic data validation
  if (typeof data !== 'object' || data === null) {
    return { isValid: false, error: 'Template data must be an object' };
  }

  // Name validation
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { isValid: false, error: 'Template name is required and must be a non-empty string' };
  }

  // Description validation
  if (typeof data.description !== 'string') {
    return { isValid: false, error: 'Template description must be a string' };
  }

  // Sections validation
  if (!Array.isArray(data.sections)) {
    return { isValid: false, error: 'Template sections must be an array' };
  }

  if (data.sections.length === 0) {
    return { isValid: false, error: 'Template must have at least one section' };
  }

  // Validate each section
  for (let i = 0; i < data.sections.length; i++) {
    const section = data.sections[i];
    
    if (typeof section !== 'object' || section === null) {
      return { isValid: false, error: `Section at index ${i} must be an object` };
    }

    if (typeof section.title !== 'string' || section.title.trim().length === 0) {
      return { isValid: false, error: `Section at index ${i} must have a non-empty title` };
    }

    if (typeof section.order !== 'number') {
      return { isValid: false, error: `Section at index ${i} must have a numeric order` };
    }

    if (!Array.isArray(section.fields)) {
      return { isValid: false, error: `Section at index ${i} must have a fields array` };
    }

    // Validate each field in the section
    for (let j = 0; j < section.fields.length; j++) {
      const field = section.fields[j];

      if (typeof field !== 'object' || field === null) {
        return { isValid: false, error: `Field at index ${j} in section ${i} must be an object` };
      }

      if (typeof field.question !== 'string' || field.question.trim().length === 0) {
        return { isValid: false, error: `Field at index ${j} in section ${i} must have a non-empty question` };
      }

      if (typeof field.type !== 'string' || !Object.values(FieldType).includes(field.type)) {
        return { isValid: false, error: `Field at index ${j} in section ${i} has invalid type` };
      }

      if (typeof field.required !== 'boolean') {
        return { isValid: false, error: `Field at index ${j} in section ${i} must have a boolean required property` };
      }

      if (typeof field.order !== 'number') {
        return { isValid: false, error: `Field at index ${j} in section ${i} must have a numeric order` };
      }

      if (field.options !== undefined && field.options !== null && typeof field.options !== 'object') {
        return { isValid: false, error: `Field at index ${j} in section ${i} has invalid options format` };
      }

      if (field.settings !== undefined && field.settings !== null && typeof field.settings !== 'object') {
        return { isValid: false, error: `Field at index ${j} in section ${i} has invalid settings format` };
      }

      if (typeof field.aiEnabled !== 'boolean') {
        return { isValid: false, error: `Field at index ${j} in section ${i} must have a boolean aiEnabled property` };
      }
    }
  }

  return { isValid: true };
}

export async function POST(request: Request) {
  try {
    // 1. Session Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to create templates' },
        { status: 401 }
      );
    }

    // 2. Get or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: {
        email: session.user.email,
        name: session.user.name || session.user.email,
        role: 'USER'
      }
    });

    // 3. Parse and validate incoming data
    const data = await request.json();
    console.log('Received template data:', JSON.stringify(data, null, 2));

    // 4. Validate template structure
    const validationResult = isValidTemplateData(data);
    if (!validationResult.isValid) {
      console.error('Template validation failed:', validationResult.error);
      return NextResponse.json(
        { success: false, error: validationResult.error || 'Invalid template structure' },
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
              title: section.title,
              order: section.order ?? sIndex,
              weight: section.weight ?? 1,
              fields: {
                create: section.fields.map((field: Field, fIndex: number) => ({
                  question: field.question,
                  type: field.type,
                  required: field.required ?? false,
                  order: field.order ?? fIndex,
                  options: field.options ?? [],
                  settings: field.settings ?? {},
                  aiEnabled: field.aiEnabled ?? false,
                  scoring: field.scoring ?? {},
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
    });

  } catch (error) {
    console.error('Error creating template:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template'
    }, { 
      status: 500 
    });
  }
}