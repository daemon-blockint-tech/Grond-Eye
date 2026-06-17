/**
 * @file Graph3DRenderer.ts
 * @description Three.js wrapper for 3D force-directed graph visualization.
 * Extends 2D GraphRenderer with 3D capabilities and force simulation.
 */

export interface Node3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fx: number;
  fy: number;
  fz: number;
  threatLevel: number;
  confidence: number;
  size: number;
  color: string;
  pinned?: boolean;
}

export interface Link3D {
  source: string;
  target: string;
  strength: number;
  confidence: number;
}

export interface Graph3DLayout {
  nodes: Node3D[];
  links: Link3D[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

/**
 * 3D force-directed graph renderer using Three.js.
 */
export class Graph3DRenderer {
  private nodes: Map<string, Node3D> = new Map();
  private links: Map<string, Link3D> = new Map();
  private simulation: any; // Will be initialized with force simulation
  private isSimulating = false;
  private convergenceThreshold = 0.001;

  /**
   * Add node to graph.
   */
  addNode(node: Node3D): void {
    this.nodes.set(node.id, {
      ...node,
      vx: 0,
      vy: 0,
      vz: 0,
      fx: 0,
      fy: 0,
      fz: 0,
    });
  }

  /**
   * Add link to graph.
   */
  addLink(link: Link3D): void {
    const key = `${link.source}-${link.target}`;
    this.links.set(key, link);
  }

  /**
   * Get node by ID.
   */
  getNode(id: string): Node3D | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes.
   */
  getNodes(): Node3D[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all links.
   */
  getLinks(): Link3D[] {
    return Array.from(this.links.values());
  }

  /**
   * Simulate forces and update positions.
   */
  simulateForces(iterations: number = 1): number {
    const alpha = 1;
    const alphaDecay = 1 - Math.pow(0.001, 1 / 300); // Converge over 300 iterations
    const alphaTarget = 0;
    const alphaMin = 0.001;

    for (let i = 0; i < iterations; i++) {
      this.applyForces();
      this.updateVelocities(alpha);
      this.updatePositions();

      const currentAlpha = Math.max(alphaMin, alpha * (1 - alphaDecay));

      if (currentAlpha < alphaMin) {
        this.isSimulating = false;
        return 0;
      }
    }

    return alpha;
  }

  /**
   * Apply all forces (repulsion, attraction, center).
   */
  private applyForces(): void {
    // Reset forces
    for (const node of this.nodes.values()) {
      node.fx = 0;
      node.fy = 0;
      node.fz = 0;
    }

    // Repulsive forces (charge)
    this.applyRepulsiveForces();

    // Attractive forces (links)
    this.applyAttractiveForces();

    // Center force
    this.applyCenterForce();
  }

  /**
   * Apply repulsive forces between nodes.
   */
  private applyRepulsiveForces(): void {
    const nodes = Array.from(this.nodes.values());
    const strength = -100; // Repulsion strength

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
        const force = (strength * a.size * b.size) / (distance * distance);

        const fx = (force * dx) / distance;
        const fy = (force * dy) / distance;
        const fz = (force * dz) / distance;

        a.fx -= fx;
        a.fy -= fy;
        a.fz -= fz;

        b.fx += fx;
        b.fy += fy;
        b.fz += fz;
      }
    }
  }

  /**
   * Apply attractive forces along links.
   */
  private applyAttractiveForces(): void {
    for (const link of this.links.values()) {
      const source = this.nodes.get(link.source);
      const target = this.nodes.get(link.target);

      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dz = target.z - source.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

      // Spring force with length based on link confidence
      const targetLength = 50 / link.confidence;
      const force = ((distance - targetLength) * link.strength) / distance;

      const fx = (force * dx) / distance;
      const fy = (force * dy) / distance;
      const fz = (force * dz) / distance;

      source.fx += fx;
      source.fy += fy;
      source.fz += fz;

      target.fx -= fx;
      target.fy -= fy;
      target.fz -= fz;
    }
  }

  /**
   * Apply center force to keep graph centered.
   */
  private applyCenterForce(): void {
    const nodes = Array.from(this.nodes.values());
    const centerStrength = 0.1;

    for (const node of nodes) {
      if (node.pinned) continue;
      node.fx -= node.x * centerStrength;
      node.fy -= node.y * centerStrength;
      node.fz -= node.z * centerStrength;
    }
  }

  /**
   * Update velocities from forces.
   */
  private updateVelocities(alpha: number): void {
    const friction = 0.6;
    const timeStep = 1;

    for (const node of this.nodes.values()) {
      if (node.pinned) continue;

      node.vx += (node.fx * alpha) / node.size;
      node.vy += (node.fy * alpha) / node.size;
      node.vz += (node.fz * alpha) / node.size;

      node.vx *= friction;
      node.vy *= friction;
      node.vz *= friction;
    }
  }

  /**
   * Update positions from velocities.
   */
  private updatePositions(): void {
    const maxVelocity = 10; // Clamp velocity

    for (const node of this.nodes.values()) {
      if (node.pinned) continue;

      // Clamp velocity
      const speed = Math.sqrt(node.vx ** 2 + node.vy ** 2 + node.vz ** 2);
      if (speed > maxVelocity) {
        const scale = maxVelocity / speed;
        node.vx *= scale;
        node.vy *= scale;
        node.vz *= scale;
      }

      node.x += node.vx;
      node.y += node.vy;
      node.z += node.vz;
    }
  }

  /**
   * Pin/unpin a node.
   */
  setNodePin(nodeId: string, pinned: boolean): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.pinned = pinned;
      if (pinned) {
        node.vx = 0;
        node.vy = 0;
        node.vz = 0;
      }
    }
  }

  /**
   * Move a node to a position.
   */
  moveNode(nodeId: string, x: number, y: number, z: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      node.z = z;
    }
  }

  /**
   * Get current layout snapshot.
   */
  getLayout(): Graph3DLayout {
    const nodes = Array.from(this.nodes.values());

    // Calculate bounds
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
      minZ = Math.min(minZ, node.z);
      maxZ = Math.max(maxZ, node.z);
    }

    return {
      nodes,
      links: Array.from(this.links.values()),
      bounds: {
        minX: minX === Infinity ? 0 : minX,
        maxX: maxX === -Infinity ? 0 : maxX,
        minY: minY === Infinity ? 0 : minY,
        maxY: maxY === -Infinity ? 0 : maxY,
        minZ: minZ === Infinity ? 0 : minZ,
        maxZ: maxZ === -Infinity ? 0 : maxZ,
      },
    };
  }

  /**
   * Reset simulation.
   */
  reset(): void {
    for (const node of this.nodes.values()) {
      node.vx = 0;
      node.vy = 0;
      node.vz = 0;
      node.fx = 0;
      node.fy = 0;
      node.fz = 0;
    }
    this.isSimulating = true;
  }

  /**
   * Get simulation status.
   */
  isActive(): boolean {
    return this.isSimulating;
  }

  /**
   * Get node count.
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Get link count.
   */
  getLinkCount(): number {
    return this.links.size;
  }
}
