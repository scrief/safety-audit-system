import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function jsonResponse(data: any, status = 200) {
  try {
    console.log('Creating JSON response:', { status, data });
    const json = JSON.stringify(data);
    console.log('Stringified JSON:', json);
    const response = new NextResponse(json, {
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    console.log('Created response object:', response);
    return response;
  } catch (error) {
    console.error('Error in jsonResponse:', error);
    const fallbackResponse = JSON.stringify({
      success: false,
      error: 'Error creating response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return new NextResponse(fallbackResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

interface CreateAuditPayload {
  templateId: string;
  clientId: string;
}

export async function POST(request: Request) {
  console.log('Starting POST /api/audits handler');
  try {
    // 1. Authentication
    console.log('Checking authentication...');
    const session = await auth(request);
    if (!session?.user?.email) {
      console.log('No authenticated user found');
      return jsonResponse({ 
        success: false,
        error: 'Authentication required' 
      }, 401);
    }

    // 2. Get user
    console.log('Getting user details for:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log('User not found in database');
      return jsonResponse({ 
        success: false,
        error: 'User not found' 
      }, 404);
    }

    // 3. Parse request body
    console.log('Parsing request body...');
    let body: CreateAuditPayload;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      console.log('Parsed request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return jsonResponse({ 
        success: false,
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Failed to parse request body'
      }, 400);
    }

    if (!body.templateId || !body.clientId) {
      console.log('Missing required fields');
      return jsonResponse({ 
        success: false,
        error: 'Missing required fields',
        details: 'templateId and clientId are required'
      }, 400);
    }

    // 4. Get template
    console.log('Fetching template:', body.templateId);
    const template = await prisma.template.findUnique({
      where: { id: body.templateId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!template) {
      console.log('Template not found');
      return jsonResponse({ 
        success: false,
        error: 'Template not found' 
      }, 404);
    }

    // 5. Get client
    console.log('Fetching client:', body.clientId);
    const client = await prisma.client.findUnique({
      where: { id: body.clientId }
    });

    if (!client) {
      console.log('Client not found');
      return jsonResponse({ 
        success: false,
        error: 'Client not found' 
      }, 404);
    }

    // 6. Create responses array
    console.log('Creating field responses...');
    const fieldResponses = template.sections.flatMap(section =>
      section.fields.map(field => ({
        field: { connect: { id: field.id } },
        value: '',
        photos: [],
        notes: '',
        aiRecommendation: null
      }))
    );

    // 7. Create audit
    console.log('Creating audit...');
    try {
      const audit = await prisma.audit.create({
        data: {
          client: { connect: { id: client.id } },
          template: { connect: { id: template.id } },
          auditor: { connect: { id: user.id } },
          status: 'DRAFT',
          responses: {
            create: fieldResponses
          },
          scoring: {
            total: 0,
            sections: template.sections.map(section => ({
              sectionId: section.id,
              score: 0,
              maxScore: 0,
              completedFields: 0,
              totalFields: section.fields.length
            }))
          }
        },
        include: {
          template: true,
          client: true,
          responses: {
            include: {
              field: true
            }
          }
        }
      });

      console.log('Audit created successfully:', audit.id);
      return jsonResponse({ 
        success: true,
        data: audit 
      }, 201);

    } catch (prismaError) {
      console.error('Prisma error creating audit:', prismaError);
      return jsonResponse({ 
        success: false,
        error: 'Database error',
        details: prismaError instanceof Error ? prismaError.message : 'Failed to create audit'
      }, 500);
    }

  } catch (error) {
    console.error('Unhandled error in POST handler:', error);
    return jsonResponse({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, 500);
  }
}

// The GET handler remains the same...
export async function GET(request: Request) {
  try {
    const session = await auth(request);
    if (!session?.user?.email) {
      return jsonResponse({ 
        success: false, 
        error: 'Authentication required' 
      }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return jsonResponse({ 
        success: false, 
        error: 'User not found' 
      }, 404);
    }

    const audits = await prisma.audit.findMany({
      where: {
        auditorId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            sections: {
              include: {
                fields: true
              }
            }
          }
        },
        client: true,
        responses: {
          include: {
            field: true
          }
        }
      }
    });

    return jsonResponse({ 
      success: true,
      data: audits
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return jsonResponse({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, 500);
  }
}