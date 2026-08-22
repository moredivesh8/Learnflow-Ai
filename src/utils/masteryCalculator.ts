import { MasteryStatus, Topic } from '../types';

/**
 * Mastery classification boundaries:
 * 0–39 = Needs Attention
 * 40–59 = Weak
 * 60–79 = Developing
 * 80–100 = Strong
 */
export function getMasteryStatus(score: number): MasteryStatus {
  if (score < 40) return 'needs_attention';
  if (score < 60) return 'weak';
  if (score < 80) return 'developing';
  return 'strong';
}

export function getMasteryBadgeDetails(status: MasteryStatus): {
  label: string;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'needs_attention':
      return {
        label: 'Needs Attention',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-600 dark:text-rose-400',
        borderClass: 'border-rose-300 dark:border-rose-800'
      };
    case 'weak':
      return {
        label: 'Weak Topic',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-600 dark:text-amber-400',
        borderClass: 'border-amber-300 dark:border-amber-800'
      };
    case 'developing':
      return {
        label: 'Developing',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-600 dark:text-blue-400',
        borderClass: 'border-blue-300 dark:border-blue-800'
      };
    case 'strong':
      return {
        label: 'Mastered',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-emerald-300 dark:border-emerald-800'
      };
  }
}

/**
 * Calculate new mastery score based on recent quiz performance:
 * Uses recency-weighted exponential formula:
 * newMastery = Math.round(previousMastery * 0.45 + recentAccuracy * 0.55)
 * Clamped between 5 and 100
 */
export function calculateUpdatedMastery(
  previousMastery: number,
  correctInSession: number,
  totalInSession: number
): { newScore: number; change: number; trend: 'up' | 'down' | 'neutral' } {
  if (totalInSession === 0) {
    return { newScore: previousMastery, change: 0, trend: 'neutral' };
  }

  const sessionAccuracy = (correctInSession / totalInSession) * 100;
  
  // Recency weight: 55% weight to recent test, 45% to baseline/history
  const rawScore = Math.round((previousMastery * 0.45) + (sessionAccuracy * 0.55));
  const newScore = Math.min(100, Math.max(5, rawScore));
  const change = newScore - previousMastery;
  
  const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'neutral';

  return { newScore, change, trend };
}

/**
 * Compute overall aggregate mastery score from a list of topics
 */
export function calculateOverallMastery(topics: Topic[]): number {
  if (!topics || topics.length === 0) return 0;
  const total = topics.reduce((acc, t) => acc + t.masteryScore, 0);
  return Math.round(total / topics.length);
}
