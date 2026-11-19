/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set for pull-request preview builds, e.g. "PR 12". Unset on the live site. */
  readonly VITE_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
