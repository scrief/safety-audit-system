import { Controller, Get, Post, Put, Delete, Body, Param, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from '../../entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientController {
  private readonly logger = new Logger(ClientController.name);

  constructor(private readonly clientService: ClientService) {}

  @Get()
  async findAll(): Promise<{ data: Client[] }> {
    this.logger.log('GET /clients request received');
    const clients = await this.clientService.findAll();
    this.logger.log('Returning clients:', clients);
    return { data: clients };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ data: Client }> {
    this.logger.log('GET /clients/:id request received, id:', id);
    const client = await this.clientService.findOne(id);
    return { data: client };
  }

  @Post()
  async create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    try {
      const result = await this.clientService.create(createClientDto);
      return result;
    } catch (error: any) {
      this.logger.error('Error creating client:', error);
      if (error?.code === '23505') {
        throw new ConflictException('Client with this name already exists');
      }
      throw new InternalServerErrorException(
        'Failed to create client',
        error?.message
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() client: Partial<Client>): Promise<{ data: Client }> {
    const updatedClient = await this.clientService.update(id, client);
    return { data: updatedClient };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.clientService.remove(id);
  }
}
