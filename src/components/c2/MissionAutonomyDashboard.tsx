'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Layers,
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';

interface ResourcePool {
  type: string;
  total: number;
  allocated: number;
  reserved: number;
}

interface SensorState {
  sensorId: string;
  sourceType: string;
  lastSeen: number;
  status: 'active' | 'degraded' | 'offline';
  reliability: number;
}

interface ExecutionSchedule {
  executionId: string;
  playbookId: string;
  entityId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

interface MissionAutonomyData {
  resourceUtilization: Record<string, number>;
  sensorHealth: Record<string, SensorState>;
  pendingExecutions: ExecutionSchedule[];
  runningExecutions: ExecutionSchedule[];
  adaptationStats: {
    totalAdaptations: number;
    byType: Record<string, number>;
    averageConfidence: number;
  };
  decomposedTasksCount: number;
}

interface MissionAutonomyDashboardProps {
  data?: MissionAutonomyData;
  isLoading?: boolean;
}

export function MissionAutonomyDashboard({ data, isLoading = false }: MissionAutonomyDashboardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('resources');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Auto-refresh would happen here via parent component
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const defaultData: MissionAutonomyData = data || {
    resourceUtilization: {
      compute: 45,
      network: 32,
      storage: 28,
      security_clearance: 60,
    },
    sensorHealth: {
      'sensor-1': {
        sensorId: 'sensor-1',
        sourceType: 'anomaly_detector',
        lastSeen: Date.now(),
        status: 'active',
        reliability: 0.95,
      },
      'sensor-2': {
        sensorId: 'sensor-2',
        sourceType: 'alert_engine',
        lastSeen: Date.now(),
        status: 'active',
        reliability: 0.98,
      },
      'sensor-3': {
        sensorId: 'sensor-3',
        sourceType: 'correlation',
        lastSeen: Date.now(),
        status: 'degraded',
        reliability: 0.72,
      },
    },
    pendingExecutions: [
      {
        executionId: 'exec-1',
        playbookId: 'pb-isolate-respond',
        entityId: 'entity-1',
        priority: 'high',
        status: 'pending',
      },
      {
        executionId: 'exec-2',
        playbookId: 'pb-block-notify',
        entityId: 'entity-2',
        priority: 'medium',
        status: 'pending',
      },
    ],
    runningExecutions: [
      {
        executionId: 'exec-3',
        playbookId: 'pb-quarantine-scan',
        entityId: 'entity-3',
        priority: 'high',
        status: 'running',
      },
    ],
    adaptationStats: {
      totalAdaptations: 12,
      byType: {
        escalate: 3,
        de_escalate: 2,
        accelerate: 4,
        extend_monitoring: 3,
      },
      averageConfidence: 0.87,
    },
    decomposedTasksCount: 8,
  };

  const displayData = data || defaultData;
  const resourceEntries = Object.entries(displayData.resourceUtilization);
  const sensorEntries = Object.entries(displayData.sensorHealth);
  const totalSensors = sensorEntries.length;
  const activeSensors = sensorEntries.filter(([, s]) => s.status === 'active').length;
  const totalExecutions = displayData.pendingExecutions.length + displayData.runningExecutions.length;

  const getResourceColor = (utilization: number): string => {
    if (utilization > 80) return 'bg-red-500';
    if (utilization > 60) return 'bg-orange-500';
    if (utilization > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-900/30 text-red-400 border-red-700';
      case 'high':
        return 'bg-orange-900/30 text-orange-400 border-orange-700';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      default:
        return 'bg-green-900/30 text-green-400 border-green-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Mission Autonomy Control</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded transition ${
              autoRefresh
                ? 'bg-green-900/30 text-green-400'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          >
            <Activity size={16} className={autoRefresh ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-800/30 border border-slate-700 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-blue-400" />
            <span className="text-xs text-slate-500">Decomposed Tasks</span>
          </div>
          <p className="text-xl font-semibold text-slate-100">{displayData.decomposedTasksCount}</p>
        </div>

        <div className="p-3 bg-slate-800/30 border border-slate-700 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-xs text-slate-500">Executions</span>
          </div>
          <p className="text-xl font-semibold text-slate-100">{totalExecutions}</p>
          <p className="text-xs text-slate-500">
            {displayData.runningExecutions.length} running
          </p>
        </div>

        <div className="p-3 bg-slate-800/30 border border-slate-700 rounded">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={14} className="text-cyan-400" />
            <span className="text-xs text-slate-500">Sensor Health</span>
          </div>
          <p className="text-xl font-semibold text-slate-100">
            {activeSensors}/{totalSensors}
          </p>
          <p className="text-xs text-slate-500">active</p>
        </div>

        <div className="p-3 bg-slate-800/30 border border-slate-700 rounded">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-purple-400" />
            <span className="text-xs text-slate-500">Adaptations</span>
          </div>
          <p className="text-xl font-semibold text-slate-100">
            {displayData.adaptationStats.totalAdaptations}
          </p>
          <p className="text-xs text-slate-500">
            {(displayData.adaptationStats.averageConfidence * 100).toFixed(0)}% avg confidence
          </p>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="border border-slate-700 rounded bg-slate-800/30">
        <button
          onClick={() => setExpandedSection(expandedSection === 'resources' ? null : 'resources')}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            <span className="font-semibold text-slate-100">Resource Allocation</span>
          </div>
          <span className="text-xs text-slate-500">
            {expandedSection === 'resources' ? '▼' : '▶'}
          </span>
        </button>

        {expandedSection === 'resources' && (
          <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2">
            {resourceEntries.map(([type, utilization]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400">{utilization.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getResourceColor(utilization)}`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sensor Fusion Status */}
      <div className="border border-slate-700 rounded bg-slate-800/30">
        <button
          onClick={() => setExpandedSection(expandedSection === 'sensors' ? null : 'sensors')}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-cyan-400" />
            <span className="font-semibold text-slate-100">Sensor Fusion</span>
          </div>
          <span className="text-xs text-slate-500">
            {expandedSection === 'sensors' ? '▼' : '▶'} {activeSensors}/{totalSensors} active
          </span>
        </button>

        {expandedSection === 'sensors' && (
          <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2 max-h-48 overflow-y-auto">
            {sensorEntries.map(([id, sensor]) => (
              <div key={id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs">
                <div className="min-w-0">
                  <p className="text-slate-300 truncate">{sensor.sensorId}</p>
                  <p className="text-slate-500 text-xs">{sensor.sourceType}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.status).replace('text-', 'bg-')}`} />
                    <span className={`capitalize ${getStatusColor(sensor.status)}`}>
                      {sensor.status}
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {(sensor.reliability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Queue */}
      <div className="border border-slate-700 rounded bg-slate-800/30">
        <button
          onClick={() => setExpandedSection(expandedSection === 'executions' ? null : 'executions')}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-green-400" />
            <span className="font-semibold text-slate-100">Execution Queue</span>
          </div>
          <span className="text-xs text-slate-500">
            {expandedSection === 'executions' ? '▼' : '▶'} {totalExecutions} queued
          </span>
        </button>

        {expandedSection === 'executions' && (
          <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2 max-h-48 overflow-y-auto">
            {displayData.runningExecutions.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-green-400 mb-1">Running</p>
                {displayData.runningExecutions.map((exec) => (
                  <div key={exec.executionId} className={`p-2 rounded text-xs border ${getPriorityColor(exec.priority)}`}>
                    <p className="font-medium truncate">{exec.playbookId}</p>
                    <p className="text-xs opacity-75">{exec.entityId}</p>
                  </div>
                ))}
              </div>
            )}

            {displayData.pendingExecutions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-1">Pending</p>
                {displayData.pendingExecutions.map((exec) => (
                  <div key={exec.executionId} className={`p-2 rounded text-xs border opacity-75 ${getPriorityColor(exec.priority)}`}>
                    <p className="font-medium truncate">{exec.playbookId}</p>
                    <p className="text-xs opacity-75">{exec.entityId}</p>
                  </div>
                ))}
              </div>
            )}

            {totalExecutions === 0 && (
              <div className="p-3 text-center text-sm text-slate-500">
                No pending or running executions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Planning Status */}
      <div className="border border-slate-700 rounded bg-slate-800/30">
        <button
          onClick={() => setExpandedSection(expandedSection === 'planning' ? null : 'planning')}
          className="w-full p-3 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-purple-400" />
            <span className="font-semibold text-slate-100">Dynamic Planning</span>
          </div>
          <span className="text-xs text-slate-500">
            {expandedSection === 'planning' ? '▼' : '▶'}
          </span>
        </button>

        {expandedSection === 'planning' && (
          <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(displayData.adaptationStats.byType).map(([type, count]) => (
                <div key={type} className="p-2 bg-slate-800/50 rounded text-xs">
                  <p className="text-slate-400 capitalize">{type}</p>
                  <p className="text-lg font-semibold text-slate-100">{count}</p>
                </div>
              ))}
            </div>
            <div className="p-2 bg-slate-800/50 rounded text-xs">
              <p className="text-slate-400">Avg Confidence</p>
              <p className="text-lg font-semibold text-slate-100">
                {(displayData.adaptationStats.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-3 bg-slate-800/20 border border-slate-700/50 rounded text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300 mb-2">🚀 Mission Autonomy Features</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Intent-to-Task:</strong> Decompose operator objectives into executable steps</li>
          <li><strong>Sensor Fusion:</strong> Fuse data from multiple detection sources</li>
          <li><strong>Resource Management:</strong> Intelligent allocation and scheduling</li>
          <li><strong>Dynamic Planning:</strong> Real-time adaptation to threat changes</li>
        </ul>
      </div>
    </div>
  );
}
