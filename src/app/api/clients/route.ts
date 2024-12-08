import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get session user
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Get all clients
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Return clients
    return NextResponse.json({
      success: true,
      data: clients
    });

  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch clients',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}