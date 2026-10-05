/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare const __APP_VERSION__: string;

// Electron renderer process globals
declare global {
  const process: NodeJS.Process;

  interface Window {
    require: NodeRequire;
    process: NodeJS.Process;
  }
}

// Image imports
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import type { FC, SVGProps } from 'react';

  const SvgComponent: FC<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}

declare module '*.svg?url' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}
