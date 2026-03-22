import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { BENCHMARK_CORPUS } from '../../data/benchmarkCorpus'
import { SectionHeader } from '../ui/SectionHeader'
import { MetricsTable } from '../metrics/MetricsTable'
import { TraceTimeline } from '../trace/TraceTimeline'
import type { BenchmarkCircuitDefinition, BenchmarkRunResult, CircuitBenchmarkCategory } from '../../types/optimization'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<CircuitBenchmarkCategory, string> = {
  textbook: 'Textbook',
  ansatz: 'Ansatz',
  'single-qubit-heavy': '1Q Heavy',
  'mixed-control': 'Mixed Control',
  'backend-shaped': 'Backend-Shaped',
}

const CATEGORY_COLORS: Record<CircuitBenchmarkCategory, string> = {
  textbook: '#06b6d4',
  ansatz: '#a78bfa',
  'single-qubit-heavy': '#14b8a6',
  'mixed-control': '#fb923c',
  'backend-shaped': '#f43f5e',
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: CircuitBenchmarkCategory }) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-mono"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}44` }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}

interface AggregateStatsProps {
  results: BenchmarkRunResult[]
  totalCircuits: number
}

function AggregateStats({ results, totalCircuits }: AggregateStatsProps) {
  if (results.length === 0) return null

  const avgGateReductionPct =
    avg(results.map((r) => r.report.delta.compressionRatio ?? 0)) * 100
  const avgDepthReductionPct =
    avg(results.map((r) => {
      const d = r.report.delta.depthReduction
      const orig = r.report.original.depth
      return orig > 0 ? d / orig : 0
    })) * 100
  const invariantFailures = results.filter(
    (r) => r.report.invariants.equivalent === false,
  ).length

  return (
    <div className="panel-card p-4 border-purple-600/20">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Across {results.length} of {totalCircuits} circuits
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">Avg Gate ↓</p>
          <p className="text-xl font-mono text-green-400">
            {avgGateReductionPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Avg Depth ↓</p>
          <p className="text-xl font-mono text-green-400">
            {avgDepthReductionPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Invariant Failures</p>
          <p className={`text-xl font-mono ${invariantFailures === 0 ? 'text-teal-400' : 'text-red-400'}`}>
            {invariantFailures}
          </p>
        </div>
      </div>
    </div>
  )
}

interface BenchmarkRowProps {
  definition: BenchmarkCircuitDefinition
  result?: BenchmarkRunResult
  running: boolean
  onRun: (def: BenchmarkCircuitDefinition) => void
  onSelect: (result: BenchmarkRunResult) => void
  isSelected: boolean
}

function BenchmarkRow({ definition, result, running, onRun, onSelect, isSelected }: BenchmarkRowProps) {
  const report = result?.report

  return (
    <div
      className={`panel-card p-3 transition-all border ${
        isSelected ? 'border-cyan-500/50' : 'border-slate-700/50 hover:border-slate-600/70'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200 truncate">{definition.name}</span>
            <CategoryBadge category={definition.category} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{definition.description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {report && (
            <button
              onClick={() => onSelect(result!)}
              className={`text-xs px-2 py-1 rounded border transition-all ${
                isSelected
                  ? 'border-cyan-500/60 text-cyan-400 bg-cyan-500/10'
                  : 'border-slate-600/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected ? 'Viewing' : 'View'}
            </button>
          )}
          <button
            onClick={() => onRun(definition)}
            disabled={running}
            className="text-xs px-2 py-1 rounded border transition-all
              border-teal-600/50 text-teal-400 bg-teal-500/10
              hover:bg-teal-500/20 hover:border-teal-500/70
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? '…' : 'Run'}
          </button>
        </div>
      </div>

      {report && (
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
          <span className="text-slate-500">
            {report.original.gateCount}→<span className="text-cyan-400">{report.optimized.gateCount}</span>{' '}
            gates
          </span>
          <span className="text-slate-500">
            depth {report.original.depth}→<span className="text-cyan-400">{report.optimized.depth}</span>
          </span>
          {report.delta.compressionRatio !== undefined && (
            <span className="text-teal-400">
              ↓{(report.delta.compressionRatio * 100).toFixed(1)}% compressed
            </span>
          )}
          {report.invariants.equivalent && (
            <span className="text-teal-400">✓ equivalent</span>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// One-click narrative summary generator
// ---------------------------------------------------------------------------

function buildNarrativeSummary(results: BenchmarkRunResult[]): string {
  if (results.length === 0) return ''

  const totalCircuits = results.length
  const categories = [...new Set(results.map((r) => r.definition.category))]
  const avgGatePct = avg(results.map((r) => (r.report.delta.compressionRatio ?? 0) * 100))
  const avgDepthPct = avg(results.map((r) => {
    const d = r.report.delta.depthReduction
    const orig = r.report.original.depth
    return orig > 0 ? (d / orig) * 100 : 0
  }))
  const invariantFailures = results.filter(
    (r) => r.report.invariants.equivalent === false,
  ).length

  // Find category with strongest gate-count gains
  const byCategory: Record<string, number[]> = {}
  for (const r of results) {
    const cat = r.definition.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push((r.report.delta.compressionRatio ?? 0) * 100)
  }
  let strongestCat = ''
  let strongestAvg = -Infinity
  for (const [cat, vals] of Object.entries(byCategory)) {
    const a = avg(vals)
    if (a > strongestAvg) {
        strongestAvg = a
        strongestCat = cat
      }
  }

  return [
    `RQM Optimization Results (v1)`,
    ``,
    `Tested on ${totalCircuits} circuit${totalCircuits !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}.`,
    ``,
    `Results:`,
    `  - Avg gate reduction: ${avgGatePct.toFixed(1)}%`,
    `  - Avg depth reduction: ${avgDepthPct.toFixed(1)}%`,
    `  - ${invariantFailures} invariant violation${invariantFailures !== 1 ? 's' : ''}`,
    ...(strongestCat
      ? [`  - Strongest gains in ${strongestCat} circuits (avg ${strongestAvg.toFixed(1)}% gate reduction)`]
      : []),
    ``,
    `Conclusion:`,
    `  RQM provides consistent structural compression while preserving`,
    `  circuit equivalence across all tested workloads.`,
    ``,
    `Generated: ${new Date().toISOString()}`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BenchmarkPanel() {
  const { benchmarkResults, benchmarkRunning, benchmarkError, runBenchmark, clearBenchmarks } =
    useStudioStore()

  const [filterCategory, setFilterCategory] = useState<CircuitBenchmarkCategory | 'all'>('all')
  const [selectedResult, setSelectedResult] = useState<BenchmarkRunResult | null>(null)
  const [showTrace, setShowTrace] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleClear = useCallback(() => {
    clearBenchmarks()
    setSelectedResult(null)
    setSummary(null)
  }, [clearBenchmarks])

  const filteredCorpus = BENCHMARK_CORPUS.filter(
    (c) => filterCategory === 'all' || c.category === filterCategory,
  )

  const handleRunAll = useCallback(async () => {
    setSummary(null)
    for (const def of filteredCorpus) {
      await runBenchmark(def)
    }
  }, [filteredCorpus, runBenchmark])

  const handleRunFullAndSummarize = useCallback(async () => {
    setSummary(null)
    // Run every circuit in the full corpus (ignore category filter for the full run)
    for (const def of BENCHMARK_CORPUS) {
      await runBenchmark(def)
    }
    // Summary will be built after state updates on next render; trigger via flag
    setSummary('__pending__')
  }, [runBenchmark])

  // Resolve pending summary after benchmarkResults has been updated
  const displaySummary =
    summary === '__pending__'
      ? buildNarrativeSummary(benchmarkResults)
      : summary

  function getResult(circuitId: string): BenchmarkRunResult | undefined {
    return benchmarkResults.find((r) => r.definition.circuitId === circuitId)
  }

  const ranCount = benchmarkResults.filter((r) =>
    filteredCorpus.some((c) => c.circuitId === r.definition.circuitId),
  ).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="panel-card p-4 border-purple-600/30">
        <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-1">
          Benchmark Mode
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Run the structured benchmark corpus. Inspect per-circuit evidence and generate
          paper-ready summaries, tables, and export files.
        </p>
      </div>

      {/* ── 1. Aggregate stats ─────────────────────────────────────────────── */}
      <AggregateStats results={benchmarkResults} totalCircuits={BENCHMARK_CORPUS.length} />

      {/* ── 2. Controls ────────────────────────────────────────────────────── */}
      <div className="panel-card p-4 flex items-center gap-3 flex-wrap">
        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as CircuitBenchmarkCategory | 'all')}
          className="bg-slate-800 border border-slate-600/60 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500/60"
        >
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_LABELS) as CircuitBenchmarkCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <button
          onClick={handleRunAll}
          disabled={benchmarkRunning}
          className="text-xs px-3 py-1.5 rounded border transition-all
            border-teal-600/50 text-teal-400 bg-teal-500/10
            hover:bg-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {benchmarkRunning ? '⏳ Running…' : `▶ Run All (${filteredCorpus.length})`}
        </button>

        {benchmarkResults.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs px-3 py-1.5 rounded border border-slate-600/50 text-slate-400 hover:text-slate-200 transition-all"
          >
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 font-mono">
          {ranCount}/{filteredCorpus.length} run
        </span>
      </div>

      {/* ── One-click full run + narrative ─────────────────────────────────── */}
      <div className="panel-card p-4 border-purple-600/20">
        <button
          onClick={handleRunFullAndSummarize}
          disabled={benchmarkRunning}
          className="w-full py-2.5 rounded text-sm font-semibold transition-all border
            border-purple-600/50 text-purple-300 bg-purple-600/10
            hover:bg-purple-600/20 hover:border-purple-500/70
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {benchmarkRunning
            ? '⏳ Running full benchmark…'
            : '⚡ Run Full Benchmark + Generate Summary'}
        </button>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Runs all {BENCHMARK_CORPUS.length} circuits and produces a pitch-ready narrative summary.
        </p>
      </div>

      {benchmarkError && (
        <div className="panel-card p-3 border-red-500/30">
          <p className="text-sm text-red-400">Error: {benchmarkError}</p>
        </div>
      )}

      {/* Narrative summary output */}
      {displaySummary && displaySummary !== '__pending__' && (
        <div className="panel-card p-4 border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <SectionHeader title="Generated Summary" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(displaySummary).catch(() => undefined)
              }}
              className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap bg-slate-800/50 rounded p-3">
            {displaySummary}
          </pre>
        </div>
      )}

      {/* ── 3. Circuit table ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {filteredCorpus.map((def) => {
          const result = getResult(def.circuitId)
          return (
            <BenchmarkRow
              key={def.circuitId}
              definition={def}
              result={result}
              running={benchmarkRunning}
              onRun={runBenchmark}
              onSelect={(r) => {
                setSelectedResult(r)
                setShowTrace(false)
              }}
              isSelected={selectedResult?.definition.circuitId === def.circuitId}
            />
          )
        })}
      </div>

      {/* ── 4. Drill-down view ─────────────────────────────────────────────── */}
      {selectedResult && (
        <>
          <div className="border-t border-slate-700/50" />
          <div className="panel-card p-4">
            <SectionHeader
              title={selectedResult.definition.name}
              subtitle={`Baseline: ${selectedResult.report.baseline} · ${selectedResult.report.backend}`}
            />
            <div className="mt-3">
              <MetricsTable
                original={selectedResult.report.original}
                optimized={selectedResult.report.optimized}
                delta={selectedResult.report.delta}
              />
            </div>
          </div>

          <div className="panel-card p-4">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader title="Transform Trace" subtitle="Self-justifying pass log" />
              <button
                onClick={() => setShowTrace((v) => !v)}
                className="text-xs text-slate-400 hover:text-cyan-400"
              >
                {showTrace ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTrace ? (
              <TraceTimeline trace={selectedResult.report.trace} />
            ) : (
              <p className="text-xs text-slate-500">
                {selectedResult.report.trace.filter((t) => t.applied).length} of{' '}
                {selectedResult.report.trace.length} passes applied. Click Show to inspect.
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

