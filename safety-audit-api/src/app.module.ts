import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Template } from './entities/template.entity';
import { Audit } from './entities/audit.entity';
import { ClientModule } from './modules/clients/client.module';
import { TemplateModule } from './modules/templates/template.module';
import { AuditModule } from './modules/audits/audit.module';
import { AIModule } from './modules/ai/ai.module';
import { ExportsModule } from './modules/exports/exports.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): PostgresConnectionOptions => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Client, Template, Audit],
        synchronize: false,
        logging: true,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false } 
          : false
      }),
      inject: [ConfigService],
    }),
    ClientModule,
    TemplateModule,
    AuditModule,
    AIModule,
    ExportsModule,
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 5,
    }]),
  ],
})
export class AppModule {}
