'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TemporalPlayback, TemporalSnapshot } from '@/core/temporal/TemporalPlayback';
import { Graph3DVisualization } from './Graph3DVisualization';
import { TemporalVisualization } from './TemporalVisualization';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { QueryResults } from '@/components/query/QueryResults';
import { Maximize2, Minimize2, Settings, AlertCircle } from 'lucide-react';

interface Entity {
  id: string;
  label: string;
  threatLevel: number;
  confidence: number;
}

interface Relationship {
  source: string;
  target: string;
  strength: number;
  confidence: number;
}

export function VisualizationDashboard() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [temporalPlayback] = useState(() => new TemporalPlayback());
  const [currentSnapshot, setCurrentSnapshot] = useState<TemporalSnapshot | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string>();
  const [expandedPanel, setExpandedPanel] = useState<'graph' | 'query' | 'none'>('none');
  const [viewMode, setViewMode] = useState<'split' | 'fullscreen'>('split');

  // Load sample data on mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = async () => {
    try {
      // In a real app, fetch from API
      const sampleEntities: Entity[] = [
        { id: 'entity-1', label: 'Server A', threatLevel: 0.7, confidence: 0.9 },
        { id: 'entity-2', label: 'Server B', threatLevel: 0.5, confidence: 0.85 },
        { id: 'entity-3', label: 'Client X', threatLevel: 0.3, confidence: 0.8 },
        { id: 'entity-4', label: 'Client Y', threatLevel: 0.6, confidence: 0.75 },
        { id: 'entity-5', label: 'Router Z', threatLevel: 0.4, confidence: 0.92 },
      ];

      const sampleRelationships: Relationship[] = [
        { source: 'entity-1', target: 'entity-2', strength: 0.8, confidence: 0.9 },
        { source: 'entity-1', target: 'entity-5', strength: 0.7, confidence: 0.85 },
        { source: 'entity-2', target: 'entity-3', strength: 0.6, confidence: 0.8 },
        { source: 'entity-2', target: 'entity-4', strength: 0.75, confidence: 0.82 },
        { source: 'entity-3', target: 'entity-4', strength: 0.9, confidence: 0.88 },
      ];

      setEntities(sampleEntities);
      setRelationships(sampleRelationships);
    } catch (error) {
      console.error('Failed to load sample data:', error);
    }
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntityIds((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]));
  }, []);

  const handleQuery = useCallback(
    async (query: string, context?: any) => {
      setIsQueryLoading(true);
      setQueryError(undefined);
      setQueryResult(null);

      try {
        const response = await fetch('/api/ops/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            naturalLanguage: query,
            context: {
              selectedEntityIds: selectedEntityIds.length > 0 ? selectedEntityIds : undefined,
              ...context,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setQueryResult(data.data);
      } catch (error) {
        setQueryError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsQueryLoading(false);
      }
    },
    [selectedEntityIds],
  );

  const handleRunCorrelation = useCallback(async () => {
    if (selectedEntityIds.length < 2) {
      setQueryError('Select at least 2 entities for correlation analysis');
      return;
    }

    setIsQueryLoading(true);
    setQueryError(undefined);

    try {
      const response = await fetch('/api/ops/correlations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'threat_correlation',
          entityIds: selectedEntityIds,
          threshold: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setQueryResult({
        interpretation: {
          type: 'correlation',
          confidence: 0.9,
          summary: `Analyzing correlations between ${selectedEntityIds.length} entities`,
          structuredQueries: [
            {
              engine: 'correlation',
              query: { type: 'threat_correlation', entityIds: selectedEntityIds },
              rationale: 'User-triggered correlation analysis',
            },
          ],
        },
        results: { correlation: data.data },
        insights: [
          `Found ${data.correlationCount} correlations between selected entities`,
          ...data.data.slice(0, 2).map((c: any) => `${c.strength} correlation: ${c.entityPair[0]} ↔ ${c.entityPair[1]}`),
        ],
        executionTime: 0,
        query: { naturalLanguage: `Analyze correlations between ${selectedEntityIds.length} entities` },
      });
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'Correlation analysis failed');
    } finally {
      setIsQueryLoading(false);
    }
  }, [selectedEntityIds]);

  const graphContent = (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <Graph3DVisualization entities={entities} relationships={relationships} onNodeSelect={handleNodeSelect} autoRotate />
      </div>

      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <TemporalVisualization playback={temporalPlayback} onSnapshotChange={setCurrentSnapshot} height="h-48" />
      </div>
    </div>
  );

  const queryContent = (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          <QueryBuilder onQuery={handleQuery} isLoading={isQueryLoading} />

          {selectedEntityIds.length >= 2 && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
              <button
                onClick={handleRunCorrelation}
                disabled={isQueryLoading}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition font-medium text-sm"
              >
                Analyze {selectedEntityIds.length} Selected Entities
              </button>
              <div className="text-xs text-slate-400 mt-2">
                Selected: {selectedEntityIds.map((id) => entities.find((e) => e.id === id)?.label || id).join(', ')}
              </div>
            </div>
          )}

          <QueryResults result={queryResult} isLoading={isQueryLoading} error={queryError} />
        </div>
      </div>
    </div>
  );

  if (viewMode === 'fullscreen' && expandedPanel !== 'none') {
    return (
      <div className="w-full h-screen bg-slate-950">
        {/* Fullscreen header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-100">
            {expandedPanel === 'graph' ? 'Threat Graph Visualization' : 'Advanced Query Engine'}
          </h2>

          <button
            onClick={() => setViewMode('split')}
            className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
            title="Exit fullscreen"
          >
            <Minimize2 size={20} />
          </button>
        </div>

        {/* Fullscreen content */}
        <div className="h-[calc(100vh-73px)]">{expandedPanel === 'graph' ? graphContent : queryContent}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Advanced Threat Intelligence Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time visualization, predictive analytics, and correlation discovery</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">
            {selectedEntityIds.length} selected
          </div>
          <button
            onClick={() => setSelectedEntityIds([])}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition text-xs"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-4 p-4">
        {/* Graph panel */}
        <div
          className={`${
            expandedPanel === 'query' ? 'w-0 hidden' : 'flex-1'
          } bg-slate-900 rounded-lg border border-slate-800 flex flex-col transition-all`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="font-semibold text-slate-100">Threat Landscape</h2>
            <button
              onClick={() => {
                setViewMode('fullscreen');
                setExpandedPanel('graph');
              }}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
              title="Expand"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">{graphContent}</div>
        </div>

        {/* Query panel */}
        <div
          className={`${
            expandedPanel === 'graph' ? 'w-0 hidden' : 'w-96'
          } bg-slate-900 rounded-lg border border-slate-800 flex flex-col transition-all`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="font-semibold text-slate-100">Query Engine</h2>
            <button
              onClick={() => {
                setViewMode('fullscreen');
                setExpandedPanel('query');
              }}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
              title="Expand"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">{queryContent}</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400">
        <div>
          Entities: {entities.length} | Relationships: {relationships.length} | Selected: {selectedEntityIds.length}
        </div>
        <div>💡 Select nodes in the graph or use natural language queries to investigate</div>
      </div>
    </div>
  );
}
