import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get templates - either created by user or assigned to their clients
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          // Templates created by the user
          {
            userId: user.id,
            isArchived: false
          },
          // Templates assigned to any client (we'll refine this if needed)
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

    // 4. Return formatted response
    return NextResponse.json({ 
      success: true,
      data: templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        sections: template.sections.map(section => ({
          id: section.id,
          title: section.title,
          fields: section.fields.map(field => ({
            id: field.id,
            question: field.question,
            type: field.type,
            required: field.required,
            order: field.order,
            options: field.options,
            settings: field.settings,
            scoring: field.scoring
          }))
        }))
      }))
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch templates',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { 
      status: 500 
    });
  }
}