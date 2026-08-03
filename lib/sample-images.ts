/**
 * Generate realistic sample images for one-click demo.
 * Each function creates a File object via Canvas API.
 * Sizes range from 200KB to ~2MB to show meaningful compression results.
 */

async function canvasToFile(
  canvas: OffscreenCanvas,
  name: string,
  type: string = 'image/png',
  quality?: number
): Promise<File> {
  const blob = await canvas.convertToBlob({ type, quality })
  return new File([blob], name, { type })
}

/** Generate pseudo-random based on a seed (simple LCG) */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** Load real landscape photo from public directory */
async function createPhotoSample(): Promise<File> {
  const res = await fetch('/demo-photo.jpg?v=2')
  if (!res.ok) throw new Error('Failed to load sample photo')
  const blob = await res.blob()
  return new File([blob], 'sample-photo.jpg', { type: 'image/jpeg' })
}

/** Create a screenshot-like image with UI elements */
async function createScreenshotSample(): Promise<File> {
  const W = 1280, H = 720
  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d')!
  const rand = seededRandom(99)

  // Background
  ctx.fillStyle = '#0b1420'
  ctx.fillRect(0, 0, W, H)

  // Sidebar
  ctx.fillStyle = '#0f1a2e'
  ctx.fillRect(0, 0, 220, H)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, 0, 220, 1)

  // Sidebar items
  const items = [
    { label: 'Dashboard', active: true, y: 80 },
    { label: 'Projects', y: 130 },
    { label: 'Analytics', y: 180 },
    { label: 'Settings', y: 230 },
    { label: 'Users', y: 280 },
  ]
  for (const item of items) {
    ctx.fillStyle = item.active ? '#06b6d4' : '#64748b'
    ctx.font = '14px sans-serif'
    ctx.fillText(item.label, 30, item.y)

    // Active indicator
    if (item.active) {
      ctx.fillStyle = '#06b6d4'
      ctx.fillRect(0, item.y - 12, 3, 18)
      ctx.fillStyle = 'rgba(6,182,212,0.1)'
      ctx.fillRect(8, item.y - 14, 204, 28)
    }
  }

  // Header
  ctx.fillStyle = '#0b1420'
  ctx.fillRect(220, 0, W - 220, 56)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(220, 56, W - 220, 1)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '16px sans-serif'
  ctx.fillText('Project Overview', 245, 35)

  // Cards
  const cards = [
    { x: 245, y: 85, label: 'Total Users', value: '12,847', color: '#06b6d4' },
    { x: 505, y: 85, label: 'Revenue', value: '$48,290', color: '#10b981' },
    { x: 765, y: 85, label: 'Active Now', value: '1,204', color: '#f59e0b' },
    { x: 1025, y: 85, label: 'Bounce Rate', value: '24.3%', color: '#ef4444' },
  ]
  for (const c of cards) {
    ctx.fillStyle = '#0f1a2e'
    ctx.strokeStyle = c.color + '30'
    ctx.lineWidth = 1
    roundRect(ctx, c.x, c.y, 240, 90, 8)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = c.color
    ctx.font = 'bold 28px sans-serif'
    ctx.fillText(c.value, c.x + 16, c.y + 45)
    ctx.fillStyle = '#64748b'
    ctx.font = '12px sans-serif'
    ctx.fillText(c.label, c.x + 16, c.y + 68)
  }

  // Chart area
  ctx.fillStyle = '#0f1a2e'
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  roundRect(ctx, 245, 200, 510, 300, 8)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#64748b'
  ctx.font = '13px sans-serif'
  ctx.fillText('Monthly Revenue', 265, 230)

  // Chart bars
  for (let i = 0; i < 12; i++) {
    const bh = 60 + rand() * 200
    const grad = ctx.createLinearGradient(0, 500 - bh, 0, 500)
    grad.addColorStop(0, '#06b6d4')
    grad.addColorStop(1, '#3b82f6')
    ctx.fillStyle = grad
    roundRect(ctx, 275 + i * 38, 500 - bh, 22, bh, 3)
    ctx.fill()
    ctx.fillStyle = '#64748b'
    ctx.font = '10px sans-serif'
    ctx.fillText(['J','F','M','A','M','J','J','A','S','O','N','D'][i], 278 + i * 38, 518)
  }

  // Table
  ctx.fillStyle = '#0f1a2e'
  ctx.strokeStyle = '#1e293b'
  roundRect(ctx, 770, 200, 495, 300, 8)
  ctx.fill()
  ctx.stroke()

  // Table rows
  const rows = [
    { name: 'Sarah Chen', email: 'sarah@example.com', role: 'Admin' },
    { name: 'Mike Johnson', email: 'mike@example.com', role: 'Editor' },
    { name: 'Anna Lee', email: 'anna@example.com', role: 'Viewer' },
    { name: 'Tom Wilson', email: 'tom@example.com', role: 'Editor' },
    { name: 'Lisa Park', email: 'lisa@example.com', role: 'Viewer' },
  ]
  rows.forEach((row, i) => {
    const y = 235 + i * 48
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '13px sans-serif'
    ctx.fillText(row.name, 785, y)
    ctx.fillStyle = '#64748b'
    ctx.fillText(row.email, 920, y)
    ctx.fillStyle = row.role === 'Admin' ? '#06b6d4' : row.role === 'Editor' ? '#10b981' : '#64748b'
    ctx.font = '11px sans-serif'
    ctx.fillText(row.role, 1130, y)
    if (i < rows.length - 1) {
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(785, y + 8, 460, 1)
    }
  })

  return canvasToFile(canvas, 'sample_dashboard.png', 'image/png')
}

/** Create a logo/design-like image with flat colors and shapes */
async function createLogoDesignSample(): Promise<File> {
  const W = 800, H = 800
  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d')!

  // Background with subtle gradient
  const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 50, W * 0.5, H * 0.5, 600)
  bgGrad.addColorStop(0, '#1a1a2e')
  bgGrad.addColorStop(1, '#0b1420')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Decorative circles
  const circles = [
    { cx: 200, cy: 200, r: 120, color: 'rgba(6,182,212,0.15)' },
    { cx: 600, cy: 250, r: 90, color: 'rgba(59,130,246,0.12)' },
    { cx: 400, cy: 550, r: 150, color: 'rgba(168,85,247,0.1)' },
    { cx: 150, cy: 600, r: 80, color: 'rgba(34,197,94,0.1)' },
  ]
  for (const c of circles) {
    ctx.fillStyle = c.color
    ctx.beginPath()
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Main shape — hexagon
  const cx = W / 2, cy = H / 2, r = 160
  const hexGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  hexGrad.addColorStop(0, '#06b6d4')
  hexGrad.addColorStop(1, '#3b82f6')
  ctx.fillStyle = hexGrad
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()

  // Inner icon — lightning bolt
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(cx + 30, cy - 80)
  ctx.lineTo(cx - 60, cy + 10)
  ctx.lineTo(cx - 10, cy + 10)
  ctx.lineTo(cx - 30, cy + 80)
  ctx.lineTo(cx + 60, cy - 10)
  ctx.lineTo(cx + 10, cy - 10)
  ctx.closePath()
  ctx.fill()

  // Text below
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 42px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('COMPRESS', cx, cy + 260)
  ctx.fillStyle = '#64748b'
  ctx.font = '18px sans-serif'
  ctx.fillText('Fast · Local · Private', cx, cy + 295)

  // Decorative grid dots
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let x = 40; x < W; x += 60) {
    for (let y = 40; y < H; y += 60) {
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return canvasToFile(canvas, 'sample_design.png', 'image/png')
}

/** Create a simple gradient pattern — small size, good for quick testing */
async function createGradientSample(): Promise<File> {
  const W = 600, H = 400
  const canvas = new OffscreenCanvas(W, H)
  const ctx = canvas.getContext('2d')!
  const rand = seededRandom(7)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = Math.floor(200 + 55 * Math.sin(x * 0.01) + 30 * Math.cos(y * 0.012))
      const g = Math.floor(150 + 55 * Math.sin(y * 0.008 + 2) + 30 * Math.cos(x * 0.01))
      const b = Math.floor(180 + 55 * Math.cos((x + y) * 0.007 + 1))
      const noise = (rand() - 0.5) * 20
      ctx.fillStyle = `rgb(${r + noise},${g + noise},${b + noise})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  return canvasToFile(canvas, 'sample_gradient.png', 'image/png')
}

// Helper to draw rounded rectangles
function roundRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export interface SampleImage {
  name: string
  description: string
  icon: string
  generator: () => Promise<File>
  size: string
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    name: 'photo',
    description: 'Landscape photo',
    icon: '🏞️',
    generator: createPhotoSample,
    size: '~140 KB',
  },
  {
    name: 'screenshot',
    description: 'App screenshot',
    icon: '🖥️',
    generator: createScreenshotSample,
    size: '~800 KB',
  },
  {
    name: 'design',
    description: 'Logo design',
    icon: '🎨',
    generator: createLogoDesignSample,
    size: '~600 KB',
  },
  {
    name: 'gradient',
    description: 'Gradient pattern',
    icon: '🌈',
    generator: createGradientSample,
    size: '~200 KB',
  },
]

/** Generate all sample images. Returns File[] ready for addFiles(). */
export async function generateSamples(): Promise<File[]> {
  const files = await Promise.all(SAMPLE_IMAGES.map(s => s.generator()))
  return files
}

/** Generate a single sample by name */
export async function generateSample(name: string): Promise<File | null> {
  const sample = SAMPLE_IMAGES.find(s => s.name === name)
  if (!sample) return null
  return sample.generator()
}
