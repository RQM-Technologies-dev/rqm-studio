/** Category of benchmark circuit */
export type CircuitBenchmarkCategory =
  | 'textbook'
  | 'ansatz'
  | 'single-qubit-heavy'
  | 'mixed-control'
  | 'backend-shaped'

/** Raw gate-count/depth metrics for a circuit */
export interface OptimizationMetrics {
  gateCount: number
  depth: number
  oneQubitGateCount?: number
  twoQubitGateCount?: number
  runtimeMs?: number
}

/** Delta between original and optimized metrics */
export interface OptimizationDelta {
  gateCountReduction: number
  depthReduction: number
  compressionRatio?: number
  geodesicReduction?: number
}

/** Invariant checks after optimization */
export interface InvariantReport {
  fidelity?: number
  equivalent?: boolean
  notes?: string[]
}

/** Single entry in the transform pass trace */
export interface TransformTraceEntry {
  pass: string
  applied: boolean
  notes?: string
  /** Micro-explanation bullet points shown in the self-justifying trace view */
  details?: string[]
  metricsImpact?: Record<string, number>
}

/** Full optimization run report (mirrors the API response shape) */
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

/** Static definition of a benchmark circuit entry */
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

/** Result of running a benchmark (definition + report) */
export interface BenchmarkRunResult {
  definition: BenchmarkCircuitDefinition
  report: OptimizationRunReport
  ranAt: string
}

/** Collection of benchmark results for export */
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
