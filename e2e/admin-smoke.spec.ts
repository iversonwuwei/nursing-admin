import { expect, test, type Page } from '@playwright/test'

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('admin123')
  await page.getByRole('button', { name: '登录' }).click()
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
  await page.getByRole('button', { name: '提交并进入入住审核' }).click()

  await expect(page).toHaveURL(/\/elderly\/checkin\?selected=.*entry=elderly-new/)
  await expect(page.getByText('来自新增老人页')).toBeVisible()
  await expect(page.getByText(name).first()).toBeVisible()

  await page.getByRole('button', { name: '确认等级并生成计划' }).click()
  await expect(page.getByRole('button', { name: '标记已入住' })).toBeVisible()

  await page.getByRole('button', { name: '标记已入住' }).click()
  await expect(page.locator('div').filter({ hasText: '已进入在住管理' }).last()).toBeVisible()

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
  await page.getByRole('button', { name: '写入入住审核' }).click()

  await expect(page).toHaveURL(/\/elderly\/checkin\?selected=.*entry=elderly-import/)
  await expect(page.getByText('来自资料导入页')).toBeVisible()
  await expect(page.getByText(name).first()).toBeVisible()

  await page.getByRole('button', { name: '确认等级并生成计划' }).click()
  await expect(page.getByRole('button', { name: '标记已入住' })).toBeVisible()

  await page.getByRole('button', { name: '标记已入住' }).click()
  await expect(page.locator('div').filter({ hasText: '已进入在住管理' }).last()).toBeVisible()

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

test('partner, third-party staff, package, plan, task and schedule workflow stays connected', async ({ page }) => {
  await loginAsAdmin(page)

  const suffix = Date.now().toString().slice(-5)
  const partnerName = `自动合作机构${suffix}`
  const staffName = `自动护工${suffix}`
  const packageName = `自动套餐${suffix}`
  const elderName = `计划老人${suffix}`
  const focus = `夜间巡房与翻身护理 ${suffix}`

  await page.goto('/organizations/partners/new')
  await page.getByPlaceholder('请输入机构名称').fill(partnerName)
  await page.locator('select').nth(0).selectOption('护理外包')
  await page.getByPlaceholder('如 浦东新区、杨浦区').fill('浦东新区')
  await page.locator('select').nth(1).selectOption('按月结')
  await page.getByPlaceholder('请输入联系人姓名').fill('李合作')
  await page.getByPlaceholder('请输入手机号').fill('13900008888')
  await page.locator('input[type="date"]').nth(0).fill('2026-04-02')
  await page.locator('input[type="date"]').nth(1).fill('2026-12-31')
  await page.getByPlaceholder('补充服务边界、合作说明或注意事项').fill('自动化创建的第三方合作机构，用于验证员工与计划联动。')
  await page.getByRole('button', { name: '提交并进入待启用' }).click()

  await expect(page).toHaveURL(/\/organizations\/partners\?selected=.*entry=partners-new/)
  await expect(page.getByText(partnerName).first()).toBeVisible()
  await page.getByRole('button', { name: '启用合作机构' }).first().click()
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
  await page.getByPlaceholder('如 夜间全护包').fill(packageName)
  await page.locator('select').nth(0).selectOption('全护')
  await page.getByPlaceholder('如 ¥4,200').fill('¥4,800')
  await page.locator('select').nth(1).selectOption('月付')
  await page.getByPlaceholder('如 夜间离床告警高频人群').fill('夜间高频照护老人')
  await page.getByPlaceholder('用顿号或逗号分隔，如 夜巡、离床告警响应、夜间安抚').fill('夜间巡房、翻身护理、离床告警响应')
  await page.getByPlaceholder('可选，如 外部康复师、家属日报').fill('家属日报')
  await page.getByRole('button', { name: '提交套餐草稿' }).click()

  const packageRow = page.locator('tr', { hasText: packageName }).first()
  await expect(packageRow).toBeVisible()
  await packageRow.getByRole('button', { name: '提交定价' }).click()
  await packageRow.getByRole('button', { name: '完成定价' }).click()
  await packageRow.getByRole('button', { name: '发布套餐' }).click()
  await expect(packageRow).toContainText('已生效')

  await page.goto('/nursing/plans')
  await page.locator('select').nth(0).selectOption({ label: packageName })
  await page.locator('select').nth(1).selectOption('套餐生成')
  await page.getByPlaceholder('如 张秀英').fill(elderName)
  await page.getByPlaceholder('如 301-1').fill('702-1')
  await page.getByPlaceholder('如 早班 / 晚班').fill('夜班')
  await page.locator('select').nth(2).selectOption('第三方护工')
  await page.getByPlaceholder('如 张护工').fill(staffName)
  await page.getByPlaceholder('如 午间翻身护理、夜间血氧监测').fill(focus)
  await page.getByPlaceholder('如 跌倒高风险、睡眠异常').fill('跌倒高风险')
  await page.getByRole('button', { name: '生成计划草稿' }).click()

  const planRow = page.locator('tr', { hasText: elderName }).first()
  await expect(planRow).toContainText(packageName)
  await expect(planRow).toContainText('待复核')
  await planRow.getByRole('button', { name: '复核通过' }).click()
  await expect(planRow).toContainText('执行中')

  await page.goto('/staff/tasks')
  const taskRow = page.locator('tr', { hasText: elderName }).first()
  await expect(taskRow).toContainText('服务计划')
  await expect(taskRow).toContainText(focus)
  await expect(taskRow).toContainText(staffName)

  await page.goto('/staff/schedule')
  const scheduleRow = page.locator('tr', { hasText: staffName }).first()
  await expect(scheduleRow).toContainText('已承接 1 条计划')
  await expect(page.getByText('待分派计划').first()).toBeVisible()
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
  await expect(page.getByText('花园套间')).toBeVisible()
  await expect(page.getByText('静养单人间')).toBeVisible()

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