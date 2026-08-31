import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MonthPicker } from './month-picker'

function renderMonthPicker(
  monthInput = '2026-08',
  maxMonth = '2026-08',
  onChange = vi.fn(),
) {
  render(
    <MonthPicker
      maxMonth={maxMonth}
      monthInput={monthInput}
      monthLabel={`${monthInput.slice(0, 4)}年${Number(monthInput.slice(5, 7))}月`}
      onChange={onChange}
    />,
  )

  return onChange
}

describe('MonthPicker', () => {
  it('opens the month grid and disables future months', () => {
    renderMonthPicker()

    fireEvent.click(screen.getByRole('button', { name: '対象月' }))

    expect(screen.getByText('2026年')).toBeVisible()
    expect(
      screen.getByRole('button', { name: '2026年8月（選択中）' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '2026年9月' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '2027年を表示' })).toBeDisabled()
  })

  it('navigates years, selects a month, and closes the popover', () => {
    const onChange = renderMonthPicker('2026-08', '2026-08')

    fireEvent.click(screen.getByRole('button', { name: '対象月' }))
    fireEvent.click(screen.getByRole('button', { name: '2025年を表示' }))

    expect(screen.getByText('2025年')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '2025年12月' }))

    expect(onChange).toHaveBeenCalledWith('2025-12-01')
    expect(screen.queryByText('2025年')).not.toBeInTheDocument()
  })

  it('offers a shortcut back to the current month', () => {
    const onChange = renderMonthPicker('2024-08', '2026-08')

    fireEvent.click(screen.getByRole('button', { name: '対象月' }))
    fireEvent.click(screen.getByRole('button', { name: '今月を選択' }))

    expect(onChange).toHaveBeenCalledWith('2026-08-01')
    expect(screen.queryByRole('button', { name: '今月を選択' })).not.toBeInTheDocument()
  })

  it('closes with Escape and restores focus to the trigger', async () => {
    renderMonthPicker()
    const trigger = screen.getByRole('button', { name: '対象月' })

    trigger.focus()
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('button', { name: '今月を選択' }), { key: 'Escape' })

    expect(screen.queryByRole('button', { name: '今月を選択' })).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
