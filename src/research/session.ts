import { randomUUID } from 'node:crypto';

// Lifecycle states of a research session (Doc 004 §5). Report generation
// states will extend this union in Phase 6.
export type ResearchSessionStatus =
  | 'created'
  | 'searching'
  | 'collecting'
  | 'extracting'
  | 'normalizing'
  | 'analyzing'
  | 'completed'
  | 'failed';

// One complete research execution (Doc 004 §5). The AI provider and model are
// injected by the caller because the research_sessions table requires them
// (Doc 007 §6.1) — the session never reads configuration itself. The shape is
// structurally compatible with the Storage persistence input.
export type ResearchSession = {
  id: string;
  keyword: string;
  marketplace: string;
  aiProvider: string;
  aiModel: string;
  status: ResearchSessionStatus;
  startedAt: string;
  completedAt: string | null;
};

export function createResearchSession(
  keyword: string,
  marketplace: string,
  aiProvider: string,
  aiModel: string,
): ResearchSession {
  return {
    id: randomUUID(),
    keyword,
    marketplace,
    aiProvider,
    aiModel,
    status: 'created',
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

// Every transition returns a new session object; the original is never mutated
// so callers can hold consistent snapshots of earlier states.
export function updateSessionStatus(
  session: ResearchSession,
  status: ResearchSessionStatus,
): ResearchSession {
  return { ...session, status };
}

export function completeResearchSession(session: ResearchSession): ResearchSession {
  return { ...session, status: 'completed', completedAt: new Date().toISOString() };
}

export function failResearchSession(session: ResearchSession): ResearchSession {
  return { ...session, status: 'failed', completedAt: new Date().toISOString() };
}
