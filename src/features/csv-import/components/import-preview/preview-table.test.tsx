import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { TimelineTransaction } from '@/shared/api/generated/model/timelineTransaction'

import { PreviewTable } from './preview-table'

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({
    count,
    estimateSize,
  }: {
    count: number
    estimateSize: () => number
  }) => ({
    getTotalSize: () => count * estimateSize(),
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        size: estimateSize(),
        start: index * estimateSize(),
      })),
    measureElement: () => undefined,
  }),
}))

describe('PreviewTable', () => {
  it('highlights a duplicate candidate and shows its registered transaction in a dialog', () => {
    const row = {
      id: 0,
      sourceRowNumber: 2,
      source: [],
      date: '2026-09-28',
      name: 'CSVランチ',
      amount: '1200',
      categoryId: 'food',
      subcategoryId: 'lunch',
      paymentId: 'card',
      selected: true,
      errors: [],
    }
    const duplicateCandidates = new Map<number, TimelineTransaction[]>([
      [
        0,
        [
          {
            transaction_id: 'existing',
            transaction_name: '登録済みランチ',
            transaction_amount: 1200,
            transaction_sign: -1,
            transaction_date: '2026-09-28',
            category_id: 'food',
            category_name: '食費',
            sub_category_id: 'lunch',
            sub_category_name: '外食',
            fixed_flg: false,
            payment_id: 'card',
            payment_name: 'クレジットカード',
          },
        ],
      ],
    ])
    render(
      <PreviewTable
        categories={[
          {
            category_id: 'food',
            category_name: '食費',
            sub_category_list: [
              {
                sub_category_id: 'lunch',
                sub_category_name: '外食',
                enable: true,
              },
            ],
          },
        ]}
        dispatch={vi.fn()}
        duplicateCandidates={duplicateCandidates}
        payments={[{ payment_id: 'card', payment_name: 'クレジットカード' }]}
        rows={[row]}
      />,
    )

    expect(screen.getByText('CSVランチ').closest('[data-index]')).toHaveClass(
      'bg-warning/10',
    )
    fireEvent.click(
      screen.getByRole('button', { name: '2行目の重複候補を確認' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('登録済みランチ')
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '2026-09-28 ・ 食費 / 外食 ・ クレジットカード',
    )
  })
})
