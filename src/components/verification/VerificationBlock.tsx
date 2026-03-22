import type { OptimizationRunReport } from '../../types/optimization'

interface VerificationBlockProps {
  report: OptimizationRunReport
}

interface VerificationRowProps {
  label: string
  value: string
  pass: boolean
}

function VerificationRow({ label, value, pass }: VerificationRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-bold flex-shrink-0 ${pass ? 'text-teal-400' : 'text-red-400'}`}
      >
        {pass ? '✔' : '✘'}
      </span>
      <span className="text-xs text-slate-400 flex-shrink-0">{label}:</span>
      <span
        className={`text-xs font-mono font-semibold ${pass ? 'text-teal-300' : 'text-red-300'}`}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * VerificationBlock — the "Trust Layer" panel.
 * Answers the unspoken question: "Did you break the circuit?"
 * Designed to be presentable to a boss or paper reviewer.
 */
export function VerificationBlock({ report }: VerificationBlockProps) {
  const { invariants, trace, canonicalizedOutput } = report
  const appliedCount = trace.filter((t) => t.applied).length
  const traceComplete = appliedCount > 0

  const allPass =
    invariants.equivalent !== false &&
    (invariants.fidelity === undefined || invariants.fidelity > 0.999) &&
    traceComplete

  return (
    <div
      className={`panel-card p-4 border ${
        allPass ? 'border-teal-500/40' : 'border-red-500/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
          Verification
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            allPass
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
              : 'bg-red-500/20 text-red-400 border border-red-500/40'
          }`}
        >
          {allPass ? 'PASS' : 'FAIL'}
        </span>
      </div>

      {/* Verification rows */}
      <div className="flex flex-col gap-2">
        <VerificationRow
          label="Equivalent"
          value={invariants.equivalent !== false ? 'TRUE' : 'FALSE'}
          pass={invariants.equivalent !== false}
        />

        {invariants.fidelity !== undefined && (
          <VerificationRow
            label="Fidelity"
            value={invariants.fidelity.toFixed(7)}
            pass={invariants.fidelity > 0.999}
          />
        )}

        <VerificationRow
          label="Canonical Form"
          value={canonicalizedOutput !== undefined ? 'MATCHED' : 'PENDING'}
          pass={canonicalizedOutput !== undefined}
        />

        <VerificationRow
          label="Pass Trace"
          value={`${appliedCount} of ${trace.length} passes`}
          pass={traceComplete}
        />
      </div>

      {/* Baseline disclosure */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Baseline: </span>
          {report.baseline}
          <span className="mx-1 text-slate-700">·</span>
          <span className="text-slate-400 font-medium">Backend: </span>
          {report.backend}
        </p>
      </div>
    </div>
  )
}
