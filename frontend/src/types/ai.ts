export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  /** Identifiers used for this reply, so the Dashboard never displays advice for other laps. */
  context?: import('./generated/ai').ChatContextRequest;
  errorCode?: string;
  errorProvider?: string;
  errorRaw?: string;
  canRetry?: boolean;
  lastPrompt?: string;
}


export type {
  AIChatRequest,
  ChatContextMode,
  ChatContextRequest,
  ChatZoomRange,
  DebriefFocus,
  RadioLineRequest,
  RadioLineResponse,
} from './generated/ai';
