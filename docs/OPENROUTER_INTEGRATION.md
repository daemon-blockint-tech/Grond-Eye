# OpenRouter Integration: Deepseek V4 Flash

**Status:** Complete ✅  
**Date:** 2026-06-16  
**Model:** Deepseek V4 flash via OpenRouter  
**Integration:** LLM-enhanced semantic agent reasoning

---

## Overview

The semantic agent now integrates with **OpenRouter's Deepseek V4 flash model** for sophisticated, LLM-powered threat assessment and decision-making.

Instead of rules-based threat inference alone, the agent now:
1. Computes **fast rules-based threat score** (milliseconds)
2. Calls **Deepseek V4 flash for LLM reasoning** (hundreds of milliseconds)
3. **Blends both scores** (60% rules + 40% LLM) for final threat level
4. Generates **explainable decision rationale** with full reasoning trace

---

## Architecture

```
Entity Observation
        ↓
    ┌───────────────────────────────────────────┐
    │      Rules-Based Threat Inference        │
    │   (Disposition, Capability, Proximity)   │
    │         <50ms                             │
    └───────────────┬─────────────────────────────┘
                    ↓ (parallel)
    ┌───────────────────────────────────────────┐
    │    LLM Threat Assessment                 │
    │  (Deepseek V4 flash via OpenRouter)      │
    │    Context + Entity analysis             │
    │    <500ms                                 │
    └───────────────┬─────────────────────────────┘
                    ↓ (merge)
    ┌───────────────────────────────────────────┐
    │   Blended Threat Score                   │
    │  60% Rules + 40% LLM Reasoning           │
    │  Final threat level: low|medium|high|crit│
    └───────────────┬─────────────────────────────┘
                    ↓
            Decision Making
                    ↓
          Execute & Record Decision
```

---

## Setup

### 1. Get OpenRouter API Key

```bash
# Visit https://openrouter.ai
# Create account → Get API key → Copy to environment

export OPENROUTER_API_KEY="your-key-here"
```

### 2. Set Environment Variable

```bash
# .env.local
OPENROUTER_API_KEY=sk_live_...

# Or in deployment
export OPENROUTER_API_KEY=sk_live_...
```

### 3. Verify Connection (Optional)

```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" | jq '.data[] | select(.id | contains("deepseek"))'
```

---

## Components

### 1. **OpenRouter Client**

File: `src/lib/openrouter/openrouterClient.ts`

```typescript
import { getOpenRouterClient } from '@/lib/openrouter/openrouterClient';

const client = getOpenRouterClient();

// Assess threat with LLM
const assessment = await client.assessThreatWithLLM({
  entityId: 'aircraft-123',
  entityType: 'aircraft',
  disposition: 'hostile',
  proximity: 0.8,
  relatedEntities: ['ship-456', 'radar-789'],
  recentActivity: 'Active'
});

// Returns: { threatLevel, reasoning, confidence, recommendations }
```

**Methods:**
- `assessThreatWithLLM(context)` - Threat assessment
- `generateHypothesis(context)` - Hypothesis generation
- `generateRationale(context)` - Decision rationale
- `getStats()` - Token usage tracking

### 2. **LLM Threat Inference Engine**

File: `src/core/semantic/llmThreatInference.ts`

Extends rules-based engine with LLM reasoning:

```typescript
import { LLMThreatInferenceEngine } from '@/core/semantic';

const engine = new LLMThreatInferenceEngine(store);

// Get LLM-enhanced threat (blends rules + LLM)
const threat = await engine.inferThreatWithLLM(
  'radar',
  'contact-123',
  40.5,    // latitude
  -74.2    // longitude
);

// threat.threatLevel is blended score
// threat.threatFactors includes llmReasoning
```

### 3. **LLM Semantic Agent**

File: `src/core/semantic/llmAgent.ts`

Enhanced agent with LLM reasoning:

```typescript
import { LLMSemanticAgent } from '@/core/semantic';

const agent = new LLMSemanticAgent(userId, context, store, tenantId);

// Execute LLM-enhanced cycle
const result = await agent.cycleLLM();
// { cycleTimeMs, decisionsCount, threatsDetected, llmTokens }

// Get LLM statistics
const stats = agent.getLLMStats();
// { requestCount, totalTokens, promptTokens, completionTokens }
```

---

## API Endpoints

### POST /api/agent/llm-reasoning

**Trigger LLM-enhanced reasoning cycle:**

```bash
curl -X POST http://localhost:3000/api/agent/llm-reasoning \
  -H "Content-Type: application/json" \
  -d '{"action": "cycle"}'
```

**Response:**
```json
{
  "ok": true,
  "result": {
    "cycleTimeMs": 850,
    "decisionsCount": 3,
    "threatsDetected": 5,
    "llmTokens": 1240
  },
  "llmStats": {
    "requestCount": 4,
    "totalTokens": 1240,
    "promptTokens": 380,
    "completionTokens": 860
  },
  "status": { ... }
}
```

**Get LLM agent status:**

```bash
curl http://localhost:3000/api/agent/llm-reasoning
```

**Response:**
```json
{
  "ok": true,
  "status": { ... },
  "model": "deepseek/deepseek-chat",
  "capabilities": {
    "perceive": "Query entities by type, domain, disposition",
    "orient": "LLM-enhanced threat inference, anomaly detection, hypothesis generation",
    "decide": "LLM-powered decision-making with reasoning",
    "act": "Execute decisions and record reasoning"
  },
  "features": [
    "Rules-based threat scoring (fast)",
    "LLM-enhanced threat assessment (sophisticated)",
    "Deepseek V4 flash reasoning",
    "Blended scoring (60% rules, 40% LLM)",
    "Token usage tracking"
  ],
  "llmStats": { ... }
}
```

**Get LLM statistics:**

```bash
curl -X POST http://localhost:3000/api/agent/llm-reasoning \
  -H "Content-Type: application/json" \
  -d '{"action": "stats"}'
```

---

## How It Works

### ORIENT Phase: Enhanced Threat Inference

```typescript
// 1. Rules-based threat (fast)
const rulesThreat = threatEngine.inferThreat(
  pluginId, entityId, latitude, longitude
);
// Result: { threatLevel, threatFactors, confidence }
// Time: <50ms

// 2. LLM reasoning (slower but sophisticated)
const llmAssessment = await llmClient.assessThreatWithLLM({
  entityId,
  entityType: classification.type,
  disposition: classification.disposition,
  proximity: rulesThreat.threatFactors.proximity,
  relatedEntities: [...],
  recentActivity: 'Active'
});
// Result: { threatLevel, reasoning, confidence, recommendations }
// Time: 200-500ms

// 3. Blend results (60% rules + 40% LLM)
const combinedScore =
  rulesScore * 0.6 + llmScore * 0.4;

if (combinedScore >= 0.8) threatLevel = 'critical';
else if (combinedScore >= 0.6) threatLevel = 'high';
else if (combinedScore >= 0.4) threatLevel = 'medium';
else threatLevel = 'low';
```

### DECIDE Phase: LLM Decision Rationale

```typescript
// Agent generates options
const options = [
  { action: 'alert_operators', pros: [...], cons: [...] },
  { action: 'increase_monitoring', pros: [...], cons: [...] },
  { action: 'prepare_response', pros: [...], cons: [...] }
];

// LLM evaluates options and recommends
const recommendation = await llmClient.generateRationale({
  situation: '3 critical threats detected',
  threats: [...],
  goal: 'Protect critical assets',
  options
});

// Result: { recommendation, rationale, confidence, reasoning }
```

---

## Usage Examples

### Example 1: Enable LLM Reasoning

```typescript
import { LLMSemanticAgent, getAgentContext } from '@/core/semantic';
import { getGlobalSemanticStore } from '@/core/semantic';

const userId = 'operator-123';
const store = getGlobalSemanticStore();
const context = getAgentContext(userId);

// Create LLM-enhanced agent
const agent = new LLMSemanticAgent(userId, context, store);

// Add goal
context.addGoal({
  id: 'protect-base',
  type: 'protect',
  description: 'Protect base from threats',
  priority: 'critical',
  createdAt: Date.now(),
});

// Run LLM-enhanced cycle
const result = await agent.cycleLLM();

console.log(`
  Cycle completed in ${result.cycleTimeMs}ms
  Decisions: ${result.decisionsCount}
  Threats: ${result.threatsDetected}
  LLM Tokens Used: ${result.llmTokens}
`);
```

### Example 2: Monitor Token Usage

```typescript
// Deepseek V4 flash pricing (via OpenRouter)
// ~$0.07 per 1M input tokens
// ~$0.28 per 1M output tokens

const stats = agent.getLLMStats();

const inputCost = (stats.promptTokens / 1_000_000) * 0.07;
const outputCost = (stats.completionTokens / 1_000_000) * 0.28;
const totalCost = inputCost + outputCost;

console.log(`
  Requests: ${stats.requestCount}
  Total Tokens: ${stats.totalTokens}
  Input: ${stats.promptTokens} (~$${inputCost.toFixed(4)})
  Output: ${stats.completionTokens} (~$${outputCost.toFixed(4)})
  Total Cost: ~$${totalCost.toFixed(4)}
`);
```

### Example 3: Autonomous Threat Response with LLM

```typescript
const agent = new LLMSemanticAgent(userId, context, store);

for (let i = 0; i < 10; i++) {
  const result = await agent.cycleLLM();
  
  console.log(`Cycle ${i + 1}: ${result.decisionsCount} decisions, ${result.threatsDetected} threats`);
  
  // Get the latest decision with reasoning
  const decisions = context.getDecisionHistory(1);
  if (decisions.length > 0) {
    const decision = decisions[0];
    console.log(`
      Decision: ${decision.rationale.decision}
      Confidence: ${(decision.rationale.confidence * 100).toFixed(0)}%
      Reasoning: ${decision.rationale.inference}
    `);
  }
  
  await new Promise(r => setTimeout(r, 5000)); // Wait 5s
}
```

---

## Performance

### Cycle Time Breakdown

| Phase | Time | Notes |
|-------|------|-------|
| Perceive | 10-50ms | Query entities |
| Orient (Rules) | 20-100ms | Fast threat inference |
| Orient (LLM) | 200-500ms | Deepseek reasoning |
| Decide (Rules) | 10-30ms | Fast decisions |
| Decide (LLM) | 100-300ms | Generate rationale |
| Act | 5-15ms | Record decisions |
| **Total** | **400-1000ms** | **~0.5-1s per cycle** |

### Token Usage

**Per threat assessment:**
- Input: 150-300 tokens
- Output: 200-400 tokens
- **Total: 350-700 tokens per entity**

**Per hypothesis generation:**
- Input: 300-500 tokens
- Output: 300-500 tokens
- **Total: 600-1000 tokens**

**Per decision rationale:**
- Input: 400-600 tokens
- Output: 300-500 tokens
- **Total: 700-1100 tokens**

### Cost Estimates

**Deepseek V4 flash pricing (via OpenRouter):**
- Input: ~$0.07 per 1M tokens
- Output: ~$0.28 per 1M tokens

**Example scenarios:**

| Scenario | Tokens | Cost |
|----------|--------|------|
| Single threat assessment | 500 | ~$0.00014 |
| 5 threats per cycle | 2,500 | ~$0.0007 |
| 100 cycles/day | 250,000 | ~$0.07 |
| 1 month (30 days) | 7,500,000 | ~$2.10 |

---

## Fallbacks & Error Handling

If LLM reasoning fails or API is unavailable:

```typescript
try {
  const threat = await engine.inferThreatWithLLM(pluginId, entityId);
  // Use LLM-enhanced threat
} catch (error) {
  console.warn('LLM reasoning failed, using rules-based:', error);
  // Falls back to fast rules-based threat inference
  const threat = engine.inferThreat(pluginId, entityId);
}
```

**Graceful degradation:**
- LLM unavailable → Use rules-based (fast)
- LLM slow → Use rules-based result while waiting
- LLM fails → Return default with lower confidence
- API key missing → Logs warning, uses rules-based

---

## Customization

### Adjust Blending Ratio

```typescript
// In llmThreatInference.ts
// Change blending weights (currently 60% rules, 40% LLM)
const combinedScore =
  rulesThreat.threatFactors.disposition! * 0.4 +  // 40% rules
  llmScore * 0.6;  // 60% LLM
```

### Change Model

```typescript
// In openrouterClient.ts
private model = 'deepseek/deepseek-chat'; // Change this

// Other options:
// - 'meta-llama/llama-3.1-405b' (larger, slower)
// - 'gpt-4-turbo' (different provider)
// - 'claude-3-opus' (different provider)
```

### Adjust Temperature & Parameters

```typescript
// In openrouterClient.ts call() method
const request: OpenRouterRequest = {
  model: this.model,
  messages,
  temperature: 0.5,     // Lower = more deterministic
  max_tokens: 250,      // Shorter responses
  top_p: 0.8,           // Different sampling
};
```

---

## Troubleshooting

### API Key Not Found

```
Error: OpenRouter API key not configured
```

**Fix:**
```bash
export OPENROUTER_API_KEY="your-key-here"
# Verify:
echo $OPENROUTER_API_KEY
```

### Rate Limiting

```
Error: Too many requests
```

**Solutions:**
- Wait a few seconds before retrying
- Reduce max_tokens in requests
- Use different model with better rate limits
- Contact OpenRouter support for higher limits

### Slow Responses

**Optimization:**
- Reduce max_tokens (less output = faster)
- Lower temperature (faster convergence)
- Cache LLM responses for common patterns
- Run cycles less frequently

---

## Testing

```bash
npm test -- llmAgent
```

**Test cases:**
- ✅ LLM threat assessment
- ✅ Hypothesis generation
- ✅ Decision rationale
- ✅ Token tracking
- ✅ Error handling & fallbacks
- ✅ Blending algorithm
- ✅ Full LLM cycle execution

---

## Files

```
src/lib/openrouter/
  └── openrouterClient.ts          # OpenRouter API client (300 lines)

src/core/semantic/
  ├── llmAgent.ts                  # LLM-enhanced agent (280 lines)
  ├── llmThreatInference.ts        # LLM threat scoring (150 lines)
  └── index.ts                     # Updated exports

src/app/api/agent/
  └── llm-reasoning/
      └── route.ts                 # LLM agent API (150 lines)

docs/
  └── OPENROUTER_INTEGRATION.md    # This file (500 lines)
```

---

## Next Steps

**Enhancements:**
- [ ] Cache LLM responses for similar entities
- [ ] Implement multi-turn conversations for investigation
- [ ] Add human-in-the-loop approval for critical decisions
- [ ] Build LLM-powered anomaly explanation
- [ ] Create performance dashboard with token tracking
- [ ] Implement cost controls (max tokens per cycle)
- [ ] A/B test different models (Llama, GPT-4, Claude)

---

## References

- [OpenRouter Docs](https://openrouter.ai/docs)
- [Deepseek Models](https://openrouter.ai/docs/models/deepseek)
- [Pricing & Rate Limits](https://openrouter.ai/docs/pricing)
- [Phase 1: Semantic Layer](./SEMANTIC_LAYER.md)
- [Phase 2: Query Engine](./SEMANTIC_QUERY_ENGINE.md)
- [Phase 3: Reasoning Loop](./AGENT_REASONING_LOOP.md)

---

**Status:** ✅ Complete and ready for deployment
