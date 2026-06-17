/**
 * @file RedisCache.ts
 * @description Redis caching layer for frequently accessed data.
 */

import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // TTL in seconds
}

/**
 * Redis cache wrapper with typed keys and automatic TTL.
 */
export class RedisCache {
  private redis: Redis;
  private defaultTTL = 300; // 5 minutes default

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Set a cache entry.
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttl = options.ttl ?? this.defaultTTL;

      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`RedisCache: Failed to set ${key}:`, error);
    }
  }

  /**
   * Get a cache entry.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`RedisCache: Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a cache entry.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`RedisCache: Failed to delete ${key}:`, error);
    }
  }

  /**
   * Delete multiple cache entries.
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(`RedisCache: Failed to delete pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      console.error(`RedisCache: Failed to check ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache entity baseline.
   */
  async setBaseline(pluginId: string, entityId: string, baseline: any): Promise<void> {
    const key = `cache:baseline:${pluginId}:${entityId}`;
    await this.set(key, baseline, { ttl: 600 }); // 10 minutes
  }

  /**
   * Get entity baseline from cache.
   */
  async getBaseline(pluginId: string, entityId: string): Promise<any | null> {
    const key = `cache:baseline:${pluginId}:${entityId}`;
    return this.get(key);
  }

  /**
   * Invalidate baselines for an entity.
   */
  async invalidateBaselines(pluginId: string, entityId: string): Promise<void> {
    const pattern = `cache:baseline:${pluginId}:${entityId}*`;
    await this.deletePattern(pattern);
  }

  /**
   * Cache threat assessment.
   */
  async setThreatAssessment(pluginId: string, entityId: string, assessment: any): Promise<void> {
    const key = `cache:threat:${pluginId}:${entityId}`;
    await this.set(key, assessment, { ttl: 300 }); // 5 minutes
  }

  /**
   * Get threat assessment from cache.
   */
  async getThreatAssessment(pluginId: string, entityId: string): Promise<any | null> {
    const key = `cache:threat:${pluginId}:${entityId}`;
    return this.get(key);
  }

  /**
   * Invalidate threat assessments for an entity.
   */
  async invalidateThreatAssessments(pluginId: string, entityId: string): Promise<void> {
    const pattern = `cache:threat:${pluginId}:${entityId}*`;
    await this.deletePattern(pattern);
  }

  /**
   * Cache graph layout.
   */
  async setGraphLayout(tenantId: string, layoutKey: string, layout: any): Promise<void> {
    const key = `cache:graph:${tenantId}:${layoutKey}`;
    await this.set(key, layout, { ttl: 900 }); // 15 minutes
  }

  /**
   * Get graph layout from cache.
   */
  async getGraphLayout(tenantId: string, layoutKey: string): Promise<any | null> {
    const key = `cache:graph:${tenantId}:${layoutKey}`;
    return this.get(key);
  }

  /**
   * Invalidate graph layouts for a tenant.
   */
  async invalidateGraphLayouts(tenantId: string): Promise<void> {
    const pattern = `cache:graph:${tenantId}:*`;
    await this.deletePattern(pattern);
  }

  /**
   * Cache query results.
   */
  async setQueryResult(tenantId: string, queryKey: string, result: any, ttl: number = 300): Promise<void> {
    const key = `cache:query:${tenantId}:${queryKey}`;
    await this.set(key, result, { ttl });
  }

  /**
   * Get query result from cache.
   */
  async getQueryResult(tenantId: string, queryKey: string): Promise<any | null> {
    const key = `cache:query:${tenantId}:${queryKey}`;
    return this.get(key);
  }

  /**
   * Invalidate query results for a tenant.
   */
  async invalidateQueryResults(tenantId: string): Promise<void> {
    const pattern = `cache:query:${tenantId}:*`;
    await this.deletePattern(pattern);
  }

  /**
   * Clear all cache.
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      console.log('RedisCache: Cleared all cache');
    } catch (error) {
      console.error('RedisCache: Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    connected: boolean;
  }> {
    try {
      const keys = await this.redis.dbsize();
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';
      const isConnected = await this.redis.ping() === 'PONG';

      return {
        keys,
        memory,
        connected: isConnected,
      };
    } catch (error) {
      console.error('RedisCache: Failed to get stats:', error);
      return {
        keys: 0,
        memory: 'unknown',
        connected: false,
      };
    }
  }

  /**
   * Shutdown cache.
   */
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('RedisCache: Shutdown complete');
    } catch (error) {
      console.error('RedisCache: Failed to shutdown:', error);
    }
  }

  /**
   * Get Redis client for direct access if needed.
   */
  getRedisClient(): Redis {
    return this.redis;
  }
}

// Singleton instance
let instance: RedisCache | null = null;

/**
 * Get or create the RedisCache singleton.
 */
export function getRedisCache(redisUrl?: string): RedisCache {
  if (!instance) {
    instance = new RedisCache(redisUrl);
  }
  return instance;
}
