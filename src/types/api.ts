export interface Client {
  id: string;
  name: string;
  industry: string;
  subIndustry?: string;
  employeeCount: number;
  locations: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notes?: string;
  assignedTemplateIds: string[];
  totalAuditsCompleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  sections: any[];
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Audit {
  id: string;
  clientId: string;
  templateId: string;
  templateName: string;
  status: 'draft' | 'completed';
  responses: Record<string, any>;
  sections: any[];
  fields: any[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface DocumentGeneratorRequest {
  templateName: string;
  clientName: string;
  auditorName: string;
  auditorTitle: string;
  auditorEmail: string;
  completedAt: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
  fields: Array<{
    id: string;
    type: string;
    question: string;
    sectionId: string;
    hasPhoto?: boolean;
    hasNotes?: boolean;
  }>;
  responses: Record<string, {
    value?: string;
    photos?: string[];
    notes?: string;
  }>;
} 