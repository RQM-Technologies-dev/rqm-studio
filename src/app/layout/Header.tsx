import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import type { StudioMode } from '../../types/circuit'
import { isLiveApiEnabled } from '../../api/optimizationApi'

const MODES: { id: StudioMode; label: string; group: 'core' | 'evidence' }[] = [
  { id: 'visualize', label: 'Visualize', group: 'core' },
  { id: 'compile', label: 'Compile', group: 'core' },
  { id: 'optimize', label: 'Optimize', group: 'core' },
  { id: 'truth', label: 'Truth Mode', group: 'evidence' },
  { id: 'benchmark', label: 'Benchmark', group: 'evidence' },
]

export function Header() {
  const { mode, setMode } = useStudioStore()
  const liveApi = isLiveApiEnabled()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-rqm-navy-light/80 backdrop-blur-sm flex-shrink-0"
    >
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-glow-cyan">
          <span className="text-white font-bold text-xs font-mono">RQ</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none glow-text">
            RQM Studio
          </h1>
          <p className="text-xs text-slate-500 leading-none mt-0.5">
            Optimization Evidence &amp; Verification
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      <nav className="hidden md:flex items-center gap-1 bg-rqm-navy rounded-lg p-1 border border-slate-700/50">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium transition-all duration-200
              ${mode === m.id
                ? m.group === 'evidence'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/40'
                  : 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border border-transparent'
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {liveApi && (
          <span className="text-xs text-teal-400 font-mono border border-teal-500/30 px-2 py-0.5 rounded">
            Live API
          </span>
        )}
        <span className="text-xs text-slate-600 font-mono">v0.1.0</span>
        <a
          href="https://github.com/RQM-Technologies-dev/rqm-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          RQM Technologies
        </a>
      </div>
    </motion.header>
  )
}
