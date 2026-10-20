import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(process.cwd())
const srcSvg = path.join(root, 'public', 'favicon.svg')
// Silueta monocroma para el distintivo de las notificaciones de Android.
const srcBadge = path.join(root, 'public', 'favicon-badge.svg')
const outDir = path.join(root, 'public', 'icons')

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

async function generate() {
  const svg = await readFile(srcSvg)
  await ensureDir(outDir)
  const targets = [
    { size: 192, file: 'icon-192.png' },
    { size: 512, file: 'icon-512.png' },
  ]
  for (const t of targets) {
    const outPath = path.join(outDir, t.file)
    const buf = await sharp(svg, { density: 384 })
      .resize(t.size, t.size)
      .png({ compressionLevel: 9 })
      .toBuffer()
    await writeFile(outPath, buf)
    console.log('Generated', outPath)
  }

  // El distintivo se genera aparte porque parte de otro archivo de origen y
  // se entrega a 96 px, que es el tamano que pide Android para el badge.
  const badgeSvg = await readFile(srcBadge)
  const badgePath = path.join(outDir, 'icon-badge.png')
  const badgeBuf = await sharp(badgeSvg, { density: 384 })
    .resize(96, 96)
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(badgePath, badgeBuf)
  console.log('Generated', badgePath)
}

generate().catch((e) => {
  console.error('Failed to generate icons:', e)
  process.exit(1)
})
