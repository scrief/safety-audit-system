import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { generatePDF, generateWord, generateCSV } from '@/lib/export';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = new URL(request.url).searchParams.get('format');
    const audit = await prisma.audit.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        template: {
          include: {
            sections: {
              include: {
                fields: true
              }
            }
          }
        },
        responses: {
          include: {
            field: true
          }
        }
      }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    let result;
    switch (format) {
      case 'pdf':
        result = await generatePDF(audit);
        return new NextResponse(result, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="audit-${audit.id}.pdf"`
          }
        });

      case 'word':
        result = await generateWord(audit);
        return new NextResponse(result, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="audit-${audit.id}.docx"`
          }
        });

      case 'csv':
        result = await generateCSV(audit);
        return new NextResponse(result, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit-${audit.id}.csv"`
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
