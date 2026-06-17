'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface HierarchyNode {
  id: string;
  label: string;
  status: 'online' | 'offline' | 'error' | 'unknown' | 'live' | 'degraded';
  type: string;
  children?: HierarchyNode[];
  metadata?: {
    ontology?: string;
    provenance?: string;
    platformType?: string;
    threatLevel?: number;
  };
}

interface AssetHierarchyProps {
  nodes: HierarchyNode[];
  onSelectNode?: (node: HierarchyNode) => void;
  selectedNodeId?: string;
}

function HierarchyNode({ node, level = 0, onSelectNode, selectedNodeId }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        onClick={() => onSelectNode?.(node)}
        className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-800 transition rounded cursor-pointer ${
          selectedNodeId === node.id ? 'bg-slate-800 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-slate-700 rounded"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <StatusIndicator status={node.status} size="sm" showPulse={false} />

        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-100 font-medium truncate">{node.label}</div>
          {node.metadata?.platformType && (
            <div className="text-xs text-slate-500">{node.metadata.platformType}</div>
          )}
        </div>

        {node.metadata?.threatLevel !== undefined && (
          <div className="text-xs font-semibold">
            <span
              className={
                node.metadata.threatLevel > 0.7
                  ? 'text-red-400'
                  : node.metadata.threatLevel > 0.4
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }
            >
              {(node.metadata.threatLevel * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child: HierarchyNode) => (
            <HierarchyNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetHierarchy({ nodes, onSelectNode, selectedNodeId }: AssetHierarchyProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filterNodes = (nodes: HierarchyNode[], query: string): HierarchyNode[] => {
    return nodes
      .filter((node) => {
        const matches = node.label.toLowerCase().includes(query.toLowerCase()) ||
          node.type.toLowerCase().includes(query.toLowerCase()) ||
          node.metadata?.platformType?.toLowerCase().includes(query.toLowerCase());
        return matches;
      })
      .map((node) => ({
        ...node,
        children: node.children ? filterNodes(node.children, query) : undefined,
      }));
  };

  const filteredNodes = searchQuery ? filterNodes(nodes, searchQuery) : nodes;

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      {/* Hierarchy tree */}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No assets found</div>
        ) : (
          <div className="py-2">
            {filteredNodes.map((node) => (
              <HierarchyNode
                key={node.id}
                node={node}
                level={0}
                onSelectNode={onSelectNode}
                selectedNodeId={selectedNodeId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
