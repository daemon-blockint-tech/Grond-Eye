/**
 * @file openrouterClient.ts
 * @description OpenRouter API client for Deepseek V4 flash model integration.
 * Enables LLM-powered reasoning in semantic agent.
 */

import type { Confidence } from '@maven-system/plugin-sdk';

export interface OpenRouterRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMThreatAssessment {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  confidence: Confidence;
  recommendations: string[];
}

export interface LLMHypothesis {
  hypothesis: string;
  evidence: string[];
  confidence: Confidence;
  suggestedActions: string[];
}

/**
 * OpenRouter client for Deepseek V4 flash integration.
 */
export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'deepseek/deepseek-chat'; // Deepseek V4 flash
  private requestCount = 0;
  private tokenUsage = { prompt: 0, completion: 0, total: 0 };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn(
        'OPENROUTER_API_KEY not set. LLM reasoning will be disabled.',
      );
    }
  }

  /**
   * Assess threat using LLM reasoning.
   */
  async assessThreatWithLLM(context: {
    entityId: string;
    entityType: string;
    disposition: string;
    proximity?: number;
    relatedEntities: string[];
    recentActivity?: string;
  }): Promise<LLMThreatAssessment> {
    if (!this.apiKey) {
      return {
        threatLevel: 'medium',
        reasoning: 'LLM reasoning disabled (no API key)',
        confidence: 0.5,
        recommendations: [],
      };
    }

    const prompt = `
You are a military threat assessment AI. Analyze the following entity and provide a threat assessment.

Entity: ${context.entityId}
Type: ${context.entityType}
Disposition: ${context.disposition}
Proximity Score: ${context.proximity ? (context.proximity * 100).toFixed(0) + '%' : 'Unknown'}
Related Entities: ${context.relatedEntities.join(', ') || 'None'}
Recent Activity: ${context.recentActivity || 'Normal'}

Provide your assessment in the following JSON format:
{
  "threatLevel": "low|medium|high|critical",
  "reasoning": "Detailed reasoning for threat assessment",
  "confidence": 0.0-1.0,
  "recommendations": ["action1", "action2"]
}

Be concise and analytical.
    `;

    try {
      const response = await this.call([
        {
          role: 'system',
          content:
            'You are a military threat assessment expert. Provide JSON responses only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        threatLevel: parsed.threatLevel || 'medium',
        reasoning: parsed.reasoning || '',
        confidence: parsed.confidence || 0.5,
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      console.error('LLM threat assessment failed:', error);
      return {
        threatLevel: 'medium',
        reasoning: 'LLM assessment failed, using default',
        confidence: 0.3,
        recommendations: [],
      };
    }
  }

  /**
   * Generate hypothesis using LLM.
   */
  async generateHypothesis(context: {
    observations: string[];
    threats: Array<{ entityId: string; threatLevel: string }>;
    anomalies: string[];
  }): Promise<LLMHypothesis> {
    if (!this.apiKey) {
      return {
        hypothesis: 'Insufficient data for hypothesis generation',
        evidence: [],
        confidence: 0.3,
        suggestedActions: [],
      };
    }

    const prompt = `
You are a military intelligence analyst. Based on the following observations, generate a hypothesis about what might be happening.

Observations:
${context.observations.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Active Threats:
${context.threats.map((t) => `- ${t.entityId} (${t.threatLevel})`).join('\n')}

Detected Anomalies:
${context.anomalies.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Provide your analysis in JSON format:
{
  "hypothesis": "Your hypothesis about the situation",
  "evidence": ["supporting evidence 1", "supporting evidence 2"],
  "confidence": 0.0-1.0,
  "suggestedActions": ["action1", "action2"]
}

Be analytical and concise.
    `;

    try {
      const response = await this.call([
        {
          role: 'system',
          content: 'You are a military intelligence analyst. Provide JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        hypothesis: parsed.hypothesis || '',
        evidence: parsed.evidence || [],
        confidence: parsed.confidence || 0.5,
        suggestedActions: parsed.suggestedActions || [],
      };
    } catch (error) {
      console.error('LLM hypothesis generation failed:', error);
      return {
        hypothesis: 'Unable to generate hypothesis',
        evidence: [],
        confidence: 0.2,
        suggestedActions: [],
      };
    }
  }

  /**
   * Generate decision rationale using LLM.
   */
  async generateRationale(context: {
    situation: string;
    threats: string[];
    goal: string;
    options: Array<{ action: string; pros: string[]; cons: string[] }>;
  }): Promise<{
    recommendation: string;
    rationale: string;
    confidence: Confidence;
    reasoning: string;
  }> {
    if (!this.apiKey) {
      return {
        recommendation: 'Continue monitoring',
        rationale: 'LLM disabled',
        confidence: 0.5,
        reasoning: 'No API key available',
      };
    }

    const prompt = `
You are a military decision-making AI. Help analyze options and provide a recommendation.

Current Situation:
${context.situation}

Active Threats:
${context.threats.join('\n')}

Goal:
${context.goal}

Options:
${context.options
  .map(
    (o, i) => `
${i + 1}. ${o.action}
   Pros: ${o.pros.join(', ')}
   Cons: ${o.cons.join(', ')}
`,
  )
  .join('\n')}

Provide your recommendation in JSON format:
{
  "recommendation": "Best action to take",
  "rationale": "Why this action",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed reasoning"
}
    `;

    try {
      const response = await this.call([
        {
          role: 'system',
          content:
            'You are a military decision-making expert. Provide JSON responses only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        recommendation: parsed.recommendation || 'Continue monitoring',
        rationale: parsed.rationale || '',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      console.error('LLM rationale generation failed:', error);
      return {
        recommendation: 'Continue monitoring',
        rationale: 'LLM failed',
        confidence: 0.3,
        reasoning: String(error),
      };
    }
  }

  /**
   * Call OpenRouter API.
   */
  private async call(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    maxTokens = 500,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const request: OpenRouterRequest = {
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.9,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://grond-eye.local',
        'X-Title': 'Grond-Eye Semantic Agent',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    this.requestCount++;
    this.tokenUsage.prompt += data.usage.prompt_tokens;
    this.tokenUsage.completion += data.usage.completion_tokens;
    this.tokenUsage.total += data.usage.total_tokens;

    return data.choices[0].message.content;
  }

  /**
   * Get usage statistics.
   */
  getStats(): {
    requestCount: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  } {
    return {
      requestCount: this.requestCount,
      totalTokens: this.tokenUsage.total,
      promptTokens: this.tokenUsage.prompt,
      completionTokens: this.tokenUsage.completion,
    };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.requestCount = 0;
    this.tokenUsage = { prompt: 0, completion: 0, total: 0 };
  }
}

/**
 * Global OpenRouter client instance.
 */
let globalClient: OpenRouterClient | null = null;

export function getOpenRouterClient(apiKey?: string): OpenRouterClient {
  if (!globalClient) {
    globalClient = new OpenRouterClient(apiKey);
  }
  return globalClient;
}
