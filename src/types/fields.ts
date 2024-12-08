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

export interface FieldOption {
  id: string;
  text: string;
  value: string;
  order: number;
  isCorrect?: boolean;
  score?: number;
}

export interface FieldLogic {
  condition: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
  action: 'show' | 'hide' | 'require' | 'skip';
  targetFieldId: string;
}

export interface AIRecommendationSettings {
  linkedQuestionIds: string[];
  customPrompt: string;
  modelSettings?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export interface FieldScoring {
  points: number;
  weight: number;
  passingScore?: number;
  scoringMethod: 'binary' | 'partial' | 'custom';
  customScoring?: Record<string, number>;
}

export interface Field {
  id: string;
  sectionId: string;
  type: FieldType;
  question: string;
  required: boolean;
  order: number;
  aiEnabled: boolean;
  options: FieldOption[] | null;
  settings: {
    logic?: FieldLogic[];
    aiRecommendation?: AIRecommendationSettings;
    allowNotes?: boolean;
    allowPhotos?: boolean;
    photoRequired?: boolean;
    notesRequired?: boolean;
    slider?: {
      min: number;
      max: number;
      step: number;
    };
  } | null;
  scoring: FieldScoring | null;
}