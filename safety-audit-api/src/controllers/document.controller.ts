import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentService } from '../services/document.service';
import { DocumentGeneratorRequest } from '../types/api';

@Controller('api/generate-document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async generateDocument(
    @Body() data: DocumentGeneratorRequest,
    @Res() res: Response
  ) {
    try {
      const buffer = await this.documentService.generateDocument(data);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${data.templateName}-${new Date().toLocaleDateString()}.docx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error generating document:', error);
      res.status(500).json({ error: 'Failed to generate document' });
    }
  }
} 