'use client';

import React, { useState } from 'react';
import { X, Edit2, Save, Copy, AlertCircle } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface Entity {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'unknown' | 'live' | 'degraded';
  entityId: string;
  provenance: string;
  ontology: string;
  capabilities: string[];
  platformType: string;
  threatLevel: number;
  lastUpdated?: number;
  metadata?: {
    location?: { lat: number; lng: number };
    owner?: string;
    notes?: string;
    tags?: string[];
    customFields?: Record<string, string>;
  };
}

interface EntityDetailViewProps {
  entity?: Entity;
  onClose?: () => void;
  onUpdate?: (entity: Entity) => void;
}

export function EntityDetailView({ entity, onClose, onUpdate }: EntityDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Entity | null>(entity || null);

  if (!entity) {
    return null;
  }

  const handleSave = () => {
    if (editData) {
      onUpdate?.(editData);
      setIsEditing(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(entity.entityId);
  };

  const metadata = entity.metadata || {};
  const threatColor =
    entity.threatLevel > 0.7 ? 'text-red-400' : entity.threatLevel > 0.4 ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-800">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editData?.name || ''}
              onChange={(e) => setEditData(editData ? { ...editData, name: e.target.value } : null)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-lg font-semibold text-slate-100 w-full mb-2"
            />
          ) : (
            <h2 className="text-lg font-semibold text-slate-100 mb-2 truncate">{entity.name}</h2>
          )}

          <div className="flex items-center gap-3 mb-3">
            <StatusIndicator status={entity.status} label={entity.status.toUpperCase()} />
            <span className={`text-sm font-semibold ${threatColor}`}>
              Threat: {(entity.threatLevel * 100).toFixed(0)}%
            </span>
          </div>

          <div className="text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <code className="bg-slate-800 px-2 py-1 rounded">{entity.entityId}</code>
              <button onClick={handleCopyId} className="p-1 hover:bg-slate-800 rounded transition">
                <Copy size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-2 hover:bg-blue-900/30 text-blue-400 rounded transition"
              title="Save changes"
            >
              <Save size={18} />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditData(entity);
              }}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
              title="Edit entity"
            >
              <Edit2 size={18} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Core Properties */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Core Properties</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Type</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.platformType || ''}
                    onChange={(e) =>
                      setEditData(editData ? { ...editData, platformType: e.target.value } : null)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                ) : (
                  <span className="text-slate-100 font-medium">{entity.platformType}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Ontology</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.ontology || ''}
                    onChange={(e) =>
                      setEditData(editData ? { ...editData, ontology: e.target.value } : null)
                    }
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                ) : (
                  <span className="text-slate-100 font-medium">{entity.ontology}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Provenance</span>
                <span className="text-slate-100 font-medium">{entity.provenance}</span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {entity.capabilities.map((cap) => (
                <span key={cap} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                {metadata.owner && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-slate-100">{metadata.owner}</span>
                  </div>
                )}

                {metadata.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="text-slate-100 text-xs font-mono">
                      {metadata.location.lat.toFixed(4)}, {metadata.location.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                {metadata.notes && (
                  <div>
                    <span className="text-slate-400 block mb-1">Notes</span>
                    {isEditing ? (
                      <textarea
                        value={editData?.metadata?.notes || ''}
                        onChange={(e) =>
                          setEditData(
                            editData
                              ? {
                                  ...editData,
                                  metadata: { ...editData.metadata, notes: e.target.value },
                                }
                              : null,
                          )
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-sm"
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-100 text-xs bg-slate-800/50 rounded p-2">
                        {metadata.notes}
                      </p>
                    )}
                  </div>
                )}

                {metadata.tags && metadata.tags.length > 0 && (
                  <div>
                    <span className="text-slate-400 block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {metadata.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last Updated */}
          {entity.lastUpdated && (
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
              Last updated: {new Date(entity.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30 space-y-2">
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm font-medium">
          Execute Command
        </button>

        <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition text-sm font-medium">
          View Timeline
        </button>

        <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition text-sm font-medium">
          Related Entities
        </button>
      </div>
    </div>
  );
}
