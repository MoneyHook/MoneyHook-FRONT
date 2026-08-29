import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, relative, resolve } from 'node:path'

const allowedExtensions = new Set(['.css', '.svg', '.ts', '.tsx'])
const ignoredFragments = [
  'src/app/styles/tokens.css',
  'src/shared/api/generated/',
]

const rules = [
  {
    name: 'primitive color value',
    pattern: /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color-mix)\s*\(/i,
  },
  {
    name: 'Tailwind palette color',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  },
  {
    name: 'Tailwind arbitrary color',
    pattern:
      /\b(?:bg|text|border|ring|outline|fill|stroke)-\[(?:#|(?:rgb|hsl|oklch|oklab|lab|lch|color(?:-mix)?)\s*\()/i,
  },
  {
    name: 'fixed SVG color',
    pattern:
      /\b(?:fill|stroke)\s*=\s*["'](?!none["']|currentColor["']|var\()[^"']+["']/i,
  },
  {
    name: 'CSS named color',
    pattern:
      /(?:^|[;{])\s*(?:color|background(?:-color)?|border-color|fill|stroke)\s*:\s*(?:black|white|red|green|blue|orange|yellow|purple|pink|gray|grey)\b/i,
  },
]

function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry)
    return statSync(path).isDirectory() ? collectFiles(path) : [path]
  })
}

export function findSemanticColorViolations(rootDirectory) {
  const srcDirectory = resolve(rootDirectory, 'src')
  const files = collectFiles(srcDirectory).filter((path) => {
    const projectPath = relative(rootDirectory, path).replaceAll('\\', '/')
    return (
      allowedExtensions.has(extname(path)) &&
      !ignoredFragments.some((fragment) => projectPath.includes(fragment))
    )
  })

  return files.flatMap((path) => {
    const projectPath = relative(rootDirectory, path).replaceAll('\\', '/')
    return readFileSync(path, 'utf8')
      .split('\n')
      .flatMap((line, index) =>
        rules
          .filter((rule) => rule.pattern.test(line))
          .map((rule) => ({
            file: projectPath,
            line: index + 1,
            rule: rule.name,
            source: line.trim(),
          })),
      )
  })
}
