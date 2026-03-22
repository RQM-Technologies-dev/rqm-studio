import type { OptimizationMetrics, OptimizationDelta } from '../../types/optimization'

interface MetricsTableProps {
  original: OptimizationMetrics
  optimized: OptimizationMetrics
  delta: OptimizationDelta
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function deltaClass(reduction: number): string {
  if (reduction > 0) return 'text-green-400'
  if (reduction < 0) return 'text-red-400'
  return 'text-slate-400'
}

interface RowProps {
  label: string
  original: string | number
  optimized: string | number
  delta?: string
  deltaColor?: string
}

function MetricRow({ label, original, optimized, delta, deltaColor }: RowProps) {
  return (
    <tr className="border-b border-slate-700/40">
      <td className="py-2 pr-4 text-sm text-slate-400 whitespace-nowrap">{label}</td>
      <td className="py-2 px-3 text-sm font-mono text-slate-300 text-right">{original}</td>
      <td className="py-2 px-3 text-sm font-mono text-cyan-300 text-right">{optimized}</td>
      <td className={`py-2 pl-3 text-sm font-mono text-right ${deltaColor ?? 'text-slate-400'}`}>
        {delta ?? '—'}
      </td>
    </tr>
  )
}

export function MetricsTable({ original, optimized, delta }: MetricsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-600/60">
            <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-left">
              Metric
            </th>
            <th className="pb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
              Original
            </th>
            <th className="pb-2 px-3 text-xs font-semibold uppercase tracking-wider text-cyan-600 text-right">
              Optimized
            </th>
            <th className="pb-2 pl-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label="Gate Count"
            original={original.gateCount}
            optimized={optimized.gateCount}
            delta={`-${delta.gateCountReduction}`}
            deltaColor={deltaClass(delta.gateCountReduction)}
          />
          <MetricRow
            label="Depth"
            original={original.depth}
            optimized={optimized.depth}
            delta={`-${delta.depthReduction}`}
            deltaColor={deltaClass(delta.depthReduction)}
          />
          {original.oneQubitGateCount !== undefined && (
            <MetricRow
              label="1Q Gates"
              original={original.oneQubitGateCount}
              optimized={optimized.oneQubitGateCount ?? '—'}
            />
          )}
          {original.twoQubitGateCount !== undefined && (
            <MetricRow
              label="2Q Gates"
              original={original.twoQubitGateCount}
              optimized={optimized.twoQubitGateCount ?? '—'}
            />
          )}
          {delta.compressionRatio !== undefined && (
            <MetricRow
              label="Compression"
              original="—"
              optimized={pct(delta.compressionRatio)}
              deltaColor="text-teal-400"
            />
          )}
          {delta.geodesicReduction !== undefined && (
            <MetricRow
              label="Geodesic ↓"
              original="—"
              optimized={pct(delta.geodesicReduction)}
              deltaColor="text-teal-400"
            />
          )}
          {original.runtimeMs !== undefined && (
            <MetricRow
              label="Runtime (ms)"
              original={original.runtimeMs}
              optimized={optimized.runtimeMs ?? '—'}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}
