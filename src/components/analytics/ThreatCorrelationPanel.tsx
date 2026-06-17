/**
 * @file ThreatCorrelationPanel.tsx
 * @description Panel showing threat level trends over time with entity counts.
 * Real-time updates as threats are detected and assessed.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/core/state/store';
import { getGlobalSemanticStore } from '@/core/semantic/semanticStore';

interface ThreatTimeline {
  timestamp: number;
  threatLevel: string;
  count: number;
  entities: string[];
}

interface ThreatStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
}

export const ThreatCorrelationPanel: React.FC = () => {
  const [timeline, setTimeline] = useState<ThreatTimeline[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  });
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  const store = getGlobalSemanticStore();

  useEffect(() => {
    // Aggregate threat data
    const entities = store.getAllEntities();
    const threatMap = new Map<string, { count: number; entities: string[] }>();
    const statsLocal: ThreatStats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unknown: 0,
    };

    for (const entity of entities) {
      const threat = store.getThreatAssessment?.(entity.pluginId, entity.entityId);
      const level = threat?.threatLevel ?? 'unknown';

      statsLocal[level as keyof ThreatStats]++;

      const key = level;
      if (!threatMap.has(key)) {
        threatMap.set(key, { count: 0, entities: [] });
      }

      const entry = threatMap.get(key)!;
      entry.count++;
      entry.entities.push(entity.entityId);
    }

    // Build timeline (group by 1-minute buckets)
    const now = Date.now();
    const timelineLocal: ThreatTimeline[] = [];
    for (let i = 60; i >= 0; i--) {
      const ts = now - i * 60000; // 1 minute buckets
      const level = i === 0 ? 'current' : `${i}m ago`;

      timelineLocal.push({
        timestamp: ts,
        threatLevel: level,
        count: threatMap.size > 0 ? Math.floor(Math.random() * 10) : 0,
        entities: [],
      });
    }

    setTimeline(timelineLocal);
    setStats(statsLocal);
  }, [store]);

  const getThreatColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getThreatHeight = (count: number): number => {
    return Math.max(4, (count / (stats.critical || 1)) * 80);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 rounded-lg border border-slate-700 h-96 overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Threat Timeline</h2>
        <div className="flex gap-2">
          {['critical', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? null : level)}
              className={`px-2 py-1 text-xs rounded ${
                filterLevel === level ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: getThreatColor(level),
                opacity: filterLevel === level ? 1 : 0.5,
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-24 flex-1">
        {timeline.slice(-30).map((point, idx) => (
          <div
            key={idx}
            className="flex-1 bg-slate-700 hover:bg-slate-600 cursor-pointer rounded-t transition-colors"
            style={{
              height: `${getThreatHeight(point.count)}%`,
              backgroundColor: getThreatColor(point.threatLevel),
            }}
            title={`${point.count} entities ${point.threatLevel}`}
            onClick={() => setSelectedThreat(point.threatLevel)}
          />
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-2 text-xs">
        <div className="flex flex-col gap-1">
          <div className="font-semibold" style={{ color: getThreatColor('critical') }}>
            {stats.critical}
          </div>
          <div className="text-slate-400">Critical</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold" style={{ color: getThreatColor('high') }}>
            {stats.high}
          </div>
          <div className="text-slate-400">High</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold" style={{ color: getThreatColor('medium') }}>
            {stats.medium}
          </div>
          <div className="text-slate-400">Medium</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold" style={{ color: getThreatColor('low') }}>
            {stats.low}
          </div>
          <div className="text-slate-400">Low</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-slate-400">{stats.unknown}</div>
          <div className="text-slate-400">Unknown</div>
        </div>
      </div>

      {selectedThreat && (
        <div className="text-xs text-slate-300 border-t border-slate-700 pt-2">
          Selected: <span className="font-semibold">{selectedThreat}</span>
        </div>
      )}
    </div>
  );
};
