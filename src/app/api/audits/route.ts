import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

interface CreateAuditPayload {
  templateId: string;
  clientId: string;
}

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const session = await auth(request);
    if (!session?.user?.email) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    // 3. Parse and validate request body
    const rawBody = await request.text();
    let body: CreateAuditPayload;
    
    try {
      body = JSON.parse(rawBody);
      
      if (!body.templateId || !body.clientId) {
        return jsonResponse({ 
          error: 'Invalid request',
          details: 'templateId and clientId are required'
        }, 400);
      }
    } catch (error) {
      return jsonResponse({ 
        error: 'Invalid JSON',
        details: 'Failed to parse request body'
      }, 400);
    }

    // 4. Verify template and client exist
    const [template, client] = await Promise.all([
      prisma.template.findUnique({
        where: { id: body.templateId },
        include: { sections: true }
      }),
      prisma.client.findUnique({
        where: { id: body.clientId }
      })
    ]);

    if (!template) {
      return jsonResponse({ error: 'Template not found' }, 404);
    }

    if (!client) {
      return jsonResponse({ error: 'Client not found' }, 404);
    }

    // 5. Create the audit
    const audit = await prisma.audit.create({
      data: {
        templateId: body.templateId,
        clientId: body.clientId,
        auditorId: user.id,
        status: 'DRAFT',
        scoring: {
          total: 0,
          sections: template.sections.map(section => ({
            sectionId: section.id,
            score: 0,
            maxScore: 0,
            completedFields: 0,
            totalFields: 0
          }))
        }
      },
      include: {
        template: {
          include: {
            sections: {
              include: {
                fields: true
              }
            }
          }
        },
        client: true
      }
    });

    return jsonResponse({ data: audit }, 201);

  } catch (error) {
    console.error('Error creating audit:', error);
    return jsonResponse({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, 500);
  }
}

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
      include: {
        template: {
          select: {
            id: true,
            name: true
          }
        },
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return jsonResponse({ 
      success: true,
      data: audits
    });

  } catch (error) {
    console.error('Error fetching audits:', error);
    return jsonResponse({ 
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, 500);
  }
}