import { IsNotEmpty, IsString, IsNumber, IsEnum, IsObject, IsOptional, IsArray } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  industry: string;

  @IsOptional()
  @IsString()
  subIndustry?: string;

  @IsNotEmpty()
  @IsNumber()
  employeeCount: number;

  @IsNotEmpty()
  @IsNumber()
  locations: number;

  @IsNotEmpty()
  @IsEnum(['Low', 'Medium', 'High'])
  riskLevel: 'Low' | 'Medium' | 'High';

  @IsNotEmpty()
  @IsObject()
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };

  @IsNotEmpty()
  @IsObject()
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  assignedTemplateIds?: string[];

  @IsOptional()
  lastAuditDate?: Date;
}
