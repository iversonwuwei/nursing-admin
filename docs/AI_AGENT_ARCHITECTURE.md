# 养老 AI Agent 落地方案

> 版本：v1.0 | 日期：2026-03-29 | 状态：AI 落地架构方案（面向可实施）

---

## 目录

1. [文档目标](#1-文档目标)
2. [AI Agent 在平台中的定位](#2-ai-agent-在平台中的定位)
3. [推荐 Agent 体系](#3-推荐-agent-体系)
4. [统一 AI Agent 架构](#4-统一-ai-agent-架构)
5. [核心 Agent 设计](#5-核心-agent-设计)
6. [工具层设计建议](#6-工具层设计建议)
7. [知识与检索架构](#7-知识与检索架构)
8. [安全与治理](#8-安全与治理)
9. [与当前工程的结合方式](#9-与当前工程的结合方式)
10. [分阶段落地路径](#10-分阶段落地路径)

---

## 1. 文档目标

本文档定义养老数字化平台中的 AI Agent 落地方式，目标不是只做一个聊天框，而是构建一组可插入业务流程、真正产生价值的智能代理能力。

本文档重点回答：

1. 哪些 AI Agent 值得先做
2. 每个 Agent 依赖哪些数据与工具
3. Agent 如何接入现有 Admin、未来家属 APP 和员工 APP
4. 如何保证安全、可解释、可运营

---

## 2. AI Agent 在平台中的定位

AI Agent 在本平台中的角色不是“代替业务系统”，而是“增强业务系统”。

### 2.1 AI 的四种主要价值

| 价值方向 | 说明 |
|----------|------|
| 解释 | 将复杂业务和健康数据转成可理解摘要 |
| 建议 | 为护理、排班、运营提供建议，不直接替代决策 |
| 预测 | 发现未来风险，如跌倒、健康恶化、设备故障 |
| 协同 | 通过对话或任务建议把信息推给合适的人 |

### 2.2 AI 不应直接做的事

不建议让 AI 在无人审核条件下直接执行以下动作：

- 直接修改老人关键档案
- 自动关闭高等级报警
- 自动下发医疗决策
- 自动做账或账单调整
- 自动放开权限或越权操作

AI 在养老场景中应坚持：

**AI 先建议，人再确认。**

---

## 3. 推荐 Agent 体系

建议平台首期建设五类核心 Agent。

| Agent | 主要用户 | 核心目标 |
|-------|----------|----------|
| 入住评估 Agent | Admin / 护理主管 | 根据入住表单、病史、ADL、认知情况推荐护理级别与计划模板 |
| 家属问答 Agent | 家属 | 回答老人今日状态、护理执行、健康趋势 |
| 护理助手 Agent | 员工 / 护理主管 | 推荐任务优先级、护理建议、交接摘要 |
| 风险预警 Agent | Admin / 医护 | 预测跌倒、健康恶化、异常行为风险 |
| 运营分析 Agent | 院长 / 运营主管 | 汇总关键指标、解释波动、生成周报月报 |

可选增强 Agent：

- 设备诊断 Agent
- AI 数字陪护 Agent
- 心理关怀 Agent
- 质控审查 Agent

---

## 4. 统一 AI Agent 架构

建议采用统一的 AI Orchestrator + Tool Calling 架构：

```text
Admin / 家属 APP / 员工 APP
        │
        ▼
   AI Gateway / Orchestrator
        │
 ┌──────┼───────────────┬───────────────┐
 │      │               │               │
 ▼      ▼               ▼               ▼
Prompt  Tool Router     RAG 检索层       Guardrails
Layer   / Agent Runtime  / 知识库         / Policy
 │      │               │               │
 └──────┴──────┬────────┴───────────────┘
               ▼
        业务中台服务层
               │
      Elder / Care / Health / Device / Alert / Billing
               │
               ▼
          数据中台 / 日志 / 审计
```

### 4.1 架构分层说明

| 层级 | 职责 |
|------|------|
| Channel Layer | 接收来自 Admin、员工 APP、家属 APP 的请求 |
| Orchestrator | 选择 Agent、拆解任务、调度工具 |
| Tool Layer | 调用真实业务 API，不直接读写底层表 |
| RAG Layer | 查询知识库、制度、护理规范、FAQ、说明文档 |
| Guardrails | 做权限校验、敏感信息过滤、回答风格治理 |
| Observability | 记录提示词、工具调用、响应耗时、人工反馈 |

---

## 5. 核心 Agent 设计

## 5.1 入住评估 Agent

### 用户场景

在 `/elderly/checkin` 页面完成入住登记后，系统自动调用 AI 对老人信息进行结构化分析，并推荐护理级别。

### 输入数据

- 入住登记表基础信息
- 既往病史
- 慢病与用药信息
- 过敏史
- ADL / IADL 评估
- 认知状态
- 风险事件史

### 推荐工具

- `createAdmissionAssessment(payload)`
- `getCareLevelRules(organizationId)`
- `recommendCareLevel(assessmentId)`
- `generateCarePlanDraft(elderId, careLevelId)`
- `scheduleCareTasks(planId)`

### 输出结果

- 推荐护理级别
- 推荐原因摘要
- 评分或置信度
- 建议关注事项
- 建议护理计划模板

### 人工确认边界

- AI 只给建议，不直接最终定级
- 护理主管确认后，才允许生成正式护理计划
- 若人工调整结果与 AI 不一致，应记录偏差原因，作为后续优化样本

---

## 5.2 家属问答 Agent

### 用户问题示例

```text
妈妈今天状态怎么样？
今天血压有没有异常？
今天做了哪些护理？
什么时候可以视频探视？
```

### 依赖数据

- 老人基础档案摘要
- 今日护理执行记录
- 最近生命体征摘要
- 报警与异常处理摘要
- 探视与账单信息摘要

### 推荐工具

- `getElderSummary(elderId)`
- `getTodayCareExecutions(elderId)`
- `getLatestVitals(elderId)`
- `getRecentAlerts(elderId)`
- `getVisitAvailability(elderId)`

### 输出要求

- 语言必须家属友好
- 不输出过度专业术语
- 优先输出“结论 + 解释 + 建议动作”
- 对高风险情况必须提示联系机构，不给医疗诊断结论

---

## 5.3 护理助手 Agent

### 用户问题示例

```text
我这一班最优先要处理哪些任务？
张桂英今晚需要重点观察什么？
帮我生成交接班摘要。
```

### 依赖数据

- 当班护理任务
- 老人风险标签
- 最近报警
- 健康异常记录
- 历史执行偏差

### 推荐工具

- `listMyShiftTasks(staffId, shiftId)`
- `getElderRiskFlags(elderId)`
- `listOpenAlertsByShift(shiftId)`
- `getTaskExecutionHistory(elderId)`
- `createShiftSummary(shiftId)`

### 输出要求

- 优先级明确
- 结论可执行
- 必须标出高风险老人和高 SLA 任务
- 遇到医疗判断边界时提示医生复核

---

## 5.4 风险预警 Agent

### 目标

风险预警 Agent 不只是问答，而是事件驱动型智能代理。

建议重点识别：

- 跌倒风险
- 夜间离床风险
- 血压异常恶化风险
- 连续低氧风险
- 设备失联导致的监测盲区风险

### 输入数据

- 健康时序数据
- 设备实时数据
- 历史报警与处理结论
- 护理任务完成情况
- 老人风险画像

### 输出方式

- 在 Admin Dashboard 输出高风险名单
- 在员工 APP 输出重点关注提示
- 必要时直接生成 `alert_event` 或建议 `care_task`

### 人工介入边界

风险预警可自动触发“建议”与“提醒”，但是否升级为正式报警，应根据规则配置决定。

---

## 5.5 运营分析 Agent

### 用户问题示例

```text
本周护理完成率为什么下降？
哪个楼层报警最多？
设备在线率下降的主要原因是什么？
帮我生成一段院长周报摘要。
```

### 依赖数据

- Dashboard 聚合数据
- 护理任务完成率
- 报警统计
- 设备在线率
- 人员排班与任务负载

### 推荐工具

- `getDashboardMetrics(range, scope)`
- `getCareCompletionAnalysis(range, scope)`
- `getAlertBreakdown(range, scope)`
- `getDeviceAvailability(range, scope)`
- `generateOpsBrief(range, scope)`

### 输出要求

- 先给结论，再给解释
- 明确指标口径与时间窗口
- 避免编造不存在的数据原因
- 可导出为周报 / 月报摘要

---

## 6. 工具层设计建议

Agent 的核心不是 prompt，而是工具质量。建议工具层遵循以下原则。

### 6.1 只通过服务接口访问数据

不建议 Agent 直接查数据库。正确链路应为：

```text
Agent
→ Tool
→ Domain API / BFF
→ Service
→ Database
```

### 6.2 工具要返回结构化对象

例如不要只返回拼接好的大段文本，而要返回：

```json
{
  "elderId": "...",
  "latestVitals": [...],
  "riskLevel": "high",
  "todayTasks": [...]
}
```

这样才能保证：

- 回答可解释
- UI 可以复用同一份结果
- Agent 能进行多步推理

### 6.3 首批建议工具清单

| 工具名 | 说明 |
|--------|------|
| `getElderSummary` | 获取老人画像摘要 |
| `createAdmissionAssessment` | 创建入住评估记录 |
| `recommendCareLevel` | 获取 AI 护理级别建议 |
| `generateCarePlanDraft` | 生成护理计划草案 |
| `scheduleCareTasks` | 按计划生成任务与提醒 |
| `getLatestVitals` | 获取最新生命体征 |
| `getVitalTrend` | 获取时间范围内健康趋势 |
| `getTodayCareExecutions` | 获取今日护理执行情况 |
| `listMyShiftTasks` | 获取员工当班任务 |
| `listOpenAlerts` | 获取待处理报警 |
| `getDeviceStatusSummary` | 获取设备状态摘要 |
| `getBillingSummary` | 获取账单摘要 |
| `createFollowupTaskSuggestion` | 生成后续任务建议 |
| `publishFamilySummaryDraft` | 生成家属摘要草稿 |

---

## 7. 知识与检索架构

养老场景 AI 不只需要结构化数据，还需要制度与知识。

### 7.1 建议纳入 RAG 的知识内容

- 护理操作规范
- 用药与健康管理规则
- 家属常见问题 FAQ
- 探视制度
- 收费规则说明
- 设备说明与处理 SOP
- 风险预警解释模板

### 7.2 知识分层建议

| 层级 | 内容 |
|------|------|
| 通用知识 | 平台使用说明、制度、术语解释 |
| 机构知识 | 院区规则、探视安排、通知模板 |
| 老人上下文 | 个人护理等级、近期状态、风险摘要 |

### 7.3 检索边界

家属 Agent 与员工 Agent 应有不同检索权限：

- 家属 Agent 只可检索被授权老人的有限范围摘要
- 员工 Agent 只可检索其职责范围内老人和任务数据
- Admin Agent 才能查看全局分析数据

---

## 8. 安全与治理

### 8.1 权限控制

所有 Agent 请求必须带上：

- userId
- role
- organizationId
- scope

AI Orchestrator 在调用工具前必须先做权限校验。

### 8.2 回答治理

需要约束：

- 不给确诊性医疗建议
- 不输出越权老人信息
- 不展示未脱敏敏感身份信息
- 不基于缺失数据强行下结论

### 8.3 审计与观测

建议记录：

- prompt 输入摘要
- 调用的工具列表
- 工具返回摘要
- 最终回答
- 响应耗时
- 用户反馈
- 是否触发人工复核

### 8.4 人工兜底

以下场景必须设置人工确认：

- 高等级健康风险提示
- 护理计划变更建议
- 报警升级处理建议
- 家属投诉和敏感问答

---

## 9. 与当前工程的结合方式

当前 `nursing-admin-v2` 已具备 AI 入口页和多个聚合页面，适合作为首批 AI 展示与运营入口。

### 9.1 当前仓库优先承接的 AI 页面

- `/ai-assistant`：AI 统一入口页
- `/ai-assistant/inference`：AI 推理详情页
- `/ai-assistant/rules`：AI 规则治理页
- `/ai-assistant/logs`：AI 问答日志页
- `/ai-assistant/staff-app`：员工 APP + AI 预览页
- `/ai-assistant/family-app`：家属 APP + AI 预览页
- `/dashboard`：风险摘要卡片、AI 建议卡片
- `/elderly/checkin`：入住评估、护理级别建议与确认面板
- `/elderly/[id]`：老人详情 AI 状态摘要、家属摘要草稿、后续跟进建议
- `/health`：风险解释与趋势说明
- `/alerts`：报警解释与处理建议
- `/staff/tasks`：AI 任务优先级建议
- `/staff/[id]`：员工班次摘要、工作负荷提示、交接班草稿
- `/elderly/visits`：探视建议、家属沟通建议、视频探视引导
- `/analytics/report`：AI 周报 / 月报摘要

### 9.2 当前仓库优先接入的 AI 数据形态

先接入“结果型数据”，而不是先接入“自由对话大闭环”：

- 入住护理级别建议
- 护理计划草案
- 风险标签
- 任务建议
- 健康摘要
- 报警解释
- 周报摘要

当前仓库也可优先承接“APP + AI 的 Web 预览形态”，用于先验证：

- 员工 APP 首页 AI 班次摘要
- 员工 APP 任务页 AI 优先级与执行建议
- 员工 APP 报警页 AI 响应提示与交接摘要
- 家属 APP 今日状态 AI 总结
- 家属 APP 健康解释与护理说明
- 家属 APP 探视与视频沟通 AI 引导

这样可以先验证：

- 页面承载方式
- 信息密度
- 用户接受度
- 人工复核流程
- APP 场景的信息压缩方式
- 家属友好表达与员工可执行表达的差异

### 9.3 当前仓库不建议直接承担的 AI 能力

以下能力建议放到独立 AI 服务中：

- Prompt 编排中心
- 模型路由
- RAG 知识索引
- 工具运行时
- 安全与审计网关

Admin 只做：

- AI 结果展示
- AI 配置管理
- AI 日志查看
- AI 反馈运营入口

当前 Admin 仓库还可以额外承担：

- 员工 APP + AI 的高保真预览页
- 家属 APP + AI 的高保真预览页
- 跨端共享 AI 文案、解释模板与结果型数据原型

---

## 10. 分阶段落地路径

### 阶段 1：AI 结果展示

优先交付：

- Dashboard 风险摘要卡
- 老人详情 AI 状态摘要
- 报警解释卡片
- 员工任务建议卡片

### 阶段 2：AI 助手交互

优先交付：

- 家属问答 Agent
- 护理助手 Agent
- 运营分析 Agent
- 员工 APP 班次摘要与交接助手
- 家属 APP 今日状态卡片与护理说明草稿

### 阶段 3：AI 事件驱动

优先交付：

- 风险预警 Agent
- 自动建议任务生成
- 周期性智能周报

### 阶段 4：AI 治理平台化

优先交付：

- 跨端统一 AI 规则启停与版本状态
- 员工端 / 家属端 / Admin 端统一审计日志
- AI 反馈闭环与人工采纳率分析

优先交付：

- Prompt 版本管理
- 工具授权策略
- 反馈闭环
- A/B 实验与质量评估

结论：

养老平台中的 AI Agent 最佳落点不是“炫技聊天”，而是围绕护理、健康、报警、家属沟通和运营分析形成稳定的业务增强层。只有当 Agent 与真实工具、真实权限、真实数据和真实流程绑定时，它才会真正可落地。
