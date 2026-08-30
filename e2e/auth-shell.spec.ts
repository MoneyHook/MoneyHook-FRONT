import { expect, test } from '@playwright/test'

function appUrl(path: string) {
  return new RegExp(`/app/${path}(?:\\?.*)?$`)
}

async function completeGoogleLogin(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Googleで続行' }).click()
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

  const firebaseUser = await page.evaluate(async () => {
    const { getFirebaseAuth } = await import('/src/shared/lib/firebase.ts')
    const user = getFirebaseAuth().currentUser
    return {
      uid: user?.uid ?? null,
      displayName: user?.displayName ?? null,
      email: user?.email ?? null,
      providerId: user?.providerData[0]?.providerId ?? null,
    }
  })
  expect(firebaseUser).toEqual({
    uid: 'a77a6e94-6aa2-47ea-87dd-129f580fb669',
    displayName: '開発ユーザー',
    email: 'developer@example.com',
    providerId: 'google.com',
  })

  const response = await callAuthenticatedCategoryApi(page)

  expect(response.status, response.body).toBe(200)
  expect(response.body).toContain('ラーメン巡り')

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

  await page.goto('/login?redirect=%2Fapp%2Fsettings')
  await expect(page).toHaveURL(appUrl('settings'))
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
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
    const link = page.getByRole('link', { name: label }).first()
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
