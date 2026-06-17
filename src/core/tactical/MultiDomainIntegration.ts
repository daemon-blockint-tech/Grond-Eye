/**
 * Multi-Domain Integration System
 * Support for air, land, sea, and space platform types with domain-specific capabilities
 */

export type PlatformDomain = 'air' | 'land' | 'sea' | 'space';

export interface PlatformCapability {
  id: string;
  name: string;
  type: string;
  range?: number; // km
  endurance?: number; // hours
  payload?: string;
  classification: string;
}

export interface DomainSpecificAction {
  id: string;
  domain: PlatformDomain;
  actionType: string;
  name: string;
  description: string;
  requiredCapabilities: string[];
  estimatedDuration: number; // seconds
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlatformProfile {
  platformId: string;
  domain: PlatformDomain;
  classification: string;
  name: string;
  capabilities: PlatformCapability[];
  operationalRange: {
    min: number; // km
    max: number; // km
  };
  maxAltitude?: number; // feet (for air/space)
  maxDepth?: number; // meters (for sea)
  maxSpeed: number; // knots
  crew?: number;
  payload?: string;
  status: 'operational' | 'maintenance' | 'deployed' | 'undeployed';
  lastServiced: number;
}

export interface DomainOperation {
  id: string;
  operationName: string;
  domain: PlatformDomain;
  assignedPlatforms: string[];
  objective: string;
  startTime: number;
  estimatedEndTime: number;
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'aborted';
  riskLevel: string;
  commandingOfficer?: string;
}

export class MultiDomainIntegration {
  private platforms: Map<string, PlatformProfile> = new Map();
  private actions: Map<string, DomainSpecificAction> = new Map();
  private operations: Map<string, DomainOperation> = new Map();

  constructor() {
    this.initializeDefaultPlatforms();
    this.initializeDefaultActions();
  }

  private initializeDefaultPlatforms(): void {
    // AIR Domain
    this.registerPlatform({
      platformId: 'air-001',
      domain: 'air',
      classification: 'fighter_jet',
      name: 'F-35 Lightning II',
      capabilities: [
        {
          id: 'cap-air-001',
          name: 'Air-to-Air Combat',
          type: 'weapons',
          range: 200,
          payload: '8x AIM-120 missiles',
          classification: 'combat',
        },
        {
          id: 'cap-air-002',
          name: 'Ground Attack',
          type: 'weapons',
          range: 150,
          payload: '6x GBU-31 JDAMs',
          classification: 'strike',
        },
        {
          id: 'cap-air-003',
          name: 'ISR Sensor Suite',
          type: 'sensor',
          range: 300,
          classification: 'intelligence',
        },
      ],
      operationalRange: { min: 50, max: 1200 },
      maxAltitude: 43000,
      maxSpeed: 1200,
      crew: 1,
      status: 'operational',
      lastServiced: Date.now(),
    });

    this.registerPlatform({
      platformId: 'air-002',
      domain: 'air',
      classification: 'transport',
      name: 'C-130 Hercules',
      capabilities: [
        {
          id: 'cap-air-004',
          name: 'Cargo Transport',
          type: 'transport',
          payload: '19,000 kg',
          classification: 'logistics',
        },
        {
          id: 'cap-air-005',
          name: 'Personnel Transport',
          type: 'transport',
          payload: '92 troops',
          classification: 'logistics',
        },
        {
          id: 'cap-air-006',
          name: 'Communication Relay',
          type: 'comms',
          range: 500,
          classification: 'communications',
        },
      ],
      operationalRange: { min: 100, max: 3800 },
      maxAltitude: 33000,
      maxSpeed: 540,
      crew: 5,
      status: 'operational',
      lastServiced: Date.now(),
    });

    // LAND Domain
    this.registerPlatform({
      platformId: 'land-001',
      domain: 'land',
      classification: 'main_battle_tank',
      name: 'M1 Abrams',
      capabilities: [
        {
          id: 'cap-land-001',
          name: 'Main Gun',
          type: 'weapons',
          range: 5,
          payload: 'M829A2 APFSDS',
          classification: 'combat',
        },
        {
          id: 'cap-land-002',
          name: 'Machine Gun',
          type: 'weapons',
          range: 2,
          payload: '12.7mm',
          classification: 'support',
        },
        {
          id: 'cap-land-003',
          name: 'Fire Control System',
          type: 'sensor',
          range: 10,
          classification: 'targeting',
        },
      ],
      operationalRange: { min: 10, max: 300 },
      maxSpeed: 45,
      crew: 4,
      status: 'operational',
      lastServiced: Date.now(),
    });

    this.registerPlatform({
      platformId: 'land-002',
      domain: 'land',
      classification: 'armored_vehicle',
      name: 'Humvee',
      capabilities: [
        {
          id: 'cap-land-004',
          name: 'Mobile Patrol',
          type: 'mobility',
          classification: 'transport',
        },
        {
          id: 'cap-land-005',
          name: 'Remote Sensor',
          type: 'sensor',
          range: 50,
          classification: 'intelligence',
        },
      ],
      operationalRange: { min: 5, max: 500 },
      maxSpeed: 100,
      crew: 4,
      status: 'operational',
      lastServiced: Date.now(),
    });

    // SEA Domain
    this.registerPlatform({
      platformId: 'sea-001',
      domain: 'sea',
      classification: 'destroyer',
      name: 'USS Arleigh Burke',
      capabilities: [
        {
          id: 'cap-sea-001',
          name: 'Tomahawk Cruise Missiles',
          type: 'weapons',
          range: 1600,
          payload: '90x Tomahawk',
          classification: 'strike',
        },
        {
          id: 'cap-sea-002',
          name: 'Air Defense',
          type: 'weapons',
          range: 100,
          payload: '96x SAM',
          classification: 'defense',
        },
        {
          id: 'cap-sea-003',
          name: 'Phased Array Radar',
          type: 'sensor',
          range: 400,
          classification: 'air_search',
        },
        {
          id: 'cap-sea-004',
          name: 'Sonar Suite',
          type: 'sensor',
          range: 200,
          classification: 'underwater',
        },
      ],
      operationalRange: { min: 100, max: 5000 },
      maxSpeed: 32,
      crew: 280,
      status: 'operational',
      lastServiced: Date.now(),
    });

    this.registerPlatform({
      platformId: 'sea-002',
      domain: 'sea',
      classification: 'submarine',
      name: 'USS Virginia',
      capabilities: [
        {
          id: 'cap-sea-005',
          name: 'Torpedo Tubes',
          type: 'weapons',
          range: 50,
          payload: 'Mk 48 torpedoes',
          classification: 'combat',
        },
        {
          id: 'cap-sea-006',
          name: 'Passive Sonar',
          type: 'sensor',
          range: 300,
          classification: 'detection',
        },
        {
          id: 'cap-sea-007',
          name: 'Stealth Operation',
          type: 'signature',
          classification: 'evasion',
        },
      ],
      operationalRange: { min: 200, max: 8000 },
      maxDepth: 2400,
      maxSpeed: 35,
      crew: 135,
      status: 'operational',
      lastServiced: Date.now(),
    });

    // SPACE Domain
    this.registerPlatform({
      platformId: 'space-001',
      domain: 'space',
      classification: 'reconnaissance_satellite',
      name: 'KH-11 Reconnaissance',
      capabilities: [
        {
          id: 'cap-space-001',
          name: 'Optical Imaging',
          type: 'sensor',
          range: 100000,
          classification: 'imint',
        },
        {
          id: 'cap-space-002',
          name: 'Global Coverage',
          type: 'coverage',
          classification: 'positioning',
        },
      ],
      operationalRange: { min: 0, max: 100000 },
      maxSpeed: 28000,
      status: 'operational',
      lastServiced: Date.now(),
    });

    this.registerPlatform({
      platformId: 'space-002',
      domain: 'space',
      classification: 'communication_satellite',
      name: 'MILSTAR Satellite',
      capabilities: [
        {
          id: 'cap-space-003',
          name: 'Secure Communications',
          type: 'comms',
          range: 100000,
          classification: 'communications',
        },
        {
          id: 'cap-space-004',
          name: 'Signal Intelligence',
          type: 'sensor',
          range: 100000,
          classification: 'sigint',
        },
      ],
      operationalRange: { min: 0, max: 100000 },
      maxSpeed: 0,
      status: 'operational',
      lastServiced: Date.now(),
    });
  }

  private initializeDefaultActions(): void {
    // AIR Domain Actions
    this.registerAction({
      id: 'air-action-patrol',
      domain: 'air',
      actionType: 'patrol',
      name: 'Combat Air Patrol',
      description: 'Maintain airspace defense over designated area',
      requiredCapabilities: ['ISR Sensor Suite', 'Air-to-Air Combat'],
      estimatedDuration: 3600,
      riskLevel: 'medium',
    });

    this.registerAction({
      id: 'air-action-strike',
      domain: 'air',
      actionType: 'strike',
      name: 'Air Strike',
      description: 'Execute coordinated air strike on designated targets',
      requiredCapabilities: ['Ground Attack', 'Fire Control System'],
      estimatedDuration: 2400,
      riskLevel: 'high',
    });

    // LAND Domain Actions
    this.registerAction({
      id: 'land-action-patrol',
      domain: 'land',
      actionType: 'patrol',
      name: 'Ground Patrol',
      description: 'Conduct ground patrol and reconnaissance',
      requiredCapabilities: ['Mobile Patrol', 'Remote Sensor'],
      estimatedDuration: 1800,
      riskLevel: 'medium',
    });

    this.registerAction({
      id: 'land-action-assault',
      domain: 'land',
      actionType: 'assault',
      name: 'Ground Assault',
      description: 'Execute coordinated ground offensive',
      requiredCapabilities: ['Main Gun', 'Machine Gun'],
      estimatedDuration: 3600,
      riskLevel: 'critical',
    });

    // SEA Domain Actions
    this.registerAction({
      id: 'sea-action-patrol',
      domain: 'sea',
      actionType: 'patrol',
      name: 'Naval Patrol',
      description: 'Maintain naval presence in designated waters',
      requiredCapabilities: ['Phased Array Radar', 'Sonar Suite'],
      estimatedDuration: 7200,
      riskLevel: 'low',
    });

    this.registerAction({
      id: 'sea-action-strike',
      domain: 'sea',
      actionType: 'strike',
      name: 'Naval Strike',
      description: 'Execute naval strike with cruise missiles',
      requiredCapabilities: ['Tomahawk Cruise Missiles', 'Fire Control System'],
      estimatedDuration: 1800,
      riskLevel: 'high',
    });

    // SPACE Domain Actions
    this.registerAction({
      id: 'space-action-surveillance',
      domain: 'space',
      actionType: 'surveillance',
      name: 'Satellite Surveillance',
      description: 'Conduct surveillance of designated area from orbit',
      requiredCapabilities: ['Optical Imaging', 'Global Coverage'],
      estimatedDuration: 86400,
      riskLevel: 'low',
    });

    // Cross-Domain Actions
    this.registerAction({
      id: 'cross-action-escort',
      domain: 'air',
      actionType: 'escort',
      name: 'Air Escort',
      description: 'Provide air escort and fighter cover',
      requiredCapabilities: ['Air-to-Air Combat', 'ISR Sensor Suite'],
      estimatedDuration: 3600,
      riskLevel: 'high',
    });
  }

  registerPlatform(profile: PlatformProfile): void {
    this.platforms.set(profile.platformId, profile);
  }

  registerAction(action: DomainSpecificAction): void {
    this.actions.set(action.id, action);
  }

  getPlatform(platformId: string): PlatformProfile | undefined {
    return this.platforms.get(platformId);
  }

  getPlatformsByDomain(domain: PlatformDomain): PlatformProfile[] {
    return Array.from(this.platforms.values()).filter((p) => p.domain === domain);
  }

  getAvailablePlatforms(): PlatformProfile[] {
    return Array.from(this.platforms.values()).filter(
      (p) => p.status === 'operational' || p.status === 'deployed',
    );
  }

  getPlatformsWithCapability(capabilityType: string): PlatformProfile[] {
    return Array.from(this.platforms.values()).filter((p) =>
      p.capabilities.some((c) => c.type.includes(capabilityType)),
    );
  }

  getActionsForDomain(domain: PlatformDomain): DomainSpecificAction[] {
    return Array.from(this.actions.values()).filter((a) => a.domain === domain);
  }

  canPlatformExecuteAction(platformId: string, actionId: string): boolean {
    const platform = this.platforms.get(platformId);
    const action = this.actions.get(actionId);

    if (!platform || !action) return false;
    if (platform.domain !== action.domain) return false;

    const platformCapabilityNames = platform.capabilities.map((c) => c.name);
    return action.requiredCapabilities.every((required) =>
      platformCapabilityNames.includes(required),
    );
  }

  suggestPlatformsForAction(actionId: string): PlatformProfile[] {
    const action = this.actions.get(actionId);
    if (!action) return [];

    const suitable = Array.from(this.platforms.values()).filter((platform) =>
      this.canPlatformExecuteAction(platform.platformId, actionId),
    );

    return suitable.filter((p) => p.status === 'operational' || p.status === 'deployed');
  }

  createOperation(operation: DomainOperation): void {
    this.operations.set(operation.id, operation);
  }

  getOperation(operationId: string): DomainOperation | undefined {
    return this.operations.get(operationId);
  }

  getOperationsByDomain(domain: PlatformDomain): DomainOperation[] {
    return Array.from(this.operations.values()).filter((o) => o.domain === domain);
  }

  updateOperationStatus(
    operationId: string,
    status: DomainOperation['status'],
  ): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;

    operation.status = status;
    return true;
  }

  getDomainStats(): Record<
    PlatformDomain,
    {
      totalPlatforms: number;
      operationalPlatforms: number;
      totalCapabilities: number;
      activeOperations: number;
    }
  > {
    const domains: PlatformDomain[] = ['air', 'land', 'sea', 'space'];
    const stats: Record<string, any> = {};

    for (const domain of domains) {
      const platformsInDomain = this.getPlatformsByDomain(domain);
      const operational = platformsInDomain.filter(
        (p) => p.status === 'operational' || p.status === 'deployed',
      ).length;
      const capabilities = platformsInDomain.reduce((sum, p) => sum + p.capabilities.length, 0);
      const operations = this.getOperationsByDomain(domain).filter(
        (o) => o.status === 'executing' || o.status === 'planned',
      ).length;

      stats[domain] = {
        totalPlatforms: platformsInDomain.length,
        operationalPlatforms: operational,
        totalCapabilities: capabilities,
        activeOperations: operations,
      };
    }

    return stats;
  }
}
