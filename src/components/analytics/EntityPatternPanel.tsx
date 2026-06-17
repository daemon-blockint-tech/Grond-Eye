/**
 * @file EntityPatternPanel.tsx
 * @description Panel for entity clustering and anomaly detection.
 * Shows behavioral patterns and unusual activity.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { getGlobalSemanticStore } from '@/core/semantic/semanticStore';

interface ClusterInfo {
  id: string;
  name: string;
  size: number;
  pattern: string;
  confidence: number;
  entities: string[];
  anomalyScore?: number;
}

export const EntityPatternPanel: React.FC = () => {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [anomalies, setAnomalies] = useState<ClusterInfo[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const store = getGlobalSemanticStore();

  useEffect(() => {
    const detectPatterns = () => {
      const entities = store.getAllEntities();

      if (entities.length === 0) {
        setClusters([]);
        setAnomalies([]);
        return;
      }

      // Simple clustering by entity type
      const typeMap = new Map<string, string[]>();
      for (const entity of entities) {
        const classification = store.getClassification?.(
          entity.pluginId,
          entity.entityId,
        );
        const type = classification?.type ?? 'unknown';

        if (!typeMap.has(type)) {
          typeMap.set(type, []);
        }
        typeMap.get(type)!.push(entity.entityId);
      }

      // Build clusters
      const clusterList: ClusterInfo[] = [];
      for (const [type, entityIds] of typeMap) {
        clusterList.push({
          id: type,
          name: type.replace(/_/g, ' ').toUpperCase(),
          size: entityIds.length,
          pattern: `${entityIds.length} entities of type ${type}`,
          confidence: 0.85,
          entities: entityIds,
        });
      }

      setClusters(clusterList.sort((a, b) => b.size - a.size));

      // Detect anomalies (simple heuristic: unusually large cluster)
      const avgSize = clusterList.reduce((sum, c) => sum + c.size, 0) / clusterList.length;
      const anomalyList = clusterList.filter((c) => {
        const deviation = Math.abs(c.size - avgSize) / avgSize;
        return deviation > 1.5; // 150% deviation
      });

      setAnomalies(
        anomalyList.map((c) => ({
          ...c,
          anomalyScore: Math.min(1, Math.abs(c.size - avgSize) / avgSize),
        })),
      );
    };

    detectPatterns();
    const interval = setInterval(detectPatterns, 5000);
    return () => clearInterval(interval);
  }, [store]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 h-96 overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Entity Patterns</h2>
        {anomalies.length > 0 && (
          <div className="px-2 py-1 bg-red-900 rounded text-xs font-semibold">
            {anomalies.length} anomalies
          </div>
        )}
      </div>

      {/* Anomalies section */}
      {anomalies.length > 0 && (
        <div className="border-b border-slate-700 pb-2">
          <div className="text-xs font-semibold text-red-400 mb-1">
            Anomalies
          </div>
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-center gap-2 py-1 px-2 bg-slate-800 rounded mb-1 cursor-pointer hover:bg-slate-700"
              onClick={() => setSelectedCluster(anomaly.id)}
            >
              <div className="w-1 h-4 bg-red-600 rounded" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">
                  {anomaly.name}
                </div>
                <div className="text-xs text-slate-400">
                  {anomaly.size} entities (unusual cluster size)
                </div>
              </div>
              {anomaly.anomalyScore && (
                <div className="text-xs font-semibold text-red-400">
                  {(anomaly.anomalyScore * 100).toFixed(0)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Clusters section */}
      <div className="flex-1 overflow-auto">
        <div className="text-xs font-semibold text-slate-400 mb-2">
          All Clusters
        </div>
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={`flex items-center gap-2 py-2 px-2 rounded mb-1 cursor-pointer transition-colors ${
              selectedCluster === cluster.id
                ? 'bg-blue-900'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
            onClick={() => setSelectedCluster(cluster.id)}
          >
            <div className="w-2 h-6 bg-slate-600 rounded" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{cluster.name}</div>
              <div className="text-xs text-slate-400">
                {cluster.size} entities
              </div>
            </div>
            <div className="text-xs text-slate-400">
              {(cluster.confidence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {selectedCluster && (
        <div className="border-t border-slate-700 pt-2 text-xs text-slate-300">
          <div className="font-semibold mb-1">Selected: {selectedCluster}</div>
          <div className="text-slate-400">
            {clusters.find((c) => c.id === selectedCluster)?.entities.length ?? 0} entities
          </div>
        </div>
      )}
    </div>
  );
};
