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

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 