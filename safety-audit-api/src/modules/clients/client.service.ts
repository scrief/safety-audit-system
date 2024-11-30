import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async findAll(): Promise<Client[]> {
    console.log('Finding all clients');
    const clients = await this.clientRepository.find();
    console.log('Found clients:', clients);
    return clients;
  }

  async findOne(id: string): Promise<Client> {
    console.log('Finding client by id:', id);
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      console.log('Client not found:', id);
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    console.log('Found client:', client);
    return client;
  }

  async create(clientData: CreateClientDto): Promise<Client> {
    try {
      // Validate required fields
      if (!clientData.name || !clientData.industry || !clientData.employeeCount || !clientData.locations) {
        throw new BadRequestException('Missing required fields');
      }

      // Validate primaryContact
      if (!clientData.primaryContact || !clientData.primaryContact.name || !clientData.primaryContact.email) {
        throw new BadRequestException('Invalid primary contact information');
      }

      // Validate address
      if (!clientData.address || !clientData.address.street || !clientData.address.city) {
        throw new BadRequestException('Invalid address information');
      }

      // Create client with default values
      const client = this.clientRepository.create({
        ...clientData,
        assignedTemplateIds: clientData.assignedTemplateIds || [],
        totalAuditsCompleted: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedClient = await this.clientRepository.save(client);
      return savedClient;
    } catch (error: unknown) {
      const err = error as Error;
      throw new BadRequestException(
        `Failed to create client: ${err?.message || 'Unknown error'}`
      );
    }
  }

  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    console.log('Updating client:', id, 'with data:', clientData);
    await this.findOne(id); // Verify client exists
    await this.clientRepository.update(id, clientData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    console.log('Removing client:', id);
    const result = await this.clientRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    console.log('Client removed:', id);
  }
}
