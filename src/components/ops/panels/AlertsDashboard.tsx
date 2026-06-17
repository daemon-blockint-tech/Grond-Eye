'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

interface SystemAlert {
  id: string;
  sourceAlertIds: string[];
  aggregatedCount: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId: string;
  enrichedContext: Record<string, any>;
  status: 'active' | 'escalated' | 'suppressed' | 'resolved';
  escalationLevel: number;
  routes: string[];
  createdAt: number;
  lastSeen: number;
  resolvedAt?: number;
  suppressedUntil?: number;
}

interface AlertsStats {
  activeCount: number;
  criticalCount: number;
  highCount: number;
  totalDeduplicatedFrom: number;
}

export function AlertsDashboard() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<AlertsStats>({
    activeCount: 0,
    criticalCount: 0,
    highCount: 0,
    totalDeduplicatedFrom: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Load alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (severityFilter) {
        params.append('severity', severityFilter);
      }

      const response = await fetch(`/api/ops/system-alerts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = (await response.json()) as any;
      let filtered = data.alerts;

      // Client-side search filtering
      if (searchQuery) {
        filtered = filtered.filter(
          (alert: SystemAlert) =>
            alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.entityId.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      setAlerts(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, limit, offset, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Resolve alert
  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ops/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Resolved from dashboard' }),
      });

      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Suppress alert
  const handleSuppress = async (alertId: string, durationMs: number = 3600000) => {
    try {
      const response = await fetch(`/api/ops/alerts/${alertId}/suppress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMs }),
      });

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, status: 'suppressed', suppressedUntil: Date.now() + durationMs } : a,
          ),
        );
      }
    } catch (err) {
      console.error('Failed to suppress alert:', err);
    }
  };

  // Escalate alert
  const handleEscalate = async (alertId: string) => {
    try {
      const response = await fetch(`/api/ops/alerts/${alertId}/escalate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Escalated from dashboard' }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, escalationLevel: data.escalationLevel, status: 'escalated' } : a)),
        );
      }
    } catch (err) {
      console.error('Failed to escalate alert:', err);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return <AlertCircle size={16} color={getSeverityColor(severity)} />;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
        <p className="text-gray-600">Monitor and manage automated threat and anomaly alerts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCount}</p>
            </div>
            <AlertCircle size={32} className="text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalCount}</p>
            </div>
            <Zap size={32} className="text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High</p>
              <p className="text-2xl font-bold text-orange-600">{stats.highCount}</p>
            </div>
            <TrendingUp size={32} className="text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deduplicated</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalDeduplicatedFrom}</p>
            </div>
            <CheckCircle size={32} className="text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by title, description, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="escalated">Escalated</option>
              <option value="suppressed">Suppressed</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fetchAlerts()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      )}

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No alerts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Entity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Count</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <span className="font-medium text-sm">{alert.severity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600 truncate">{alert.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{alert.entityId}</code>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{alert.type}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          alert.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : alert.status === 'escalated'
                              ? 'bg-red-100 text-red-800'
                              : alert.status === 'suppressed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatTime(alert.createdAt)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <span className="font-medium">{alert.aggregatedCount}</span>
                        {alert.aggregatedCount > 1 && <Clock size={14} className="text-gray-400" />}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleEscalate(alert.id)}
                              className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200 transition"
                            >
                              Escalate
                            </button>
                            <button
                              onClick={() => handleSuppress(alert.id, 3600000)}
                              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
                            >
                              Snooze
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && alerts.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, offset + alerts.length)} alerts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={alerts.length < limit}
                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 30 seconds
      </div>
    </div>
  );
}
