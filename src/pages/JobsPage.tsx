import { useStudioStore } from '../store'

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-teal-400',
  failed: 'text-red-400',
  pending: 'text-yellow-400',
  running: 'text-cyan-400',
  cancelled: 'text-slate-500',
}

export function JobsPage() {
  const { jobs, clearJobs } = useStudioStore()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Jobs</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Optimization requests submitted in this session. Execution jobs will appear here once the API supports them.
          </p>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={clearJobs}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="panel-card p-12 flex flex-col items-center text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-base font-semibold text-slate-300 mb-2">No jobs yet</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Run an optimization from the <strong className="text-slate-300">Optimize</strong> tab to see job history here.
            Once quantum execution is available, submitted execution jobs will also appear in this dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="panel-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {job.type}
                    </span>
                    <span className={`text-xs font-medium ${STATUS_COLORS[job.status] ?? 'text-slate-400'}`}>
                      {job.status}
                    </span>
                    {job.circuitName && (
                      <span className="text-xs text-slate-400 truncate">{job.circuitName}</span>
                    )}
                  </div>
                  {job.summary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{job.summary}</p>
                  )}
                  {job.report && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-slate-500">
                        Gates: <span className="text-slate-300">{job.report.original_gate_count} → {job.report.optimized_gate_count}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Depth: <span className="text-slate-300">{job.report.original_depth} → {job.report.optimized_depth}</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {job.processingTimeMs !== undefined && (
                    <p className="text-xs text-slate-500">{Math.round(job.processingTimeMs)}ms</p>
                  )}
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    {new Date(job.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 panel-card p-4 border-slate-700/30">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Coming Soon</h3>
        <p className="text-xs text-slate-500">
          Quantum execution jobs via IBM Qiskit and AWS Braket will appear here once the API supports them.
          You will be able to track job status, view results, and download outputs.
        </p>
      </div>
    </div>
  )
}
