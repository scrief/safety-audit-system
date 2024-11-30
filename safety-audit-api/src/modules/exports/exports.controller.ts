import { 
  Controller, 
  Post, 
  Get,
  Param,
  Body, 
  HttpException, 
  HttpStatus, 
  UseInterceptors,
  BadRequestException,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentGeneratorRequest } from '../../types/api';
import { ExportsService } from './exports.service';
import { Throttle } from '@nestjs/throttler';
import { Readable } from 'stream';

@Controller('exports')
export class ExportsController {
  private readonly logger = new Logger(ExportsController.name);

  constructor(private readonly exportsService: ExportsService) {}

  @Get('word/:id')
  async downloadWord(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const buffer = await this.exportsService.generateWord(id);
      
      // Verify buffer integrity
      if (!Buffer.isBuffer(buffer) || buffer.length < 100) {
        throw new Error('Invalid document buffer');
      }

      // Verify Word document magic numbers (PK\003\004)
      const magicNumbers = buffer.slice(0, 4);
      if (!magicNumbers.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
        throw new Error('Invalid document format');
      }

      // Set filename
      const filename = `audit-${id}-${new Date().toISOString().split('T')[0]}.docx`;
      
      // Set complete headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, no-transform');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Connection', 'keep-alive');

      // Create readable stream from buffer
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // Pipe the stream to response
      stream.pipe(res);
    } catch (error) {
      this.logger.error(`Error generating Word document for audit ${id}:`, error);
      throw new HttpException(
        'Failed to generate document',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('word')
  @Throttle({
    default: {
      ttl: 60000,
      limit: 5,
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async generateWord(
    @Body() data: DocumentGeneratorRequest,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Validate request data
      this.validateDocumentRequest(data);

      // Generate document
      const buffer = await this.exportsService.generateDocument(data);

      // Verify buffer integrity
      if (!Buffer.isBuffer(buffer) || buffer.length < 100) {
        throw new Error('Invalid document buffer');
      }

      // Verify Word document magic numbers
      const magicNumbers = buffer.slice(0, 4);
      if (!magicNumbers.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
        throw new Error('Invalid document format');
      }

      // Set filename
      const sanitizedName = this.sanitizeFileName(data.templateName || 'audit-report');
      const filename = `${sanitizedName}-${new Date().toISOString().split('T')[0]}.docx`;
      
      // Set complete headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, no-transform');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Connection', 'keep-alive');

      // Create readable stream from buffer
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // Pipe the stream to response
      stream.pipe(res);
    } catch (error) {
      this.logger.error('Document generation failed:', error);
      throw this.handleExportError(error);
    }
  }

  @Get('pdf/:id')
  async downloadPDF(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const buffer = await this.exportsService.generatePDF(id);
      
      // Set filename
      const filename = `audit-${id}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      
      // Send the PDF
      res.send(buffer);
    } catch (error) {
      this.logger.error(`Error generating PDF for audit ${id}:`, error);
      throw new HttpException(
        'Failed to generate PDF',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private validateDocumentRequest(data: DocumentGeneratorRequest): void {
    if (!data.templateName || !data.clientName) {
      throw new BadRequestException('Missing required fields');
    }

    if (!Array.isArray(data.sections) || !Array.isArray(data.fields)) {
      throw new BadRequestException('Invalid data structure');
    }

    data.sections.forEach(section => {
      if (!section.id || !section.title) {
        throw new BadRequestException('Invalid section structure');
      }
    });

    data.fields.forEach(field => {
      if (!field.id || !field.sectionId || !field.question) {
        throw new BadRequestException('Invalid field structure');
      }
    });
  }

  private sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50);
  }

  private handleExportError(error: unknown): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid document')) {
        throw new HttpException(
          'Failed to generate valid document',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    throw new HttpException(
      'Failed to generate document',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
} 