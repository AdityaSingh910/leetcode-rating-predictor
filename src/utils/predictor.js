/**
 * Performance-Based Rating Prediction Engine
 * Uses an adaptation of the Elo rating system similar to LeetCode's algorithm.
 *
 * Core idea:
 * - For each past contest, compute a "performance rating" based on actual rank vs expected rank
 * - Use performance ratings to predict the next contest outcome
 */

/**
 * Predict the user's next contest rating based on performance history
 * @param {Array} contestHistory — contest objects with { rating, ranking, problemsSolved, totalProblems, finishTimeInSeconds, contest }
 * @returns {Object} prediction
 */
export function predictRating(contestHistory) {
  if (!contestHistory || contestHistory.length === 0) {
    return defaultPrediction(1500);
  }

  const ratings = contestHistory.map(c => c.rating);
  const currentRating = ratings[ratings.length - 1];

  if (ratings.length === 1) {
    return defaultPrediction(currentRating);
  }

  // Compute performance ratings for each contest
  const perfRatings = computePerformanceRatings(contestHistory);

  // Use last N contests
  const N = Math.min(contestHistory.length, 12);
  const recentPerf = perfRatings.slice(-N);
  const recentRatings = ratings.slice(-N);
  const recentContests = contestHistory.slice(-N);

  // 1. Weighted Mean of Performance Ratings (recent contests weighted higher)
  const weightedPerfMean = weightedMean(recentPerf);

  // 2. Linear trend on actual ratings
  const lrPrediction = linearRegressionPredict(recentRatings);

  // 3. Solve rate factor - how well they solve problems
  const solveRates = recentContests.map(c =>
    c.totalProblems > 0 ? c.problemsSolved / c.totalProblems : 0
  );
  const avgSolveRate = solveRates.reduce((a, b) => a + b, 0) / solveRates.length;
  const solveFactor = avgSolveRate >= 0.75 ? 1.02 : avgSolveRate >= 0.5 ? 1.0 : 0.98;

  // 4. Combined prediction
  // Performance-based (50%) + trend-based (30%) + current rating anchor (20%)
  let predicted = (
    0.50 * weightedPerfMean +
    0.30 * lrPrediction +
    0.20 * currentRating
  ) * solveFactor;

  // 5. Calculate volatility
  const changes = [];
  for (let i = 1; i < recentRatings.length; i++) {
    changes.push(recentRatings[i] - recentRatings[i - 1]);
  }
  const volatility = standardDeviation(changes);

  // 6. Confidence interval
  const marginOfError = Math.max(volatility * 1.5, 30);
  const lowerBound = predicted - marginOfError;
  const upperBound = predicted + marginOfError;

  // 7. Trend detection
  const { slope } = linearRegression(recentRatings);
  const expectedChange = predicted - currentRating;

  let trend, trendStrength;
  if (slope > 5) {
    trend = 'up';
    trendStrength = slope > 15 ? 'Strong' : 'Moderate';
  } else if (slope < -5) {
    trend = 'down';
    trendStrength = slope < -15 ? 'Strong' : 'Moderate';
  } else {
    trend = 'stable';
    trendStrength = 'Weak';
  }

  // 8. Confidence level
  let confidence;
  if (ratings.length >= 10 && volatility < 80) {
    confidence = 'High';
  } else if (ratings.length >= 5 && volatility < 120) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // 9. Average stats
  const avgProblemsSolved = recentContests.reduce((s, c) => s + (c.problemsSolved || 0), 0) / recentContests.length;
  const avgRank = recentContests.reduce((s, c) => s + (c.ranking || 0), 0) / recentContests.length;

  return {
    predictedRating: Math.round(predicted),
    lowerBound: Math.round(lowerBound),
    upperBound: Math.round(upperBound),
    expectedChange: Math.round(expectedChange),
    trend,
    trendStrength,
    confidence,
    avgProblemsSolved: avgProblemsSolved.toFixed(1),
    avgRank: Math.round(avgRank),
    avgSolveRate: (avgSolveRate * 100).toFixed(0) + '%',
    performanceRatings: perfRatings,
  };
}

/**
 * Compute performance rating for each contest.
 *
 * Performance rating estimates what rating a player "performed at" based on:
 * - Their actual rank in the contest
 * - The approximate field strength
 *
 * We use the inverse Elo formula:
 *   If a player ranked R out of N participants, their performance rating is approximately:
 *   perfRating = currentRating + 400 * log10((N - rank) / rank)
 *   (clamped to avoid infinities)
 */
function computePerformanceRatings(contestHistory) {
  return contestHistory.map((contest, idx) => {
    const rating = contest.rating;
    const rank = contest.ranking;

    // Estimate total participants from the contest
    // Use ranking as a fraction — if rank is very low relative to typical sizes, it's a good performance
    // We estimate ~5000-30000 typical participants for LeetCode contests
    // The actual totalParticipants isn't in the API, so we estimate from ranking patterns
    const estimatedN = estimateParticipants(contestHistory, idx);

    if (rank <= 0 || estimatedN <= 0) return rating;

    // Performance rating from the Elo model
    const clampedRank = Math.max(rank, 1);
    const clampedN = Math.max(estimatedN, rank + 1);

    // Elo performance: rating + 400 * log10((N - rank) / rank)
    const ratio = (clampedN - clampedRank) / clampedRank;
    const perfRating = rating + 400 * Math.log10(Math.max(ratio, 0.01));

    return perfRating;
  });
}

/**
 * Estimate total participants for a contest.
 * Uses a heuristic: if we know the user's ranking and rating,
 * we can estimate the field size based on typical LeetCode contest sizes.
 */
function estimateParticipants(history, currentIdx) {
  // Use the contest's ranking to infer approximate field size
  // Heuristic: top-rated users (3000+) typically rank in top 100 out of ~25000
  // Mid-rated users (1800) rank around 2000-5000
  // We'll use a simple estimate based on available data

  const contest = history[currentIdx];
  
  // If we seeded this contest with a known total participant count (for post-contest prediction)
  if (contest._simulatedTotalParticipants) {
    return contest._simulatedTotalParticipants;
  }

  const rank = contest.ranking;
  const rating = contest.rating;

  // Rough estimation based on rating percentile
  // A user with rating R, if contest has N participants:
  // Expected rank ≈ N / (1 + 10^((R - 1500) / 400))
  // Solving for N: N ≈ rank * (1 + 10^((R - 1500) / 400))

  const expectedFraction = 1 / (1 + Math.pow(10, (rating - 1500) / 400));
  const estimatedN = Math.round(rank / Math.max(expectedFraction, 0.001));

  // Clamp to reasonable range
  return Math.min(Math.max(estimatedN, 1000), 50000);
}

/**
 * Weighted mean — exponentially weight recent values more
 */
function weightedMean(values) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < values.length; i++) {
    const weight = Math.pow(2, i);
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

/**
 * Linear Regression — returns { slope, intercept }
 */
function linearRegression(values) {
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: values[0] || 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function linearRegressionPredict(values) {
  const { slope, intercept } = linearRegression(values);
  return slope * values.length + intercept;
}

function standardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function defaultPrediction(rating) {
  return {
    predictedRating: Math.round(rating),
    lowerBound: Math.round(rating - 80),
    upperBound: Math.round(rating + 80),
    expectedChange: 0,
    trend: 'stable',
    trendStrength: 'None',
    confidence: 'Low',
    avgProblemsSolved: '0',
    avgRank: 0,
    avgSolveRate: '0%',
    performanceRatings: [],
  };
}

/**
 * Simulate the actual post-contest rating change using LeetCode's Elo system.
 *
 * This is fundamentally different from predictRating():
 * - predictRating() forecasts from historical trends (for "what will happen next")
 * - simulateRatingChange() computes the definitive Elo delta (for "what DID happen")
 *
 * @param {number} currentRating — user's rating before the contest
 * @param {number} rank — user's actual rank in the contest
 * @param {number} totalParticipants — total contestants
 * @param {number} contestsAttended — how many contests the user has done (affects K-factor)
 * @param {number} problemsSolved — problems solved (0-4)
 * @param {number} totalProblems — total problems in contest (usually 4)
 * @returns {Object} simulation result
 */
export function simulateRatingChange(currentRating, rank, totalParticipants, contestsAttended, problemsSolved = 0, totalProblems = 4) {
  const N = Math.max(totalParticipants, rank + 1);
  const clampedRank = Math.max(rank, 1);

  // 1. Expected rank from Elo model
  // E(rank) = N * (1 / (1 + 10^((R - 1500) / 400)))
  const expectedFraction = 1 / (1 + Math.pow(10, (currentRating - 1500) / 400));
  const expectedRank = Math.max(1, Math.round(N * expectedFraction));

  // 2. Performance rating — what rating the user "performed at"
  // perfRating = 1500 + 400 * log10((N - rank) / rank)
  const ratio = Math.max((N - clampedRank) / clampedRank, 0.01);
  const performanceRating = Math.round(1500 + 400 * Math.log10(ratio));

  // 3. K-factor — decreases with experience (similar to chess Elo)
  // New players (< 6 contests): K = 0.4
  // Intermediate (6-20): K = 0.3
  // Experienced (20+): K = 0.2
  let K;
  if (contestsAttended < 6) {
    K = 0.4;
  } else if (contestsAttended < 20) {
    K = 0.3;
  } else {
    K = 0.2;
  }

  // 4. Elo rating change
  // δ = K × (performanceRating - currentRating)
  // Capped to avoid extreme swings
  let rawDelta = K * (performanceRating - currentRating);

  // 5. Solve rate adjustment — 0 problems solved should penalize harder
  const solveRate = totalProblems > 0 ? problemsSolved / totalProblems : 0;
  if (solveRate === 0) {
    rawDelta = Math.min(rawDelta, -15); // Ensure negative if solved nothing
  } else if (solveRate < 0.25) {
    rawDelta *= 1.1; // Slightly amplify poor performance
  }

  // 6. Clamp delta to realistic range (-100 to +150)
  const delta = Math.round(Math.max(-100, Math.min(150, rawDelta)));
  const newRating = Math.round(currentRating + delta);

  // 7. Confidence based on rank position
  let confidence;
  const percentile = (clampedRank / N) * 100;
  if (percentile <= 5 || percentile >= 95) {
    confidence = 'High'; // Very clear outcome
  } else if (percentile <= 20 || percentile >= 80) {
    confidence = 'Medium';
  } else {
    confidence = 'Low'; // Mid-pack, hard to tell exact delta
  }

  return {
    currentRating: Math.round(currentRating),
    newRating,
    delta,
    performanceRating,
    expectedRank,
    actualRank: clampedRank,
    totalParticipants: N,
    percentile: (100 - percentile).toFixed(1),
    problemsSolved,
    totalProblems,
    solveRate: (solveRate * 100).toFixed(0) + '%',
    confidence,
    kFactor: K,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
  };
}
