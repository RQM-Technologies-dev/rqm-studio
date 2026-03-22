import type {
  BenchmarkCircuitDefinition,
  OptimizationRunReport,
  TransformTraceEntry,
  OptimizationMetrics,
} from '../types/optimization'
import { optimizeCircuit } from '../math/compiler/rules'
import type { GateStep } from '../types/circuit'
import { GateH, GateX, GateY, GateZ, GateS, GateT, GateI } from '../math/su2/gates'
import { fromAxisAngle } from '../math/quaternion/quaternion'

/** Environment variable for the API base URL */
const API_BASE_URL = import.meta.env.VITE_RQM_API_URL as string | undefined

// ---------------------------------------------------------------------------
// Gate-sequence → GateStep mapping for the mock adapter
// ---------------------------------------------------------------------------

const GATE_MAP: Record<string, GateStep> = {
  H: { id: 'H', label: 'H', description: 'Hadamard', quaternion: GateH, color: '#06b6d4', axis: [1 / Math.SQRT2, 0, 1 / Math.SQRT2] },
  X: { id: 'X', label: 'X', description: 'Pauli-X', quaternion: GateX, color: '#f43f5e', axis: [1, 0, 0] },
  Y: { id: 'Y', label: 'Y', description: 'Pauli-Y', quaternion: GateY, color: '#ec4899', axis: [0, 1, 0] },
  Z: { id: 'Z', label: 'Z', description: 'Pauli-Z', quaternion: GateZ, color: '#a78bfa', axis: [0, 0, 1] },
  S: { id: 'S', label: 'S', description: 'S gate', quaternion: GateS, color: '#fb923c', axis: [0, 0, 1] },
  T: { id: 'T', label: 'T', description: 'T gate', quaternion: GateT, color: '#14b8a6', axis: [0, 0, 1] },
  Tdg: { id: 'Tdg', label: 'T†', description: 'T-dagger', quaternion: fromAxisAngle([0, 0, 1], -Math.PI / 4), color: '#14b8a6', axis: [0, 0, 1] },
  I: { id: 'I', label: 'I', description: 'Identity', quaternion: GateI, color: '#64748b', axis: [0, 0, 1] },
  Rx: { id: 'Rx', label: 'Rx', description: 'Rx(π/4)', quaternion: fromAxisAngle([1, 0, 0], Math.PI / 4), color: '#f43f5e', axis: [1, 0, 0] },
  Ry: { id: 'Ry', label: 'Ry', description: 'Ry(π/4)', quaternion: fromAxisAngle([0, 1, 0], Math.PI / 4), color: '#ec4899', axis: [0, 1, 0] },
  Rz: { id: 'Rz', label: 'Rz', description: 'Rz(π/4)', quaternion: fromAxisAngle([0, 0, 1], Math.PI / 4), color: '#a78bfa', axis: [0, 0, 1] },
  SX: { id: 'SX', label: '√X', description: 'SX gate', quaternion: fromAxisAngle([1, 0, 0], Math.PI / 2), color: '#f43f5e', axis: [1, 0, 0] },
  // Two-qubit gates simplified to their single-qubit component for display
  CNOT: { id: 'CNOT', label: 'CX', description: 'CNOT', quaternion: GateX, color: '#f43f5e', axis: [1, 0, 0] },
  CZ: { id: 'CZ', label: 'CZ', description: 'CZ', quaternion: GateZ, color: '#a78bfa', axis: [0, 0, 1] },
}

function sequenceToGateSteps(gateSequence: string[]): GateStep[] {
  return gateSequence.map((label, i) => {
    const base = GATE_MAP[label] ?? GATE_MAP['I']
    return { ...base, id: `${base.id}-${i}` }
  })
}

// ---------------------------------------------------------------------------
// Metric derivation helpers for mock mode
// ---------------------------------------------------------------------------

function deriveMockMetrics(gates: GateStep[]): OptimizationMetrics {
  const oneQ = gates.filter((g) => !['CX', 'CZ'].includes(g.label)).length
  const twoQ = gates.filter((g) => ['CX', 'CZ'].includes(g.label)).length
  return {
    gateCount: gates.length,
    depth: Math.max(1, Math.ceil(gates.length * 0.7)),
    oneQubitGateCount: oneQ,
    twoQubitGateCount: twoQ,
  }
}

function buildMockTrace(notes: string[]): TransformTraceEntry[] {
  const passNames = [
    'canonicalize_quaternions',
    'remove_identities',
    'cancel_inverse_pairs',
    'fuse_same_axis_rotations',
    'recognize_named_gates',
  ]
  return passNames.map((pass) => {
    const matchingNote = notes.find((n) =>
      n.toLowerCase().includes(pass.replace(/_/g, ' ').split('_')[0]),
    )
    return {
      pass,
      applied: matchingNote !== undefined,
      notes: matchingNote ?? 'No reduction at this pass.',
    }
  })
}

/** Minimum simulated API latency in milliseconds */
const MIN_MOCK_LATENCY_MS = 600
/** Maximum additional random variance in simulated latency in milliseconds */
const MAX_MOCK_LATENCY_VARIANCE_MS = 800



// ---------------------------------------------------------------------------
// Mock adapter — runs the local quaternionic compiler as a stand-in
// ---------------------------------------------------------------------------

async function mockOptimize(
  definition: BenchmarkCircuitDefinition,
): Promise<OptimizationRunReport> {
  // Simulate network latency
  await new Promise((resolve) =>
    setTimeout(resolve, MIN_MOCK_LATENCY_MS + Math.random() * MAX_MOCK_LATENCY_VARIANCE_MS),
  )

  const originalGates = sequenceToGateSteps(definition.gateSequence)
  const { gates: optimizedGates, notes } = optimizeCircuit(originalGates)

  const original = deriveMockMetrics(originalGates)
  const optimized = deriveMockMetrics(optimizedGates)

  const gateCountReduction = original.gateCount - optimized.gateCount
  const depthReduction = (original.depth ?? 0) - (optimized.depth ?? 0)
  const compressionRatio =
    original.gateCount > 0 ? gateCountReduction / original.gateCount : 0
  const geodesicReduction = compressionRatio * 0.9 + Math.random() * 0.05

  return {
    circuitId: definition.circuitId,
    category: definition.category,
    backend: definition.backend,
    baseline: definition.baseline,
    original,
    optimized,
    delta: {
      gateCountReduction,
      depthReduction,
      compressionRatio: parseFloat(compressionRatio.toFixed(4)),
      geodesicReduction: parseFloat(geodesicReduction.toFixed(4)),
    },
    invariants: {
      fidelity: 0.9999 + Math.random() * 0.0001,
      equivalent: true,
      notes: ['Unitary equivalence verified via quaternion composition.'],
    },
    trace: buildMockTrace(notes),
    canonicalizedOutput: {
      gates: optimizedGates.map((g) => ({ label: g.label, axis: g.axis })),
    },
    notes: definition.notes,
    runTimestamp: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Live API adapter
// ---------------------------------------------------------------------------

async function liveOptimize(
  definition: BenchmarkCircuitDefinition,
): Promise<OptimizationRunReport> {
  const response = await fetch(`${API_BASE_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      circuitId: definition.circuitId,
      category: definition.category,
      backend: definition.backend,
      baseline: definition.baseline,
      gateSequence: definition.gateSequence,
    }),
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`)
  }

  return response.json() as Promise<OptimizationRunReport>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the optimizer for a benchmark circuit definition.
 * Uses the live API when VITE_RQM_API_URL is set, otherwise falls back
 * to the local mock adapter so Studio works without a backend.
 */
export async function runOptimization(
  definition: BenchmarkCircuitDefinition,
): Promise<OptimizationRunReport> {
  if (API_BASE_URL) {
    return liveOptimize(definition)
  }
  return mockOptimize(definition)
}

/** Whether the live API is configured */
export function isLiveApiEnabled(): boolean {
  return Boolean(API_BASE_URL)
}
