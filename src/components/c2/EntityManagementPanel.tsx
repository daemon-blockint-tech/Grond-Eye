'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface Entity {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'unknown' | 'live' | 'degraded';
  checks?: number;
  entityId: string;
  provenance: string;
  ontology: string;
  capabilities: string[];
  platformType: string;
  threatLevel: number;
  lastUpdated?: number;
}

interface EntityManagementPanelProps {
  entities: Entity[];
  onSelectEntity?: (entity: Entity) => void;
  onCreateEntity?: () => void;
  onDeleteEntity?: (id: string) => void;
  selectedEntityIds?: string[];
  isLoading?: boolean;
}

type SortField = 'name' | 'status' | 'threatLevel' | 'platformType';
type SortOrder = 'asc' | 'desc';

export function EntityManagementPanel({
  entities,
  onSelectEntity,
  onCreateEntity,
  onDeleteEntity,
  selectedEntityIds = [],
  isLoading = false,
}: EntityManagementPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [ontologyFilter, setOntologyFilter] = useState<string>('All');
  const [capabilityFilter, setCapabilityFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedEntityIds));

  // Extract unique filter values
  const statuses = useMemo(() => ['All', ...new Set(entities.map((e) => e.status))], [entities]);
  const ontologies = useMemo(() => ['All', ...new Set(entities.map((e) => e.ontology))], [entities]);
  const capabilities = useMemo(
    () => ['All', ...new Set(entities.flatMap((e) => e.capabilities))],
    [entities],
  );

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = entities.filter((entity) => {
      const matchesSearch =
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.entityId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || entity.status === statusFilter;
      const matchesOntology = ontologyFilter === 'All' || entity.ontology === ontologyFilter;
      const matchesCapability =
        capabilityFilter === 'All' || entity.capabilities.includes(capabilityFilter);

      return matchesSearch && matchesStatus && matchesOntology && matchesCapability;
    });

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'threatLevel') {
        aVal = a.threatLevel;
        bVal = b.threatLevel;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [entities, searchQuery, statusFilter, ontologyFilter, capabilityFilter, sortField, sortOrder]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredEntities.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectEntity = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-100">Entity Explorer</h2>
          <button
            onClick={onCreateEntity}
            className="p-2 hover:bg-slate-800 text-slate-300 rounded transition"
            title="Create new entity"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or entity ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none transition"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={ontologyFilter}
            onChange={(e) => setOntologyFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none transition"
          >
            {ontologies.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <select
            value={capabilityFilter}
            onChange={(e) => setCapabilityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 outline-none transition"
          >
            {capabilities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-800 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase sticky top-0">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredEntities.length && filteredEntities.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
          <div className="col-span-3">
            <button onClick={() => toggleSort('name')} className="hover:text-slate-200 transition">
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="col-span-1">
            <button onClick={() => toggleSort('status')} className="hover:text-slate-200 transition">
              Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="col-span-2">Provenance</div>
          <div className="col-span-2">Ontology</div>
          <div className="col-span-1">
            <button
              onClick={() => toggleSort('threatLevel')}
              className="hover:text-slate-200 transition"
            >
              Risk {sortField === 'threatLevel' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="col-span-2">Platform Type</div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400">Loading entities...</div>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">No entities found</div>
            </div>
          ) : (
            <div>
              {filteredEntities.map((entity) => (
                <div
                  key={entity.id}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/50 transition items-center ${
                    selectedIds.has(entity.id) ? 'bg-slate-800/50' : ''
                  }`}
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(entity.id)}
                      onChange={() => handleSelectEntity(entity.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div
                    className="col-span-3 cursor-pointer"
                    onClick={() => onSelectEntity?.(entity)}
                  >
                    <div className="text-sm font-medium text-slate-100">{entity.name}</div>
                    <div className="text-xs text-slate-500">{entity.entityId}</div>
                  </div>

                  <div className="col-span-1">
                    <StatusIndicator status={entity.status} size="sm" />
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-slate-400">{entity.provenance}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-slate-400">{entity.ontology}</span>
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`text-xs font-semibold ${
                        entity.threatLevel > 0.7
                          ? 'text-red-400'
                          : entity.threatLevel > 0.4
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }`}
                    >
                      {(entity.threatLevel * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-slate-400">{entity.platformType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30 text-xs text-slate-400 flex items-center justify-between">
        <div>{filteredEntities.length} results</div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span>{selectedIds.size} selected</span>
            <button
              onClick={() => {
                selectedIds.forEach((id) => onDeleteEntity?.(id));
                setSelectedIds(new Set());
              }}
              className="p-1.5 hover:bg-red-900/30 text-red-400 rounded transition"
              title="Delete selected"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
