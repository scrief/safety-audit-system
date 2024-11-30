import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TemplateService } from './template.service';
import { Template } from '../../entities/template.entity';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async findAll(): Promise<{ data: Template[] }> {
    console.log('GET /templates request received');
    const templates = await this.templateService.findAll();
    console.log('Returning templates:', templates);
    return { data: templates };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ data: Template }> {
    console.log('GET /templates/:id request received, id:', id);
    const template = await this.templateService.findOne(id);
    console.log('Returning template:', template);
    return { data: template };
  }

  @Post()
  async create(@Body() template: Partial<Template>): Promise<Template> {
    console.log('POST /templates request received with data:', template);
    const result = await this.templateService.create(template);
    console.log('Created template:', result);
    return result;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() template: Partial<Template>): Promise<Template> {
    return this.templateService.update(id, template);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.templateService.remove(id);
  }
} 