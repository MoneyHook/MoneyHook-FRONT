import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createNewTransactionValues } from '../../model/new-transaction'
import { TransactionSelectionSheets } from './transaction-selection-sheets'

function createMocks() {
  return {
    confirmNewSubcategory: vi.fn<() => void>(),
    changeNewSubcategoryName: vi.fn<(name: string) => void>(),
  }
}

type Mocks = ReturnType<typeof createMocks>

function SubcategorySelectionHarness({
  errors = {},
  mocks,
}: {
  errors?: { subcategoryName?: string }
  mocks: Mocks
}) {
  const [newSubcategoryName, setNewSubcategoryName] = useState('')

  return (
    <TransactionSelectionSheets
      categories={[]}
      categorySelectionStep="subcategory"
      changeNewSubcategoryName={(name) => {
        mocks.changeNewSubcategoryName(name)
        setNewSubcategoryName(name)
      }}
      confirmNewSubcategory={mocks.confirmNewSubcategory}
      enabledSubcategories={[]}
      errors={errors}
      form={{ ...createNewTransactionValues(), categoryId: 'food' }}
      frequentTransactions={[]}
      isEdit={false}
      newSubcategoryName={newSubcategoryName}
      paymentTypeNames={new Map()}
      payments={[]}
      selectedCategory={{
        category_id: 'food',
        category_name: '食費',
        sub_category_list: [],
      }}
      selectCategory={vi.fn()}
      selectFrequentTransaction={vi.fn()}
      selectionSheet="category"
      setCategorySelectionStep={vi.fn()}
      setSelectionSheet={vi.fn()}
      setValue={vi.fn()}
    />
  )
}

function renderSubcategorySelection(errors: { subcategoryName?: string } = {}) {
  const mocks = createMocks()

  return {
    ...render(<SubcategorySelectionHarness errors={errors} mocks={mocks} />),
    ...mocks,
  }
}

describe('TransactionSelectionSheets', () => {
  it('replaces the new subcategory action with an inline input and register button', async () => {
    const user = userEvent.setup()
    const { changeNewSubcategoryName, confirmNewSubcategory } =
      renderSubcategorySelection()

    await user.click(
      screen.getByRole('button', { name: '新しいサブカテゴリを作成' }),
    )

    expect(changeNewSubcategoryName).toHaveBeenCalledWith('')
    expect(
      screen.queryByRole('button', { name: '新しいサブカテゴリを作成' }),
    ).not.toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'サブカテゴリ名' })
    expect(input).toHaveFocus()
    const registerButton = screen.getByRole('button', { name: '登録' })
    expect(registerButton).toBeVisible()
    expect(input.parentElement).toContainElement(registerButton)

    await user.type(input, 'カフェ')
    expect(changeNewSubcategoryName).toHaveBeenLastCalledWith('カフェ')

    await user.click(registerButton)
    expect(confirmNewSubcategory).toHaveBeenCalledOnce()
  })

  it('shows the subcategory validation error below the inline input', async () => {
    const user = userEvent.setup()
    renderSubcategorySelection({
      subcategoryName: 'サブカテゴリ名は1〜16文字で入力してください。',
    })

    await user.click(
      screen.getByRole('button', { name: '新しいサブカテゴリを作成' }),
    )

    expect(
      screen.getByText('サブカテゴリ名は1〜16文字で入力してください。'),
    ).toBeVisible()
  })
})
