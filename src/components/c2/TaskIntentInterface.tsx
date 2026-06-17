'use client';

import React, { useState } from 'react';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  Shield,
} from 'lucide-react';

interface TaskStep {
  id: string;
  action: string;
  description: string;
  estimatedDuration: number;
}

interface DecomposedTask {
  id: string;
  steps: TaskStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
}

interface TaskIntentInterfaceProps {
  entityId?: string;
  entityName?: string;
  currentThreatLevel?: number;
  onTaskSubmit?: (intent: string, taskId: string) => void;
}

export function TaskIntentInterface({
  entityId,
  entityName,
  currentThreatLevel = 0,
  onTaskSubmit,
}: TaskIntentInterfaceProps) {
  const [intent, setIntent] = useState('');
  const [decomposedTask, setDecomposedTask] = useState<DecomposedTask | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const exampleIntents = [
    'Isolate this system and collect forensics',
    'Block malicious IP and notify the team',
    'Quarantine suspicious file and scan',
    'Investigate anomalous activity and escalate if critical',
    'Hunt for indicators of compromise across the asset',
  ];

  const handleAnalyzeIntent = async () => {
    if (!intent.trim() || !entityId) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      const taskId = `task-${Date.now()}`;
      const riskScores = {
        'isolate': 0.4,
        'block': 0.3,
        'quarantine': 0.35,
        'investigate': 0.2,
        'hunt': 0.5,
        'collect': 0.25,
        'scan': 0.2,
      };

      let riskScore = 0.3;
      for (const [keyword, score] of Object.entries(riskScores)) {
        if (intent.toLowerCase().includes(keyword)) {
          riskScore = Math.max(riskScore, score);
        }
      }

      const threatMultiplier = Math.min(1, currentThreatLevel / 100);
      const adjustedRisk = riskScore + threatMultiplier * 0.2;

      let riskLevel: DecomposedTask['riskLevel'] = 'low';
      if (adjustedRisk > 0.7) riskLevel = 'critical';
      else if (adjustedRisk > 0.5) riskLevel = 'high';
      else if (adjustedRisk > 0.3) riskLevel = 'medium';

      const steps: TaskStep[] = [
        {
          id: 'step-1',
          action: 'Analyze Intent',
          description: 'Parse intent and generate execution plan',
          estimatedDuration: 30,
        },
        {
          id: 'step-2',
          action: 'Validate Resources',
          description: 'Check available resources and scheduling conflicts',
          estimatedDuration: 20,
        },
      ];

      if (intent.toLowerCase().includes('isolate')) {
        steps.push({
          id: 'step-3',
          action: 'Network Isolation',
          description: 'Isolate entity from network',
          estimatedDuration: 45,
        });
      }

      if (intent.toLowerCase().includes('collect') || intent.toLowerCase().includes('forensic')) {
        steps.push({
          id: 'step-4',
          action: 'Artifact Collection',
          description: 'Collect forensic artifacts and preserve evidence',
          estimatedDuration: 120,
        });
      }

      if (intent.toLowerCase().includes('hunt') || intent.toLowerCase().includes('investigate')) {
        steps.push({
          id: 'step-5',
          action: 'Threat Hunt',
          description: 'Hunt for additional indicators of compromise',
          estimatedDuration: 300,
        });
      }

      if (intent.toLowerCase().includes('scan')) {
        steps.push({
          id: 'step-6',
          action: 'Deep Scan',
          description: 'Perform comprehensive system scan',
          estimatedDuration: 180,
        });
      }

      if (intent.toLowerCase().includes('notify') || intent.toLowerCase().includes('escalate')) {
        steps.push({
          id: 'step-7',
          action: 'Notify Team',
          description: 'Escalate findings to security team',
          estimatedDuration: 10,
        });
      }

      const estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);

      const recommendations: string[] = [];
      if (riskLevel === 'high' || riskLevel === 'critical') {
        recommendations.push('⚠️ High-risk operation - recommend human review before execution');
        recommendations.push('🔒 Ensure backup systems are online before isolation');
      }
      if (estimatedDuration > 600) {
        recommendations.push('⏱️ Long-running task - monitor resource utilization');
      }
      if (currentThreatLevel > 80) {
        recommendations.push('🚨 Critical threat level - consider immediate containment');
      }
      if (steps.length > 5) {
        recommendations.push('📋 Complex operation - verify each step before execution');
      }

      setDecomposedTask({
        id: taskId,
        steps,
        estimatedDuration,
        riskLevel,
        confidence: 0.85 + Math.random() * 0.15,
        recommendations,
      });

      setIsAnalyzing(false);
    }, 1500);
  };

  const handleExecuteTask = () => {
    if (decomposedTask) {
      onTaskSubmit?.(intent, decomposedTask.id);
      setIntent('');
      setDecomposedTask(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-700';
      case 'high':
        return 'text-orange-400 bg-orange-900/20 border-orange-700';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      default:
        return 'text-green-400 bg-green-900/20 border-green-700';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high':
        return <AlertTriangle size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-100">Mission Intent</h3>
        <p className="text-xs text-slate-500">
          Describe your objective in natural language. The system will break it down into
          executable steps and identify required resources.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g., 'Isolate this system and collect forensics', 'Block malicious IP and notify the team'"
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
          rows={3}
          disabled={!entityId}
        />

        {!entityId && (
          <p className="text-xs text-amber-400">Select an entity to specify a mission intent</p>
        )}
      </div>

      {entityId && (
        <button
          onClick={handleAnalyzeIntent}
          disabled={!intent.trim() || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:hover:bg-slate-700 text-white rounded text-sm font-medium transition"
        >
          <Zap size={16} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Intent'}
        </button>
      )}

      {decomposedTask && (
        <div className="space-y-4 p-3 bg-slate-800/50 border border-slate-700 rounded">
          <div className="space-y-3">
            <div className={`flex items-start gap-2 p-2 rounded border ${getRiskColor(decomposedTask.riskLevel)}`}>
              <div className="flex-shrink-0">{getRiskIcon(decomposedTask.riskLevel)}</div>
              <div className="min-w-0">
                <p className="font-semibold text-xs capitalize">{decomposedTask.riskLevel} Risk</p>
                <p className="text-xs opacity-80">
                  Confidence: {(decomposedTask.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-slate-800 rounded text-xs">
                <Clock size={14} className="text-slate-400" />
                <span className="text-slate-300">
                  {Math.round(decomposedTask.estimatedDuration / 60)}m estimated
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-800 rounded text-xs">
                <Target size={14} className="text-slate-400" />
                <span className="text-slate-300">{decomposedTask.steps.length} steps</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Execution Plan</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {decomposedTask.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="border border-slate-700 rounded bg-slate-800/30 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    className="w-full p-2 flex items-center justify-between hover:bg-slate-800/50 transition text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0 text-xs text-slate-400">
                        {index + 1}.
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{step.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500">
                        {step.estimatedDuration}s
                      </span>
                      {expandedStep === step.id ? (
                        <ChevronUp size={14} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expandedStep === step.id && (
                    <div className="px-2 py-2 border-t border-slate-700 text-xs text-slate-400">
                      {step.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {decomposedTask.recommendations.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="w-full flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-xs text-slate-300 transition"
              >
                <Shield size={14} />
                <span>Safety Recommendations ({decomposedTask.recommendations.length})</span>
              </button>

              {showRecommendations && (
                <div className="p-2 bg-slate-800 rounded space-y-1 text-xs">
                  {decomposedTask.recommendations.map((rec, i) => (
                    <p key={i} className="text-slate-300">
                      {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleExecuteTask}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition"
            >
              <Send size={14} />
              Execute Mission
            </button>
            <button
              onClick={() => {
                setDecomposedTask(null);
                setIntent('');
              }}
              className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 p-3 bg-slate-800/20 border border-slate-700/50 rounded">
        <p className="text-xs font-semibold text-slate-400">Example Intents</p>
        <div className="space-y-1">
          {exampleIntents.map((example, i) => (
            <button
              key={i}
              onClick={() => setIntent(example)}
              className="w-full text-left p-1.5 hover:bg-slate-700 rounded text-xs text-slate-400 hover:text-slate-300 transition truncate"
            >
              • {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
