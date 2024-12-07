import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Attempting to delete client:', params.clientId);

    // Check if the client exists first
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    });

    if (!client) {
      console.log('Client not found:', params.clientId);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if there are any related audits
    const relatedAudits = await prisma.audit.findMany({
      where: { clientId: params.clientId }
    });

    if (relatedAudits.length > 0) {
      console.log('Found related audits:', relatedAudits.length);
      return NextResponse.json(
        { error: 'Cannot delete client with existing audits' },
        { status: 400 }
      );
    }

    // Perform the deletion
    try {
      await prisma.client.delete({
        where: { id: params.clientId }
      });
      console.log('Client deleted successfully:', params.clientId);
    } catch (deleteError) {
      console.error('Prisma delete error:', deleteError);
      return NextResponse.json({
        error: 'Database error during deletion',
        details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
      }, { 
        status: 500 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE handler:', error);
    return NextResponse.json({ 
      error: 'Failed to delete client',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) 
        : undefined
    }, { 
      status: 500 
    });
  }
}

// Optional: Add GET method for fetching client details
export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch client',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) 
        : undefined
    }, { 
      status: 500 
    });
  }
}

// Optional: Add PATCH method for updating clients
export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updatedClient = await prisma.client.update({
      where: { id: params.clientId },
      data: body
    });

    return NextResponse.json({ data: updatedClient });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ 
      error: 'Failed to update client',
      details: process.env.NODE_ENV === 'development' ? 
        error instanceof Error ? error.message : String(error) 
        : undefined
    }, { 
      status: 500 
    });
  }
}