import type { ReviewSession, ReviewIndex } from 'hive-core';

export interface ReviewStatusSummary {
  activeSessionId: string | null;
  unresolvedThreads: number;
  totalThreads: number;
  latestVerdict: string | null;
  latestStatus: string | null;
}

/**
 * Build the review summary for hive_status output.
 *
 * Given the session list from the review index and optionally the full
 * active session (with threads), returns a summary of review state
 * suitable for inclusion in the hive_status JSON response.
 */
export function buildReviewStatus(
  sessions: ReviewIndex['sessions'],
  activeSession: ReviewSession | null,
): ReviewStatusSummary {
  // Find the active (in_progress) session
  const activeInProgress = sessions.find((s) => s.status === 'in_progress');
  const activeSessionId = activeInProgress?.id || null;

  if (activeSession && activeSession.threads) {
    const totalThreads = activeSession.threads.length;
    const unresolvedThreads = activeSession.threads.filter(
      (t) => t.status === 'open',
    ).length;

    return {
      activeSessionId,
      unresolvedThreads,
      totalThreads,
      latestVerdict: activeSession.verdict,
      latestStatus: activeSession.status,
    };
  }

  // If there's no active session, check the most recent session from the list
  if (sessions.length > 0) {
    const latest = sessions[sessions.length - 1];
    return {
      activeSessionId,
      unresolvedThreads: 0,
      totalThreads: 0,
      latestVerdict: null,
      latestStatus: latest.status,
    };
  }

  return {
    activeSessionId: null,
    unresolvedThreads: 0,
    totalThreads: 0,
    latestVerdict: null,
    latestStatus: null,
  };
}
