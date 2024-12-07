import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating client data
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().min(1, 'Industry is required'),
  employeeCount: z.number().min(1, 'Employee count must be at least 1'),
  locations: z.number().min(1, 'Number of locations must be at least 1'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  contacts: z.array(z.object({
    name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    title: z.string().optional(),
  })).min(1, 'At least one contact is required'),
});

export async function POST(request: Request) {
  try {
    // 1. Check authentication
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    // 4. Create the client
    const client = await prisma.client.create({
      data: {
        name: validatedData.name,
        industry: validatedData.industry,
        employeeCount: validatedData.employeeCount,
        locations: validatedData.locations,
        riskLevel: validatedData.riskLevel,
        contacts: validatedData.contacts, // This will be stored as JSON
      },
    });

    // 5. Return the created client
    return NextResponse.json({
      success: true,
      data: client
    }, { 
      status: 201 
    });

  } catch (error) {
    console.error('Error creating client:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { 
        status: 400 
      });
    }

    // Handle other errors
    return NextResponse.json({ 
      error: 'Failed to create client',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { 
      status: 500 
    });
  }
}

// DELETE route handler
export async function DELETE(request: Request) {
  try {
    // Extract client ID from the URL
    const url = new URL(request.url);
    const clientId = url.pathname.split('/').pop();

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete the client
    await prisma.client.delete({
      where: { id: clientId }
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ 
      error: 'Failed to delete client',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    }, { 
      status: 500 
    });
  }
}