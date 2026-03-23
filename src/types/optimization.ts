/** Category of benchmark circuit */
export type CircuitBenchmarkCategory =
  | 'textbook'
  | 'ansatz'
  | 'single-qubit-heavy'
  | 'mixed-control'
  | 'backend-shaped'

// ── rqm-circuits payload ───────────────────────────────────────────────────

export interface RqmInstruction {
  gate: string
  targets: number[]
  controls?: number[]
  params?: number[]
}

export interface RqmCircuit {
  schema_version: string
  num_qubits: number
  name?: string
  instructions: RqmInstruction[]
  num_clbits?: number
  metadata?: Record<string, unknown>
}

// ── API response types ─────────────────────────────────────────────────────

export interface OptimizeReport {
  original_gate_count: number
  optimized_gate_count: number
  gate_count_delta: number
  original_depth: number
  optimized_depth: number
  depth_delta: number
  passes_applied: string[]
  equivalence_verified: boolean
}

export interface OptimizeResponseData {
  input_circuit: RqmCircuit
  optimized_circuit: RqmCircuit
  report: OptimizeReport
  summary: string
}

export interface OptimizeMeta {
  version: string
  request_id: string
  processing_time_ms: number
}

export interface OptimizeApiError {
  code: string
  message: string
}

export interface OptimizeApiResponse {
  status: 'ok' | 'error'
  data?: OptimizeResponseData
  meta?: OptimizeMeta
  error?: OptimizeApiError
}

// ── Jobs (scaffold for future execution) ──────────────────────────────────

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface ExecutionJob {
  id: string
  type: 'optimize' | 'execute'
  status: ExecutionStatus
  submittedAt: string
  backend?: string
  summary?: string
}

export interface JobItem {
  id: string
  type: 'optimize' | 'execute'
  status: ExecutionStatus
  submittedAt: string
  backend?: string
  circuitName?: string
  requestId?: string
  processingTimeMs?: number
  summary?: string
  report?: OptimizeReport
}

// ── Legacy types kept for internal use ────────────────────────────────────

/** @deprecated Use OptimizeReport instead */
export interface OptimizationMetrics {
  gateCount: number
  depth: number
  oneQubitGateCount?: number
  twoQubitGateCount?: number
  runtimeMs?: number
}

/** @deprecated */
export interface OptimizationDelta {
  gateCountReduction: number
  depthReduction: number
  compressionRatio?: number
  geodesicReduction?: number
}

/** @deprecated */
export interface InvariantReport {
  fidelity?: number
  equivalent?: boolean
  notes?: string[]
}

/** @deprecated */
export interface TransformTraceEntry {
  pass: string
  applied: boolean
  notes?: string
  details?: string[]
  metricsImpact?: Record<string, number>
}

/** @deprecated Use OptimizeResponseData instead */
export interface OptimizationRunReport {
  circuitId: string
  category: CircuitBenchmarkCategory
  backend: string
  baseline: string
  original: OptimizationMetrics
  optimized: OptimizationMetrics
  delta: OptimizationDelta
  invariants: InvariantReport
  trace: TransformTraceEntry[]
  canonicalizedOutput?: Record<string, unknown>
  notes?: string
  runTimestamp?: string
}

/** @deprecated */
export interface BenchmarkCircuitDefinition {
  circuitId: string
  name: string
  category: CircuitBenchmarkCategory
  description: string
  qubitCount: number
  backend: string
  baseline: string
  gateSequence: string[]
  notes?: string
}

/** @deprecated */
export interface BenchmarkRunResult {
  definition: BenchmarkCircuitDefinition
  report: OptimizationRunReport
  ranAt: string
}

/** @deprecated */
export interface ExportableBenchmarkDataset {
  exportedAt: string
  runs: BenchmarkRunResult[]
  summary: {
    totalCircuits: number
    avgGateCountReduction: number
    avgDepthReduction: number
    avgCompressionRatio: number
  }
}
