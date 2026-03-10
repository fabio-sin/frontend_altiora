export type Classification = 'public' | 'restricted';

export interface UserProfile {
  name: string;
  email: string;
  department: string;
  maxClassification: Classification;
}
