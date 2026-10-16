// Splits src/imir.json (all Algerian communes) into one tiny file per wilaya:
// public/communes/<wilaya_id>.json  →  [[communeName, hasStopDesk(0|1)], ...]
// The order form downloads only the selected wilaya's file (~3 KB), so the
// 170 KB source file is never shipped to visitors. Runs before dev/build.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'

const rows = JSON.parse(readFileSync(new URL('../src/imir.json', import.meta.url), 'utf8'))
const out = new URL('../public/communes/', import.meta.url)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const byWilaya = new Map()
for (const r of rows) {
  const id = Number(r.wilaya_id)
  const name = String(r.nom ?? '').trim()
  if (!id || !name) continue
  if (!byWilaya.has(id)) byWilaya.set(id, [])
  byWilaya.get(id).push([name, r.has_stop_desk ? 1 : 0])
}
for (const [id, list] of byWilaya) {
  list.sort((a, b) => a[0].localeCompare(b[0], 'fr'))
  writeFileSync(new URL(`${id}.json`, out), JSON.stringify(list))
}
console.log(`communes: ${rows.length} rows → ${byWilaya.size} wilaya files`)
