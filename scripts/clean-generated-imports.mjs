import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Use TypeScript's symbol-aware removal rather than editing generated schemas
// or matching import names with a regular expression. Keep used imports/order.
export function cleanGeneratedImports(directory) {
  const fileNames = ts.sys.readDirectory(resolve(directory), ['.ts'])
  const options = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  }
  const service = ts.createLanguageService({
    getCompilationSettings: () => options,
    getScriptFileNames: () => fileNames,
    getScriptVersion: () => '0',
    getScriptSnapshot: (file) => {
      const text = ts.sys.readFile(file)
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text)
    },
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  })
  try {
    const changes = fileNames.flatMap((fileName) =>
      service.organizeImports(
        {
          type: 'file',
          fileName,
          mode: ts.OrganizeImportsMode.RemoveUnused,
        },
        { indentSize: 2, convertTabsToSpaces: true, newLineCharacter: '\n' },
        {},
      ),
    )
    for (const change of changes) {
      let source = readFileSync(change.fileName, 'utf8')
      for (const edit of [...change.textChanges].sort((a, b) => b.span.start - a.span.start)) {
        source =
          source.slice(0, edit.span.start) +
          edit.newText +
          source.slice(edit.span.start + edit.span.length)
      }
      writeFileSync(change.fileName, source)
    }
  } finally {
    service.dispose()
  }
}

const scriptPath = fileURLToPath(import.meta.url)
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  cleanGeneratedImports(resolve(dirname(scriptPath), '../src/shared/api/generated/model'))
}
