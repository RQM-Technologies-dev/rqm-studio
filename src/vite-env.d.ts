/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RQM_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
