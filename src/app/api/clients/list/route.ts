import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { 
        status: 401 
      });
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found' 
      }, { 
        status: 404 
      });
    }

    // 3. Get clients
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // 4. Return formatted response
    return NextResponse.json({ 
      success: true,
      data: clients.map(client => ({
        id: client.id,
        name: client.name,
        industry: client.industry,
        employeeCount: client.employeeCount,
        locations: client.locations,
        riskLevel: client.riskLevel,
        logo: client.logo,
        contacts: client.contacts
      }))
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch clients',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { 
      status: 500 
    });
  }
}