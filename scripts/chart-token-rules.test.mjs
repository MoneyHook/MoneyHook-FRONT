import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokensPath = resolve(process.cwd(), 'src/app/styles/tokens.css')

describe('chart token rules', () => {
  it('keeps chart tokens independent from the primary token', () => {
    const tokens = readFileSync(tokensPath, 'utf8')

    expect(tokens).not.toContain('--chart-1: var(--primary)')
    expect(tokens).toMatch(/--chart-1:\s*oklch\(/)
    expect(tokens).toMatch(/\.dark\s*\{[\s\S]*--chart-1:\s*oklch\(/)
  })
})
