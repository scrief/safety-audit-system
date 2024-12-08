import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await params.id to fix Next.js warning
    const id = await Promise.resolve(params.id);
    console.log('Starting template duplication for ID:', id);
    
    // 1. Session Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to duplicate templates' },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log('User not found:', session.user.email);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get source template with all relations
    const sourceTemplate = await prisma.template.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            fields: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        tags: true,
      },
    });

    if (!sourceTemplate) {
      console.log('Template not found:', id);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // 4. Create the duplicate template
    const duplicateData = {
      name: `${sourceTemplate.name} (Copy)`,
      description: sourceTemplate.description || '',
      disclaimer: sourceTemplate.disclaimer || '',
      userId: user.id,
      sections: {
        create: sourceTemplate.sections.map(section => ({
          title: section.title,
          description: section.description || '',
          order: section.order,
          weight: section.weight || 1,
          fields: {
            create: section.fields.map(field => ({
              question: field.question,
              type: field.type,
              required: field.required,
              order: field.order,
              options: field.options,
              settings: field.settings,
              aiEnabled: field.aiEnabled || false,
              scoring: field.scoring,
            })),
          },
        })),
      },
      tags: sourceTemplate.tags.length > 0 ? {
        connect: sourceTemplate.tags.map(tag => ({
          id: tag.id,
        })),
      } : undefined,
    };

    console.log('Creating duplicate with data:', JSON.stringify(duplicateData, null, 2));

    const duplicatedTemplate = await prisma.template.create({
      data: duplicateData,
      include: {
        sections: {
          include: {
            fields: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        tags: true,
      },
    });

    console.log('Successfully created duplicate:', duplicatedTemplate.id);

    return NextResponse.json({
      success: true,
      data: duplicatedTemplate,
    });

  } catch (error) {
    console.error('Error duplicating template:', error);
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to duplicate template',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}