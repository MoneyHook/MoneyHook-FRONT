import Papa from 'papaparse'

type Request = { file: File; encoding: 'auto' | 'utf-8' | 'shift-jis' }

self.onmessage = async (event: MessageEvent<Request>) => {
  const { file, encoding } = event.data
  try {
    const buffer = await file.arrayBuffer()
    const decode = (label: string, fatal = false) => new TextDecoder(label, { fatal }).decode(buffer).replace(/^\uFEFF/, '')
    let text: string
    let usedEncoding: 'utf-8' | 'shift-jis'
    if (encoding === 'shift-jis') {
      text = decode('shift_jis')
      usedEncoding = 'shift-jis'
    } else if (encoding === 'utf-8') {
      text = decode('utf-8', true)
      usedEncoding = 'utf-8'
    } else {
      try { text = decode('utf-8', true); usedEncoding = 'utf-8' } catch { text = decode('shift_jis'); usedEncoding = 'shift-jis' }
    }
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' })
    if (parsed.errors.length) throw new Error(parsed.errors[0].message)
    self.postMessage({ rows: parsed.data, encoding: usedEncoding })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'CSVを解析できませんでした。' })
  }
}
