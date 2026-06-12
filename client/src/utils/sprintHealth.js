// Threshold Constants for tuning
const THRESHOLDS = {
  GAP_DANGER: 25,          // Time elapsed % minus completion %
  GAP_WARN: 10,
  VELOCITY_DANGER: 1.5,    // Required velocity vs Average velocity
  VELOCITY_WARN: 1.1,
  BURNDOWN_DANGER: 3,      // Actual tasks remaining vs Ideal tasks remaining
  BURNDOWN_WARN: 1,
};

export const calculateSprintHealth = (sprint, stats) => {
  if (!sprint || !stats) return null;

  // If sprint hasn't started, return neutral state
  if (sprint.status === 'created' || sprint.status === 'planner') {
    return {
      state: 'NEUTRAL',
      color: 'bg-gray-100 text-gray-500',
      iconColor: 'text-gray-400',
      title: '—',
      message: "Sprint hasn't started yet",
    };
  }

  const now = new Date();
  const start = new Date(sprint.startDate);
  // Add 23:59:59 to endDate to include the full day
  const end = new Date(sprint.endDate);
  end.setHours(23, 59, 59, 999);

  // Time metrics
  const totalSprintDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, (now - start) / (1000 * 60 * 60 * 24));
  const timeElapsedPct = Math.min(100, Math.max(0, (daysElapsed / totalSprintDays) * 100));
  const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  // Completion metrics
  const completionPct = stats.velocity || 0;
  const gap = timeElapsedPct - completionPct;

  // Effort & Velocity metrics
  const remainingEffortHours = Math.max(0, stats.totalEstimatedHours - stats.totalSpentHours);
  const requiredDailyVelocity = remainingEffortHours / Math.max(remainingDays, 1);
  const avgDailyVelocity = stats.totalSpentHours / Math.max(Math.floor(daysElapsed), 1);
  const velocityRatio = avgDailyVelocity > 0 ? requiredDailyVelocity / avgDailyVelocity : (requiredDailyVelocity > 0 ? 999 : 0);

  // Burndown trend
  const todayLabel = 'D' + Math.max(1, Math.ceil(daysElapsed));
  const todayBurndown = stats.burndown?.find(b => b.day === todayLabel) || stats.burndown?.[stats.burndown.length - 1];
  const actualVsIdealDiff = todayBurndown ? (todayBurndown.actual - todayBurndown.ideal) : 0;

  // ---------------------------------------------------------------------------
  // COMPLETED SPRINT HANDLING
  // ---------------------------------------------------------------------------
  if (sprint.status === 'completed') {
    if (completionPct < 100) {
      return {
        state: 'DELAYED',
        color: 'bg-red-100 text-red-700',
        iconColor: 'text-red-500',
        title: 'Delayed',
        message: `Completed — Finished incomplete at ${completionPct}%`,
      };
    }
    if (gap > THRESHOLDS.GAP_WARN || actualVsIdealDiff > THRESHOLDS.BURNDOWN_WARN) {
      return {
        state: 'AT_RISK',
        color: 'bg-yellow-100 text-yellow-700',
        iconColor: 'text-yellow-500',
        title: 'At Risk',
        message: 'Completed — Finished behind ideal schedule.',
      };
    }
    return {
      state: 'HEALTHY',
      color: 'bg-green-100 text-green-700',
      iconColor: 'text-green-500',
      title: 'Healthy',
      message: 'Completed — Finished on time.',
    };
  }

  // ---------------------------------------------------------------------------
  // ACTIVE SPRINT HANDLING (Rules Engine)
  // ---------------------------------------------------------------------------
  
  // 1. DELAYED Rules
  if (gap > THRESHOLDS.GAP_DANGER || velocityRatio > THRESHOLDS.VELOCITY_DANGER || (remainingDays <= 0 && completionPct < 100) || actualVsIdealDiff > THRESHOLDS.BURNDOWN_DANGER) {
    if (remainingDays <= 0) {
      return {
        state: 'DELAYED',
        color: 'bg-red-100 text-red-700',
        iconColor: 'text-red-500',
        title: 'Delayed',
        message: `Deadline passed with ${completionPct}% completion. Mark as Completed or extend deadline.`,
      };
    }
    return {
      state: 'DELAYED',
      color: 'bg-red-100 text-red-700',
      iconColor: 'text-red-500',
      title: 'Delayed',
      message: `Significantly delayed — ${completionPct}% complete with ${remainingDays} days left. Consider re-scoping.`,
    };
  }

  // 2. AT RISK Rules
  if (gap > THRESHOLDS.GAP_WARN || velocityRatio > THRESHOLDS.VELOCITY_WARN || actualVsIdealDiff > THRESHOLDS.BURNDOWN_WARN) {
    return {
      state: 'AT_RISK',
      color: 'bg-yellow-100 text-yellow-700',
      iconColor: 'text-yellow-500',
      title: 'At Risk',
      message: `Slightly behind — ${completionPct}% complete, team needs to pick up pace to finish on time.`,
    };
  }

  // 3. HEALTHY Rules (Fallback)
  return {
    state: 'HEALTHY',
    color: 'bg-green-100 text-green-700',
    iconColor: 'text-green-500',
    title: 'Healthy',
    message: `On track — ${completionPct}% complete with ${remainingDays} days remaining.`,
  };
};
