import { expect, test, type Page } from '@playwright/test'

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('admin123')
  await page.getByRole('button', { name: '登录' }).click()
  await expect(page).toHaveURL('http://localhost:3000/')
  await expect(page.getByText('欢迎回来')).toBeVisible()
}

test('unauthenticated root redirects to login', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2F/)
  await expect(page.getByText('养老院管理系统')).toBeVisible()
})

test('login shows error on invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('wrong-password')
  await page.getByRole('button', { name: '登录' }).click()

  await expect(page.getByText('用户名或密码错误')).toBeVisible()
})

test('authenticated user can open root and equipment status compatibility routes', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/equipment/status')
  await expect(page.getByRole('heading', { name: '设备状态' })).toBeVisible()
  await expect(page.getByText('实时设备状态监控')).toBeVisible()

  await page.goto('/devices/status')
  await expect(page.getByRole('heading', { name: '设备状态' })).toBeVisible()
  await expect(page.getByText('实时设备状态监控')).toBeVisible()
})

test('authenticated user can open health compatibility routes and metric pages', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/health')
  await expect(page.getByRole('heading', { name: '健康监测' })).toBeVisible()
  await expect(page.getByText('实时监测').first()).toBeVisible()

  await page.goto('/health-monitoring')
  await expect(page.getByRole('heading', { name: '健康监测' })).toBeVisible()
  await expect(page.getByText('实时监测').first()).toBeVisible()

  await page.goto('/health/bp')
  await expect(page.getByRole('heading', { name: '血压管理' })).toBeVisible()
  await expect(page.getByText('重点血压记录')).toBeVisible()

  await page.goto('/health/not-a-metric')
  await expect(page.locator('body')).toContainText('404')
  await expect(page.locator('body')).toContainText('This page could not be found')
})

test('authenticated user can open analytics compatibility routes and switch report periods', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/analytics')
  await expect(page.getByRole('heading', { name: '数据分析' })).toBeVisible()
  await expect(page.getByText('运营数据看板').first()).toBeVisible()

  await page.goto('/data-dashboard')
  await expect(page.getByRole('heading', { name: '数据分析' })).toBeVisible()
  await expect(page.getByText('运营数据看板').first()).toBeVisible()

  await page.goto('/analytics/report')
  await expect(page.getByRole('heading', { name: 'AI 报表中心' })).toBeVisible()
  await expect(page.getByText('AI 院长周报草稿')).toBeVisible()
  await expect(page.getByText('近 7 天')).toBeVisible()

  await page.getByRole('button', { name: '月报' }).click()
  await expect(page.getByText('AI 月度经营摘要')).toBeVisible()
  await expect(page.getByText('近 30 天')).toBeVisible()

  await page.getByRole('button', { name: '周报' }).click()
  await expect(page.getByText('AI 院长周报草稿')).toBeVisible()
  await expect(page.getByText('近 7 天')).toBeVisible()
})

test('ai assistant preserves tracking context into child routes', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/ai-assistant?source=equipment-status&entityId=equipment-status-board&entityName=%E8%AE%BE%E5%A4%87%E7%8A%B6%E6%80%81&focus=equipment-risk&target=logs')

  await expect(page.getByRole('heading', { name: 'AI 运营入口' })).toBeVisible()
  await expect(page.getByText('Tracked Context')).toBeVisible()
  await expect(page.getByText('设备状态').first()).toBeVisible()

  const continueLink = page.getByRole('link', { name: '按当前来源继续追踪' })
  await expect(continueLink).toHaveAttribute('href', /\/ai-assistant\/logs/)
  await continueLink.click()

  await expect(page).toHaveURL(/\/ai-assistant\/logs\?.*source=equipment-status/)
})