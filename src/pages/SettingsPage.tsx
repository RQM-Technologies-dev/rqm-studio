import { useState } from 'react'
import { useStudioStore } from '../store'

export function SettingsPage() {
  const { ibmToken, awsAccessKeyId, awsSecretAccessKey, awsRegion, setIbmToken, setAwsCredentials } = useStudioStore()
  const [ibmDraft, setIbmDraft] = useState(ibmToken)
  const [awsKeyDraft, setAwsKeyDraft] = useState(awsAccessKeyId)
  const [awsSecretDraft, setAwsSecretDraft] = useState(awsSecretAccessKey)
  const [awsRegionDraft, setAwsRegionDraft] = useState(awsRegion)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setIbmToken(ibmDraft)
    setAwsCredentials(awsKeyDraft, awsSecretDraft, awsRegionDraft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-200">Settings</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Provider credentials and backend configuration. Credentials are stored in memory only and never persisted to disk or transmitted without your action.
        </p>
      </div>

      <div className="panel-card p-4 border-yellow-700/30 mb-6">
        <p className="text-xs text-yellow-400 font-semibold mb-1">⚠ Execution Coming Soon</p>
        <p className="text-xs text-slate-400">
          Quantum execution via IBM Qiskit and AWS Braket is not yet available. You can configure credentials here in advance, but they will not be used until the API supports execution endpoints.
        </p>
      </div>

      {/* IBM Qiskit */}
      <div className="panel-card p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          IBM Quantum (Qiskit)
          <span className="text-xs text-slate-500 font-normal bg-slate-800 px-2 py-0.5 rounded">Coming soon</span>
        </h3>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">IBM Quantum API Token</label>
          <input
            type="password"
            value={ibmDraft}
            onChange={(e) => setIbmDraft(e.target.value)}
            placeholder="Paste your IBM Quantum token…"
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Backend</label>
          <select
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs text-slate-400 focus:outline-none cursor-not-allowed"
            disabled
          >
            <option>ibm_brisbane (IBM Simulator) — Coming soon</option>
            <option>ibm_kyoto (IBM Hardware) — Coming soon</option>
          </select>
        </div>
      </div>

      {/* AWS Braket */}
      <div className="panel-card p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          AWS Braket
          <span className="text-xs text-slate-500 font-normal bg-slate-800 px-2 py-0.5 rounded">Coming soon</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Access Key ID</label>
            <input
              type="password"
              value={awsKeyDraft}
              onChange={(e) => setAwsKeyDraft(e.target.value)}
              placeholder="AKIA…"
              className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Secret Access Key</label>
            <input
              type="password"
              value={awsSecretDraft}
              onChange={(e) => setAwsSecretDraft(e.target.value)}
              placeholder="Secret…"
              className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              disabled
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Region</label>
          <input
            value={awsRegionDraft}
            onChange={(e) => setAwsRegionDraft(e.target.value)}
            placeholder="us-east-1"
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Backend</label>
          <select
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs text-slate-400 focus:outline-none cursor-not-allowed"
            disabled
          >
            <option>SV1 (Local Simulator) — Coming soon</option>
            <option>IonQ (Hardware) — Coming soon</option>
            <option>Rigetti Aspen (Hardware) — Coming soon</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-600">Credentials are stored in memory only.</p>
        <button
          onClick={handleSave}
          disabled
          className="px-4 py-2 rounded-lg bg-slate-700 text-slate-500 text-xs font-semibold cursor-not-allowed"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
