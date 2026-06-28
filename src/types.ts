export interface TeamStanding {
  rank: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  tcs: number;
}

export interface GroupStanding {
  groupLetter: string; // A, B, C, D, E, F, G, H, I, J, K, L
  teams: TeamStanding[];
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'Live' | 'Finished' | 'Upcoming';
  minute?: string; // e.g., "75'" or "FT"
  date: string; // e.g., "June 21"
  time: string; // e.g., "15:00"
  group?: string; // e.g., "A"
  stage: 'Group Stage' | 'Round of 32' | 'Round of 16' | 'Quarter-finals' | 'Semi-finals' | 'Third-place' | 'Final';
}

export interface BracketMatch {
  id: string;
  stage: 'RoundOf32' | 'RoundOf16' | 'QuarterFinals' | 'SemiFinals' | 'Final';
  matchNumber: number;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  date?: string;
  time?: string;
  // reference details to which match winner goes next
  nextMatchId?: string;
  nextMatchSide?: 'home' | 'away';
}

export interface BracketData {
  roundOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch[];
}

export interface AIAnalysis {
  summary: string;
  predictions: string;
  hotTopics: string[];
}

export interface WorldCupData {
  lastUpdated: string;
  isRealTime: boolean;
  groups: GroupStanding[];
  matches: Match[];
  bracket: BracketData;
  aiAnalysis?: AIAnalysis;
}
