import type { RqmCircuit, OptimizeResponseData, OptimizeMeta, OptimizeApiResponse } from '../types/optimization'
import { optimizeCircuit } from '../math/compiler/rules'
import type { GateStep } from '../types/circuit'
import { GateH, GateX, GateY, GateZ, GateS, GateT, GateI } from '../math/su2/gates'
import { fromAxisAngle } from '../math/quaternion/quaternion'

/** Environment variable for the API base URL */
const API_BASE_URL = import.meta.env.VITE_RQM_API_URL as string | undefined

/** Feature flag: enable execution endpoints (not yet implemented in API) */
const ENABLE_EXECUTION = import.meta.env.VITE_RQM_STUDIO_ENABLE_EXECUTION === 'true'

/** Feature flag: enable benchmarks page */
export const ENABLE_BENCHMARKS = import.meta.env.VITE_RQM_STUDIO_ENABLE_BENCHMARKS !== 'false'

// ---------------------------------------------------------------------------
// Gate-sequence → GateStep mapping
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
// Convert GateStep[] to rqm-circuits RqmCircuit payload
// ---------------------------------------------------------------------------

export function gateStepsToRqmCircuit(gates: GateStep[], name?: string): RqmCircuit {
  const instructions = gates.map((g) => ({
    gate: g.label,
    targets: [0],
    ...(g.label === 'CNOT' || g.label === 'CX' ? { controls: [0], targets: [1] } : {}),
    ...(g.label === 'CZ' ? { controls: [0], targets: [1] } : {}),
  }))
  return {
    schema_version: '1.0',
    num_qubits: 1,
    name: name ?? 'studio-circuit',
    instructions,
  }
}

// ---------------------------------------------------------------------------
// Mock adapter — derives from local quaternionic compiler
// ---------------------------------------------------------------------------

const MIN_MOCK_LATENCY_MS = 600
const MAX_MOCK_LATENCY_VARIANCE_MS = 800

async function mockOptimize(circuit: RqmCircuit): Promise<{ data: OptimizeResponseData; meta: OptimizeMeta }> {
  await new Promise((resolve) =>
    setTimeout(resolve, MIN_MOCK_LATENCY_MS + Math.random() * MAX_MOCK_LATENCY_VARIANCE_MS),
  )

  const gateSequence = circuit.instructions.map((i) => i.gate)
  const originalGates = sequenceToGateSteps(gateSequence)
  const { gates: optimizedGates, notes } = optimizeCircuit(originalGates)

  const originalGateCount = originalGates.length
  const optimizedGateCount = optimizedGates.length
  const originalDepth = Math.max(1, Math.ceil(originalGateCount * 0.7))
  const optimizedDepth = Math.max(0, Math.ceil(optimizedGateCount * 0.7))

  const passesApplied = notes.filter(Boolean)

  const optimizedCircuit: RqmCircuit = {
    schema_version: circuit.schema_version,
    num_qubits: circuit.num_qubits,
    name: circuit.name ? `${circuit.name}-optimized` : 'optimized',
    instructions: optimizedGates.map((g) => ({ gate: g.label, targets: [0] })),
  }

  const data: OptimizeResponseData = {
    input_circuit: circuit,
    optimized_circuit: optimizedCircuit,
    report: {
      original_gate_count: originalGateCount,
      optimized_gate_count: optimizedGateCount,
      gate_count_delta: originalGateCount - optimizedGateCount,
      original_depth: originalDepth,
      optimized_depth: optimizedDepth,
      depth_delta: originalDepth - optimizedDepth,
      passes_applied: passesApplied,
      equivalence_verified: true,
    },
    summary: `Optimized from ${originalGateCount} to ${optimizedGateCount} gates (${originalGateCount - optimizedGateCount} removed). Depth reduced from ${originalDepth} to ${optimizedDepth}. ${passesApplied.length} compiler pass(es) applied.`,
  }

  const meta: OptimizeMeta = {
    version: '0.1.0-mock',
    request_id: `mock-${Date.now()}`,
    processing_time_ms: MIN_MOCK_LATENCY_MS + Math.random() * MAX_MOCK_LATENCY_VARIANCE_MS,
  }

  return { data, meta }
}

async function mockGetExample(): Promise<RqmCircuit> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return {
    schema_version: '1.0',
    num_qubits: 1,
    name: 'example-bell-like',
    instructions: [
      { gate: 'H', targets: [0] },
      { gate: 'T', targets: [0] },
      { gate: 'H', targets: [0] },
      { gate: 'X', targets: [0] },
      { gate: 'X', targets: [0] },
      { gate: 'Z', targets: [0] },
      { gate: 'S', targets: [0] },
    ],
  }
}

// ---------------------------------------------------------------------------
// Live API adapter
// ---------------------------------------------------------------------------

async function liveRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const envelope = (await response.json()) as OptimizeApiResponse

  if (!response.ok || envelope.status === 'error') {
    const code = envelope.error?.code ?? `HTTP_${response.status}`
    const message = envelope.error?.message ?? `API error ${response.status}`
    throw new ApiError(code, message)
  }

  return envelope as T
}

// ---------------------------------------------------------------------------
// ApiError class for structured error handling
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

/**
 * Optimize a circuit using POST /v1/circuits/optimize.
 * Falls back to the local mock when VITE_RQM_API_URL is not set.
 */
export async function optimizeCircuitApi(
  circuit: RqmCircuit,
): Promise<{ data: OptimizeResponseData; meta: OptimizeMeta }> {
  if (API_BASE_URL) {
    const envelope = await liveRequest<OptimizeApiResponse>('/v1/circuits/optimize', {
      method: 'POST',
      body: JSON.stringify(circuit),
    })
    if (envelope.status === 'ok' && envelope.data && envelope.meta) {
      return { data: envelope.data, meta: envelope.meta }
    }
    throw new ApiError(envelope.error?.code ?? 'UNKNOWN', envelope.error?.message ?? 'Unknown error')
  }
  return mockOptimize(circuit)
}

/**
 * Validate a circuit using POST /v1/circuits/validate.
 * Falls back to a no-op mock.
 */
export async function validateCircuit(circuit: RqmCircuit): Promise<{ valid: boolean; errors?: string[] }> {
  if (API_BASE_URL) {
    const envelope = await liveRequest<OptimizeApiResponse>('/v1/circuits/validate', {
      method: 'POST',
      body: JSON.stringify(circuit),
    })
    return { valid: envelope.status === 'ok' }
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  const errors: string[] = []
  if (!circuit.instructions || circuit.instructions.length === 0) {
    errors.push('Circuit must have at least one instruction.')
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Analyze a circuit using POST /v1/circuits/analyze.
 * Falls back to a no-op mock.
 */
export async function analyzeCircuit(circuit: RqmCircuit): Promise<Record<string, unknown>> {
  if (API_BASE_URL) {
    const envelope = await liveRequest<OptimizeApiResponse>('/v1/circuits/analyze', {
      method: 'POST',
      body: JSON.stringify(circuit),
    })
    return (envelope.data as unknown as Record<string, unknown>) ?? {}
  }
  await new Promise((resolve) => setTimeout(resolve, 200))
  return {
    num_qubits: circuit.num_qubits,
    gate_count: circuit.instructions.length,
    depth: Math.max(1, Math.ceil(circuit.instructions.length * 0.7)),
  }
}

/**
 * Fetch an example circuit from GET /v1/circuits/example.
 * Falls back to a hardcoded example.
 */
export async function getExampleCircuit(): Promise<RqmCircuit> {
  if (API_BASE_URL) {
    const response = await fetch(`${API_BASE_URL}/v1/circuits/example`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const envelope = (await response.json()) as OptimizeApiResponse
    if (envelope.status === 'ok' && envelope.data) {
      return envelope.data.input_circuit
    }
    throw new ApiError('FETCH_EXAMPLE_FAILED', 'Could not fetch example circuit')
  }
  return mockGetExample()
}

// ---------------------------------------------------------------------------
// Future execution stubs (behind ENABLE_EXECUTION feature flag)
// ---------------------------------------------------------------------------

/** @future Execute circuit via Qiskit/IBM backend */
export async function executeQiskit(
  _circuit: RqmCircuit,
  _credentials: { token: string; backend?: string },
): Promise<never> {
  if (!ENABLE_EXECUTION) {
    throw new ApiError('EXECUTION_NOT_AVAILABLE', 'Execution via Qiskit is not yet available. Check back soon.')
  }
  throw new ApiError('NOT_IMPLEMENTED', 'Qiskit execution is not yet implemented in the API.')
}

/** @future Execute circuit via AWS Braket backend */
export async function executeBraket(
  _circuit: RqmCircuit,
  _credentials: { accessKeyId: string; secretAccessKey: string; region?: string; backend?: string },
): Promise<never> {
  if (!ENABLE_EXECUTION) {
    throw new ApiError('EXECUTION_NOT_AVAILABLE', 'Execution via AWS Braket is not yet available. Check back soon.')
  }
  throw new ApiError('NOT_IMPLEMENTED', 'AWS Braket execution is not yet implemented in the API.')
}

/** Whether the live API is configured */
export function isLiveApiEnabled(): boolean {
  return Boolean(API_BASE_URL)
}
