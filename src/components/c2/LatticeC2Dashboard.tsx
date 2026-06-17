'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  RefreshCw,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  Zap,
} from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';
import { PlaybookManager } from './PlaybookManager';

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
    creator?: string;
    endpoint?: string;
  };
}

export function LatticeC2Dashboard() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load entities
  const loadEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ops/c2/entities?limit=100');
      if (response.ok) {
        const data = await response.json();
        setEntities(data.data || []);
        setLastRefresh(Date.now());
      }
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load entities on mount
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadEntities, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadEntities]);

  // Filter entities
  useEffect(() => {
    const filtered = entities.filter((entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.entityId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredEntities(filtered);
  }, [entities, searchQuery]);

  const getRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const statusCounts = {
    online: entities.filter((e) => e.status === 'online' || e.status === 'live').length,
    offline: entities.filter((e) => e.status === 'offline').length,
    error: entities.filter((e) => e.status === 'error').length,
    degraded: entities.filter((e) => e.status === 'degraded').length,
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col">
      {/* GLOBAL HEADER */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
        {/* Left: Branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-white">GE</span>
          </div>
          <span className="font-semibold text-slate-100">Grond-Eye</span>
          <span className="text-xs text-slate-500 ml-2">C2 Command & Control</span>
        </div>

        {/* Right: Utilities */}
        <div className="flex items-center gap-4">
          {/* System clock */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Clock size={14} />
            <span>{new Date().toLocaleString()}</span>
          </div>

          {/* Help */}
          <button
            className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
            title="Documentation"
          >
            <HelpCircle size={18} />
          </button>

          {/* User */}
          <div className="text-xs text-slate-400">
            <span>developer@anduril.com</span>
          </div>

          {/* Settings */}
          <button
            className="p-2 hover:bg-slate-800 text-slate-400 rounded transition"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-6 flex-shrink-0">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-4">
          <span className="hover:text-slate-300 cursor-pointer">Environments</span>
          <span className="mx-2">/</span>
          <span className="text-slate-400">Control Center</span>
        </div>

        {/* Title & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Control Center</h1>
            <p className="text-sm text-slate-400">Manage and monitor entity threats in real-time</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadEntities}
              disabled={isLoading}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded transition disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 transition font-medium text-sm">
              <Plus size={16} />
              Create Entity
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Online', count: statusCounts.online, color: 'bg-green-500', textColor: 'text-green-400' },
            { label: 'Offline', count: statusCounts.offline, color: 'bg-red-500', textColor: 'text-red-400' },
            { label: 'Error', count: statusCounts.error, color: 'bg-orange-500', textColor: 'text-orange-400' },
            { label: 'Degraded', count: statusCounts.degraded, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-400 uppercase font-semibold">{item.label}</span>
              </div>
              <div className={`text-2xl font-bold ${item.textColor}`}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT: ENTITY LIST */}
        <div className="w-full lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900">
          {/* Search */}
          <div className="p-4 border-b border-slate-800 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Entity List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEntities.length === 0 ? (
              // EMPTY STATE
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <AlertCircle size={40} className="text-slate-600 mb-4" />
                <h3 className="text-slate-300 font-semibold mb-2">No entities found</h3>
                <p className="text-slate-500 text-sm mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new entity'}
                </p>
                {!searchQuery && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition">
                    + Create Entity
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    className={`p-4 cursor-pointer transition ${
                      selectedEntity?.id === entity.id
                        ? 'bg-slate-800 border-l-2 border-blue-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Entity name + status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-100 text-sm truncate">{entity.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{entity.entityId}</p>
                      </div>
                      <StatusIndicator status={entity.status} size="sm" showPulse={true} />
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-slate-500 space-y-1">
                      <div>
                        <span className="text-slate-600">Platform:</span> {entity.platformType}
                      </div>
                      <div>
                        <span className="text-slate-600">Threat:</span>{' '}
                        <span
                          className={
                            entity.threatLevel > 0.7
                              ? 'text-red-400'
                              : entity.threatLevel > 0.4
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }
                        >
                          {(entity.threatLevel * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-800/30 text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span>{filteredEntities.length} entities</span>
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-3 h-3 cursor-pointer"
                  id="autoRefresh"
                />
                <label htmlFor="autoRefresh" className="cursor-pointer">
                  Auto-refresh
                </label>
              </div>
            </div>
            <div className="mt-2 text-slate-600">Last updated: {getRelativeTime(lastRefresh)}</div>
          </div>
        </div>

        {/* RIGHT: DETAIL VIEW */}
        {selectedEntity ? (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Entity Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">{selectedEntity.name}</h2>
                  <code className="text-sm text-slate-500 font-mono mt-1">{selectedEntity.entityId}</code>
                </div>
                <StatusIndicator status={selectedEntity.status} label={selectedEntity.status.toUpperCase()} size="md" />
              </div>

              {/* Metadata Row */}
              <div className="text-sm text-slate-400 space-y-1">
                <div>
                  <span className="text-slate-600">Created:</span>{' '}
                  {selectedEntity.lastUpdated
                    ? `${new Date(selectedEntity.lastUpdated).toLocaleString()} (${getRelativeTime(selectedEntity.lastUpdated)})`
                    : 'N/A'}
                </div>
                <div>
                  <span className="text-slate-600">Creator:</span> {selectedEntity.metadata?.creator || 'System'}
                </div>
              </div>
            </div>

            {/* Content: Two-Column Layout */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 p-6">
                {/* LEFT: Status & Configuration */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">Status</h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-500">State</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedEntity.status === 'online' || selectedEntity.status === 'live'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span className="text-sm font-semibold text-slate-100 capitalize">
                            {selectedEntity.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-500">Threat Level</span>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  selectedEntity.threatLevel > 0.7
                                    ? 'bg-red-500'
                                    : selectedEntity.threatLevel > 0.4
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${selectedEntity.threatLevel * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-100 w-12">
                              {(selectedEntity.threatLevel * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Card */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">Configuration</h3>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">Platform Type</span>
                        <p className="text-slate-100 font-medium">{selectedEntity.platformType}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Ontology</span>
                        <p className="text-slate-100 font-medium">{selectedEntity.ontology}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Provenance</span>
                        <p className="text-slate-100 font-medium">{selectedEntity.provenance}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Resources & Endpoint */}
                <div className="space-y-6">
                  {/* Resources Card */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">Resources</h3>

                    <div>
                      <span className="text-xs text-slate-500">All Started</span>
                      <p className="text-sm text-slate-100 font-medium mt-1">
                        {selectedEntity.capabilities.length} capabilities
                      </p>

                      <div className="mt-3 space-y-2">
                        {selectedEntity.capabilities.map((cap) => (
                          <div key={cap} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs">
                            {cap}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Card */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-4">Endpoint</h3>

                    {selectedEntity.metadata?.endpoint ? (
                      <div>
                        <span className="text-xs text-slate-500">Access URL</span>
                        <a
                          href={`https://${selectedEntity.metadata.endpoint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-mono mt-2 break-all transition"
                        >
                          {selectedEntity.metadata.endpoint}
                          <ArrowUpRight size={14} />
                        </a>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-900/20 border border-yellow-900/50 rounded text-sm text-yellow-300">
                        Endpoint is being generated. This may take a few minutes.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion: Documentation */}
              <div className="p-6 pt-0">
                <div className="bg-slate-800/30 border border-slate-700 rounded">
                  <button
                    onClick={() => {
                      const updated = new Set(expandedDocs);
                      if (updated.has(selectedEntity.id)) {
                        updated.delete(selectedEntity.id);
                      } else {
                        updated.add(selectedEntity.id);
                      }
                      setExpandedDocs(updated);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition rounded"
                  >
                    <h3 className="text-sm font-semibold text-slate-100">Documentation</h3>
                    {expandedDocs.has(selectedEntity.id) ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </button>

                  {expandedDocs.has(selectedEntity.id) && (
                    <div className="px-4 py-3 border-t border-slate-700 text-sm text-slate-400">
                      <p>Entity type: {selectedEntity.ontology}</p>
                      <p className="mt-2">
                        Manage and monitor threats for this {selectedEntity.platformType} entity. Use the command
                        interface to execute control operations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mission Automation Section */}
            <div className="border-t border-slate-800 bg-slate-900/50 p-4 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-yellow-400" />
                <h3 className="text-xs font-semibold text-slate-100 uppercase">Mission Automation</h3>
              </div>
              <PlaybookManager entityId={selectedEntity.id} entityName={selectedEntity.name} />
            </div>

            {/* Action Buttons */}
            <div className="border-t border-slate-800 bg-slate-900 p-4 flex-shrink-0 flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium text-sm">
                Execute Command
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition font-medium text-sm">
                View Timeline
              </button>
            </div>
          </div>
        ) : (
          // EMPTY DETAIL VIEW
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Entity Selected</h3>
              <p className="text-slate-500">Select an entity from the list to view details and manage</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
