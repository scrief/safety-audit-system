interface FormResponse {
    [key: string]: string;
  }
  
  interface AIConfig {
    sourceFieldId: string;
    customPrompt: string;
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'company-model';
    maxTokens: number;
    useSpeechToText: boolean;
    buttonLabel: string;
  }
  
  interface Section {
    id: string;
    title: string;
    order: number;
    isRepeatable?: boolean;
    instances?: number;
  }
  
  interface Field {
    id: string;
    sectionId: string;
    type: 'text' | 'yesNo' | 'multipleChoice' | 'number' | 'date' | 
          'checkbox' | 'slider' | 'signature' | 'instruction' | 'aiRecommendation';
    question: string;
    required: boolean;
    hasNotes: boolean;
    hasPhoto: boolean;
    options?: string[];
    conditions?: Condition[];
    order: number;
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
    checkboxOptions?: string[];
    aiConfig?: AIConfig;
  }
  
  interface Condition {
    sourceFieldId: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
    value: string;
  }
  
  interface FormTemplate {
    id: string;
    name: string;
    sections: Section[];
    fields: Field[];
    createdAt: string;
    updatedAt: string;
  }
  
  interface DragItem {
    id: string;
    type: 'section' | 'field';
  }

  // Keep your other existing types
export interface Field {
    id: string;
    sectionId: string;
    type: 'text' | 'number' | 'date' | 'yesNo' | 'multipleChoice' | 'checkbox' | 'slider' | 'signature' | 'instruction' | 'aiRecommendation';
    question: string;
    required: boolean;
    hasNotes: boolean;
    hasPhoto: boolean;
    order: number;
    conditions?: Condition[];
    aiConfig?: AIConfig;
    options?: string[];
    checkboxOptions?: string[];
    sliderMin?: number;
    sliderMax?: number;
    sliderStep?: number;
  }
  
  // ... rest of your types