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

    // 3. Get audits
    const searchParams = new URL(request.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const audits = await prisma.audit.findMany({
      where: {
        userId: user.id,
      },
      include: {
        template: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // 4. Return formatted response
    return NextResponse.json({ 
      success: true,
      data: audits.map(audit => ({
        id: audit.id,
        status: audit.status,
        createdAt: audit.createdAt,
        template: {
          id: audit.template.id,
          name: audit.template.name
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch audits',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { 
      status: 500 
    });
  }
}
