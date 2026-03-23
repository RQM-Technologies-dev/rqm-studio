import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import type { StudioMode } from '../../types/circuit'
import { isLiveApiEnabled } from '../../api/optimizationApi'

interface NavItem {
  id: StudioMode
  label: string
  icon: string
  primary: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'optimize', label: 'Optimize', icon: '⚡', primary: true },
  { id: 'jobs', label: 'Jobs', icon: '📋', primary: true },
  { id: 'benchmarks', label: 'Benchmarks', icon: '📊', primary: true },
  { id: 'settings', label: 'Settings', icon: '⚙', primary: true },
  { id: 'visualize', label: 'Visualizer', icon: '🌐', primary: false },
]

export function Header() {
  const { mode, setMode, jobs } = useStudioStore()
  const liveApi = isLiveApiEnabled()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-rqm-navy-light/80 backdrop-blur-sm flex-shrink-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-glow-cyan">
          <span className="text-white font-bold text-xs font-mono">RQ</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none glow-text">
            RQM Studio
          </h1>
          <p className="text-xs text-slate-500 leading-none mt-0.5">
            Quantum Circuit Optimization
          </p>
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-rqm-navy rounded-lg p-1 border border-slate-700/50">
        {NAV_ITEMS.filter((n) => n.primary).map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5
              ${mode === item.id
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border border-transparent'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'jobs' && jobs.length > 0 && (
              <span className="bg-cyan-600/40 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none">
                {jobs.length}
              </span>
            )}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-700/50 mx-1" />
        {NAV_ITEMS.filter((n) => !n.primary).map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`
              px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5
              ${mode === item.id
                ? 'bg-slate-600/30 text-slate-300 border border-slate-500/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/20 border border-transparent'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <span
          className={`text-xs font-mono flex items-center gap-1.5 px-2 py-0.5 rounded border ${
            liveApi
              ? 'text-teal-400 border-teal-500/30 bg-teal-500/10'
              : 'text-slate-500 border-slate-600/30'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${liveApi ? 'bg-teal-400' : 'bg-slate-600'}`} />
          {liveApi ? 'Live API' : 'Mock Mode'}
        </span>
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
