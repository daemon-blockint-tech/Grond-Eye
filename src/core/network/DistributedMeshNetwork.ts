/**
 * Distributed Mesh Network Architecture
 * Resilient decentralized mesh with intelligent routing and data prioritization
 */

export interface MeshNode {
  nodeId: string;
  name: string;
  location?: { latitude: number; longitude: number };
  status: 'active' | 'degraded' | 'offline';
  bandwidth: number; // Mbps
  availableBandwidth: number;
  latency: number; // ms
  reliability: number; // 0-1
  encryption: 'aes-256' | 'aes-128' | 'none';
  securityLevel: 'top-secret' | 'secret' | 'unclassified';
  role: 'hub' | 'relay' | 'edge' | 'gateway';
}

export interface MeshLink {
  linkId: string;
  sourceNodeId: string;
  targetNodeId: string;
  signalStrength: number; // 0-1
  latency: number; // ms
  bandwidth: number; // Mbps
  qualityScore: number; // 0-1
  active: boolean;
}

export interface RoutedMessage {
  messageId: string;
  senderId: string;
  recipientId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dataSize: number; // bytes
  classification: 'top-secret' | 'secret' | 'unclassified';
  payload: any;
  timestamp: number;
  createdAt: number;
  deliveredAt?: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  route?: string[];
}

export interface DataPrioritizationPolicy {
  dataType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  maxLatency: number; // ms
  minBandwidth: number; // Mbps
  compressionRequired: boolean;
}

export class DistributedMeshNetwork {
  private nodes: Map<string, MeshNode> = new Map();
  private links: Map<string, MeshLink> = new Map();
  private messages: Map<string, RoutedMessage> = new Map();
  private prioritizationPolicies: Map<string, DataPrioritizationPolicy> = new Map();
  private routeCache: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    this.registerPrioritizationPolicy({
      dataType: 'command_execution',
      priority: 'critical',
      maxLatency: 500,
      minBandwidth: 10,
      compressionRequired: false,
    });

    this.registerPrioritizationPolicy({
      dataType: 'threat_alert',
      priority: 'critical',
      maxLatency: 1000,
      minBandwidth: 5,
      compressionRequired: false,
    });

    this.registerPrioritizationPolicy({
      dataType: 'status_update',
      priority: 'medium',
      maxLatency: 5000,
      minBandwidth: 1,
      compressionRequired: true,
    });

    this.registerPrioritizationPolicy({
      dataType: 'sensor_telemetry',
      priority: 'high',
      maxLatency: 2000,
      minBandwidth: 5,
      compressionRequired: true,
    });

    this.registerPrioritizationPolicy({
      dataType: 'intelligence_report',
      priority: 'medium',
      maxLatency: 10000,
      minBandwidth: 2,
      compressionRequired: true,
    });

    this.registerPrioritizationPolicy({
      dataType: 'archival_data',
      priority: 'low',
      maxLatency: 60000,
      minBandwidth: 0.5,
      compressionRequired: true,
    });
  }

  registerNode(node: MeshNode): void {
    this.nodes.set(node.nodeId, node);
  }

  getNode(nodeId: string): MeshNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): MeshNode[] {
    return Array.from(this.nodes.values());
  }

  getActiveNodes(): MeshNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.status === 'active');
  }

  getNodesByRole(role: 'hub' | 'relay' | 'edge' | 'gateway'): MeshNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.role === role);
  }

  updateNodeStatus(nodeId: string, status: MeshNode['status']): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      this.clearRouteCache();
    }
  }

  updateNodeBandwidth(nodeId: string, available: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.availableBandwidth = Math.max(0, Math.min(node.bandwidth, available));
    }
  }

  createLink(link: MeshLink): void {
    this.links.set(link.linkId, link);
    this.recalculateQualityScore(link.linkId);
  }

  private recalculateQualityScore(linkId: string): void {
    const link = this.links.get(linkId);
    if (!link) return;

    const signalComponent = link.signalStrength * 0.4;
    const latencyComponent = Math.max(0, 1 - link.latency / 1000) * 0.3;
    const bandwidthComponent = Math.min(1, link.bandwidth / 100) * 0.3;

    link.qualityScore = signalComponent + latencyComponent + bandwidthComponent;
  }

  getLink(linkId: string): MeshLink | undefined {
    return this.links.get(linkId);
  }

  getActiveLinks(): MeshLink[] {
    return Array.from(this.links.values()).filter((l) => l.active && l.qualityScore > 0.3);
  }

  getLinksBetween(sourceNodeId: string, targetNodeId: string): MeshLink[] {
    return Array.from(this.links.values()).filter(
      (l) =>
        (l.sourceNodeId === sourceNodeId && l.targetNodeId === targetNodeId) ||
        (l.sourceNodeId === targetNodeId && l.targetNodeId === sourceNodeId),
    );
  }

  computeOptimalRoute(senderId: string, recipientId: string): string[] {
    const cacheKey = `${senderId}-${recipientId}`;
    const cached = this.routeCache.get(cacheKey);
    if (cached) return cached;

    const route = this.dijkstraRoute(senderId, recipientId);
    this.routeCache.set(cacheKey, route);
    return route;
  }

  private dijkstraRoute(start: string, end: string): string[] {
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const unvisited = new Set<string>();

    for (const node of this.nodes.values()) {
      distances.set(node.nodeId, node.nodeId === start ? 0 : Infinity);
      unvisited.add(node.nodeId);
    }

    while (unvisited.size > 0) {
      let current: string | undefined;
      let minDist = Infinity;

      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId) || Infinity;
        if (dist < minDist) {
          minDist = dist;
          current = nodeId;
        }
      }

      if (!current || minDist === Infinity) break;
      if (current === end) break;

      unvisited.delete(current);

      for (const link of this.getActiveLinks()) {
        let neighbor: string | undefined;
        if (link.sourceNodeId === current) neighbor = link.targetNodeId;
        else if (link.targetNodeId === current) neighbor = link.sourceNodeId;

        if (neighbor && unvisited.has(neighbor)) {
          const cost = 1 / link.qualityScore;
          const newDist = (distances.get(current) || 0) + cost;

          if (newDist < (distances.get(neighbor) || Infinity)) {
            distances.set(neighbor, newDist);
            previous.set(neighbor, current);
          }
        }
      }
    }

    const route: string[] = [];
    let current: string | undefined = end;

    while (current) {
      route.unshift(current);
      current = previous.get(current);
    }

    return route.length > 1 && route[0] === start ? route : [start, end];
  }

  private clearRouteCache(): void {
    this.routeCache.clear();
  }

  registerPrioritizationPolicy(policy: DataPrioritizationPolicy): void {
    this.prioritizationPolicies.set(policy.dataType, policy);
  }

  getDataPriority(dataType: string): DataPrioritizationPolicy | undefined {
    return this.prioritizationPolicies.get(dataType);
  }

  async routeMessage(message: RoutedMessage): Promise<RoutedMessage> {
    const route = this.computeOptimalRoute(message.senderId, message.recipientId);
    message.route = route;
    message.status = 'in_transit';
    message.createdAt = Date.now();

    this.messages.set(message.messageId, message);

    // Simulate transmission delay based on route quality
    const totalLatency = this.computeRouteLatency(route);
    const policy = this.prioritizationPolicies.get(message.classification);

    const delay = Math.min(
      totalLatency,
      policy?.maxLatency || 10000,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    message.status = 'delivered';
    message.deliveredAt = Date.now();

    return message;
  }

  private computeRouteLatency(route: string[]): number {
    let totalLatency = 0;

    for (let i = 0; i < route.length - 1; i++) {
      const links = this.getLinksBetween(route[i], route[i + 1]);
      if (links.length > 0) {
        const bestLink = links.reduce((best, current) =>
          current.qualityScore > best.qualityScore ? current : best,
        );
        totalLatency += bestLink.latency;
      }
    }

    return totalLatency;
  }

  getMessage(messageId: string): RoutedMessage | undefined {
    return this.messages.get(messageId);
  }

  getMessagesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): RoutedMessage[] {
    return Array.from(this.messages.values())
      .filter((m) => m.priority === priority)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  getPendingMessages(): RoutedMessage[] {
    return Array.from(this.messages.values()).filter((m) => m.status === 'pending');
  }

  getNetworkHealth(): {
    activeNodes: number;
    totalNodes: number;
    activeLinks: number;
    totalLinks: number;
    averageLatency: number;
    averageQuality: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const links = Array.from(this.links.values());
    const activeLinks = this.getActiveLinks();

    const averageLatency =
      activeLinks.length > 0
        ? activeLinks.reduce((sum, l) => sum + l.latency, 0) / activeLinks.length
        : 0;

    const averageQuality =
      activeLinks.length > 0
        ? activeLinks.reduce((sum, l) => sum + l.qualityScore, 0) / activeLinks.length
        : 0;

    return {
      activeNodes: nodes.filter((n) => n.status === 'active').length,
      totalNodes: nodes.length,
      activeLinks: activeLinks.length,
      totalLinks: links.length,
      averageLatency,
      averageQuality,
    };
  }

  detectBottlenecks(): Array<{
    nodeId: string;
    utilizationPercent: number;
    threshold: number;
  }> {
    const bottlenecks: Array<{
      nodeId: string;
      utilizationPercent: number;
      threshold: number;
    }> = [];

    for (const node of this.getActiveNodes()) {
      const utilization = ((node.bandwidth - node.availableBandwidth) / node.bandwidth) * 100;
      if (utilization > 80) {
        bottlenecks.push({
          nodeId: node.nodeId,
          utilizationPercent: utilization,
          threshold: 80,
        });
      }
    }

    return bottlenecks;
  }

  suggestOptimization(): string[] {
    const suggestions: string[] = [];
    const bottlenecks = this.detectBottlenecks();
    const health = this.getNetworkHealth();

    if (bottlenecks.length > 0) {
      suggestions.push(
        `High bandwidth utilization detected at ${bottlenecks.length} nodes - consider load balancing`,
      );
    }

    if (health.averageLatency > 500) {
      suggestions.push('High network latency detected - consider alternate routes or additional relays');
    }

    if (health.averageQuality < 0.6) {
      suggestions.push('Network quality degradation - check link quality and signal strength');
    }

    const degradedNodes = Array.from(this.nodes.values()).filter((n) => n.status === 'degraded');
    if (degradedNodes.length > 0) {
      suggestions.push(`${degradedNodes.length} nodes in degraded state - monitor for failures`);
    }

    if (suggestions.length === 0) {
      suggestions.push('Network operating at optimal efficiency');
    }

    return suggestions;
  }
}
