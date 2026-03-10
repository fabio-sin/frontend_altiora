import { CVResult } from './api.model';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
  sources?: CVResult[];
  appliedClassification?: string;
}
