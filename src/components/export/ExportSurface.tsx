import { useStudioStore } from '../../store'
import type { ExportableBenchmarkDataset } from '../../types/optimization'

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function ExportSurface() {
  const { benchmarkResults } = useStudioStore()

  if (benchmarkResults.length === 0) {
    return (
      <div className="panel-card p-4 border-slate-700/40">
        <p className="text-sm text-slate-500 italic">
          Run benchmarks first to enable exports.
        </p>
      </div>
    )
  }

  function buildDataset(): ExportableBenchmarkDataset {
    const runs = benchmarkResults
    const compressionRatios = runs
      .map((r) => r.report.delta.compressionRatio ?? 0)
    return {
      exportedAt: new Date().toISOString(),
      runs,
      summary: {
        totalCircuits: runs.length,
        avgGateCountReduction: avg(runs.map((r) => r.report.delta.gateCountReduction)),
        avgDepthReduction: avg(runs.map((r) => r.report.delta.depthReduction)),
        avgCompressionRatio: avg(compressionRatios),
      },
    }
  }

  function exportJSON() {
    const dataset = buildDataset()
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rqm-benchmark-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportCSV() {
    const rows: string[] = []
    rows.push(
      [
        'circuitId',
        'name',
        'category',
        'backend',
        'baseline',
        'originalGateCount',
        'optimizedGateCount',
        'gateCountReduction',
        'originalDepth',
        'optimizedDepth',
        'depthReduction',
        'compressionRatio',
        'geodesicReduction',
        'fidelity',
        'equivalent',
      ].join(','),
    )

    for (const r of benchmarkResults) {
      const { definition, report } = r
      rows.push(
        [
          definition.circuitId,
          `"${definition.name}"`,
          definition.category,
          definition.backend,
          definition.baseline,
          report.original.gateCount,
          report.optimized.gateCount,
          report.delta.gateCountReduction,
          report.original.depth,
          report.optimized.depth,
          report.delta.depthReduction,
          report.delta.compressionRatio?.toFixed(4) ?? '',
          report.delta.geodesicReduction?.toFixed(4) ?? '',
          report.invariants.fidelity?.toFixed(8) ?? '',
          report.invariants.equivalent ?? '',
        ].join(','),
      )
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rqm-benchmark-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dataset = buildDataset()

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="panel-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Run Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500">Circuits</p>
            <p className="text-lg font-mono text-slate-200">{dataset.summary.totalCircuits}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Gate Reduction</p>
            <p className="text-lg font-mono text-green-400">
              {dataset.summary.avgGateCountReduction.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Depth Reduction</p>
            <p className="text-lg font-mono text-green-400">
              {dataset.summary.avgDepthReduction.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Compression</p>
            <p className="text-lg font-mono text-teal-400">
              {(dataset.summary.avgCompressionRatio * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="panel-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Export
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={exportJSON}
            className="w-full py-2 text-sm rounded border transition-all
              border-cyan-600/50 text-cyan-400 bg-cyan-500/10
              hover:bg-cyan-500/20 hover:border-cyan-500/60"
          >
            ↓ Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="w-full py-2 text-sm rounded border transition-all
              border-teal-600/50 text-teal-400 bg-teal-500/10
              hover:bg-teal-500/20 hover:border-teal-500/60"
          >
            ↓ Export CSV
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Exports include all run results with metrics, traces, and invariant checks.
          Suitable for paper tables, grant decks, and enterprise demos.
        </p>
      </div>

      {/* Shareable note */}
      <div className="panel-card p-4 border-slate-600/30">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          Shareable Run Links
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Shareable URLs require backend persistence.
          {/* TODO: implement when backend storage is available */}
          State model is ready — connect a storage adapter to enable this feature.
        </p>
      </div>
    </div>
  )
}
