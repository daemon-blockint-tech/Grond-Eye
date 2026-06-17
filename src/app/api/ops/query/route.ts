import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { LLMQueryInterpreter } from '@/core/query/LLMQueryInterpreter';
import { TemporalQueryEngine } from '@/core/query/TemporalQueryEngine';
import { PredictiveQueryEngine } from '@/core/query/PredictiveQueryEngine';
import { FullTextSearchIndex } from '@/core/search/FullTextSearchIndex';
import { CorrelationQueryEngine } from '@/core/query/CorrelationQueryEngine';
import { AnomalyDetectionEngine } from '@/core/ml/AnomalyDetectionEngine';
import { SemanticStore } from '@/core/semantic/semanticStore';

const db = new PrismaClient();
const anomalyEngine = new AnomalyDetectionEngine();
const semanticStore = new SemanticStore();
const temporalEngine = new TemporalQueryEngine(db, anomalyEngine, semanticStore);
const predictiveEngine = new PredictiveQueryEngine(db, anomalyEngine);
const searchIndex = new FullTextSearchIndex(db);
const correlationEngine = new CorrelationQueryEngine(db);
const llmInterpreter = new LLMQueryInterpreter(
  db,
  temporalEngine,
  predictiveEngine,
  searchIndex,
  correlationEngine,
);

/**
 * POST /api/ops/query
 * Execute natural language query and get structured results.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { naturalLanguage, context } = body;

    if (!naturalLanguage || typeof naturalLanguage !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid naturalLanguage query' },
        { status: 400 },
      );
    }

    const result = await llmInterpreter.interpret({
      naturalLanguage,
      context: context || {},
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Query execution failed' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ops/query/suggestions
 * Get example query suggestions.
 */
export async function GET() {
  try {
    const suggestions = await llmInterpreter.getSuggestions();

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve suggestions' },
      { status: 500 },
    );
  }
}
