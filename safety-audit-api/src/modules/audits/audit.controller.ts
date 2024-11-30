import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Audit } from '../../entities/audit.entity';

@Controller('audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(@Query('clientId') clientId?: string): Promise<{ data: Audit[] }> {
    const audits = clientId 
      ? await this.auditService.findByClient(clientId)
      : await this.auditService.findAll();
    return { data: audits };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ data: Audit }> {
    const audit = await this.auditService.findOne(id);
    return { data: audit };
  }

  @Post()
  async create(@Body() audit: Partial<Audit>): Promise<{ data: Audit }> {
    const newAudit = await this.auditService.create(audit);
    return { data: newAudit };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() audit: Partial<Audit>): Promise<{ data: Audit }> {
    const updatedAudit = await this.auditService.update(id, audit);
    return { data: updatedAudit };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.auditService.remove(id);
  }
} 