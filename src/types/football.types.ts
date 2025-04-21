// Football-Data.org API types

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface Area {
  id: number;
  name: string;
  code: string;
  flag: string;
}

export interface Score {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  fullTime: {
    home: number | null;
    away: number | null;
  };
  halfTime: {
    home: number | null;
    away: number | null;
  };
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  competition: Competition;
}

export interface MatchesResponse {
  count: number;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    competition?: string;
  };
  matches: Match[];
}

export interface HeadToHeadResponse {
  count: number;
  matches: Match[];
}

export interface CompetitionsResponse {
  count: number;
  competitions: Competition[];
}
