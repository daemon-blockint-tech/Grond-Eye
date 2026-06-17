'use client';

import React from 'react';

type Status = 'online' | 'offline' | 'error' | 'unknown' | 'live' | 'degraded';

interface StatusIndicatorProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function StatusIndicator({ status, label, size = 'md', showPulse = true }: StatusIndicatorProps) {
  const statusConfig: Record<Status, { color: string; bg: string; text: string }> = {
    online: { color: 'bg-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
    live: { color: 'bg-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
    offline: { color: 'bg-red-500', bg: 'bg-red-500/20', text: 'text-red-400' },
    error: { color: 'bg-red-600', bg: 'bg-red-600/20', text: 'text-red-400' },
    degraded: { color: 'bg-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    unknown: { color: 'bg-slate-500', bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };

  const sizeConfig = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeConfig[size]}`}>
        <div className={`absolute inset-0 rounded-full ${config.color}`} />
        {showPulse && (
          <div
            className={`absolute inset-0 rounded-full ${config.color} animate-pulse`}
          />
        )}
      </div>
      {label && (
        <span className={`text-xs font-semibold uppercase ${config.text}`}>
          {label}
        </span>
      )}
    </div>
  );
}
