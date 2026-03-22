import type { TransformTraceEntry } from '../../types/optimization'

interface TraceTimelineProps {
  trace: TransformTraceEntry[]
}

export function TraceTimeline({ trace }: TraceTimelineProps) {
  if (trace.length === 0) {
    return <p className="text-sm text-slate-500 italic">No pass trace available.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {trace.map((entry, i) => (
        <div key={i} className="flex gap-3 items-start">
          {/* Applied indicator */}
          <div
            className={`mt-1 w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
              entry.applied
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                : 'bg-slate-700/40 text-slate-500 border border-slate-600/40'
            }`}
          >
            {entry.applied ? '✓' : '—'}
          </div>

          {/* Pass info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-slate-300">{entry.pass}</span>
              {entry.applied ? (
                <span className="text-xs text-teal-400 font-medium">applied</span>
              ) : (
                <span className="text-xs text-slate-500">skipped</span>
              )}
              {entry.metricsImpact &&
                Object.entries(entry.metricsImpact).map(([k, v]) => (
                  <span key={k} className="text-xs text-amber-400 font-mono">
                    {k}: {v > 0 ? '+' : ''}{v}
                  </span>
                ))}
            </div>
            {entry.notes && (
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
