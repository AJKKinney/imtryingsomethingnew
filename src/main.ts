// MELTLINE — entry point.
// Commit 1 is the skeleton: CI exists before there is anything to break (§17).
// The loop, the renderer and the board arrive in commits 5, 6 and 10 (§136.3).

declare const __MELTLINE_TARGET__: string

export const target: string = __MELTLINE_TARGET__

const canvas = document.getElementById('stage')
if (canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (ctx) {
    canvas.width = 640
    canvas.height = 360
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, 640, 360)
  }
}
