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
