/**
 * @file osint-plugin.ts
 * @description OSINT feeds plugin - aggregates RSS alerts and reports.
 * Demonstrates multi-source streaming integration for Phase 4c.
 */

import type { WorldPlugin, GeoEntity, PluginContext, LayerConfig } from '@grond/plugin-sdk';

interface Feed {
  url: string;
  name: string;
  category: 'flood' | 'conflict' | 'infrastructure' | 'weather' | 'security';
  parseFunction: (item: any) => GeoEntity | null;
}

interface FeedItem {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string;
  geo?: { lat: number; lon: number };
  severity?: string;
  tags?: string[];
}

export class OSINTFeedsPlugin implements WorldPlugin {
  id = 'osint-feeds';
  name = 'OSINT Feeds';
  private context?: PluginContext;
  private feeds: Feed[] = [];
  private lastFetchTime = 0;
  private pollingInterval = 300000; // 5 minutes

  constructor() {
    this.initializeFeeds();
  }

  private initializeFeeds(): void {
    this.feeds = [
      {
        url: 'https://example.com/floods.rss',
        name: 'Flood Alerts',
        category: 'flood',
        parseFunction: this.parseFloodAlert.bind(this),
      },
      {
        url: 'https://example.com/conflicts.rss',
        name: 'Conflict Events',
        category: 'conflict',
        parseFunction: this.parseConflictEvent.bind(this),
      },
      {
        url: 'https://example.com/infrastructure.rss',
        name: 'Infrastructure Events',
        category: 'infrastructure',
        parseFunction: this.parseInfrastructureEvent.bind(this),
      },
    ];
  }

  async fetch(timeRange: { start: Date; end: Date }): Promise<GeoEntity[]> {
    const entities: GeoEntity[] = [];
    const now = Date.now();

    // Rate limiting
    if (now - this.lastFetchTime < this.pollingInterval) {
      return entities;
    }

    this.lastFetchTime = now;

    // Fetch from all feeds in parallel
    const promises = this.feeds.map((feed) => this.fetchFeed(feed));
    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        entities.push(...result.value);
      }
    }

    return entities;
  }

  private async fetchFeed(feed: Feed): Promise<GeoEntity[]> {
    try {
      // Mock fetch - in production, use actual RSS parser
      const items = await this.mockFetchRSS(feed.url);
      return items
        .map((item) => feed.parseFunction(item))
        .filter((entity): entity is GeoEntity => entity !== null);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error);
      return [];
    }
  }

  private async mockFetchRSS(url: string): Promise<FeedItem[]> {
    // Mock implementation - returns sample data
    return [
      {
        title: 'Flash Flood Warning - Southeast Region',
        description: 'Severe flooding reported in river basin',
        severity: 'high',
        geo: { lat: 33.5, lon: -87.5 },
        tags: ['flood', 'weather', 'critical'],
        pubDate: new Date().toISOString(),
      },
      {
        title: 'Infrastructure Damage - Power Plant',
        description: 'Partial outage reported',
        severity: 'medium',
        geo: { lat: 40.2, lon: -75.3 },
        tags: ['infrastructure', 'critical_asset'],
        pubDate: new Date().toISOString(),
      },
    ];
  }

  private parseFloodAlert(item: FeedItem): GeoEntity | null {
    if (!item.geo) return null;

    return {
      id: `flood-${Date.now()}-${Math.random()}`,
      pluginId: this.id,
      latitude: item.geo.lat,
      longitude: item.geo.lon,
      label: item.title,
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
      properties: {
        type: 'flood_alert',
        severity: item.severity ?? 'unknown',
        description: item.description,
        source: 'rss_feed',
        keywords: item.tags ?? [],
      },
    };
  }

  private parseConflictEvent(item: FeedItem): GeoEntity | null {
    if (!item.geo) return null;

    return {
      id: `conflict-${Date.now()}-${Math.random()}`,
      pluginId: this.id,
      latitude: item.geo.lat,
      longitude: item.geo.lon,
      label: item.title,
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
      properties: {
        type: 'conflict_event',
        severity: item.severity ?? 'unknown',
        description: item.description,
        source: 'rss_feed',
        keywords: item.tags ?? [],
      },
    };
  }

  private parseInfrastructureEvent(item: FeedItem): GeoEntity | null {
    if (!item.geo) return null;

    return {
      id: `infra-${Date.now()}-${Math.random()}`,
      pluginId: this.id,
      latitude: item.geo.lat,
      longitude: item.geo.lon,
      label: item.title,
      timestamp: new Date(item.pubDate ?? Date.now()).getTime(),
      properties: {
        type: 'infrastructure_event',
        severity: item.severity ?? 'unknown',
        description: item.description,
        source: 'rss_feed',
        criticality: 'high',
        keywords: item.tags ?? [],
      },
    };
  }

  getPollingInterval(): number {
    return this.pollingInterval;
  }

  getLayerConfig(): LayerConfig {
    return {
      name: 'OSINT Feeds',
      color: '#f59e0b',
      clustering: true,
      clustering_config: {
        min_level: 0,
        max_objects: 5,
      },
    };
  }

  onContextReady(context: PluginContext): void {
    this.context = context;
  }

  mapWebsocketPayload(payload: any): GeoEntity[] {
    // Handle real-time WebSocket updates if available
    if (Array.isArray(payload)) {
      return payload
        .map((item) => this.parseFloodAlert(item))
        .filter((entity): entity is GeoEntity => entity !== null);
    }
    return [];
  }
}

export default new OSINTFeedsPlugin();
