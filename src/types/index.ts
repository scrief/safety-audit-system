export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  YES_NO = 'YES_NO',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOX = 'CHECKBOX',
  DATE = 'DATE',
  SLIDER = 'SLIDER',
  INSTRUCTION = 'INSTRUCTION'
}

export interface Field {
  id: string;
  sectionId: string;
  question: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: any | null; // Json in Prisma
  settings?: any | null; // Json in Prisma
  aiEnabled: boolean;
  scoring?: any | null; // Json in Prisma
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  templateId?: string;
  weight: number;
  fields: Field[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  userId: string;
  disclaimer?: string | null;
  sections: Section[];
  tags: Tag[];
  createdAt?: Date;
  updatedAt?: Date;
  isArchived?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditResponse {
  value: string | number | boolean | string[];
  aiRecommendation?: string;
  notes?: string;
  photos?: string[];
}

export interface Audit {
  id?: string;
  templateId: string;
  userId: string;
  status: 'draft' | 'completed';
  responses: Record<string, AuditResponse>;
  score?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  locations: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  logo?: string;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    title?: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  message?: string;
}