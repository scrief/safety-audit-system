import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function authenticate(session: any) {
  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

async function getUser(session: any) {
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return user;
}

async function getTemplate(id: string) {
  const template = await prisma.template.findUnique({
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

  if (!template) {
    return NextResponse.json(
      { success: false, error: 'Template not found' },
      { status: 404 }
    );
  }

  return template;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);
    const authResponse = await authenticate(session);
    if (authResponse) return authResponse;

    const template = await getTemplate(id);

    if (template instanceof NextResponse) return template;

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);
    const authResponse = await authenticate(session);
    if (authResponse) return authResponse;

    const user = await getUser(session);
    if (user instanceof NextResponse) return user;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this template' },
        { status: 403 }
      );
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('Starting template duplication for ID:', id);
    
    const session = await getServerSession(authOptions);
    const authResponse = await authenticate(session);
    if (authResponse) return authResponse;

    const user = await getUser(session);
    if (user instanceof NextResponse) return user;

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

    console.log('Found template:', sourceTemplate.id);

    // Create duplicate template data
    const duplicateData = {
      name: `${sourceTemplate.name} (Copy)`,
      description: sourceTemplate.description,
      disclaimer: sourceTemplate.disclaimer,
      userId: user.id,
      sections: {
        create: sourceTemplate.sections.map(section => ({
          title: section.title,
          description: section.description,
          order: section.order,
          weight: section.weight,
          fields: {
            create: section.fields.map(field => ({
              question: field.question,
              type: field.type,
              required: field.required,
              order: field.order,
              options: field.options,
              settings: field.settings,
              aiEnabled: field.aiEnabled,
              scoring: field.scoring,
            })),
          },
        })),
      },
    };

    // Add tags if they exist
    if (sourceTemplate.tags && sourceTemplate.tags.length > 0) {
      duplicateData.tags = {
        connect: sourceTemplate.tags.map(tag => ({ id: tag.id })),
      };
    }

    console.log('Creating duplicate template...');
    const duplicatedTemplate = await prisma.template.create({
      data: duplicateData,
      include: {
        sections: {
          include: {
            fields: true,
          },
        },
        tags: true,
      },
    });

    console.log('Successfully duplicated template:', duplicatedTemplate.id);
    return NextResponse.json({ 
      success: true, 
      data: duplicatedTemplate 
    });

  } catch (error) {
    console.error('Error duplicating template:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to duplicate template',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { 
      status: 500 
    });
  }
}
