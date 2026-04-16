import { expect, test, type Locator, type Page } from '@playwright/test'

async function suppressDevOverlays(page: Page) {
  await page.evaluate(() => {
    if (document.getElementById('pw-hide-dev-overlays')) {
      return
    }

    const style = document.createElement('style')
    style.id = 'pw-hide-dev-overlays'
    style.textContent = `
      [aria-label="Open Next.js Dev Tools"],
      nextjs-portal,
      [data-next-badge-root],
      [data-next-mark],
      [data-nextjs-dev-tools-button],
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `

    document.head.appendChild(style)
  })
}

async function expectClippedSnapshot(locator: Locator, snapshotName: string, maxDiffPixels = 160) {
  await expect(locator).toBeVisible()
  await suppressDevOverlays(locator.page())
  const image = await locator.screenshot({
    animations: 'disabled',
    caret: 'hide',
  })

  expect(image).toMatchSnapshot(snapshotName, { maxDiffPixels })
}

async function expectPageClipSnapshot(page: Page, locator: Locator, snapshotName: string, maxDiffPixels = 160) {
  await expect(locator).toBeVisible()
  await suppressDevOverlays(page)
  const bounds = await locator.boundingBox()
  expect(bounds).not.toBeNull()

  const image = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    clip: {
      x: Math.floor(bounds!.x),
      y: Math.floor(bounds!.y),
      width: Math.ceil(bounds!.width),
      height: Math.ceil(bounds!.height),
    },
  })

  expect(image).toMatchSnapshot(snapshotName, { maxDiffPixels })
}

async function loginAsAdmin(page: Page, tenantId = 'tenant-demo') {
  await page.goto('/login')
  await page.getByLabel('租户').selectOption(tenantId)
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('admin123')
  await page.getByRole('button', { name: /登\s*录/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
}

async function loginAsManager(page: Page, tenantId = 'tenant-demo') {
  await page.goto('/login')
  await page.getByLabel('租户').selectOption(tenantId)
  await page.getByPlaceholder('请输入用户名').fill('manager')
  await page.getByPlaceholder('请输入密码').fill('manager123')
  await page.getByRole('button', { name: /登\s*录/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
}

function trackSyncExternalStoreLoopSignals(page: Page) {
  const signals: string[] = []
  const pattern = /getSnapshot should be cached|Maximum update depth exceeded/i

  page.on('console', message => {
    if ((message.type() === 'warning' || message.type() === 'error') && pattern.test(message.text())) {
      signals.push(`${message.type()}: ${message.text()}`)
    }
  })

  page.on('pageerror', error => {
    if (pattern.test(error.message)) {
      signals.push(`pageerror: ${error.message}`)
    }
  })

  return signals
}

function trackUnhandledWorkflowSignals(page: Page) {
  const signals: string[] = []
  const pattern = /unhandledRejection|workflow request failed|ai request failed/i

  page.on('console', message => {
    if ((message.type() === 'warning' || message.type() === 'error') && pattern.test(message.text())) {
      signals.push(`${message.type()}: ${message.text()}`)
    }
  })

  page.on('pageerror', error => {
    if (pattern.test(error.message)) {
      signals.push(`pageerror: ${error.message}`)
    }
  })

  return signals
}

test('unauthenticated root redirects to login', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login\?callbackUrl=%2F/)
  await expect(page.getByText('智慧养老管理系统')).toBeVisible()
})

test('login shows error on invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('租户').selectOption('tenant-demo')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('wrong-password')
  await page.getByRole('button', { name: /登\s*录/ }).click()

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

test('desktop navbar hover reveals first-level dropdown', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const navButton = page.getByRole('button', { name: '长者照护' })
  await expect(navButton).toBeVisible()
  await navButton.hover()

  await expect(page.locator('.navbar-dropdown').getByText('机构养老', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '入住建档' })).toBeVisible()
  await expect(page.getByRole('link', { name: '健康档案' })).toBeVisible()
})

test('desktop ltci navbar groups all long-term-care modules under one menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const navButton = page.getByRole('button', { name: '评定与长护险' })
  await expect(navButton).toBeVisible()
  await navButton.hover()

  await expect(page.getByText('认定受理', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '个案评定中心' })).toBeVisible()
  await expect(page.getByRole('link', { name: '评定标准配置' })).toBeVisible()
  await expect(page.getByRole('link', { name: '认定方案模板' })).toBeVisible()
})

test('desktop first-level dropdown keeps visual grouping stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const navButton = page.getByRole('button', { name: '长者照护' })
  await expect(navButton).toBeVisible()
  await navButton.hover()

  const dropdown = page.locator('.navbar-dropdown').first()
  await expect(dropdown.getByText('机构养老', { exact: true })).toBeVisible()
  await expect(dropdown.getByText('居家养老', { exact: true })).toBeVisible()

  await expectPageClipSnapshot(page, dropdown, 'navbar-first-level-dropdown-desktop.png', 120)
})

test('mid-width navbar moves items into more dropdown and hover reveals overflow links', async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 1000 })
  await loginAsAdmin(page)

  const moreButton = page.getByRole('button', { name: '更多' })
  await expect(moreButton).toBeVisible()
  await moreButton.hover()

  const overflowDropdown = page.locator('.navbar-overflow-dropdown')
  await expect(overflowDropdown.getByText('通知服务', { exact: true })).toBeVisible()
  await expect(overflowDropdown.getByRole('link', { name: '通知中心' })).toBeVisible()
  await expect(overflowDropdown.getByText('AI运营', { exact: true })).toBeVisible()
})

test('mid-width more dropdown scrolls and auto-reveals the active overflow item', async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 700 })
  await loginAsAdmin(page)

  await page.goto('/notifications')
  const moreButton = page.getByRole('button', { name: '更多' })
  await expect(moreButton).toBeVisible()
  await moreButton.hover()

  const overflowDropdown = page.locator('.navbar-overflow-dropdown')
  await expect(overflowDropdown).toBeVisible()
  await expect(overflowDropdown).toHaveClass(/show-bottom-fade/)

  const activeOverflowItem = overflowDropdown.locator('.navbar-dropdown-item.is-active').first()
  await expect(activeOverflowItem).toContainText('通知中心')

  const scrollState = await overflowDropdown.evaluate((element) => ({
    scrollTop: element.scrollTop,
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }))

  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight)
  expect(scrollState.scrollTop).toBeGreaterThan(0)
})

test('mid-width more dropdown supports keyboard navigation keys', async ({ page }) => {
  await page.setViewportSize({ width: 920, height: 700 })
  await loginAsAdmin(page)

  const moreButton = page.getByRole('button', { name: '更多' })
  await expect(moreButton).toBeVisible()
  await moreButton.focus()

  await page.keyboard.press('ArrowDown')
  const overflowDropdown = page.locator('.navbar-overflow-dropdown')
  await expect(overflowDropdown).toBeVisible()

  await expect(page.locator('.navbar-overflow-dropdown .navbar-dropdown-item:focus')).toContainText('设备监控')

  await page.keyboard.press('End')
  await expect(page.locator('.navbar-overflow-dropdown .navbar-dropdown-item:focus')).toContainText('AI助手')

  await page.keyboard.press('Home')
  await expect(page.locator('.navbar-overflow-dropdown .navbar-dropdown-item:focus')).toContainText('设备监控')

  await page.keyboard.press('PageDown')
  await expect(page.locator('.navbar-overflow-dropdown .navbar-dropdown-item:focus')).not.toContainText('设备监控')

  await page.keyboard.press('Escape')
  await expect(overflowDropdown).not.toBeVisible()
  await expect(moreButton).toBeFocused()

  await moreButton.hover()
  const overflowDropdownForSnapshot = page.locator('.navbar-overflow-dropdown')
  await expect(overflowDropdownForSnapshot).toBeVisible()

  await page.addStyleTag({
    content: `
      #navbar-overflow-dropdown {
        scrollbar-width: none !important;
        max-height: none !important;
        overflow: hidden !important;
      }
      #navbar-overflow-dropdown::-webkit-scrollbar {
        display: none !important;
      }
      #navbar-overflow-dropdown .navbar-overflow-fade {
        display: none !important;
      }
      #navbar-overflow-dropdown .navbar-dropdown-item:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `,
  })

  await expectClippedSnapshot(overflowDropdownForSnapshot, 'navbar-overflow-dropdown-mid-width.png', 320)
})

test('mobile navbar uses drawer navigation at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginAsAdmin(page)

  const hamburger = page.getByRole('button', { name: '打开菜单' })
  await expect(hamburger).toBeVisible()
  await hamburger.click()

  await expect(page.getByRole('dialog', { name: '主导航菜单' })).toBeVisible()
  await page.getByRole('button', { name: '长者照护' }).click()
  await page.getByRole('link', { name: '健康档案' }).click()

  await expect(page).toHaveURL(/\/elderly\/health/)
  await expect(page.getByRole('heading', { name: '健康档案' })).toBeVisible()
})

test('mobile drawer keeps visual layout stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginAsAdmin(page)

  const hamburger = page.getByRole('button', { name: '打开菜单' })
  await expect(hamburger).toBeVisible()
  await hamburger.click()

  const drawer = page.locator('.mobile-drawer-panel')
  await expect(drawer).toBeVisible()
  await page.getByRole('button', { name: '长者照护' }).click()
  await expect(drawer.getByRole('link', { name: '健康档案' })).toBeVisible()

  await expectClippedSnapshot(drawer, 'navbar-mobile-drawer-panel.png', 180)
})

test('desktop navbar right actions keep full layout stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const navbarRight = page.locator('.navbar-right')
  await expect(navbarRight).toBeVisible()
  await expect(page.getByTitle('消息通知')).toBeVisible()
  await expect(page.getByTitle('系统设置')).toBeVisible()
  await expect(page.locator('.notif-dot')).toBeVisible()

  await expectClippedSnapshot(navbarRight, 'navbar-right-actions-full.png', 140)
})

test('desktop navbar right actions degrade cleanly without notifications', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page, 'tenant-lite')

  const navbarRight = page.locator('.navbar-right')
  await expect(navbarRight).toBeVisible()
  await expect(page.getByTitle('消息通知')).toHaveCount(0)
  await expect(page.getByTitle('系统设置')).toBeVisible()
  await expect(page.locator('.notif-dot')).toHaveCount(0)

  await expectClippedSnapshot(navbarRight, 'navbar-right-actions-no-notifications.png', 120)
})

test('desktop navbar identity summary keeps default admin layout stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const navbarUser = page.locator('.navbar-user')
  await expect(navbarUser).toBeVisible()
  await expect(page.locator('.navbar-user-name')).toContainText('管理员')
  await expect(page.locator('.navbar-user-role')).toContainText(/演示养老集团\s*·\s*10 模块\s*·\s*系统管理员/)

  await expectClippedSnapshot(navbarUser, 'navbar-identity-default-admin.png', 120)
})

test('desktop navbar identity summary reflects org admin role cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsManager(page)

  const navbarUser = page.locator('.navbar-user')
  await expect(navbarUser).toBeVisible()
  await expect(page.locator('.navbar-user-name')).toContainText('机构管理员')
  await expect(page.locator('.navbar-user-role')).toContainText(/演示养老集团\s*·\s*10 模块\s*·\s*机构管理员/)

  await expectClippedSnapshot(navbarUser, 'navbar-identity-org-admin.png', 120)
})

test('desktop navbar identity summary reflects tenant module count changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page, 'tenant-lite')

  const navbarUser = page.locator('.navbar-user')
  await expect(navbarUser).toBeVisible()
  await expect(page.locator('.navbar-user-name')).toContainText('管理员')
  await expect(page.locator('.navbar-user-role')).toContainText(/轻量试用机构\s*·\s*3 模块\s*·\s*系统管理员/)

  await expectClippedSnapshot(navbarUser, 'navbar-identity-tenant-lite.png', 120)
})

test('desktop navbar avatar logs the user out to login page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page)

  const logoutButton = page.getByRole('button', { name: '退出登录' })
  await expect(logoutButton).toBeVisible()
  await logoutButton.click()

  await expect(page).toHaveURL(/\/login(?:\?|$)/)
  await expect(page.getByText('智慧养老管理系统')).toBeVisible()
})

test('org admin sees role-specific navbar priority', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsManager(page)

  await expect(page.locator('.navbar-user-role')).toContainText('机构管理员')

  const navText = (await page.locator('.navbar-nav').textContent()) ?? ''
  expect(navText).toMatch(/日班工作台[\s\S]*长者照护[\s\S]*报警服务[\s\S]*评定与长护险/)
})

test('tenant-private hides ai navigation and blocks ai hub entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page, 'tenant-private')

  await expect(page.locator('.navbar-user-role')).toContainText('私有化试点机构')

  const navText = (await page.locator('.navbar-nav').textContent()) ?? ''
  expect(navText).not.toContain('AI运营')

  await page.goto('/ai-assistant')
  await expect(page.getByText('当前租户未启用 AI 模块')).toBeVisible()
  await expect(page.getByText('Entitlement Off')).toBeVisible()
})

test('tenant-lite blocks unsubscribed module entry routes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await loginAsAdmin(page, 'tenant-lite')

  await expect(page.locator('.navbar-user-role')).toContainText('轻量试用机构')

  const navText = (await page.locator('.navbar-nav').textContent()) ?? ''
  expect(navText).not.toContain('报警服务')
  expect(navText).not.toContain('财务服务')
  expect(navText).not.toContain('通知服务')
  expect(navText).not.toContain('评定与长护险')

  await page.goto('/notifications')
  await expect(page.getByText('当前租户未启用通知服务')).toBeVisible()
  await expect(page.getByText('Entitlement Off')).toBeVisible()

  await page.goto('/financial')
  await expect(page.getByText('当前租户未启用财务服务')).toBeVisible()
  await expect(page.getByText('Entitlement Off')).toBeVisible()

  await page.goto('/alerts')
  await expect(page.getByText('当前租户未启用报警服务')).toBeVisible()
  await expect(page.getByText('Entitlement Off')).toBeVisible()

  await page.goto('/elderly/checkin')
  await expect(page.getByText('当前租户未启用评定与长护险')).toBeVisible()
  await expect(page.getByText('Entitlement Off')).toBeVisible()
})

test('nursing services overview shows navbar ownership matrix', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/nursing/services')

  await expect(page.getByRole('heading', { name: '长护险评定机构总览' })).toBeVisible()
  await expect(page.getByText('一级导航归属矩阵')).toBeVisible()
  await expect(page.getByText('这些路由不再重复挂到机构养老、居家养老和机构管理。')).toBeVisible()
  await expect(page.getByRole('link', { name: '协同人员入职' })).toBeVisible()
  await expect(page.getByText('设备与健康、机构管理、运营分析只保留未被长护险、机构养老、居家养老接管的通用能力。')).toBeVisible()
})

test('scene-aware shared pages expose institutional and home-care contexts', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/elderly?scene=institutional')
  await expect(page.getByRole('heading', { name: '机构老人档案' })).toBeVisible()
  await expect(page.getByText('当前按机构养老视角聚焦院内在住老人、床位承载和照护档案。')).toBeVisible()
  await expect(page.locator('.navbar-item.is-active').filter({ hasText: '长者照护' }).first()).toBeVisible()

  await page.goto('/staff?scene=home')
  await expect(page.getByRole('heading', { name: '协同人员池' })).toBeVisible()
  await expect(page.getByText('当前聚焦居家养老协同视角，默认前置第三方合作人员与护理服务机构绑定关系。')).toBeVisible()
  await expect(page.locator('.navbar-item.is-active').filter({ hasText: '长者照护' }).first()).toBeVisible()

  await page.goto('/staff/new?scene=home')
  await expect(page.getByRole('heading', { name: '添加协同人员' })).toBeVisible()
  await expect(page.getByLabel('人员来源')).toHaveValue('第三方合作')

  await page.goto('/elderly/health?scene=home')
  await expect(page.getByRole('heading', { name: '居家健康档案' })).toBeVisible()

  await page.goto('/elderly/face?scene=home')
  await expect(page.getByRole('heading', { name: '居家人脸录入' })).toBeVisible()

  await page.goto('/elderly/checkin?scene=home')
  await expect(page.getByRole('heading', { name: '居家个案评定中心' })).toBeVisible()
  await expect(page.getByText('资料受理 -> 上门评定 -> 认定结论与回执跟进')).toBeVisible()

  await page.goto('/staff/tasks?scene=home')
  await expect(page.getByRole('heading', { name: '上门评定回执任务' })).toBeVisible()
  await expect(page.getByText('聚焦资料导入个案、第三方协同与上门回执补录')).toBeVisible()

  await page.goto('/staff/schedule?scene=home')
  await expect(page.getByRole('heading', { name: '居家派案排期' })).toBeVisible()
  await expect(page.getByText('聚焦第三方协同、上门窗口与路线分派')).toBeVisible()

  await page.goto('/organizations/partners?scene=home')
  await expect(page.getByRole('heading', { name: '居家定点机构协同' })).toBeVisible()
  await expect(page.getByText('当前优先聚焦居家上门评定与护理服务承接')).toBeVisible()

  await page.goto('/nursing/checkin?scene=home')
  await expect(page.getByRole('heading', { name: '居家服务回执台' })).toBeVisible()
  await expect(page.getByText('聚焦第三方协同到场、回执补录与主管复核')).toBeVisible()

  await page.goto('/financial?scene=home')
  await expect(page.getByRole('heading', { name: '居家评定结算与质控' })).toBeVisible()
  await expect(page.getByText('资料导入个案 -> 上门评定 -> 质控抽检 -> 评估费结算')).toBeVisible()

  await page.goto('/analytics/report?scene=home')
  await expect(page.getByRole('heading', { name: '居家监管报表中心' })).toBeVisible()
  await expect(page.getByText('面向评定主管与运营经理的居家周报 / 月报摘要草稿。')).toBeVisible()
  await page.getByRole('link', { name: '进入 AI 运营中心' }).first().click()
  await expect(page).toHaveURL(/\/ai-assistant\?.*source=analytics-report.*scene=home/)
  await expect(page.getByText('场景：居家养老')).toBeVisible()
})

test('scene-aware entry pages preserve context through home, daily workbench, and elderly detail', async ({ page }) => {
  const workflowSignals = trackUnhandledWorkflowSignals(page)
  await loginAsAdmin(page)

  await page.goto('/?scene=home')
  await expect(page.getByText('当前按居家养老视角组织入口，优先聚焦评定、派案、回执与监管链路。')).toBeVisible()
  await expect(page.getByText('场景快捷入口')).toBeVisible()

  await page.getByRole('link', { name: '进入居家工作台' }).click()
  await expect(page).toHaveURL(/\/operations\/daily\?scene=home/)
  await expect(page.getByRole('heading', { name: '居家日班工作台' })).toBeVisible()

  await page.getByRole('link', { name: '进入评定任务' }).click()
  await expect(page).toHaveURL(/\/staff\/tasks\?scene=home/)
  await expect(page.getByRole('heading', { name: '上门评定回执任务' })).toBeVisible()

  await page.goto('/elderly/E001?scene=home')
  await expect(page.locator('.page-header .tag').filter({ hasText: '居家养老' })).toBeVisible()
  await page.getByRole('link', { name: '人脸录入' }).click()
  await expect(page).toHaveURL(/\/elderly\/face\?.*scene=home.*entry=elderly-detail/)
  await expect(page.getByRole('heading', { name: '居家人脸录入' })).toBeVisible()

  await page.goto('/elderly/E001?scene=home')
  await page.locator('.page-header a').first().click()
  await expect(page).toHaveURL(/\/elderly\?scene=home/)
  await expect(page.getByRole('heading', { name: '居家个案池' })).toBeVisible()
  expect(workflowSignals).toEqual([])
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

test('elderly create flow reaches checkin and registry list', async ({ page }) => {
  await loginAsAdmin(page)

  const name = `自动化老人${Date.now().toString().slice(-4)}`

  await page.goto('/elderly/new')
  await page.getByPlaceholder('请输入姓名').fill(name)
  await page.locator('select').nth(0).selectOption('女')
  await page.getByPlaceholder('请输入年龄').fill('79')
  await page.getByPlaceholder('请输入手机号').fill('13900001111')
  await page.getByPlaceholder('如 201-1').fill('509-1')
  await page.getByPlaceholder(/姓名 \+ 电话/).fill('张敏 13900002222')
  await page.getByPlaceholder('0 - 100').fill('68')
  await page.locator('select').nth(2).selectOption('清晰')
  await page.getByRole('button', { name: '提交并进入个案评定' }).click()

  await expect(page).toHaveURL(/\/elderly\/checkin\?selected=.*entry=elderly-new/)
  await expect(page.getByText('来自新增老人页', { exact: true })).toBeVisible()
  await expect(page.getByText(name).first()).toBeVisible()

  await page.getByRole('button', { name: '确认认定并生成结论' }).click()
  await expect(page.getByRole('button', { name: '标记认定生效' })).toBeVisible()

  await page.getByRole('button', { name: '标记认定生效' }).click()
  await expect(page.getByText('已进入认定生效期')).toBeVisible()

  await page.goto('/elderly')
  await page.getByPlaceholder('搜索姓名/编号...').fill(name)
  await expect(page.getByText(name).first()).toBeVisible()
})

test('elderly import flow reaches checkin and registry list', async ({ page }) => {
  await loginAsAdmin(page)

  const suffix = Date.now().toString().slice(-4)
  const name = `导入老人${suffix}`

  await page.goto('/elderly/import')
  await page.getByLabel('资料包模板').selectOption('chronic-followup')
  await page.getByPlaceholder(/可粘贴 OCR、病历摘要/).fill([
    `姓名：${name}`,
    '性别：女',
    '年龄：81',
    '联系电话：13900005555',
    '紧急联系人：张敏 13900006666',
    '房间：608-1',
    '身份证：310101194502036666',
    'ADL：54',
    '认知状态：轻度受损',
    '慢病：高血压、糖尿病',
    '过敏史：无',
    '风险备注：近半年有跌倒史，需要夜间离床提醒',
  ].join('\n'))
  await page.getByRole('button', { name: '开始AI识别' }).click()

  await expect(page.locator(`input[value="${name}"]`).first()).toBeVisible()
  await page.getByRole('button', { name: '写入个案评定' }).click()

  await expect(page).toHaveURL(/\/elderly\/checkin\?selected=.*entry=elderly-import/)
  await expect(page.getByText('来自资料导入页', { exact: true })).toBeVisible()
  await expect(page.getByText(name).first()).toBeVisible()

  await page.getByRole('button', { name: '确认认定并生成结论' }).click()
  await expect(page.getByRole('button', { name: '标记认定生效' })).toBeVisible()

  await page.getByRole('button', { name: '标记认定生效' }).click()
  await expect(page.getByText('已进入认定生效期')).toBeVisible()

  await page.goto('/elderly')
  await page.getByPlaceholder('搜索姓名/编号...').fill(name)
  await expect(page.getByText(name).first()).toBeVisible()
})

test('staff create flow reaches pending onboarding and active roster', async ({ page }) => {
  await loginAsAdmin(page)

  const suffix = Date.now().toString().slice(-4)
  const staffName = `自动化员工${suffix}`

  await page.goto('/staff/new')
  await page.locator('select').nth(0).selectOption('自营')
  await page.getByPlaceholder('请输入姓名').fill(staffName)
  await page.getByPlaceholder('如 护士').fill('护士')
  await page.getByPlaceholder('如 护理部').fill('护理部')
  await page.locator('select').nth(1).selectOption('女')
  await page.getByPlaceholder('请输入手机号').fill('13900003333')
  await page.getByPlaceholder('请输入邮箱').fill(`staff${suffix}@example.com`)
  await page.getByPlaceholder('如 32').fill('32')
  await page.getByRole('button', { name: '提交并进入待入职' }).click()

  await expect(page).toHaveURL(/\/staff\?selected=.*entry=staff-new/)
  await expect(page.getByText('来自新增员工页')).toBeVisible()
  await expect(page.getByText(staffName).first()).toBeVisible()
  await expect(page.getByText('待入职').first()).toBeVisible()

  await page.getByRole('button', { name: '确认入职' }).click()
  await expect(page.getByRole('link', { name: '查看详情' })).toBeVisible()
  await expect(page.getByText('已入职').first()).toBeVisible()

  await page.getByPlaceholder('搜索姓名/工号...').fill(staffName)
  const staffRow = page.locator('tr', { hasText: staffName }).first()
  await expect(staffRow).toBeVisible()
  await expect(staffRow).toContainText('在职')
})

test('partner, third-party staff, assessment config, task and schedule routes stay connected', async ({ page }) => {
  await loginAsAdmin(page)

  const suffix = Date.now().toString().slice(-5)
  const partnerName = `自动合作机构${suffix}`
  const staffName = `自动护工${suffix}`
  const itemName = `自动护理项${suffix}`
  const ruleSetName = `自动规则集${suffix}`
  const templateName = `自动模板${suffix}`

  await page.goto('/organizations/partners/new')
  await page.getByPlaceholder('请输入机构名称').fill(partnerName)
  await page.locator('select').nth(0).selectOption('护理服务机构')
  await page.locator('select').nth(1).selectOption('护理外包')
  await page.getByPlaceholder('如 浦东新区、杨浦区').fill('浦东新区')
  await page.locator('select').nth(2).selectOption('按月结')
  await page.getByPlaceholder('请输入联系人姓名').fill('李合作')
  await page.getByPlaceholder('请输入手机号').fill('13900008888')
  await page.locator('input[type="date"]').nth(0).fill('2026-04-02')
  await page.locator('input[type="date"]').nth(1).fill('2026-12-31')
  await page.getByPlaceholder('补充服务边界、合作说明或注意事项').fill('自动化创建的护理服务机构，用于验证第三方员工绑定与评定配置链路。')
  await page.getByRole('button', { name: '提交并进入待启用' }).click()

  await expect(page).toHaveURL(/\/organizations\/partners\?selected=.*entry=partners-new/)
  await expect(page.getByText(partnerName).first()).toBeVisible()
  await expect(page.getByText('护理服务机构').first()).toBeVisible()
  await page.getByRole('button', { name: '启用机构' }).first().click()
  await expect(page.getByText('已启用').first()).toBeVisible()

  await page.goto('/staff/new')
  await page.locator('select').nth(0).selectOption('第三方合作')
  await page.getByPlaceholder('请输入姓名').fill(staffName)
  await page.getByPlaceholder('如 护士').fill('护工')
  await page.getByPlaceholder('如 护理部').fill('护理部')
  await page.locator('select').nth(1).selectOption({ label: partnerName })
  await page.getByPlaceholder('如 第三方护工').fill('驻场护工')
  await page.locator('select').nth(2).selectOption('女')
  await page.getByPlaceholder('请输入手机号').fill('13900009999')
  await page.getByPlaceholder('请输入邮箱').fill(`caregiver${suffix}@example.com`)
  await page.getByPlaceholder('如 32').fill('35')
  await page.getByRole('button', { name: '提交并进入待入职' }).click()

  await expect(page).toHaveURL(/\/staff\?selected=.*entry=staff-new/)
  await expect(page.getByText(staffName).first()).toBeVisible()
  await expect(page.getByText('第三方合作').first()).toBeVisible()
  await page.getByRole('button', { name: '确认入职' }).click()
  const staffRow = page.locator('tr', { hasText: staffName }).first()
  await expect(staffRow).toContainText(partnerName)
  await expect(staffRow).toContainText('在职')

  await page.goto('/nursing/packages')
  await expect(page.getByRole('heading', { name: '评定标准配置' })).toBeVisible()
  await page.getByPlaceholder('如 居家环境与风险评估').fill(itemName)
  await page.getByPlaceholder('如 30 分钟/次').fill('40 分钟/次')
  await page.getByPlaceholder('如 现场照片、签名确认、量表记录').fill('现场照片、签名确认、量表记录')
  await page.getByPlaceholder('说明该护理项在认定中的作用和适用边界').fill('自动化护理项，用于验证评定标准配置链路。')
  await page.getByRole('button', { name: '提交护理项' }).click()

  await expect(page.getByText(itemName).first()).toBeVisible()
  await page.getByRole('button', { name: '启用' }).first().click()
  await expect(page.getByText('护理项已启用，可进入规则集和模板配置。')).toBeVisible()

  await page.getByPlaceholder('如 居家失能首评规则集').fill(ruleSetName)
  await page.getByPlaceholder('如 ADL 35-65 + 认知修正项').fill('ADL 40-70 + 夜间风险修正项')
  await page.getByPlaceholder('说明满足何种条件后进入相应照护建议').fill('满足 ADL 阈值且存在夜间风险时进入重点照护建议。')
  await page.getByPlaceholder('如 ADL 记录、现场照片、签名确认').fill('ADL 记录、现场照片、签名确认')
  await page.getByPlaceholder('如 item-adl-observation，item-home-safety').fill('item-adl-observation，item-home-safety')
  await page.getByPlaceholder('如 双人复核后方可出具认定意见').fill('主管与质控双人复核后方可发布。')
  await page.getByRole('button', { name: '提交规则集' }).click()

  const ruleDraftCard = page.locator('div').filter({ hasText: ruleSetName }).filter({ has: page.getByRole('button', { name: '提交复核' }) }).first()
  await expect(ruleDraftCard).toBeVisible()
  await ruleDraftCard.getByRole('button', { name: '提交复核' }).click()

  const ruleReviewCard = page.locator('div').filter({ hasText: ruleSetName }).filter({ has: page.getByRole('button', { name: '发布生效' }) }).first()
  await expect(ruleReviewCard).toBeVisible()
  await ruleReviewCard.getByRole('button', { name: '发布生效' }).click()
  await expect(page.getByText('规则集已生效，可被个案评定直接消费。')).toBeVisible()
  await expect(page.locator('div').filter({ hasText: ruleSetName }).filter({ hasText: '已生效' }).first()).toBeVisible()

  await page.goto('/nursing/plans')
  await expect(page.getByRole('heading', { name: '认定方案模板' })).toBeVisible()
  await page.getByPlaceholder('如 首评二级照护建议模板').fill(templateName)
  await page.locator('select').nth(1).selectOption({ label: ruleSetName })
  await page.getByPlaceholder('如 item-adl-observation，item-home-safety').fill('item-adl-observation，item-home-safety')
  await page.getByPlaceholder('如 量表记录、签名确认、现场照片').fill('量表记录、签名确认、现场照片')
  await page.getByPlaceholder('描述模板适用范围、输出口径和风险说明').fill('自动化模板，用于验证规则集与模板复核启用链路。')
  await page.getByPlaceholder('如 30 日内回访、7 日内复核资料一致性').fill('7 日内复核资料一致性并安排回访。')
  await page.getByRole('button', { name: '提交模板' }).click()

  const templateDraftCard = page.locator('div').filter({ hasText: templateName }).filter({ has: page.getByRole('button', { name: '提交复核' }) }).first()
  await expect(templateDraftCard).toBeVisible()
  await expect(templateDraftCard).toContainText(ruleSetName)
  await templateDraftCard.getByRole('button', { name: '提交复核' }).click()

  const templateReviewCard = page.locator('div').filter({ hasText: templateName }).filter({ has: page.getByRole('button', { name: '启用模板' }) }).first()
  await expect(templateReviewCard).toBeVisible()
  await templateReviewCard.getByRole('button', { name: '启用模板' }).click()
  await expect(page.getByText('认定模板已启用，可在个案评定页直接引用。')).toBeVisible()
  await expect(page.locator('div').filter({ hasText: templateName }).filter({ hasText: '已启用' }).first()).toBeVisible()

  await page.goto('/staff/tasks')
  await expect(page.getByRole('heading', { name: '现场评定任务', exact: true })).toBeVisible()
  await expect(page.getByText('联动说明')).toBeVisible()
  await expect(page.getByText('任务台账不再只依赖个案受理，而是同时消费个案评定与认定模板两条 workflow。')).toBeVisible()

  await page.goto('/staff/schedule')
  await expect(page.getByRole('heading', { name: '派案排期', exact: true })).toBeVisible()
  await expect(page.getByText('认定联动总览')).toBeVisible()
  await expect(page.getByText('待分派案件').first()).toBeVisible()
})

test('visit create flow reaches pending approval and registered list', async ({ page }) => {
  await loginAsAdmin(page)

  const suffix = Date.now().toString().slice(-4)
  const visitorName = `自动访客${suffix}`

  await page.goto('/elderly/visits/new')
  await page.locator('select').nth(0).selectOption('E001')
  await page.getByPlaceholder('请输入访客姓名').fill(visitorName)
  await page.getByPlaceholder('如 女儿').fill('女儿')
  await page.getByPlaceholder('请输入手机号').fill('13900004444')
  await page.locator('input[type="date"]').fill('2026-04-02')
  await page.locator('input[type="time"]').fill('15:30')
  await page.getByRole('button', { name: '提交并进入待审核' }).click()

  await expect(page).toHaveURL(/\/elderly\/visits\?selected=.*entry=elderly-visits-new/)
  await expect(page.getByText('来自预约探视页')).toBeVisible()
  await expect(page.getByText(visitorName).first()).toBeVisible()
  await expect(page.getByText('待审核').first()).toBeVisible()

  await page.getByRole('button', { name: '通过预约' }).click()
  await expect(page.getByText('已审核').first()).toBeVisible()

  await page.getByPlaceholder('搜索老人姓名或探视人...').fill(visitorName)
  const visitRow = page.locator('tr', { hasText: visitorName }).first()
  await expect(visitRow).toBeVisible()
  await expect(visitRow).toContainText('已登记')
})

test('face enrollment flow reaches activated state from elderly detail', async ({ page }) => {
  await loginAsAdmin(page)

  await page.goto('/elderly/E004')
  await page.locator('a[href="/elderly/face?selected=E004&entry=elderly-detail"]').click()

  await expect(page).toHaveURL(/\/elderly\/face\?selected=E004&entry=elderly-detail/)
  await expect(page.getByText('来自老人详情页')).toBeVisible()

  await page.getByPlaceholder('如 前台接待 李敏').fill('自动化前台')
  await page.getByPlaceholder('如 前台采集终端 A').fill('自动化采集终端')
  await page.getByTestId('face-capture-front').click()
  await page.getByTestId('face-capture-left').click()
  await page.getByTestId('face-capture-right').click()

  await page.getByPlaceholder('填写为什么可以激活，例如已完成三角度采集且光照稳定。').fill('三角度样本齐全，光照稳定，可进入门禁白名单。')
  await page.getByTestId('face-activate-button').click()

  const faceRow = page.locator('tr', { hasText: '赵德明' }).first()
  await expect(faceRow).toContainText('已生效')
  await expect(page.getByText('三角度样本完整，当前模板已生效并可用于门禁或核验。')).toBeVisible()

  await page.goto('/elderly')
  await page.getByPlaceholder('搜索姓名/编号...').fill('E004')
  const elderlyRow = page.locator('tr', { hasText: '赵德明' }).first()
  await expect(elderlyRow).toContainText('已生效')
  await expect(elderlyRow.getByRole('link', { name: '人脸录入' })).toHaveAttribute('href', /\/elderly\/face\?selected=E004&entry=elderly-list/)
})

test('master data routes render without sync external store snapshot loops', async ({ page }) => {
  await loginAsAdmin(page)
  const syncLoopSignals = trackSyncExternalStoreLoopSignals(page)

  await page.goto('/rooms')
  await expect(page.getByRole('heading', { name: '房间管理' })).toBeVisible()
  await expect(page.locator('tr', { hasText: '花园套间' }).first()).toBeVisible()
  await expect(page.locator('tr', { hasText: '静养单人间' }).first()).toBeVisible()

  await page.goto('/rooms/R202')
  await expect(page.getByRole('heading', { name: 'R202' })).toBeVisible()
  await expect(page.getByText('房间状态', { exact: true })).toBeVisible()

  await page.goto('/organizations')
  await expect(page.getByRole('heading', { name: '机构管理' })).toBeVisible()
  await expect(page.getByText('阳光养老院（浦东店）').first()).toBeVisible()
  await expect(page.getByText('康乐养老院（静安店）').first()).toBeVisible()

  await page.goto('/organizations/O001')
  await expect(page.getByRole('heading', { name: '阳光养老院（浦东店）' })).toBeVisible()
  await expect(page.getByText('机构状态', { exact: true })).toBeVisible()

  expect(syncLoopSignals).toEqual([])
})