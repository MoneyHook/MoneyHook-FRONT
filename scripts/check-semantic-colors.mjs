import { findSemanticColorViolations } from './semantic-color-rules.mjs'

const violations = findSemanticColorViolations(process.cwd())

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} ${violation.rule}: ${violation.source}`,
    )
  }
  process.exitCode = 1
} else {
  console.log('Semantic color check passed.')
}
