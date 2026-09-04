import { describe, expect, it } from 'vitest'

import {
  createImportRows,
  displayColumnName,
  inferHeaderRow,
  normalizeAmount,
  normalizeDate,
  toTransactionList,
} from './csv-import'

const categories = [{
  category_id: 'food',
  category_name: '食費',
  sub_category_list: [{ enable: true, sub_category_id: 'groceries', sub_category_name: '食料品' }],
}]

const defaults = { categoryId: 'food', paymentId: 'card', sign: 'expense' as const, subcategoryId: 'groceries' }

describe('CSV import model', () => {
  it('recognizes the supported date formats and rejects invalid calendar dates', () => {
    expect(normalizeDate('2026/09/01', 'auto')).toBe('2026-09-01')
    expect(normalizeDate('2026-09-01', 'auto')).toBe('2026-09-01')
    expect(normalizeDate('20260901', 'auto')).toBe('2026-09-01')
    expect(normalizeDate('2026年9月1日', 'auto')).toBe('2026-09-01')
    expect(normalizeDate('2026/02/29', 'auto')).toBeNull()
  })

  it('normalizes common Japanese amount separators but does not accept decimals or negatives', () => {
    expect(normalizeAmount('￥ 3，980')).toBe('3980')
    expect(normalizeAmount('¥ 3,980')).toBe('3980')
    expect(normalizeAmount('-3980')).toBeNull()
    expect(normalizeAmount('3980.5')).toBeNull()
  })

  it('keeps duplicate column labels distinguishable and finds a header after preamble rows', () => {
    expect(displayColumnName(['日付', '金額', '金額'], 1)).toBe('金額（2列目）')
    expect(inferHeaderRow([['楽天カード利用明細'], ['2026年8月分'], ['利用日', '利用店名', '利用金額'], ['2026/08/01', 'Amazon', '3980']])).toBe(2)
  })

  it('creates editable rows, marks invalid source data as excluded, and emits the legacy batch payload', () => {
    const rows = createImportRows({
      rows: [['日付', '名称', '金額'], ['2026/09/01', 'Amazon', '3,980'], ['invalid', '', '0']],
      headerRowIndex: 0,
      mapping: { amount: 2, date: 0, name: 1 },
      defaults,
      dateFormat: 'auto',
      categories,
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ amount: '3980', date: '2026-09-01', selected: true })
    expect(rows[1].selected).toBe(false)
    expect(rows[1].errors).toHaveLength(3)
    expect(toTransactionList(rows, defaults)).toEqual({
      transaction_list: [{
        category_id: 'food', fixed_flg: false, payment_id: 'card', sub_category_id: 'groceries', transaction_amount: 3980,
        transaction_date: '2026-09-01', transaction_name: 'Amazon', transaction_sign: -1,
      }],
    })
  })
})
