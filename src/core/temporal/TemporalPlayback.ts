/**
 * @file TemporalPlayback.ts
 * @description Temporal playback engine for entity behavior visualization.
 * Manages timeline scrubbing, playback, and frame generation.
 */

export interface TemporalSnapshot {
  timestamp: number;
  frameIndex: number;
  entities: Array<{
    id: string;
    pluginId: string;
    x?: number;
    y?: number;
    z?: number;
    speed?: number;
    heading?: number;
    threatLevel?: number;
    [key: string]: any;
  }>;
  events: Array<{
    type: 'anomaly' | 'alert' | 'fusion';
    id: string;
    entityId: string;
    severity?: string;
    description: string;
  }>;
}

/**
 * Temporal playback manager for entity behavior timeline.
 */
export class TemporalPlayback {
  private snapshots: Map<number, TemporalSnapshot> = new Map();
  private sortedTimestamps: number[] = [];
  private currentIndex = 0;
  private isPlaying = false;
  private playbackSpeed = 1; // 1.0 = real-time
  private lastFrameTime = 0;
  private frameInterval = 1000; // Frame every 1 second by default

  /**
   * Load behavior history and generate snapshots.
   */
  async loadBehaviorHistory(
    startTime: number,
    endTime: number,
    entities: Array<{ id: string; behaviors: any[] }>,
  ): Promise<void> {
    this.snapshots.clear();
    this.sortedTimestamps = [];
    this.currentIndex = 0;

    // Group behaviors by time window
    const windows = this.createTimeWindows(startTime, endTime);

    for (let i = 0; i < windows.length; i++) {
      const windowStart = windows[i];
      const windowEnd = i + 1 < windows.length ? windows[i + 1] : endTime;

      const snapshot: TemporalSnapshot = {
        timestamp: windowStart,
        frameIndex: i,
        entities: [],
        events: [],
      };

      // Aggregate entity data for this window
      for (const entity of entities) {
        const behaviorInWindow = entity.behaviors.find(
          (b) => b.timestamp >= windowStart && b.timestamp < windowEnd,
        );

        if (behaviorInWindow) {
          snapshot.entities.push({
            id: entity.id,
            pluginId: entity.id.split('|')[0],
            x: behaviorInWindow.x,
            y: behaviorInWindow.y,
            z: behaviorInWindow.z,
            speed: behaviorInWindow.features?.speed,
            heading: behaviorInWindow.features?.heading,
            threatLevel: behaviorInWindow.threatLevel,
          });
        }
      }

      this.snapshots.set(windowStart, snapshot);
      this.sortedTimestamps.push(windowStart);
    }

    console.log(`TemporalPlayback: Loaded ${this.snapshots.size} frames`);
  }

  /**
   * Create time windows for aggregation.
   */
  private createTimeWindows(startTime: number, endTime: number): number[] {
    const windows: number[] = [];
    const windowSize = this.frameInterval; // 1 second windows by default

    for (let t = startTime; t < endTime; t += windowSize) {
      windows.push(t);
    }

    if (windows.length === 0) {
      windows.push(startTime);
    }

    return windows;
  }

  /**
   * Play timeline from current position.
   */
  play(): void {
    this.isPlaying = true;
    this.lastFrameTime = Date.now();
  }

  /**
   * Pause timeline.
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Stop and reset to beginning.
   */
  stop(): void {
    this.isPlaying = false;
    this.currentIndex = 0;
  }

  /**
   * Seek to timestamp.
   */
  seek(timestamp: number): void {
    const index = this.sortedTimestamps.findIndex((t) => t >= timestamp);
    if (index >= 0) {
      this.currentIndex = index;
    }
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(4, speed)); // Clamp between 0.1x and 4x
  }

  /**
   * Get current snapshot, advancing playback if needed.
   */
  getSnapshot(): TemporalSnapshot | null {
    if (this.sortedTimestamps.length === 0) {
      return null;
    }

    // Advance frame if playing
    if (this.isPlaying) {
      const now = Date.now();
      const elapsed = now - this.lastFrameTime;
      const expectedTime = this.frameInterval / this.playbackSpeed;

      if (elapsed >= expectedTime) {
        this.currentIndex = Math.min(this.currentIndex + 1, this.sortedTimestamps.length - 1);
        this.lastFrameTime = now;

        // Pause at end
        if (this.currentIndex >= this.sortedTimestamps.length - 1) {
          this.isPlaying = false;
        }
      }
    }

    const timestamp = this.sortedTimestamps[this.currentIndex];
    return this.snapshots.get(timestamp) || null;
  }

  /**
   * Get next frame (frame-by-frame mode).
   */
  nextFrame(): TemporalSnapshot | null {
    this.currentIndex = Math.min(this.currentIndex + 1, this.sortedTimestamps.length - 1);
    const timestamp = this.sortedTimestamps[this.currentIndex];
    return this.snapshots.get(timestamp) || null;
  }

  /**
   * Get previous frame (frame-by-frame mode).
   */
  previousFrame(): TemporalSnapshot | null {
    this.currentIndex = Math.max(this.currentIndex - 1, 0);
    const timestamp = this.sortedTimestamps[this.currentIndex];
    return this.snapshots.get(timestamp) || null;
  }

  /**
   * Get timeline metadata.
   */
  getMetadata(): {
    totalFrames: number;
    currentFrame: number;
    currentTimestamp: number;
    startTimestamp: number;
    endTimestamp: number;
    isPlaying: boolean;
    speed: number;
  } {
    const currentTimestamp = this.sortedTimestamps[this.currentIndex] || 0;
    const startTimestamp = this.sortedTimestamps[0] || 0;
    const endTimestamp = this.sortedTimestamps[this.sortedTimestamps.length - 1] || 0;

    return {
      totalFrames: this.sortedTimestamps.length,
      currentFrame: this.currentIndex,
      currentTimestamp,
      startTimestamp,
      endTimestamp,
      isPlaying: this.isPlaying,
      speed: this.playbackSpeed,
    };
  }

  /**
   * Get progress as percentage.
   */
  getProgress(): number {
    if (this.sortedTimestamps.length === 0) return 0;
    return (this.currentIndex / (this.sortedTimestamps.length - 1)) * 100;
  }

  /**
   * Jump to anomaly event.
   */
  jumpToAnomaly(direction: 'forward' | 'backward' = 'forward'): boolean {
    const start = direction === 'forward' ? this.currentIndex + 1 : this.currentIndex - 1;
    const end = direction === 'forward' ? this.sortedTimestamps.length : -1;
    const step = direction === 'forward' ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const snapshot = this.snapshots.get(this.sortedTimestamps[i]);
      if (snapshot && snapshot.events.some((e) => e.type === 'anomaly')) {
        this.currentIndex = i;
        return true;
      }
    }

    return false;
  }

  /**
   * Jump to alert event.
   */
  jumpToAlert(direction: 'forward' | 'backward' = 'forward'): boolean {
    const start = direction === 'forward' ? this.currentIndex + 1 : this.currentIndex - 1;
    const end = direction === 'forward' ? this.sortedTimestamps.length : -1;
    const step = direction === 'forward' ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const snapshot = this.snapshots.get(this.sortedTimestamps[i]);
      if (snapshot && snapshot.events.some((e) => e.type === 'alert')) {
        this.currentIndex = i;
        return true;
      }
    }

    return false;
  }

  /**
   * Get all events in timeline.
   */
  getAllEvents(): Array<TemporalSnapshot['events'][0] & { timestamp: number }> {
    const allEvents: Array<TemporalSnapshot['events'][0] & { timestamp: number }> = [];

    for (const [timestamp, snapshot] of this.snapshots) {
      for (const event of snapshot.events) {
        allEvents.push({ ...event, timestamp });
      }
    }

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clear timeline.
   */
  clear(): void {
    this.snapshots.clear();
    this.sortedTimestamps = [];
    this.currentIndex = 0;
    this.isPlaying = false;
  }
}
