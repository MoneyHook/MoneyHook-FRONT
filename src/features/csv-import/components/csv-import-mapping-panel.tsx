import { Ellipsis } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { displayColumnName, type DateFormat, type Encoding, type Mapping } from '../model/csv-import'
import { Field, SelectField } from './form-fields'

export function CsvImportMappingPanel({ dateFormat, encoding, file, headerRowIndex, headers, mapping, onDateFormatChange, onEncodingChange, onHeaderRowChange, onMappingChange, parsedEncoding, rows }: {
  dateFormat: DateFormat
  encoding: Encoding
  file: File | null
  headerRowIndex: number | null
  headers: string[]
  mapping: Mapping
  onDateFormatChange: (value: DateFormat) => void
  onEncodingChange: (value: Encoding) => void
  onHeaderRowChange: (value: number | null) => void
  onMappingChange: (field: keyof Mapping, value: number | null) => void
  parsedEncoding: string | null
  rows: string[][]
}) {
  return <aside className="grid content-start gap-4 rounded-2xl border bg-card p-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">列の指定</h2><p className="mt-1 text-sm text-muted-foreground">{file?.name}・{parsedEncoding?.toUpperCase()}として解析</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button aria-label="解析オプションを開く" size="icon" variant="ghost"><Ellipsis /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-72 p-3"><DropdownMenuLabel>解析オプション</DropdownMenuLabel><DropdownMenuSeparator /><div className="grid gap-3 px-1 py-2"><Field label="文字コード"><SelectField value={encoding} onValueChange={(value) => onEncodingChange(value as Encoding)}><option value="auto">自動</option><option value="utf-8">UTF-8</option><option value="shift-jis">Shift_JIS</option></SelectField></Field><Field label="日付形式"><SelectField value={dateFormat} onValueChange={(value) => onDateFormatChange(value as DateFormat)}><option value="auto">自動判定</option><option value="yyyy/mm/dd">YYYY/MM/DD</option><option value="yyyy-mm-dd">YYYY-MM-DD</option><option value="yyyymmdd">YYYYMMDD</option><option value="japanese">YYYY年M月D日</option></SelectField></Field></div></DropdownMenuContent></DropdownMenu></div>
    <Field label="ヘッダー行"><SelectField value={headerRowIndex === null ? 'none' : String(headerRowIndex)} onValueChange={(value) => onHeaderRowChange(value === 'none' ? null : Number(value))}><option value="none">ヘッダーなし</option>{rows.slice(0, 20).map((_, index) => <option key={index} value={index}>{index + 1}行目</option>)}</SelectField></Field>
    {(['date', 'name', 'amount'] as const).map((field) => <Field key={field} label={{ date: '日付', name: '取引名', amount: '金額' }[field]}><SelectField value={mapping[field] === null ? '' : String(mapping[field])} onValueChange={(value) => onMappingChange(field, value === '' ? null : Number(value))}><option value="">選択してください</option>{headers.map((_, index) => <option key={index} value={index}>{displayColumnName(headers, index)}</option>)}</SelectField></Field>)}
  </aside>
}
