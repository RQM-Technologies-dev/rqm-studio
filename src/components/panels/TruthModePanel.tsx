import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { BENCHMARK_CORPUS } from '../../data/benchmarkCorpus'
import { isLiveApiEnabled } from '../../api/optimizationApi'
import { SectionHeader } from '../ui/SectionHeader'
import { MetricsTable } from '../metrics/MetricsTable'
import { TraceTimeline } from '../trace/TraceTimeline'
import { VerificationBlock } from '../verification/VerificationBlock'
import { BeforeAfterCircuit } from '../circuit/BeforeAfterCircuit'
import type { GateStep } from '../../types/circuit'
import type { BenchmarkCircuitDefinition } from '../../types/optimization'

// ---------------------------------------------------------------------------
// Re-use the gate-sequence label list from the corpus to build display gates
// ---------------------------------------------------------------------------

/** Thin display-only gate stub (no quaternion needed for BeforeAfterCircuit) */
function makeDisplayGates(labels: string[]): GateStep[] {
  const COLORS: Record<string, string> = {
    H: '#06b6d4', X: '#f43f5e', Y: '#ec4899', Z: '#a78bfa',
    S: '#fb923c', T: '#14b8a6', Tdg: '#14b8a6', SX: '#f43f5e',
    Rx: '#f43f5e', Ry: '#ec4899', Rz: '#a78bfa',
    CNOT: '#f43f5e', CZ: '#a78bfa', CX: '#f43f5e',
  }
  return labels.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    description: label,
    color: COLORS[label] ?? '#64748b',
    quaternion: { w: 1, x: 0, y: 0, z: 0 },
  }))
}

export function TruthModePanel() {
  const {
    truthModeLoading,
    truthModeError,
    truthModeReport,
    runTruthMode,
    clearTruthMode,
  } = useStudioStore()

  const [selectedId, setSelectedId] = useState<string>(BENCHMARK_CORPUS[0].circuitId)
  const [showTrace, setShowTrace] = useState(false)

  const selected: BenchmarkCircuitDefinition | undefined = BENCHMARK_CORPUS.find(
    (c) => c.circuitId === selectedId,
  )

  const liveApi = isLiveApiEnabled()

  function handleRun() {
    if (selected) {
      runTruthMode(selected)
      setShowTrace(false)
    }
  }

  // Build display gates for BeforeAfterCircuit from the report's canonical output
  const originalDisplayGates = selected ? makeDisplayGates(selected.gateSequence) : []
  const optimizedDisplayGates = truthModeReport
    ? (truthModeReport.canonicalizedOutput?.gates as Array<{ label: string }> | undefined)?.map(
        (g, i) => ({ id: `opt-${i}`, label: g.label, description: g.label, color: '#14b8a6', quaternion: { w: 1, x: 0, y: 0, z: 0 } }),
      ) ?? []
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="panel-card p-4 border-cyan-600/30">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">
            Truth Mode
          </h2>
          <span
            className={`text-xs px-2 py-0.5 rounded font-mono ${
              liveApi
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {liveApi ? '● Live API' : '○ Mock Mode'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Run the RQM Optimization API on a circuit and inspect undeniable evidence —
          metrics, invariant verification, and the full self-justifying pass trace.
          {!liveApi && (
            <span className="block mt-1 text-amber-400/80">
              Set <code className="font-mono">VITE_RQM_API_URL</code> to connect to the live API.
            </span>
          )}
        </p>
      </div>

      {/* ── Circuit selector ───────────────────────────────────────────────── */}
      <div className="panel-card p-4">
        <SectionHeader title="Select Circuit" />
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
            clearTruthMode()
          }}
          className="w-full mt-2 bg-slate-800 border border-slate-600/60 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-cyan-500/60"
        >
          {BENCHMARK_CORPUS.map((c) => (
            <option key={c.circuitId} value={c.circuitId}>
              [{c.category}] {c.name}
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 flex flex-col gap-1.5">
            <p className="text-xs text-slate-400 leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span>Qubits: {selected.qubitCount}</span>
              <span className="text-slate-700">·</span>
              <span>Gates: {selected.gateSequence.length}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-400 font-medium">Baseline: {selected.baseline}</span>
              <span className="text-slate-700">·</span>
              <span>Backend: {selected.backend}</span>
            </div>
            <div className="flex gap-1 flex-wrap mt-1">
              {selected.gateSequence.map((g, i) => (
                <span
                  key={i}
                  className="text-xs font-mono px-1.5 py-0.5 bg-slate-700/60 rounded text-slate-300"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={truthModeLoading || !selected}
          className="mt-4 w-full py-2 rounded text-sm font-semibold transition-all border
            bg-cyan-700/30 text-cyan-300 border-cyan-600/50
            hover:bg-cyan-600/40 hover:border-cyan-500/70
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {truthModeLoading ? '⏳ Running optimizer…' : '▶ Run Truth Mode'}
        </button>
      </div>

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {truthModeError && (
        <div className="panel-card p-4 border-red-500/30">
          <p className="text-sm text-red-400">Error: {truthModeError}</p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {truthModeReport && !truthModeLoading && (
        <>
          {/* 1. Metrics + Verification side by side (most authoritative content first) */}
          <div className="flex flex-col gap-3">
            {/* Verification block */}
            <VerificationBlock report={truthModeReport} />

            {/* Metrics */}
            <div className="panel-card p-4">
              <SectionHeader title="Optimization Metrics" />
              <div className="mt-3">
                <MetricsTable
                  original={truthModeReport.original}
                  optimized={truthModeReport.optimized}
                  delta={truthModeReport.delta}
                />
              </div>
            </div>
          </div>

          {/* 2. Before/After circuit comparison */}
          <div className="panel-card p-4">
            <SectionHeader title="Before / After" subtitle="Gate-level comparison" />
            <div className="mt-3">
              <BeforeAfterCircuit
                original={originalDisplayGates}
                optimized={optimizedDisplayGates}
              />
            </div>
          </div>

          {/* 3. Transform trace (collapsible) */}
          <div className="panel-card p-4">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Transform Trace" subtitle="Self-justifying pass log" />
              <button
                onClick={() => setShowTrace((v) => !v)}
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {showTrace ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTrace && <TraceTimeline trace={truthModeReport.trace} />}
            {!showTrace && (
              <p className="text-xs text-slate-500">
                {truthModeReport.trace.filter((t) => t.applied).length} of{' '}
                {truthModeReport.trace.length} passes applied. Click Show to inspect.
              </p>
            )}
          </div>

          {/* 4. Notes */}
          {truthModeReport.notes && (
            <div className="panel-card p-4">
              <SectionHeader title="Notes" />
              <p className="text-sm text-slate-400 leading-relaxed mt-1">{truthModeReport.notes}</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

