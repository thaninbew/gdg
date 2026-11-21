// WCAG contrast gate for the text/surface token pairs in app/globals.css, in light and dark.
// Run: pnpm check:contrast. Add a pair below whenever a new text-on-surface combination appears.
import { readFileSync } from "node:fs"

const PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "canvas"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "canvas"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["destructive", "card"],
  ["critical-fg", "critical-tint"],
  ["warning-fg", "warning-tint"],
  ["success-fg", "success-tint"],
  ["info-fg", "info-tint"],
]
const MIN = 4.5

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
const block = (selector) => {
  const m = css.match(new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`No ${selector} block in globals.css`)
  return Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]))
}
const light = block(":root")
const dark = { ...light, ...block(".dark") }

const resolve = (vars, name, depth = 0) => {
  const v = vars[name]
  if (!v) throw new Error(`Token --${name} is not defined`)
  const ref = v.match(/^var\(--([\w-]+)\)$/)
  if (ref && depth < 5) return resolve(vars, ref[1], depth + 1)
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${name} is "${v}"; this check needs a 6-digit hex`)
  return v
}
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

let failed = 0
for (const [theme, vars] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg] of PAIRS) {
    const r = ratio(resolve(vars, fg), resolve(vars, bg))
    const ok = r >= MIN
    if (!ok) failed++
    console.log(`${ok ? "PASS" : "FAIL"}  ${theme.padEnd(5)}  ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}`)
  }
}
if (failed) {
  console.error(`\n${failed} pair(s) below ${MIN}:1`)
  process.exit(1)
}
