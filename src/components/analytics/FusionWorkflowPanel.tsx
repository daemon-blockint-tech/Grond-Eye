/**
 * @file FusionWorkflowPanel.tsx
 * @description Panel for managing fusion proposal queue and human approval.
 * Shows pending merges with side-by-side entity comparison.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FusionEngine, type FusionProposal } from '@/core/fusion';

export const FusionWorkflowPanel: React.FC<{ engine?: FusionEngine }> = ({
  engine,
}) => {
  const [proposals, setProposals] = useState<FusionProposal[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!engine) return;

    const loadProposals = async () => {
      setLoading(true);
      try {
        // In real implementation, fetch from DB
        const pending = await engine.getPendingFusions(10);
        // Convert to proposals for display
        const props = pending.map((d) => d.proposal);
        setProposals(props);
      } catch (error) {
        console.error('Error loading proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
    const interval = setInterval(loadProposals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [engine]);

  const handleApprove = async (idx: number) => {
    if (!engine) return;
    const proposal = proposals[idx];

    try {
      await engine.acceptFusion(proposal, 'user', 'Approved via UI');
      setProposals(proposals.filter((_, i) => i !== idx));
      if (selectedIdx >= proposals.length - 1) {
        setSelectedIdx(Math.max(0, proposals.length - 2));
      }
    } catch (error) {
      console.error('Error accepting fusion:', error);
    }
  };

  const handleReject = async (idx: number) => {
    if (!engine) return;
    const proposal = proposals[idx];

    try {
      await engine.rejectFusion(
        proposal.pluginId1,
        proposal.entityId1,
        proposal.pluginId2,
        proposal.entityId2,
        'user',
        'Rejected via UI',
      );
      setProposals(proposals.filter((_, i) => i !== idx));
    } catch (error) {
      console.error('Error rejecting fusion:', error);
    }
  };

  if (!engine) {
    return (
      <div className="p-4 text-slate-400 text-sm">
        Fusion engine not available
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-slate-400 text-sm">Loading proposals...</div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-4 text-slate-400 text-sm">No pending fusions</div>
    );
  }

  const current = proposals[selectedIdx];

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 h-96 overflow-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Fusion Workflow</h2>
        <div className="text-xs text-slate-400">
          {selectedIdx + 1} / {proposals.length}
        </div>
      </div>

      {current && (
        <>
          {/* Confidence score */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">Confidence:</div>
            <div className="flex-1 bg-slate-700 h-2 rounded overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${current.score * 100}%` }}
              />
            </div>
            <div className="text-xs font-semibold">
              {(current.score * 100).toFixed(0)}%
            </div>
          </div>

          {/* Reasons */}
          <div className="flex gap-2">
            {current.reasons.map((reason) => (
              <span
                key={reason}
                className="px-2 py-1 bg-slate-700 rounded text-xs"
              >
                {reason.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          {/* Entity comparison */}
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-auto text-xs">
            <div className="border border-slate-700 rounded p-2">
              <div className="font-semibold text-slate-300">
                {current.pluginId1}
              </div>
              <div className="text-slate-400">{current.entityId1}</div>
            </div>
            <div className="border border-slate-700 rounded p-2">
              <div className="font-semibold text-slate-300">
                {current.pluginId2}
              </div>
              <div className="text-slate-400">{current.entityId2}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(selectedIdx)}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(selectedIdx)}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
            >
              Reject
            </button>
          </div>

          {/* Navigation */}
          {proposals.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelectedIdx(Math.max(0, selectedIdx - 1))
                }
                disabled={selectedIdx === 0}
                className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm"
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  setSelectedIdx(Math.min(proposals.length - 1, selectedIdx + 1))
                }
                disabled={selectedIdx === proposals.length - 1}
                className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
