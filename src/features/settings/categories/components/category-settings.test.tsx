import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CategorySettings } from './category-settings'

const { setVisibility, useCategorySettings } = vi.hoisted(() => ({
  setVisibility: vi.fn(),
  useCategorySettings: vi.fn(),
}))

vi.mock('../api/use-category-settings', () => ({ useCategorySettings }))

type Subcategory = {
  sub_category_id: string
  sub_category_name: string
  enable: boolean
}

function categoryQuery(subcategories: Subcategory[]) {
  return {
    data: {
      status: 200 as const,
      data: {
        category_list: [
          {
            category_id: '1',
            category_name: '食費',
            sub_category_list: subcategories,
          },
        ],
      },
    },
    isError: false,
    isPending: false,
  }
}

function categoriesQuery(
  categories: Array<{
    category_id: string
    category_name: string
    sub_category_list: Subcategory[]
  }>,
) {
  return {
    data: { status: 200 as const, data: { category_list: categories } },
    isError: false,
    isPending: false,
  }
}

describe('CategorySettings', () => {
  beforeEach(() => {
    setVisibility.mockReset()
    setVisibility.mockResolvedValue(undefined)
  })

  it('keeps subcategories collapsed until their category is opened', async () => {
    useCategorySettings.mockReturnValue({
      categoriesQuery: categoryQuery([
        { sub_category_id: '10', sub_category_name: '外食', enable: true },
      ]),
      setVisibility,
    })
    const user = userEvent.setup()

    render(<CategorySettings />)

    const trigger = screen.getByRole('button', { name: '食費' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('外食')).not.toBeInTheDocument()

    await user.click(trigger)

    expect(screen.getByText('外食')).toBeInTheDocument()
  })

  it('does not allow the final visible subcategory in a category to be hidden', async () => {
    useCategorySettings.mockReturnValue({
      categoriesQuery: categoriesQuery([
        {
          category_id: '1',
          category_name: '食費',
          sub_category_list: [
            { sub_category_id: '10', sub_category_name: '外食', enable: true },
          ],
        },
        {
          category_id: '2',
          category_name: '交通費',
          sub_category_list: [
            {
              sub_category_id: '20',
              sub_category_name: '電車',
              enable: true,
            },
          ],
        },
      ]),
      setVisibility,
    })
    const user = userEvent.setup()

    render(<CategorySettings />)
    await user.click(screen.getByRole('button', { name: '食費' }))

    expect(screen.getByRole('checkbox', { name: '表示する' })).toBeDisabled()
  })

  it('allows a visible subcategory to be hidden when another remains visible', async () => {
    useCategorySettings.mockReturnValue({
      categoriesQuery: categoryQuery([
        { sub_category_id: '10', sub_category_name: '外食', enable: true },
        { sub_category_id: '11', sub_category_name: '自炊', enable: true },
      ]),
      setVisibility,
    })
    const user = userEvent.setup()

    render(<CategorySettings />)
    await user.click(screen.getByRole('button', { name: '食費' }))
    await user.click(screen.getAllByRole('checkbox', { name: '表示する' })[0])

    expect(setVisibility).toHaveBeenCalledWith('10', false)
  })
})
