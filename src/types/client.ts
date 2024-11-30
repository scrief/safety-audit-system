export interface ClientProfile {
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
  createdAt?: string;
  updatedAt?: string;
  logoUrl?: string;
  lastAuditDate?: string;
}

export type FormDataType = Omit<ClientProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalAuditsCompleted'>; 