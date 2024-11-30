import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { DocumentService } from '../../services/document.service';
import { Audit } from '../../entities/audit.entity';
import { Client } from '../../entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audit, Client]),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 5,
    }]),
  ],
  controllers: [ExportsController],
  providers: [ExportsService, DocumentService],
})
export class ExportsModule {} 