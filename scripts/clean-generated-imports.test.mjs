import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

import { cleanGeneratedImports } from './clean-generated-imports.mjs'

it('removes unused schema imports while preserving aliases, side effects, and exports, and is repeatable', () => {
  const directory = mkdtempSync(join(tmpdir(), 'moneyhooks-generated-'))
  try {
    writeFileSync(
      join(directory, 'types.ts'),
      'export type DateString = string;\nexport type MonthParameter = string;\n',
    )
    const target = join(directory, 'params.ts')
    writeFileSync(
      target,
      `// Generated schema\nimport type { DateString, MonthParameter as Month } from './types';\nimport './side-effect';\nexport type Params = { month: Month };\nexport type { DateString } from './types';\n`,
    )
    writeFileSync(join(directory, 'side-effect.ts'), 'export {};\n')
    cleanGeneratedImports(directory)
    const cleaned = readFileSync(target, 'utf8')
    expect(cleaned).not.toMatch(/import type.*DateString/)
    expect(cleaned).toContain('MonthParameter as Month')
    expect(cleaned).toContain("import './side-effect'")
    expect(cleaned).toContain("export type { DateString } from './types'")
    expect(cleaned).toContain('month: Month')
    expect(cleaned).toContain('// Generated schema')
    cleanGeneratedImports(directory)
    expect(readFileSync(target, 'utf8')).toBe(cleaned)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
