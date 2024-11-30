import { Injectable, Logger } from '@nestjs/common';
import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Packer,
  HeadingLevel,
  BorderStyle,
  convertInchesToTwip,
  VerticalAlign,
  TableLayoutType,
} from 'docx';
import PDFDocument from 'pdfkit';
import { DocumentGeneratorRequest } from '../types/api';
import sanitizeHtml from 'sanitize-html';
import sizeOf from 'image-size';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  type: 'jpg' | 'png';
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly MAX_IMAGE_WIDTH = 400;
  private readonly MAX_IMAGE_HEIGHT = 300;

  // Add PDF-specific styles to match Word styling
  private readonly PDF_STYLES = {
    fonts: {
      regular: 'Helvetica',  // Closest to Segoe UI
      bold: 'Helvetica-Bold'
    },
    fontSize: {
      title: 24,      // PDF points are different from Word points
      section: 16,
      question: 12,
      answer: 11
    },
    colors: {
      primary: '#2563EB',
      gray: {
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937'
      }
    },
    spacing: {
      title: 30,
      section: 20,
      question: 15,
      answer: 10
    },
    margins: {
      top: 72,    // 1 inch = 72 points in PDF
      right: 72,
      bottom: 72,
      left: 72
    }
  };

  private sanitizeText(text: string): string {
    return sanitizeHtml(text || '', {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  private async processImage(base64String: string): Promise<ProcessedImage> {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Get image dimensions
      const dimensions = sizeOf(buffer);
      if (!dimensions.width || !dimensions.height) {
        throw new Error('Invalid image dimensions');
      }

      // Calculate scaled dimensions
      let width = dimensions.width;
      let height = dimensions.height;

      if (width > this.MAX_IMAGE_WIDTH) {
        const ratio = this.MAX_IMAGE_WIDTH / width;
        width = this.MAX_IMAGE_WIDTH;
        height = Math.round(height * ratio);
      }

      if (height > this.MAX_IMAGE_HEIGHT) {
        const ratio = this.MAX_IMAGE_HEIGHT / height;
        height = this.MAX_IMAGE_HEIGHT;
        width = Math.round(width * ratio);
      }

      // Determine image type
      const type = dimensions.type === 'png' ? 'png' : 'jpg';

      return { buffer, width, height, type };
    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  async generatePDF(data: DocumentGeneratorRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create a simple PDF document
        const doc = new PDFDocument({
          size: 'A4',
          autoFirstPage: true,
          margin: 50
        });

        // Create a buffer to store the PDF
        const chunks: any[] = [];

        // Collect the PDF data chunks
        doc.on('data', chunk => chunks.push(chunk));

        // When the PDF is done being generated
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });

        // Handle any errors
        doc.on('error', err => {
          reject(err);
        });

        // Start adding content
        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .text(data.templateName || 'Audit Report', {
            align: 'center'
          })
          .moveDown();

        // Add metadata
        doc
          .font('Helvetica')
          .fontSize(12)
          .text(`Client: ${data.clientName || ''}`)
          .text(`Auditor: ${data.auditorName || ''}`)
          .text(`Date: ${new Date().toLocaleDateString()}`)
          .moveDown();

        // Process sections
        for (const section of data.sections) {
          // Add section title
          doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(section.title)
            .moveDown();

          // Process fields in this section
          const sectionFields = data.fields.filter(f => f.sectionId === section.id);
          for (const field of sectionFields) {
            const response = data.responses[field.id] || {};

            // Add question
            doc
              .font('Helvetica-Bold')
              .fontSize(12)
              .text(field.question)
              .moveDown(0.5);

            // Add response if present
            if (response.value) {
              doc
                .font('Helvetica')
                .fontSize(11)
                .text(response.value, {
                  indent: 20
                })
                .moveDown();
            }

            // Add photos if present
            if (response.photos?.length) {
              for (const photo of response.photos) {
                try {
                  // Process the base64 image
                  const imageData = Buffer.from(photo, 'base64');
                  
                  // Add the image to the PDF
                  doc.image(imageData, {
                    fit: [400, 300],
                    align: 'center'
                  });
                  
                  doc.moveDown();
                } catch (error) {
                  console.error('Error adding photo to PDF:', error);
                }
              }
            }

            doc.moveDown();
          }

          // Add a page break after each section (except the last one)
          if (section !== data.sections[data.sections.length - 1]) {
            doc.addPage();
          }
        }

        // Finalize the PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  private calculateImageDimensions(
    imgWidth: number,
    imgHeight: number,
    maxWidth: number
  ): { width: number; height: number } {
    const ratio = imgHeight / imgWidth;
    let width = Math.min(maxWidth, this.MAX_IMAGE_WIDTH);
    let height = width * ratio;

    if (height > this.MAX_IMAGE_HEIGHT) {
      height = this.MAX_IMAGE_HEIGHT;
      width = height / ratio;
    }

    return { width, height };
  }

  async generateDocument(data: DocumentGeneratorRequest): Promise<Buffer> {
    try {
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: await this.generateDocumentContent(data),
        }],
        styles: {
          default: {
            document: {
              run: {
                font: 'Segoe UI',
              },
            },
          },
        },
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      this.logger.error('Error generating document:', error);
      throw error;
    }
  }

  private async generateDocumentContent(data: DocumentGeneratorRequest): Promise<(Paragraph | Table)[]> {
    const docElements: (Paragraph | Table)[] = [];

    // Add title
    docElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: this.sanitizeText(data.templateName || 'Audit Report'),
            bold: true,
            size: 32,
            font: 'Segoe UI'
          }),
        ],
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER,
      })
    );

    // Process sections and fields
    for (const section of data.sections) {
      docElements.push(
        new Paragraph({
          text: this.sanitizeText(section.title),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        })
      );

      const sectionFields = data.fields.filter(f => f.sectionId === section.id);
      for (const field of sectionFields) {
        const response = data.responses[field.id] || {};

        // Add question
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: this.sanitizeText(field.question),
                bold: true,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        // Add response if present
        if (response.value) {
          docElements.push(
            new Paragraph({
              text: this.sanitizeText(response.value),
              spacing: { before: 100, after: 200 },
              indent: { left: convertInchesToTwip(0.5) },
            })
          );
        }

        // Process photos if present
        if (response.photos?.length) {
          const photoTable = await this.processPhotosToTable(response.photos);
          if (photoTable) {
            docElements.push(photoTable);
          }
        }
      }
    }

    return docElements;
  }

  private async processPhotosToTable(photos: string[]): Promise<Table | null> {
    try {
      const rows: TableRow[] = [];
      const processedPhotos: ProcessedImage[] = [];

      // Process all photos first
      for (const photo of photos) {
        try {
          const processed = await this.processImage(photo);
          processedPhotos.push(processed);
        } catch (error) {
          this.logger.error('Error processing photo:', error);
        }
      }

      // Create table rows
      for (const processedPhoto of processedPhotos) {
        const cells: TableCell[] = [];

        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: processedPhoto.buffer,
                    transformation: {
                      width: processedPhoto.width,
                      height: processedPhoto.height,
                    },
                    type: processedPhoto.type
                  }),
                ],
                spacing: { after: 200 },
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.NONE, size: 0 },
              right: { style: BorderStyle.NONE, size: 0 }
            }
          })
        );

        rows.push(new TableRow({ children: cells }));
      }

      if (rows.length === 0) {
        return null;
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 }
        },
        rows,
        layout: TableLayoutType.FIXED,
        columnWidths: [100],
        alignment: AlignmentType.CENTER,
      });
    } catch (error) {
      this.logger.error('Error creating photo table:', error);
      return null;
    }
  }
}