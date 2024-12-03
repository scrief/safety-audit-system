import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Session Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to view templates' },
        { status: 401 }
      );
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Fetch templates with sections and fields
    const templates = await prisma.template.findMany({
      where: {
        userId: user.id,
        isArchived: false,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { 
      status: 500 
    });
  }
}
