import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun } from 'docx';
import { Parser } from 'json2csv';
import { Audit } from '@/types';

export async function generatePDF(audit: Audit): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Add company logo
    if (audit.client?.logo) {
      doc.image(audit.client.logo, 50, 50, { width: 150 });
    }

    // Header
    doc.fontSize(18).text('Safety Audit Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Client: ${audit.client?.name}`);
    doc.text(`Date: ${new Date(audit.createdAt).toLocaleDateString()}`);
    doc.text(`Auditor: ${audit.auditorName}`);
    doc.moveDown();

    // Executive Summary
    doc.fontSize(14).text('Executive Summary', { underline: true });
    doc.fontSize(12).text(`Overall Score: ${calculateOverallScore(audit)}%`);
    doc.moveDown();

    // Sections
    audit.template.sections.forEach(section => {
      doc.fontSize(14).text(section.title, { underline: true });
      doc.moveDown();

      section.fields.forEach(field => {
        const response = audit.responses[field.id];
        if (!response) return;

        doc.fontSize(12).text(field.question);
        doc.fontSize(10).text(`Response: ${response.value}`);
        
        if (response.aiRecommendation) {
          doc.fontSize(10).text('Safety Recommendation:', { color: 'blue' });
          doc.text(response.aiRecommendation);
        }

        if (response.photos?.length) {
          response.photos.forEach(photo => {
            doc.image(photo, { width: 200 });
          });
        }

        doc.moveDown();
      });
    });

    doc.end();
  });
}

export async function generateWord(audit: Audit): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header with logo and basic info
        new Paragraph({
          children: [
            new ImageRun({
              data: audit.client?.logo || '',
              transformation: {
                width: 150,
                height: 75,
              },
            }),
          ],
        }),
        new Paragraph({
          text: 'Safety Audit Report',
          heading: 'Heading1',
        }),
        new Paragraph({
          text: `Client: ${audit.client?.name}`,
        }),
        new Paragraph({
          text: `Date: ${new Date(audit.createdAt).toLocaleDateString()}`,
        }),
        
        // Executive Summary
        new Paragraph({
          text: 'Executive Summary',
          heading: 'Heading2',
        }),
        new Paragraph({
          text: `Overall Score: ${calculateOverallScore(audit)}%`,
        }),

        // Sections and Questions
        ...audit.template.sections.flatMap(section => [
          new Paragraph({
            text: section.title,
            heading: 'Heading2',
          }),
          ...section.fields.map(field => {
            const response = audit.responses[field.id];
            return new Table({
              width: {
                size: 100,
                type: 'pct',
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: field.question })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: `Response: ${response?.value || ''}` })],
                    }),
                  ],
                }),
                ...(response?.aiRecommendation ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({ text: 'Safety Recommendation:', style: 'Emphasis' }),
                          new Paragraph({ text: response.aiRecommendation }),
                        ],
                      }),
                    ],
                  }),
                ] : []),
              ],
            });
          }),
        ]),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

export async function generateCSV(audit: Audit): Promise<string> {
  const fields = [
    'Question',
    'Response',
    'AI Recommendation',
    'Section',
    'Notes',
    'Score',
  ];

  const data = audit.template.sections.flatMap(section =>
    section.fields.map(field => {
      const response = audit.responses[field.id];
      return {
        Question: field.question,
        Response: response?.value || '',
        'AI Recommendation': response?.aiRecommendation || '',
        Section: section.title,
        Notes: response?.notes || '',
        Score: field.scoring?.points || '',
      };
    })
  );

  const parser = new Parser({ fields });
  return parser.parse(data);
}

// Utility function for calculating scores
function calculateOverallScore(audit: Audit): number {
  let totalPoints = 0;
  let maxPoints = 0;

  audit.template.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.scoring?.enabled) {
        const response = audit.responses[field.id];
        if (response) {
          const weight = field.scoring.weight || 1;
          maxPoints += field.scoring.points * weight;
          
          // Calculate points based on response value and type
          let earnedPoints = 0;
          if (field.type === 'boolean' && response.value === 'true') {
            earnedPoints = field.scoring.points;
          } else if (field.type === 'select' && field.scoring.options) {
            earnedPoints = field.scoring.options[response.value] || 0;
          }
          
          totalPoints += earnedPoints * weight;
        }
      }
    });
  });

  return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
}
