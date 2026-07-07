declare module '@upng/upng-js' {
  interface UPNGInstance {
    encode(imgs: Uint8Array[], w: number, h: number, cnum: number, plte?: number[]): ArrayBuffer
    decode(buffer: ArrayBuffer): any
    toRGBA8(png: any): ArrayBuffer[]
    quantize(data: ArrayBuffer, maxColors: number): any
  }
  const UPNG: UPNGInstance
  export default UPNG
}
