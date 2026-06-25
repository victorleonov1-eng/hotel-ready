export type Scenario = {
  id: string;
  title: string;
  situation: string;
  guestPersona: string;
  guestOpeningLine: string;
  difficultyNote: string;
  skills: string[];
  businessOutcome: string;
  successCriteria: string;
  voice?: {
    voiceId: string;
    baseStyle: string;
  };
};

export type ScenarioPack = {
  id: string;
  department: string;
  scenarios: Scenario[];
};

export type GuestTurn = {
  reply: string;
  emotion: "angry" | "irritated" | "neutral" | "warming" | "satisfied" | "anxious";
};

export type AnswerOption = { text: string; rank: 1 | 2 | 3 | 4 | 5 };
export type AnswerOptions = { options: AnswerOption[] };

export type ScoreResult = {
  overall: number;
  verdict: "floor-ready" | "almost" | "needs-work";
  dimensions: {
    empathy: number;
    clarity: number;
    toneWarmth: number;
    resolution: number;
    outcomeAchieved: number;
  };
  coaching: string[];
  oneThingToFix: string;
};

export type Message = {
  role: 'staff' | 'guest';
  text: string;
  emotion?: string;
  timestamp: number;
};

export type Recording = {
  attemptId: string;
  scenarioId: string;
  messages: Message[];
  score: number;
  seconds: number;
  usedCards: boolean;
  recordedAt: string;
  audioData?: Record<string, string>; // Map of timestamp -> base64 audio
};

export type Attempt = {
  scenarioId: string;
  score: number;
  seconds: number;
  usedCards: boolean;
  at: string;
  recordingId?: string;
};

export type Department = "FO" | "F&B" | "HK" | "FIN" | "KITCHEN" | "TECH" | "MANAGER" | "GM" | "OTHER";

export type UserProfile = {
  firstName: string;
  lastName: string;
  pin: string;
  position: string;
  department: Department;
  attempts: Attempt[];
  bestByScenario: Record<string, number>;
  bestTimeByScenario: Record<string, number>;
};
