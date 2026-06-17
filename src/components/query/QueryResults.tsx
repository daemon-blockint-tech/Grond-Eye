'use client';

import React, { useState } from 'react';
import { ChevronDown, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';

interface QueryResultsProps {
  result?: {
    query: { naturalLanguage: string };
    interpretation: {
      type: string;
      confidence: number;
      structuredQueries: Array<{
        engine: string;
        query: any;
        rationale: string;
      }>;
      summary: string;
    };
    results: any;
    executionTime: number;
    insights: string[];
  };
  isLoading?: boolean;
  error?: string;
}

export function QueryResults({ result, isLoading, error }: QueryResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['interpretation', 'results']));

  const toggleSection = (section: string) => {
    const updated = new Set(expandedSections);
    if (updated.has(section)) {
      updated.delete(section);
    } else {
      updated.add(section);
    }
    setExpandedSections(updated);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-400">Processing your query...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-lg border border-red-900/30 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold">Query Failed</div>
            <div className="text-red-300/70 text-sm mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Query summary */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="text-slate-300 text-sm mb-3">
          <span className="font-semibold">Query:</span> {result.query.naturalLanguage}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500 mb-1">Confidence</div>
            <div className="text-lg font-semibold text-blue-400">{(result.interpretation.confidence * 100).toFixed(0)}%</div>
          </div>

          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500 mb-1">Execution Time</div>
            <div className="text-lg font-semibold text-slate-300">{result.executionTime}ms</div>
          </div>

          <div className="bg-slate-800/50 rounded px-3 py-2">
            <div className="text-xs text-slate-500 mb-1">Type</div>
            <div className="text-lg font-semibold text-slate-300 capitalize">{result.interpretation.type}</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {result.insights && result.insights.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-400" />
            <span className="font-semibold text-slate-300">Key Insights</span>
          </div>

          <div className="space-y-2">
            {result.insights.map((insight, i) => (
              <div key={i} className="text-sm text-slate-300 bg-slate-800/30 rounded px-3 py-2 flex items-start gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <button
          onClick={() => toggleSection('interpretation')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
        >
          <span className="font-semibold text-slate-300">Interpretation</span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition ${expandedSections.has('interpretation') ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.has('interpretation') && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-1">Summary</div>
              <div className="text-sm text-slate-300">{result.interpretation.summary}</div>
            </div>

            {result.interpretation.structuredQueries.map((sq, i) => (
              <div key={i} className="bg-slate-800/30 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase">{sq.engine}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2">{sq.rationale}</div>
                <pre className="bg-slate-950 rounded p-2 text-xs text-slate-400 overflow-x-auto max-h-32">
                  {JSON.stringify(sq.query, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <button
          onClick={() => toggleSection('results')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
        >
          <span className="font-semibold text-slate-300">Results</span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition ${expandedSections.has('results') ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSections.has('results') && (
          <div className="border-t border-slate-800 px-4 py-3">
            {Object.entries(result.results).map(([engine, data]) => (
              <div key={engine} className="mb-4 last:mb-0">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">{engine}</div>

                {Array.isArray(data) ? (
                  <div className="space-y-2">
                    {data.length === 0 ? (
                      <div className="text-sm text-slate-500 italic">No results</div>
                    ) : (
                      data.slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800/30 rounded p-2 text-xs text-slate-300">
                          {/* Temporal results */}
                          {item.type && (
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">{item.type}</div>
                              {item.summary && (
                                <div className="space-y-1">
                                  <div>
                                    Avg: {(item.summary.averageValue * 100).toFixed(1)}% | Max:{' '}
                                    {(item.summary.maxValue * 100).toFixed(1)}% | Trend: {item.summary.trend}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Predictive results */}
                          {item.trend && item.riskLevel && (
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">{item.type}</div>
                              <div>Risk: {item.riskLevel} | Trend: {item.trend}</div>
                              {item.recommendations && (
                                <div className="mt-1">
                                  {item.recommendations.slice(0, 2).map((rec: string, j: number) => (
                                    <div key={j} className="text-slate-400">• {rec}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Correlation results */}
                          {item.entityPair && (
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">
                                {item.entityPair[0]} ↔ {item.entityPair[1]}
                              </div>
                              <div>
                                Score: {(item.correlationScore * 100).toFixed(0)}% ({item.strength})
                              </div>
                            </div>
                          )}

                          {/* Search results */}
                          {item.title && (
                            <div>
                              <div className="font-semibold text-slate-200 mb-1">{item.title}</div>
                              <div className="text-slate-400">{item.description?.substring(0, 100)}</div>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {data.length > 5 && <div className="text-xs text-slate-500">+{data.length - 5} more results</div>}
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded p-3">
                    <pre className="text-xs text-slate-400 overflow-x-auto max-h-48">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-slate-500 text-center">
        Query executed in {result.executionTime}ms across {result.interpretation.structuredQueries.length} query engine
        {result.interpretation.structuredQueries.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
