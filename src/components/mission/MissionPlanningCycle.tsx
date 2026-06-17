'use client';

import React, { useState } from 'react';
import {
  Pencil,
  CheckCircle2,
  Play,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Users,
  Target,
  BookOpen,
} from 'lucide-react';

type MissionPhase = 'design' | 'plan' | 'execute' | 'debrief';

interface MissionObjective {
  id: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  measurable: string;
  status: 'pending' | 'achieved' | 'failed';
}

interface MissionStatus {
  phase: MissionPhase;
  objectives: MissionObjective[];
  assignedResources: string[];
  estimatedDuration: number;
  startTime?: number;
  endTime?: number;
  lessonsLearned?: string[];
}

interface MissionPlanningCycleProps {
  missionId?: string;
  onMissionUpdate?: (status: MissionStatus) => void;
}

export function MissionPlanningCycle({ missionId, onMissionUpdate }: MissionPlanningCycleProps) {
  const [currentPhase, setCurrentPhase] = useState<MissionPhase>('design');
  const [objectives, setObjectives] = useState<MissionObjective[]>([
    {
      id: '1',
      description: 'Establish command post',
      priority: 'critical',
      measurable: 'Command post operational',
      status: 'pending',
    },
    {
      id: '2',
      description: 'Secure perimeter',
      priority: 'high',
      measurable: 'Perimeter secured with no breaches',
      status: 'pending',
    },
  ]);
  const [assignedResources, setAssignedResources] = useState<string[]>(['fighter-1', 'transport-1']);
  const [newObjective, setNewObjective] = useState('');
  const [missionStartTime, setMissionStartTime] = useState<number>();
  const [debriefNotes, setDebriefNotes] = useState('');

  const phaseStages: Array<{ phase: MissionPhase; title: string; icon: React.ReactNode; color: string }> = [
    { phase: 'design', title: 'Design & Tactics', icon: <Pencil size={18} />, color: 'blue' },
    { phase: 'plan', title: 'Planning', icon: <Target size={18} />, color: 'purple' },
    { phase: 'execute', title: 'Execution', icon: <Play size={18} />, color: 'green' },
    { phase: 'debrief', title: 'Debrief & Learn', icon: <BookOpen size={18} />, color: 'orange' },
  ];

  const getPriorityColor = (priority: string) => {
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

  const getPhaseColor = (phase: MissionPhase) => {
    switch (phase) {
      case 'design':
        return 'from-blue-500 to-blue-600';
      case 'plan':
        return 'from-purple-500 to-purple-600';
      case 'execute':
        return 'from-green-500 to-green-600';
      case 'debrief':
        return 'from-orange-500 to-orange-600';
    }
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    const objective: MissionObjective = {
      id: String(Date.now()),
      description: newObjective,
      priority: 'medium',
      measurable: `${newObjective} completed`,
      status: 'pending',
    };
    setObjectives([...objectives, objective]);
    setNewObjective('');
  };

  const handleDeleteObjective = (id: string) => {
    setObjectives(objectives.filter((o) => o.id !== id));
  };

  const handlePhaseChange = (phase: MissionPhase) => {
    if (phase === 'execute' && !missionStartTime) {
      setMissionStartTime(Date.now());
    }
    setCurrentPhase(phase);
    onMissionUpdate?.({
      phase,
      objectives,
      assignedResources,
      estimatedDuration: 3600,
      startTime: missionStartTime,
    });
  };

  const handleObjectiveStatusChange = (id: string, status: 'achieved' | 'failed') => {
    setObjectives(
      objectives.map((o) => (o.id === id ? { ...o, status } : o)),
    );
  };

  const renderDesignPhase = () => (
    <div className="space-y-4">
      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Mission Objectives</h4>
        <div className="space-y-2">
          {objectives.map((obj) => (
            <div
              key={obj.id}
              className={`p-3 rounded border flex items-start justify-between ${getPriorityColor(obj.priority)}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{obj.description}</p>
                <p className="text-xs opacity-75">{obj.measurable}</p>
              </div>
              <button
                onClick={() => handleDeleteObjective(obj.id)}
                className="flex-shrink-0 ml-2 p-1 hover:bg-slate-700 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddObjective()}
            placeholder="Add new objective..."
            className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddObjective}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Key Constraints</h4>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-slate-800/50 rounded flex items-start gap-2">
            <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-300">Rules of engagement enforce civilian protection</span>
          </div>
          <div className="p-2 bg-slate-800/50 rounded flex items-start gap-2">
            <Clock size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-300">Mission completion deadline in 12 hours</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanPhase = () => (
    <div className="space-y-4">
      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Assigned Resources</h4>
        <div className="grid grid-cols-2 gap-2">
          {assignedResources.map((resource) => (
            <div
              key={resource}
              className="p-2 bg-slate-800/50 rounded border border-slate-700 text-xs text-slate-300 flex items-center gap-2"
            >
              <Users size={12} />
              {resource}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Execution Tactics</h4>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-slate-800/50 rounded">
            <p className="font-medium text-slate-200">Phase 1: Establishment</p>
            <p className="text-slate-400">Est. duration: 30 minutes</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded">
            <p className="font-medium text-slate-200">Phase 2: Execution</p>
            <p className="text-slate-400">Est. duration: 2 hours</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded">
            <p className="font-medium text-slate-200">Phase 3: Consolidation</p>
            <p className="text-slate-400">Est. duration: 30 minutes</p>
          </div>
        </div>
      </div>

      <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition">
        Approve Plan
      </button>
    </div>
  );

  const renderExecutePhase = () => (
    <div className="space-y-4">
      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Mission Status: IN PROGRESS</h4>
        <div className="space-y-2">
          {objectives.map((obj) => (
            <div key={obj.id} className="p-2 bg-slate-800/50 rounded border border-slate-700">
              <div className="flex items-start justify-between mb-1">
                <p className="text-xs font-medium text-slate-200">{obj.description}</p>
                <select
                  value={obj.status}
                  onChange={(e) => handleObjectiveStatusChange(obj.id, e.target.value as any)}
                  className="text-xs bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-slate-100"
                >
                  <option value="pending">Pending</option>
                  <option value="achieved">Achieved</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <p className="text-xs text-slate-400">{obj.measurable}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/30 border border-slate-700 rounded p-3">
          <p className="text-xs text-slate-500">Elapsed Time</p>
          <p className="text-lg font-semibold text-slate-100">
            {missionStartTime ? Math.round((Date.now() - missionStartTime) / 60000) : 0} min
          </p>
        </div>
        <div className="bg-slate-800/30 border border-slate-700 rounded p-3">
          <p className="text-xs text-slate-500">Objectives Achieved</p>
          <p className="text-lg font-semibold text-green-400">
            {objectives.filter((o) => o.status === 'achieved').length}/{objectives.length}
          </p>
        </div>
      </div>

      <button className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium text-sm transition">
        Complete Mission & Proceed to Debrief
      </button>
    </div>
  );

  const renderDebriefPhase = () => (
    <div className="space-y-4">
      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Mission Results</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-800/50 rounded">
            <p className="text-slate-500">Objectives Achieved</p>
            <p className="text-lg font-semibold text-green-400">
              {objectives.filter((o) => o.status === 'achieved').length}
            </p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded">
            <p className="text-slate-500">Objectives Failed</p>
            <p className="text-lg font-semibold text-red-400">
              {objectives.filter((o) => o.status === 'failed').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-100">Lessons Learned</h4>
        <textarea
          value={debriefNotes}
          onChange={(e) => setDebriefNotes(e.target.value)}
          placeholder="Document key lessons learned and recommendations for future missions..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 resize-none h-24"
        />
      </div>

      <button className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-medium text-sm transition">
        Archive & Close Mission
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mission Cycle Progress */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-100">Mission Cycle</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {phaseStages.map((stage, index) => (
            <div key={stage.phase} className="flex items-center gap-2">
              <button
                onClick={() => handlePhaseChange(stage.phase)}
                className={`px-4 py-3 rounded font-medium text-sm flex items-center gap-2 whitespace-nowrap transition ${
                  currentPhase === stage.phase
                    ? `bg-gradient-to-r ${getPhaseColor(stage.phase)} text-white`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {stage.icon}
                {stage.title}
              </button>
              {index < phaseStages.length - 1 && (
                <ChevronRight size={16} className="text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phase Content */}
      <div className="bg-slate-800/20 border border-slate-700 rounded p-4">
        {currentPhase === 'design' && renderDesignPhase()}
        {currentPhase === 'plan' && renderPlanPhase()}
        {currentPhase === 'execute' && renderExecutePhase()}
        {currentPhase === 'debrief' && renderDebriefPhase()}
      </div>
    </div>
  );
}
