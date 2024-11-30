export type Section = {
  id: string;
  title: string;
  order: number;
  isRepeatable: boolean;
  instances: number;
};

export type Field = {
  id: string;
  photoId?: string;
  sectionId: string;
  type: 'mainText' | 'yesNo' | 'multipleChoice' | 'checkbox' | 'number' | 'date' | 'slider' | 'signature' | 'instruction' | 'aiRecommendation';
  question: string;
  required: boolean;
  hasNotes: boolean;
  hasPhoto: boolean;
  order: number;
  conditions: Condition[];
  aiConfig?: AIConfig;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  options?: string[];
  checkboxOptions?: string[];
};

export type DragItem = {
  id: string;
  type: 'section' | 'field';
};

export type FormTemplate = {
  id: string;
  name: string;
  sections: Section[];
  fields: Field[];
  createdAt: string;
  updatedAt: string;
};

export type FormResponse = {
  [key: string]: string | PhotoData[];
};

export type Condition = {
  sourceFieldId: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  value: string;
};

export type AIConfig = {
  sourceFieldId: string;
  customPrompt: string;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'company-model';
  maxTokens: number;
  useSpeechToText: boolean;
  buttonLabel: string;
};

export type PhotoData = {
  id: string;
  fieldId: string;
  instanceIndex: number;
  file: string;
  fileName: string;
};