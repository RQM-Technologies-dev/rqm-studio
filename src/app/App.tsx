import { Header } from './layout/Header'
import { OptimizePage } from '../pages/OptimizePage'
import { JobsPage } from '../pages/JobsPage'
import { BenchmarksPage } from '../pages/BenchmarksPage'
import { SettingsPage } from '../pages/SettingsPage'
import { VisualizerPage } from '../pages/VisualizerPage'
import { useStudioStore } from '../store'

export default function App() {
  const mode = useStudioStore((s) => s.mode)

  const renderPage = () => {
    switch (mode) {
      case 'optimize':
        return <OptimizePage />
      case 'jobs':
        return <JobsPage />
      case 'benchmarks':
        return <BenchmarksPage />
      case 'settings':
        return <SettingsPage />
      case 'visualize':
      default:
        return <VisualizerPage />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-rqm-navy overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {renderPage()}
      </div>
    </div>
  )
}
