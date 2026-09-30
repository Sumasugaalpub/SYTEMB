import type * as React from "react";

/** `<iconify-icon>` web component (loaded from the Iconify CDN in the root layout). */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { icon: string; width?: string | number; height?: string | number };
    }
  }
}

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "iconify-icon": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & { icon: string; width?: string | number; height?: string | number };
      }
    }
  }
}

export {};
