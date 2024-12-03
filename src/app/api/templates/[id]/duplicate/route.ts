import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Starting template duplication for ID:', params.id);
    
    // 1. Session Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('No session found');
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

    console.log('Found user:', user.id);

    // 3. Get source template with all relations
    const sourceTemplate = await prisma.template.findUnique({
      where: { id: params.id },
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
      console.log('Template not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log('Found template:', sourceTemplate.id);
    console.log('Template sections:', sourceTemplate.sections.length);
    console.log('Template tags:', sourceTemplate.tags.length);

    // 4. Create duplicate template with all relations
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
              options: field.options || null,
              settings: field.settings || null,
              aiEnabled: field.aiEnabled || false,
              scoring: field.scoring || null,
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
