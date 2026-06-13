/**
 * Core data models for Polla Mundialista
 * Requirements: 8.1-8.6
 */

/**
 * Represents a World Cup match
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export interface Match {
  id: string;
  team1: string;
  team2: string;
  date: string; // ISO 8601 date format (YYYY-MM-DD)
  time: string; // HH:MM format
}

/**
 * Represents a participant in the prediction pool
 * Requirements: 8.1
 */
export interface Participant {
  id: string;
  name: string;
}

/**
 * Represents a prediction made by a participant for a specific match
 * Format: "[SCORE1]-[SCORE2]" (e.g., "3-1")
 * Requirements: 8.1
 */
export interface Prediction {
  participantId: string;
  matchId: string;
  prediction: string; // Format: "[NUMBER]-[NUMBER]"
}

/**
 * Represents a correct mark for a participant's prediction
 * Requirements: 8.1
 */
export interface CorrectMark {
  participantId: string;
  matchId: string;
  isCorrect: boolean;
}

/**
 * Map of predictions keyed by composite "participantId:matchId"
 * Requirements: 8.1
 */
export type PredictionMap = Record<string, string>;

/**
 * Map of correct marks keyed by composite "participantId:matchId"
 * Requirements: 8.1
 */
export type CorrectMarkMap = Record<string, boolean>;

/**
 * Application state
 * Requirements: 8.1, 8.6
 */
export interface AppState {
  participants: Participant[];
  matches: Match[];
  predictions: PredictionMap;
  correctMarks: CorrectMarkMap;
  isAdminMode: boolean;
}

/**
 * Participant with ranking information
 * Requirements: 8.1
 */
export interface RankedParticipant {
  id: string;
  name: string;
  correctCount: number;
  rank: number;
}

/**
 * Result of a validation operation
 * Requirements: 8.6
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
