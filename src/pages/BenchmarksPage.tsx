export function BenchmarksPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-200">Benchmarks</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Independent benchmark results demonstrating the value of RQM optimization.
        </p>
      </div>

      <div className="panel-card p-8 flex flex-col items-center text-center mb-6">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-base font-semibold text-slate-300 mb-2">Benchmark Results Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-md">
          We are currently running systematic benchmarks to demonstrate optimizer performance.
          Results will include gate count reduction, depth reduction, and comparison against standard
          compiler toolchains across a diverse circuit corpus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Gate Count Reduction', desc: 'Average percentage reduction in total gate count across the benchmark corpus.' },
          { label: 'Depth Reduction', desc: 'Average circuit depth reduction, improving execution time and noise resilience.' },
          { label: 'Equivalence Verified', desc: 'Percentage of optimized circuits with machine-verified unitary equivalence.' },
        ].map((metric) => (
          <div key={metric.label} className="panel-card p-4 text-center">
            <div className="text-2xl font-bold text-slate-600 mb-1">—</div>
            <p className="text-xs font-semibold text-slate-400 mb-1">{metric.label}</p>
            <p className="text-xs text-slate-600">{metric.desc}</p>
          </div>
        ))}
      </div>

      <div className="panel-card p-4 border-slate-700/30">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Planned Benchmark Corpus</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Textbook circuits (QFT, Grover, Bell states)',
            'Variational ansätze (QAOA, VQE)',
            'Single-qubit heavy circuits',
            'Mixed control-flow circuits',
            'Backend-shaped circuits (IBM, Braket)',
            'Random Clifford circuits',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
              <p className="text-xs text-slate-500">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
