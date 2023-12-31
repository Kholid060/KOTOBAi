declare module 'virtual:reload-on-update-in-background-script' {
  export const reloadOnUpdate: (watchPath: string) => void;
  export default reloadOnUpdate;
}

declare module 'virtual:reload-on-update-in-view' {
  const refreshOnUpdate: (watchPath: string) => void;
  export default refreshOnUpdate;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: string;
  export default content;
}

declare interface ShadowRoot {
  getSelection?(): Selection;
}

interface Highlight {
  prototype: Highlight;
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new (...ranges: Array<StaticRange>): Highlight;
}

declare interface Window {
  Highlight?: Highlight;
}

declare namespace CSS {
  const highlights: Map<string, Highlight> | undefined;
}

declare const VITE_IS_FIREFOX: boolean;
