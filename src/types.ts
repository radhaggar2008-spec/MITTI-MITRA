export type SectionId = 'home' | 'report' | 'health' | 'crops' | 'eco' | 'learn';

export type PollutionType =
  | 'Farming'
  | 'Industry'
  | 'Urban Waste'
  | 'E-Waste'
  | 'Oil Spill'
  | 'Acid Rain Fallout';

export interface PollutionReport {
  id: string;
  type: PollutionType;
  location: string;
  coordinates?: string;
  description: string;
  photoDataUrl?: string;
  createdAt: string;
  isUserSubmitted?: boolean;
}

export interface SoilReading {
  ph: number;
  nitrogen: number; // kg/ha (0 - 600)
  phosphorus: number; // kg/ha (0 - 100)
  potassium: number; // kg/ha (0 - 500)
}

export type HealthTier = 'green' | 'yellow' | 'red';

export interface SoilHealthEvaluation {
  tier: HealthTier;
  statusLabel: string;
  hindiLabel: string;
  score: number;
  headline: string;
  summary: string;
  adviceList: string[];
}

export interface ShcSampleCard {
  id: string;
  cardNumber: string;
  farmerName: string;
  district: string;
  soilType: string;
  reading: SoilReading;
  organicCarbon: string;
}

export type CropLocation = 'Delhi' | 'Faridabad' | 'Haryana';
export type CropType = 'Wheat' | 'Spinach' | 'Mustard' | 'Rice';
export type CropRiskLevel = 'high' | 'moderate' | 'low';

export interface CropRiskResult {
  location: CropLocation;
  crop: CropType;
  risk: CropRiskLevel;
  riskBadge: string;
  headline: string;
  explanation: string;
  hindiTip: string;
  phytoremediationNote: string;
  recommendedAlternative: CropType;
}

export interface EcoTask {
  id: string;
  title: string;
  hindiTitle: string;
  description: string;
  points: number;
  emoji: string;
}

export interface LeaderboardMember {
  id: string;
  name: string;
  city: string;
  points: number;
  streakDays: number;
  isUser?: boolean;
}

export interface LearnCard {
  id: 'sources' | 'food-chain' | 'health-effects' | 'solutions';
  stepNumber: string;
  title: string;
  hindiSubtitle: string;
  emoji: string;
  summary: string;
  keyPoints: string[];
  actionTakeaway: string;
}

export interface DailySoilTip {
  id: string;
  title: string;
  hindiLine: string;
  advice: string;
  focusArea: string;
  emoji: string;
}

