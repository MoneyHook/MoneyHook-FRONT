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
