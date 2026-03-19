import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rqm: {
          navy: '#0a0e1a',
          'navy-light': '#0f1629',
          'navy-card': '#111827',
          cyan: '#06b6d4',
          teal: '#14b8a6',
          'cyan-dim': '#0891b2',
          accent: '#22d3ee',
          muted: '#64748b',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
        'glow-sm': '0 0 10px rgba(6, 182, 212, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config
