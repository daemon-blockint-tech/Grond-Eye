/**
 * @file ConfidenceScoring.ts
 * @description Confidence aggregation and weighting for fusion decisions.
 */

export interface StrategyScore {
  strategyName: string;
  score: number;
  weight: number;
  reasoning?: string;
}

export class ConfidenceScorer {
  private readonly sourceCredibilityWeights: Map<string, number> = new Map();
  private readonly defaultSourceWeight = 0.8;

  /**
   * Register a data source with a credibility weight.
   * Weight: 0-1, where 1 is fully trusted.
   */
  registerSource(pluginId: string, weight: number): void {
    this.sourceCredibilityWeights.set(pluginId, Math.max(0, Math.min(1, weight)));
  }

  getSourceWeight(pluginId: string): number {
    return this.sourceCredibilityWeights.get(pluginId) ?? this.defaultSourceWeight;
  }

  /**
   * Blend multiple strategy scores with optional source credibility weighting.
   */
  blendScores(
    strategyScores: StrategyScore[],
    sourceWeights?: Map<string, number>,
  ): {
    overallScore: number;
    weightedBreakdown: Array<{ strategy: string; weight: number; contribution: number }>;
    reasoning: string[];
  } {
    if (strategyScores.length === 0) {
      return {
        overallScore: 0,
        weightedBreakdown: [],
        reasoning: ['No strategies evaluated'],
      };
    }

    let totalWeight = 0;
    let weightedSum = 0;
    const breakdown: Array<{ strategy: string; weight: number; contribution: number }> = [];
    const reasoning: string[] = [];

    for (const strat of strategyScores) {
      const effectiveWeight = strat.weight;
      totalWeight += effectiveWeight;
      const contribution = strat.score * effectiveWeight;
      weightedSum += contribution;

      breakdown.push({
        strategy: strat.strategyName,
        weight: effectiveWeight,
        contribution,
      });

      if (strat.reasoning) {
        reasoning.push(`${strat.strategyName}: ${strat.reasoning}`);
      }
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      overallScore: Math.min(1, Math.max(0, overallScore)),
      weightedBreakdown: breakdown,
      reasoning,
    };
  }

  /**
   * Apply source credibility adjustment to a base score.
   * Higher credibility sources get higher weight.
   */
  adjustForSourceCredibility(
    baseScore: number,
    pluginId1: string,
    pluginId2: string,
  ): number {
    const cred1 = this.getSourceWeight(pluginId1);
    const cred2 = this.getSourceWeight(pluginId2);

    // Average credibility boost: min(cred1, cred2) determines "trust level"
    const trustBoost = Math.min(cred1, cred2) * 0.2;
    return Math.min(1, baseScore + trustBoost);
  }

  /**
   * Calculate confidence intervals for a score (simple Wilson score bounds).
   */
  confidenceInterval(score: number, sampleSize: number = 1): {
    lower: number;
    upper: number;
  } {
    if (sampleSize === 0) {
      return { lower: 0, upper: 1 };
    }

    const z = 1.96; // 95% confidence
    const z2 = z * z;
    const pn = score;
    const n = Math.max(sampleSize, 1);

    const denominator = 1 + z2 / n;
    const centre_adjusted_probability =
      (pn + (z2 / (2 * n))) / denominator;
    const adjusted_standard_deviation =
      Math.sqrt((pn * (1 - pn)) / n + z2 / (4 * n * n)) / denominator;

    return {
      lower: Math.max(0, centre_adjusted_probability - z * adjusted_standard_deviation),
      upper: Math.min(1, centre_adjusted_probability + z * adjusted_standard_deviation),
    };
  }

  /**
   * Determine if a score meets threshold and should trigger fusion.
   */
  shouldFuse(score: number, threshold: number = 0.75): boolean {
    return score >= threshold;
  }
}
