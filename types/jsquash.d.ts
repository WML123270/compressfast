declare module '@jsquash/oxipng' {
  interface OptimiseOptions {
    level?: number
    interlace?: boolean
  }
  export function optimise(data: Uint8Array, options?: OptimiseOptions): Promise<Uint8Array>
}

declare module '@jsquash/png' {
  export function decode(data: Uint8Array): Promise<{ width: number; height: number; data: Uint8Array }>
}
