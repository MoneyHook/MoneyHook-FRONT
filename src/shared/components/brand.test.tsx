import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Brand } from './brand'

describe('Brand', () => {
  it('links to the root and uses the home icon as a decorative logo', () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'MoneyHooksのホームへ' }),
    ).toHaveAttribute('href', '/')

    const logo = screen.getByAltText('')
    expect(logo).toHaveAttribute('src', '/home-icon.svg')
    expect(logo).toHaveAttribute('alt', '')
  })
})
