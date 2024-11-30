import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from '../../entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
  ) {}

  async findAll(): Promise<Audit[]> {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByClient(clientId: string): Promise<Audit[]> {
    return this.auditRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Audit> {
    const audit = await this.auditRepository.findOne({ where: { id } });
    if (!audit) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }
    return audit;
  }

  async create(audit: Partial<Audit>): Promise<Audit> {
    const newAudit = this.auditRepository.create(audit);
    return this.auditRepository.save(newAudit);
  }

  async update(id: string, audit: Partial<Audit>): Promise<Audit> {
    await this.findOne(id);
    await this.auditRepository.update(id, audit);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.auditRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Audit with ID ${id} not found`);
    }
  }
} 