import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { findSemanticColorViolations } from './semantic-color-rules.mjs'

function createFixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'moneyhooks-colors-'))
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(root, path)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, content)
  }
  return root
}

describe('semantic color rules', () => {
  it('allows semantic tokens and primitive values in tokens.css', () => {
    const root = createFixture({
      'src/app/styles/tokens.css': ':root { --primary: #123456; }',
      'src/example.tsx': '<div className="bg-primary text-foreground" />',
    })

    expect(findSemanticColorViolations(root)).toEqual([])
  })

  it('rejects raw and Tailwind palette colors outside tokens.css', () => {
    const root = createFixture({
      'src/example.tsx': '<div className="bg-red-500 text-[#fff]" />',
    })

    expect(findSemanticColorViolations(root)).toHaveLength(3)
  })
})
