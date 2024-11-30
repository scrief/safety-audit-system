import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentService } from '../../services/document.service';
import { DocumentGeneratorRequest } from '../../types/api';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from '../../entities/audit.entity';
import { Client } from '../../entities/client.entity';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    private readonly documentService: DocumentService,
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async generateDocument(data: DocumentGeneratorRequest): Promise<Buffer> {
    this.logger.log('Generating document for template:', data.templateName);
    return this.documentService.generateDocument(data);
  }

  private processImageData(base64String: string): string {
    try {
      // If it already has the data:image prefix, return as is
      if (base64String.startsWith('data:image/')) {
        return base64String;
      }

      // Check if it's a raw base64 string starting with common image headers
      if (base64String.startsWith('iVBOR')) {  // PNG
        return `data:image/png;base64,${base64String}`;
      }
      if (base64String.startsWith('/9j/')) {   // JPEG
        return `data:image/jpeg;base64,${base64String}`;
      }
      if (base64String.startsWith('R0lGOD')) { // GIF
        return `data:image/gif;base64,${base64String}`;
      }

      // Try to detect image type from the base64 data
      const buffer = Buffer.from(base64String, 'base64');
      if (buffer[0] === 0x89 && buffer[1] === 0x50) { // PNG magic number
        return `data:image/png;base64,${base64String}`;
      }
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) { // JPEG magic number
        return `data:image/jpeg;base64,${base64String}`;
      }

      this.logger.warn('Could not determine image type from base64 data');
      throw new BadRequestException('Invalid image format');
    } catch (error) {
      this.logger.error('Error processing image data:', error);
      throw new BadRequestException('Invalid image data');
    }
  }

  async generateWord(id: string): Promise<Buffer> {
    this.logger.log(`Generating Word document for audit ${id}`);
    
    try {
      // First fetch the audit with relations
      const audit = await this.auditRepository
        .createQueryBuilder('audit')
        .leftJoinAndSelect('audit.client', 'client')
        .where('audit.id = :id', { id })
        .getOne();

      if (!audit) {
        throw new NotFoundException(`Audit with ID ${id} not found`);
      }

      if (!audit.client) {
        // If client relation is missing, try to fetch client directly
        const client = await this.clientRepository.findOne({
          where: { id: audit.clientId }
        });

        if (!client) {
          throw new NotFoundException(`Client not found for audit ${id}`);
        }

        audit.client = client;
      }

      // Process responses to ensure valid image data
      const processedResponses = { ...audit.responses };
      if (audit.responses) {
        for (const fieldId of Object.keys(audit.responses)) {
          const response = audit.responses[fieldId];
          if (response?.photos && Array.isArray(response.photos)) {
            const validPhotos = [];
            let skippedPhotos = 0;

            for (const photo of response.photos) {
              try {
                if (!photo) {
                  this.logger.warn(`Empty photo data in field ${fieldId}`);
                  skippedPhotos++;
                  continue;
                }

                // Process the image data
                const processedPhoto = this.processImageData(photo);
                if (!processedPhoto) {
                  this.logger.warn(`Could not process photo in field ${fieldId}`);
                  skippedPhotos++;
                  continue;
                }

                validPhotos.push(processedPhoto);
              } catch (error) {
                this.logger.error(`Error processing photo in field ${fieldId}:`, error);
                skippedPhotos++;
              }
            }

            if (skippedPhotos > 0) {
              this.logger.warn(`Skipped ${skippedPhotos} invalid photos in field ${fieldId}`);
            }

            if (validPhotos.length === 0) {
              this.logger.warn(`No valid photos found in field ${fieldId}`);
            } else {
              this.logger.log(`Successfully processed ${validPhotos.length} photos in field ${fieldId}`);
            }

            response.photos = validPhotos;
          }
        }
      }

      // Prepare document data
      const documentData: DocumentGeneratorRequest = {
        templateName: audit.templateName,
        clientName: audit.client.name,
        auditorName: audit.auditorName,
        auditorTitle: audit.auditorTitle || '',
        auditorEmail: audit.auditorEmail || '',
        completedAt: audit.completedAt?.toISOString() || new Date().toISOString(),
        sections: audit.sections || [],
        fields: audit.fields || [],
        responses: processedResponses
      };

      this.logger.debug('Processed document data:', {
        templateName: documentData.templateName,
        clientName: documentData.clientName,
        auditorName: documentData.auditorName,
        sectionsCount: documentData.sections.length,
        fieldsCount: documentData.fields.length,
        responsesCount: Object.keys(documentData.responses).length,
        photoFields: Object.entries(processedResponses)
          .filter(([_, response]) => response.photos?.length > 0)
          .map(([fieldId, response]) => ({
            fieldId,
            photoCount: response.photos.length
          }))
      });

      const documentBuffer = await this.documentService.generateDocument(documentData);
      
      // Verify buffer integrity
      if (!Buffer.isBuffer(documentBuffer)) {
        this.logger.error('Generated document is not a valid buffer');
        throw new Error('Invalid document format');
      }

      // Verify minimum size
      if (documentBuffer.length < 100) {
        this.logger.error('Generated document is too small');
        throw new Error('Invalid document size');
      }

      // Verify Word document magic numbers
      const magicNumbers = documentBuffer.slice(0, 4);
      if (!magicNumbers.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
        this.logger.error('Generated document has invalid magic numbers');
        throw new Error('Invalid document format');
      }

      return documentBuffer;
    } catch (error: any) {
      this.logger.error(
        `Error generating Word document: ${error?.message || 'Unknown error'}`, 
        error?.stack
      );
      throw error;
    }
  }

  async generatePDF(id: string): Promise<Buffer> {
    // Your existing generatePDF method
    return Buffer.from('');
  }

  async generateCSV(id: string): Promise<string> {
    // Your existing generateCSV method
    return '';
  }
} 