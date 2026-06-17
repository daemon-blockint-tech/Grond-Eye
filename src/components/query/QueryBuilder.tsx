'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronDown, AlertCircle, TrendingUp } from 'lucide-react';

interface QueryBuilderProps {
  onQuery?: (query: string, context?: any) => void;
  isLoading?: boolean;
  suggestions?: string[];
}

export function QueryBuilder({ onQuery, isLoading = false, suggestions: initialSuggestions }: QueryBuilderProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions || []);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load suggestions on mount
  useEffect(() => {
    if (!initialSuggestions) {
      fetchSuggestions();
    }
  }, [initialSuggestions]);

  // Load recent queries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentQueries');
    if (stored) {
      setRecentQueries(JSON.parse(stored).slice(0, 5));
    }
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/ops/query?method=GET');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSubmit = (queryText: string = query) => {
    if (!queryText.trim()) return;

    // Save to recent queries
    const updated = [queryText, ...recentQueries.filter((q) => q !== queryText)].slice(0, 5);
    setRecentQueries(updated);
    localStorage.setItem('recentQueries', JSON.stringify(updated));

    // Call parent handler
    onQuery?.(queryText, {});

    // Clear input if not using suggestion
    if (queryText === query) {
      setQuery('');
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSubmit(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displaySuggestions = showSuggestions && (query.length > 0 ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())) : suggestions);

  return (
    <div ref={containerRef} className="w-full">
      <div className="space-y-3">
        {/* Main query input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 focus-within:border-blue-500 transition">
            {isLoading ? <Loader2 size={20} className="text-slate-400 animate-spin" /> : <Search size={20} className="text-slate-400" />}

            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question about threats, correlations, forecasts..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={!query.trim() || isLoading}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {displaySuggestions && displaySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-lg z-50">
              <div className="max-h-64 overflow-y-auto">
                {displaySuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 transition flex items-start gap-3 border-b border-slate-800 last:border-0"
                  >
                    <TrendingUp size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-slate-100 text-sm">{suggestion}</div>
                      <div className="text-slate-500 text-xs mt-1">Click to execute or type to filter</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Query tips */}
        <div className="text-xs text-slate-500 px-1">
          💡 Try: "Show threat trends", "Find correlated entities", "Forecast next week"
        </div>

        {/* Recent queries */}
        {recentQueries.length > 0 && !showSuggestions && (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-3">
            <div className="text-xs font-semibold text-slate-400 mb-2">Recent Queries</div>
            <div className="space-y-2">
              {recentQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q)}
                  className="w-full text-left text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded px-2 py-1 transition truncate"
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
