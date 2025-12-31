/**
 * Threader AI - Differential Analysis Engine
 * Compares current analysis with previous snapshots to identify trends
 */

/**
 * Compare current synthesis with previous snapshot
 * @param {Object} current - Current synthesis result
 * @param {Object} previous - Previous snapshot
 * @returns {Object} Differential analysis
 */
export function compareSyntheses(current, previous) {
  if (!previous) {
    return {
      isFirstRun: true,
      changes: null,
      trends: null,
    };
  }

  const changes = {
    newIssues: [],
    improvedIssues: [],
    worsenedIssues: [],
    resolvedIssues: [],
    stableIssues: [],
  };

  const currentAreas = new Map(
    current.focusAreas.map(fa => [`${fa.category}:${fa.title}`, fa])
  );
  const previousAreas = new Map(
    previous.focusAreas.map(fa => [`${fa.category}:${fa.title}`, fa])
  );

  // Find new and changed issues
  for (const [key, currentArea] of currentAreas) {
    const previousArea = previousAreas.get(key);

    if (!previousArea) {
      // New issue
      changes.newIssues.push({
        ...currentArea,
        changeType: 'new',
        insight: `New ${currentArea.category.replace('_', ' ')} detected: "${currentArea.title}"`,
      });
    } else {
      // Compare frequencies and impact
      const freqDelta = currentArea.frequency - previousArea.frequency;
      const impactDelta = (currentArea.impactScore || 0) - (previousArea.impactScore || 0);

      if (freqDelta < -2 || impactDelta < -1) {
        // Improved (less frequent/severe)
        changes.improvedIssues.push({
          ...currentArea,
          changeType: 'improved',
          previousFrequency: previousArea.frequency,
          frequencyDelta: freqDelta,
          impactDelta,
          insight: `"${currentArea.title}" has improved: ${Math.abs(freqDelta)} fewer mentions`,
        });
      } else if (freqDelta > 2 || impactDelta > 1) {
        // Worsened (more frequent/severe)
        changes.worsenedIssues.push({
          ...currentArea,
          changeType: 'worsened',
          previousFrequency: previousArea.frequency,
          frequencyDelta: freqDelta,
          impactDelta,
          insight: `"${currentArea.title}" is growing: +${freqDelta} more mentions`,
        });
      } else {
        // Stable
        changes.stableIssues.push({
          ...currentArea,
          changeType: 'stable',
          previousFrequency: previousArea.frequency,
          frequencyDelta: freqDelta,
          impactDelta,
        });
      }
    }
  }

  // Find resolved issues (in previous but not in current)
  for (const [key, previousArea] of previousAreas) {
    if (!currentAreas.has(key)) {
      changes.resolvedIssues.push({
        ...previousArea,
        changeType: 'resolved',
        insight: `"${previousArea.title}" no longer appearing in feedback`,
      });
    }
  }

  // Calculate overall trends
  const trends = calculateOverallTrends(current, previous, changes);

  return {
    isFirstRun: false,
    comparedAt: new Date().toISOString(),
    previousSnapshotDate: previous.createdAt,
    changes,
    trends,
    summary: generateChangeSummary(changes, trends),
  };
}

/**
 * Calculate overall trend metrics
 */
function calculateOverallTrends(current, previous, changes) {
  // Sentiment trend
  const sentimentTrend = calculateSentimentTrend(
    current.sentiment,
    previous.sentiment
  );

  // Volume trend
  const volumeTrend = {
    current: current.metadata?.totalAnalyzed || 0,
    previous: previous.metadata?.totalAnalyzed || 0,
    delta: (current.metadata?.totalAnalyzed || 0) - (previous.metadata?.totalAnalyzed || 0),
    direction: calculateDirection(
      current.metadata?.totalAnalyzed || 0,
      previous.metadata?.totalAnalyzed || 0
    ),
  };

  // Issue resolution rate
  const resolutionRate = changes.resolvedIssues.length /
    (previous.focusAreas?.length || 1) * 100;

  // New issue rate
  const newIssueRate = changes.newIssues.length /
    (current.focusAreas?.length || 1) * 100;

  return {
    sentiment: sentimentTrend,
    volume: volumeTrend,
    resolutionRate: Math.round(resolutionRate),
    newIssueRate: Math.round(newIssueRate),
    overallHealth: calculateHealthScore(sentimentTrend, changes),
  };
}

/**
 * Calculate sentiment trend
 */
function calculateSentimentTrend(current, previous) {
  if (!current || !previous) return null;

  const currentPositiveRatio = current.positive / 100;
  const previousPositiveRatio = previous.positive / 100;
  const delta = currentPositiveRatio - previousPositiveRatio;

  return {
    current: {
      positive: current.positive,
      neutral: current.neutral,
      negative: current.negative,
      mood: current.mood,
    },
    previous: {
      positive: previous.positive,
      neutral: previous.neutral,
      negative: previous.negative,
      mood: previous.mood,
    },
    delta: Math.round(delta * 100),
    direction: delta > 0.02 ? 'improving' : delta < -0.02 ? 'declining' : 'stable',
    moodChange: current.mood !== previous.mood,
  };
}

/**
 * Calculate direction from values
 */
function calculateDirection(current, previous) {
  const delta = current - previous;
  const percentChange = previous > 0 ? (delta / previous) * 100 : 0;

  if (percentChange > 10) return 'up';
  if (percentChange < -10) return 'down';
  return 'stable';
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(sentimentTrend, changes) {
  let score = 50; // Base score

  // Adjust for sentiment
  if (sentimentTrend?.direction === 'improving') score += 15;
  if (sentimentTrend?.direction === 'declining') score -= 15;

  // Adjust for resolved issues
  score += changes.resolvedIssues.length * 5;

  // Penalize for new critical issues
  const criticalNew = changes.newIssues.filter(
    i => i.severityLabel === 'Critical'
  ).length;
  score -= criticalNew * 10;

  // Penalize for worsening issues
  score -= changes.worsenedIssues.length * 3;

  // Bonus for improved issues
  score += changes.improvedIssues.length * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate human-readable change summary
 */
function generateChangeSummary(changes, trends) {
  const parts = [];

  // New issues
  if (changes.newIssues.length > 0) {
    const critical = changes.newIssues.filter(i => i.severityLabel === 'Critical');
    if (critical.length > 0) {
      parts.push(`${critical.length} new critical issue(s) detected`);
    } else {
      parts.push(`${changes.newIssues.length} new issue(s) emerged`);
    }
  }

  // Improved
  if (changes.improvedIssues.length > 0) {
    parts.push(`${changes.improvedIssues.length} issue(s) showing improvement`);
  }

  // Worsened
  if (changes.worsenedIssues.length > 0) {
    parts.push(`${changes.worsenedIssues.length} issue(s) getting worse`);
  }

  // Resolved
  if (changes.resolvedIssues.length > 0) {
    parts.push(`${changes.resolvedIssues.length} issue(s) resolved`);
  }

  // Sentiment
  if (trends?.sentiment?.direction === 'improving') {
    parts.push('overall sentiment improving');
  } else if (trends?.sentiment?.direction === 'declining') {
    parts.push('overall sentiment declining');
  }

  return parts.length > 0
    ? parts.join(', ') + '.'
    : 'No significant changes detected.';
}

/**
 * Get what's new since last snapshot
 */
export function getWhatsNew(comparison) {
  if (comparison.isFirstRun) {
    return {
      headline: 'First Analysis Run',
      items: [],
    };
  }

  const items = [];

  // Add new issues
  for (const issue of comparison.changes.newIssues) {
    items.push({
      type: 'new_issue',
      severity: issue.severityLabel || 'Medium',
      title: issue.title,
      category: issue.category,
      insight: issue.insight,
    });
  }

  // Add significantly improved
  for (const issue of comparison.changes.improvedIssues) {
    if (Math.abs(issue.frequencyDelta) >= 3) {
      items.push({
        type: 'improvement',
        title: issue.title,
        delta: issue.frequencyDelta,
        insight: issue.insight,
      });
    }
  }

  // Add resolved
  for (const issue of comparison.changes.resolvedIssues) {
    items.push({
      type: 'resolved',
      title: issue.title,
      insight: issue.insight,
    });
  }

  return {
    headline: comparison.summary,
    items: items.slice(0, 10), // Top 10 changes
    healthScore: comparison.trends?.overallHealth || 50,
  };
}

/**
 * Get items that have improved
 */
export function getWhatsImproved(comparison) {
  if (comparison.isFirstRun) return [];

  return comparison.changes.improvedIssues.map(issue => ({
    title: issue.title,
    category: issue.category,
    previousFrequency: issue.previousFrequency,
    currentFrequency: issue.frequency,
    delta: issue.frequencyDelta,
    impactDelta: issue.impactDelta,
    insight: issue.insight,
  }));
}

/**
 * Attach trend data to focus areas
 */
export function attachTrendData(focusAreas, comparison) {
  if (comparison.isFirstRun) {
    return focusAreas.map(fa => ({
      ...fa,
      trend: 'new',
      trendDelta: 0,
    }));
  }

  return focusAreas.map(fa => {
    const key = `${fa.category}:${fa.title}`;

    // Check in various change categories
    const improved = comparison.changes.improvedIssues.find(
      i => `${i.category}:${i.title}` === key
    );
    const worsened = comparison.changes.worsenedIssues.find(
      i => `${i.category}:${i.title}` === key
    );
    const newIssue = comparison.changes.newIssues.find(
      i => `${i.category}:${i.title}` === key
    );
    const stable = comparison.changes.stableIssues.find(
      i => `${i.category}:${i.title}` === key
    );

    if (newIssue) {
      return { ...fa, trend: 'new', trendDelta: fa.frequency };
    }
    if (improved) {
      return { ...fa, trend: 'down', trendDelta: improved.frequencyDelta };
    }
    if (worsened) {
      return { ...fa, trend: 'up', trendDelta: worsened.frequencyDelta };
    }
    if (stable) {
      return { ...fa, trend: 'stable', trendDelta: stable.frequencyDelta };
    }

    return { ...fa, trend: 'stable', trendDelta: 0 };
  });
}

export default {
  compareSyntheses,
  getWhatsNew,
  getWhatsImproved,
  attachTrendData,
};
