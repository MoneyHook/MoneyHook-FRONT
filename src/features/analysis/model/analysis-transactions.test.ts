import { expect, it } from 'vitest'

import { compareAnalysisTransactions } from './analysis-transactions'

it('sorts dates, times and numeric IDs descending, with unknown times last', () => {
  const rows = [
    { id: '2', date: '2026-09-01', time: '10:00' },
    { id: '99', date: '2026-09-01', time: null },
    { id: '10', date: '2026-09-01', time: '10:00' },
    { id: '1', date: '2026-09-02', time: null },
    { id: '3', date: '2026-09-01', time: '11:00' },
  ]
  expect(
    [...rows].sort(compareAnalysisTransactions).map((row) => row.id),
  ).toEqual(['1', '3', '10', '2', '99'])
})
