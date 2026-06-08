import type { Timestamp } from "firebase/firestore";

export type CircuitRole = "user" | "assistant";

export interface CircuitUserProfileContext {
  name: string;
  exam: string;
  class: string;
  targetScore: string;
  preferredLanguage: string;
  weakSubjects: string[];
  strongSubjects: string[];
  studyHoursPerDay: number;
}

export interface CircuitMessage {
  id: string;
  role: CircuitRole;
  content: string;
  createdAt: string;
  status?: "streaming" | "complete" | "error";
}

export interface CircuitContext {
  userProfile: CircuitUserProfileContext;
  conversationSummary: string;
  recentMessages: Array<Pick<CircuitMessage, "role" | "content">>;
}

export interface CircuitChat {
  id: string;
  uid: string;
  title: string;
  messages: CircuitMessage[];
  context: CircuitContext;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface CircuitStreamRequest {
  context: CircuitContext;
  message: string;
}

export interface CircuitSummaryRequest {
  action: "summarize";
  previousSummary: string;
  messages: Array<Pick<CircuitMessage, "role" | "content">>;
}
