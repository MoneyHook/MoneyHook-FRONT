import { expect, test } from '@playwright/test'

function appUrl(path: string) {
  return new RegExp(`/app/${path}(?:\\?.*)?$`)
}

async function completeGoogleLogin(page: import('@playwright/test').Page) {
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Googleで続行' }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForEvent('close')
  await expect(page).toHaveURL(appUrl('(?:home|analysis|settings)'))
}

async function signInWithEmulator(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await expect(
    page.getByRole('heading', { name: /MoneyHooksへ\s*ログイン/ }),
  ).toBeVisible()
  await completeGoogleLogin(page)

  await expect(page).toHaveURL(appUrl('home'))
  await expect(page.getByRole('heading', { name: 'ホーム' })).toBeVisible()
}

async function callAuthenticatedCategoryApi(
  page: import('@playwright/test').Page,
) {
  return page.evaluate(async () => {
    const firebaseModulePath = '/src/shared/lib/firebase.ts'
    const { getFirebaseAuth } = await import(firebaseModulePath)
    const token = await getFirebaseAuth().currentUser?.getIdToken()
    const response = await fetch(
      'http://localhost:8080/api/category/getCategoryWithSubCategoryList',
      {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      },
    )
    return { status: response.status, body: await response.text() }
  })
}

test('accepts a Google emulator token at the real API', async ({ page }) => {
  const unauthorizedResponse = await page.request.get(
    'http://localhost:8080/api/category/getCategoryList',
  )
  expect(unauthorizedResponse.status()).toBe(401)

  await signInWithEmulator(page)

  const response = await callAuthenticatedCategoryApi(page)

  expect(response.status, response.body).toBe(200)

  await page.getByRole('button', { name: 'アカウントメニューを開く' }).click()
  await page.getByRole('menuitem', { name: 'ログアウト' }).click()
  await expect(page).toHaveURL(/\/login(?:\?redirect=.*)?$/)
  await expect(page.getByRole('button', { name: 'Googleで続行' })).toBeVisible()
})

test('protects app routes and restores a deep link after login', async ({ page }) => {
  await page.goto('/app/analysis')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await completeGoogleLogin(page)

  await expect(page).toHaveURL(appUrl('analysis'))
  await expect(page.getByRole('heading', { name: '分析' })).toBeVisible()

  for (const tab of ['概要', 'カテゴリ', '固定費', '支払い方法']) {
    await expect(page.getByRole('link', { name: tab, exact: true })).toBeVisible()
  }
  await page.getByRole('link', { name: 'カテゴリ', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/analysis\?view=categories$/)
  await expect(page.getByRole('heading', { name: 'カテゴリ別支出' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /の内訳$/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'カテゴリ別支出' })).toBeVisible()
  await page.getByRole('link', { name: '固定費', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/analysis\?view=fixed$/)
  await expect(page.getByRole('heading', { name: '固定費サマリー' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '固定費のカテゴリ別推移' }),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '固定費サマリー' })).toBeVisible()
  await page.getByRole('link', { name: '支払い方法', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '支払い方法サマリー' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '支払い方法別の支出推移' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '支払い方法の詳細' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: '支払い方法サマリー' }),
  ).toBeVisible()
  await page.getByRole('link', { name: '概要', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'サマリー' })).toBeVisible()

  await page.goto('/login?redirect=%2Fapp%2Fsettings')
  await expect(page).toHaveURL(appUrl('settings'))
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
})

test('opens each settings summary card in its dedicated management page', async ({ page }) => {
  await signInWithEmulator(page)
  await page.goto('/app/settings')

  for (const [cardName, path, heading] of [
    ['アカウントの設定を開く', 'settings/account', 'アカウント'],
    ['予算の設定を開く', 'settings/budget', '予算'],
    ['支払い方法の設定を開く', 'settings/payments', '支払い方法'],
    ['収支の自動入力の設定を開く', 'settings/recurring-transactions', '収支の自動入力'],
    ['表示の設定を開く', 'settings/appearance', '表示'],
  ] as const) {
    await page.getByRole('link', { name: cardName }).click()
    await expect(page).toHaveURL(appUrl(path))
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await page.getByRole('link', { name: '設定へ戻る' }).click()
    await expect(page).toHaveURL(appUrl('settings'))
  }
})

test('keeps the analysis width stable at 1024px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await signInWithEmulator(page)
  await page.goto('/app/analysis?view=overview')
  await expect(page.getByRole('heading', { name: 'サマリー' })).toBeVisible()

  const analysisTabs = page
    .getByRole('navigation', { name: '分析表示' })
    .getByRole('link')
  const overviewTabWidths = await analysisTabs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  )

  await page.getByRole('link', { name: '固定費', exact: true }).click()
  await expect(page.getByRole('heading', { name: '固定費サマリー' })).toBeVisible()

  const fixedTabWidths = await analysisTabs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  )
  const layout = await page.evaluate(() => {
    const main = document.querySelector('#main-content')
    const table = document.querySelector('table')
    const tableScroller = table?.parentElement

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      mainRight: main?.getBoundingClientRect().right ?? 0,
      tableClientWidth: tableScroller?.clientWidth ?? 0,
      tableScrollWidth: tableScroller?.scrollWidth ?? 0,
      tableOverflowX: tableScroller
        ? getComputedStyle(tableScroller).overflowX
        : '',
    }
  })

  expect(fixedTabWidths).toEqual(overviewTabWidths)
  expect(layout.documentWidth).toBe(layout.viewportWidth)
  expect(layout.mainRight).toBeLessThanOrEqual(layout.viewportWidth)
  expect(layout.tableScrollWidth).toBeGreaterThan(layout.tableClientWidth)
  expect(layout.tableOverflowX).toBe('auto')

  await page.getByRole('link', { name: '支払い方法', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: '支払い方法サマリー' }),
  ).toBeVisible()
  const paymentTabWidths = await analysisTabs.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  )
  const paymentLayout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))

  expect(paymentTabWidths).toEqual(overviewTabWidths)
  expect(paymentLayout.documentWidth).toBe(paymentLayout.viewportWidth)

  await page.getByRole('button', { name: 'サイドバーを切り替える' }).last().click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    1024,
  )
})

test('switches between desktop sidebar and mobile bottom navigation at 769px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await signInWithEmulator(page)

  const desktopNavigation = page.locator('[data-slot="sidebar"]').first()
  await expect(desktopNavigation).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toBeHidden()

  for (const [label, path] of [
    ['取引', 'transactions'],
    ['分析', 'analysis'],
    ['設定', 'settings'],
    ['ホーム', 'home'],
  ] as const) {
    const link = page.getByRole('link', { name: label, exact: true }).first()
    await link.click()
    await expect(page).toHaveURL(appUrl(path))
    await expect(page.getByRole('heading', { name: label })).toBeVisible()
    await expect(link).toHaveAttribute('aria-current', 'page')
  }

  await page.goBack()
  await expect(page).toHaveURL(appUrl('settings'))
  await page.goForward()
  await expect(page).toHaveURL(appUrl('home'))

  await page.setViewportSize({ width: 768, height: 900 })
  const mobileNavigation = page.getByRole('navigation', {
    name: 'メインナビゲーション',
  })
  await expect(mobileNavigation).toBeVisible()
  await expect(desktopNavigation).toBeHidden()

  await page.getByRole('link', { name: '取引' }).last().click()
  await expect(page).toHaveURL(appUrl('transactions'))
  await page.reload()
  await expect(page.getByRole('heading', { name: '取引', exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(mobileNavigation).toBeVisible()
  for (const link of await mobileNavigation.getByRole('link').all()) {
    const box = await link.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }

  await page.setViewportSize({ width: 769, height: 900 })
  await expect(desktopNavigation).toBeVisible()
  await expect(mobileNavigation).toBeHidden()

  await page.goto('/app/unknown')
  await expect(desktopNavigation).toBeVisible()
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible()

  await page.goto('/app/home')
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const skipLink = page.getByRole('link', { name: '本文へ移動' })
  let reachedSkipLink = false
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab')
    if (await skipLink.evaluate((element) => element === document.activeElement)) {
      reachedSkipLink = true
      break
    }
  }
  expect(reachedSkipLink).toBe(true)
  await skipLink.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('rejects an external login redirect and provides a public 404', async ({ page }) => {
  await page.goto('/login?redirect=https://example.com/app/home')
  await expect(page.getByRole('button', { name: 'Googleで続行' })).toBeVisible()

  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible()
})
