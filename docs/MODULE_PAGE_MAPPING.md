# 养老数字化平台模块与页面映射表

> 版本：v1.0 | 日期：2026-03-29 | 状态：工程映射文档（用于产品、前端、后端对齐）

---

## 目录

1. [文档目标](#1-文档目标)
2. [映射原则](#2-映射原则)
3. [平台模块总览](#3-平台模块总览)
4. [当前 Admin 路由映射表](#4-当前-admin-路由映射表)
5. [兼容与别名路由](#5-兼容与别名路由)
6. [家属 APP 模块映射建议](#6-家属-app-模块映射建议)
7. [员工 APP 模块映射建议](#7-员工-app-模块映射建议)
8. [与当前工程实现的结合方式](#8-与当前工程实现的结合方式)

---

## 1. 文档目标

本文档用于把平台级领域模块映射到当前仓库的页面结构，回答以下问题：

1. 当前 Admin 已经覆盖了哪些业务模块
2. 每个页面对应哪个中台服务域
3. 哪些页面属于 Demo 占位页，后续需要替换为真实业务闭环
4. 家属 APP 与员工 APP 后续应如何按同一模块体系扩展

本文档应与以下文件配合使用：

- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)
- [IMPLEMENTATION_BLUEPRINT.md](./IMPLEMENTATION_BLUEPRINT.md)
- [PRODUCT_DESIGN.md](./PRODUCT_DESIGN.md)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## 2. 映射原则

### 2.1 页面属于应用层，不等于服务边界

当前仓库中的页面只代表前端视图入口，不应直接等同于后端服务边界。例如：

- `/dashboard` 是聚合页面，不应对应独立数据库域
- `/health/bp`、`/health/hr`、`/health/sleep` 都属于 `Health Service`
- `/devices/assets`、`/devices/status`、`/devices/realtime` 都属于 `Device Service`

### 2.2 canonical path 优先

当前仓库已经建立产品级 canonical route，后续以以下路径为准：

- `/dashboard`
- `/health`
- `/devices`
- `/analytics`
- `/nursing/*`
- `/alerts/history`
- `/settings/*`

旧路径如 `/equipment`、`/health-monitoring`、`/data-dashboard` 保留兼容，但不作为新功能扩展路径。

### 2.3 标准页骨架优先

对于处于 Demo 阶段、尚未形成完整业务交互闭环的模块页，优先复用标准骨架：

- `StandardModulePage`
- `standard-pages.tsx`

这样可以先统一信息结构，再逐步替换为真实 API 和实际流程。

---

## 3. 平台模块总览

| 平台模块 | 说明 | 对应服务域 | 主要用户端 |
|----------|------|------------|------------|
| 运营驾驶舱 | 机构总览、关键指标、风险聚合 | Dashboard Aggregation | Admin |
| 老人管理 | 老人档案、入住、护理等级、家属关系 | Elder Service | Admin / 员工 / 家属 |
| 护理服务 | 服务项目、计划、任务、打卡、交接 | Care Service | Admin / 员工 |
| 健康医疗 | 生命体征、病史、医嘱、趋势、风险 | Health Service | Admin / 员工 / 家属 |
| 员工管理 | 员工档案、排班、任务中心、绩效 | Staff Service | Admin / 员工 |
| 房间床位 | 房间、床位、入住状态、占用关系 | Facility Service 或 Elder Service 子域 | Admin |
| 设备管理 | 资产台账、在线状态、实时监控、维保 | Device Service | Admin |
| 报警中心 | 报警接收、分派、处理、复盘 | Alert Service | Admin / 员工 |
| 机构管理 | 多院区、组织、楼层、运营主体 | Organization Service | Admin |
| 活动管理 | 文娱、康复活动与参与记录 | Activity Service | Admin / 家属 |
| 财务收费 | 套餐、账单、支付、对账 | Billing Service | Admin / 家属 |
| AI 能力 | AI 助手、风险解释、问答、建议 | AI Service | Admin / 家属 / 员工 |
| 系统设置 | 角色权限、规则配置、系统参数 | User Service / Config Service | Admin |

---

## 4. 当前 Admin 路由映射表

### 4.1 运营驾驶舱与总览

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/` | 首页驾驶舱 | 运营驾驶舱 | Dashboard Aggregation | 已实现 |
| `/dashboard` | 首页别名 | 运营驾驶舱 | Dashboard Aggregation | 已实现 |
| `/analytics` | 数据分析总览 | 数据分析 | Analytics Service / BFF | 已实现 |
| `/analytics/report` | 报表中心 | 数据分析 | Analytics Service | 标准骨架页 |

### 4.2 老人管理

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/elderly` | 老人列表 | 老人管理 | Elder Service | 已实现 |
| `/elderly/new` | 新增老人 | 老人管理 | Elder Service | 已实现 |
| `/elderly/[id]` | 老人详情 | 老人管理 | Elder Service | 已实现 |
| `/elderly/[id]/edit` | 编辑老人 | 老人管理 | Elder Service | 已实现 |
| `/elderly/checkin` | 入住办理 + AI 护理级别评估 + 计划确认入口 | 入住管理 | Elder Service / Care Service / AI Service | 已实现，待接入真实 AI 流程 |
| `/elderly/vitals` | 指标录入 | 健康医疗 | Health Service | 已实现 |
| `/elderly/health` | 老人健康页 | 健康医疗 | Health Service | 已实现 |
| `/elderly/visits` | 探视管理 | 家属协同 | Visit Service | 已实现 |
| `/elderly/face` | 人脸录入 | 老人管理 / IoT 联动 | Elder Service / Device Service | 已实现 |

### 4.3 护理服务

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/nursing/services` | 护理服务项目库 | 护理服务 | Care Service | 标准骨架页 |
| `/nursing/packages` | 护理套餐 | 护理服务 | Care Service / Billing Service | 标准骨架页 |
| `/nursing/plans` | 护理计划 | 护理服务 | Care Service | 标准骨架页 |
| `/nursing/schedule` | 护理排班 | 护理服务 | Care Service / Staff Service | 标准骨架页 |
| `/nursing/checkin` | 服务打卡 | 护理服务 | Care Service | 标准骨架页 |

### 4.4 健康医疗

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/health` | 健康总览 | 健康医疗 | Health Service | 已实现 |
| `/health/bp` | 血压管理 | 健康医疗 | Health Service | 标准骨架页 |
| `/health/hr` | 心率管理 | 健康医疗 | Health Service | 标准骨架页 |
| `/health/sleep` | 睡眠监测 | 健康医疗 | Health Service | 标准骨架页 |

### 4.5 员工管理

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/staff` | 员工列表 | 员工管理 | Staff Service | 已实现 |
| `/staff/[id]` | 员工详情 | 员工管理 | Staff Service | 已实现 |
| `/staff/schedule` | 员工排班 | 员工管理 | Staff Service | 已实现 |
| `/staff/tasks` | 任务中心 | 员工管理 | Staff Service / Care Service | 标准骨架页 |

### 4.6 房间床位与机构管理

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/rooms` | 房间列表 | 房间床位 | Facility Service | 已实现 |
| `/rooms/[id]` | 房间详情 | 房间床位 | Facility Service | 已实现 |
| `/organizations` | 机构列表 | 机构管理 | Organization Service | 已实现 |
| `/organizations/[id]` | 机构详情 | 机构管理 | Organization Service | 已实现 |
| `/branch` | 分院管理 | 机构管理 | Organization Service | 已实现 |

### 4.7 设备管理

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/devices` | 设备总览 | 设备管理 | Device Service | 已实现 |
| `/devices/assets` | 资产管理 | 设备管理 | Device Service | 标准骨架页 |
| `/devices/realtime` | 实时监控 | 设备管理 | Device Service / IoT Service | 已实现 |
| `/devices/status` | 设备状态 | 设备管理 | Device Service | 已实现 |
| `/devices/stats` | 设备统计 | 设备管理 | Device Service / Analytics Service | 已实现 |
| `/devices/[id]` | 设备详情 | 设备管理 | Device Service | 已实现 |

### 4.8 报警与事件

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/alerts` | 实时报警 | 报警中心 | Alert Service | 已实现 |
| `/alerts/history` | 报警历史 | 报警中心 | Alert Service | 标准骨架页 |
| `/incidents` | 事件 / 事故列表 | 事件管理 | Incident Service | 已实现 |
| `/incidents/[id]` | 事件 / 事故详情 | 事件管理 | Incident Service | 已实现 |

### 4.9 活动、物资、财务、AI 与设置

| 路由 | 页面职责 | 模块归属 | 对应服务域 | 当前状态 |
|------|----------|----------|------------|----------|
| `/activities` | 活动列表 | 活动管理 | Activity Service | 已实现 |
| `/activities/[id]` | 活动详情 | 活动管理 | Activity Service | 已实现 |
| `/supplies` | 物资列表 | 供应链 / 后勤 | Supply Service | 已实现 |
| `/supplies/[id]` | 物资详情 | 供应链 / 后勤 | Supply Service | 已实现 |
| `/financial` | 财务总览 | 费用系统 | Billing Service | 已实现 |
| `/ai-assistant` | AI 总览入口 | AI 能力 | AI Service | 已实现 |
| `/ai-assistant/inference` | AI 推理详情 | AI 能力 | AI Service | 已实现 |
| `/ai-assistant/rules` | AI 规则治理 | AI 能力 | AI Service / Config Service | 已实现 |
| `/ai-assistant/logs` | AI 问答日志 | AI 能力 | AI Service / Audit Service | 已实现 |
| `/ai-assistant/staff-app` | 员工 APP + AI 预览 | AI 能力 / 员工 APP 原型 | AI Service / Care Service / Alert Service | 待实现 |
| `/ai-assistant/family-app` | 家属 APP + AI 预览 | AI 能力 / 家属 APP 原型 | AI Service / Elder Service / Visit Service | 待实现 |
| `/settings` | 系统配置 | 系统设置 | Config Service | 标准骨架页 |
| `/settings/roles` | 角色权限 | 系统设置 | User Service / Config Service | 标准骨架页 |
| `/login` | 登录页 | 认证 | User Service | 已实现 |

---

## 5. 兼容与别名路由

当前仓库仍保留部分旧路径用于兼容历史实现或过渡：

| 旧路径 | 新路径 | 说明 |
|--------|--------|------|
| `/equipment` | `/devices` | 旧设备路径，后续不再作为新页面入口 |
| `/equipment/monitor` | `/devices/realtime` | 旧监控路径 |
| `/equipment/status` | `/devices/status` | 旧状态路径 |
| `/equipment/stats` | `/devices/stats` | 旧统计路径 |
| `/health-monitoring` | `/health` | 旧健康总览路径 |
| `/data-dashboard` | `/analytics` | 旧分析总览路径 |

建议：

- 前台导航、文档、接口示例全部使用新路径
- 旧路径仅承担兼容职责
- 后续新增功能不再挂载到旧路径下

---

## 6. 家属 APP 模块映射建议

家属 APP 不需要完整复制 Admin 模块，而应围绕“信任、透明、沟通”构建。

| 家属模块 | 推荐页面 / 场景 | 对应服务域 |
|----------|----------------|------------|
| 老人状态首页 | 今日状态、心率、血压、睡眠、护理摘要 | Elder Service + Health Service + Care Service |
| 护理记录 | 今日护理、历史护理、用药记录 | Care Service + Health Service |
| 健康报告 | 日报、周报、月报 | Health Service + Analytics Service |
| 探视中心 | 视频探视、预约探视、探视记录 | Visit Service |
| 消息中心 | 护理完成、健康异常、账单、系统通知 | Notification Service |
| 账单中心 | 费用账单、支付记录、欠费提醒 | Billing Service |
| AI 家属助手 | 今日状态问答、风险解释、护理说明 | AI Service |

建议优先补充三类家属 AI 能力：

- 今日状态摘要卡
- 探视与视频沟通建议
- 家属友好版健康解释

---

## 7. 员工 APP 模块映射建议

员工 APP 是执行端，不需要承接全部运营能力，而应聚焦任务闭环。

| 员工模块 | 推荐页面 / 场景 | 对应服务域 |
|----------|----------------|------------|
| 今日任务 | 护理任务、优先级、倒计时 | Care Service |
| 护理执行 | 打卡、照片上传、备注补录 | Care Service |
| 健康录入 | 血压、血糖、体温、血氧录入 | Health Service |
| 报警处理 | 跌倒、呼叫、异常响应 | Alert Service |
| 交接班 | 班次交接、重点关注老人 | Care Service + Staff Service |
| 我的排班 | 今日班次、未来排班、请假替班 | Staff Service |
| AI 护理助手 | 任务提醒、风险提示、护理建议 | AI Service |

建议优先补充三类员工 AI 能力：

- 班次摘要与优先任务建议
- 报警响应动作提示
- 交接班摘要草稿

---

## 8. 与当前工程实现的结合方式

### 8.1 当前优先做什么

当前仓库建议继续强化以下三件事：

1. 路由与模块命名统一
2. Demo 页面骨架与信息结构统一
3. 为未来 API 契约预留稳定页面入口

### 8.2 哪些页面适合继续用标准骨架推进

以下页面当前最适合继续使用标准骨架快速推进：

- `/nursing/*`
- `/health/bp`
- `/health/hr`
- `/health/sleep`
- `/devices/assets`
- `/alerts/history`
- `/analytics/report`
- `/settings`
- `/settings/roles`
- `/staff/tasks`

### 8.3 入住 AI 分级链路建议

建议将以下页面和服务域串成一条固定链路：

```text
/elderly/checkin
→ AI 护理级别建议面板
→ /nursing/plans
→ /staff/tasks
→ 消息中心 / 员工提醒
```

建议责任分工：

- `/elderly/checkin`：录入与触发 AI 评估
- AI Service：返回护理级别建议、原因、推荐模板
- Care Service：生成护理计划与任务
- Staff Service：承接护理人员待办
- Notification Service：负责定时提醒与送达回执

### 8.4 哪些页面应优先进入真实业务闭环

建议优先从以下页面开始接入真实契约：

- `/dashboard`
- `/elderly`
- `/elderly/checkin`
- `/elderly/[id]`
- `/staff/tasks`
- `/devices/realtime`
- `/alerts`
- `/health`

### 8.5 APP + AI 原型在当前仓库的承接方式

当前仓库虽不是 Flutter 代码仓，但可以先承接 APP + AI 的高保真 Web 原型页，用于验证：

- 首页信息密度
- 卡片排序优先级
- 员工与家属两类语言风格差异
- AI 解释与人工兜底的交互边界

建议优先在以下路由落地：

- `/ai-assistant/staff-app`
- `/ai-assistant/family-app`

原因是这些页面最能代表平台的核心链路：

- 运营总览
- 入住与分级闭环
- 老人主档案
- 执行任务
- 实时监控
- 实时报警
- 健康风险
