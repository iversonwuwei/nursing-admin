'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { STAFF_APP_AI_MODULES, STAFF_APP_FOCUS } from '@/lib/mock/app-ai'
import { BellRing, Bot, ClipboardList, Smartphone, Sparkles } from 'lucide-react'

export default function StaffAppAiPage() {
  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="员工 APP + AI 预览"
        subtitle="在当前 Web 仓库中预览员工端 AI 首页、任务助手、报警提示和交接班摘要。"
        actions={<Tag variant="primary">Web Prototype</Tag>}
      />

      <AdminAiNav />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Smartphone size={18} />} label="预览模块" value={STAFF_APP_AI_MODULES.length} sub="覆盖首页 / 任务 / 报警 / 交接" color="primary" />
        <StatCard icon={<ClipboardList size={18} />} label="重点任务" value={STAFF_APP_FOCUS.filter(item => item.severity !== '常规').length} sub="适合上班即看" color="warning" />
        <StatCard icon={<BellRing size={18} />} label="报警提示" value={2} sub="高风险动作建议" color="danger" />
        <StatCard icon={<Bot size={18} />} label="当前阶段" value="预览" sub="先验证信息结构" color="info" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard icon={<Smartphone size={16} />} title="员工端 AI 模块" subtitle="当前先用 Web 原型承接，后续可迁移到 Flutter 页面。">
          <div style={{ display: 'grid', gap: 10 }}>
            {STAFF_APP_AI_MODULES.map(item => (
              <div key={item.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                  <Tag variant={item.status === '已接入' ? 'success' : 'warning'}>{item.status}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-muted)' }}>{item.summary}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.primaryMetric}</div>
              </div>
            ))}
          </div>
        </DataCard>

        <DataCard icon={<Sparkles size={16} />} title="班次首页 AI 摘要" subtitle="强调“先结论、后解释、再动作”的移动端压缩表达。">
          <div style={{ display: 'grid', gap: 10 }}>
            {STAFF_APP_FOCUS.map(item => (
              <div key={item.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                  <Tag variant={item.severity === '高' ? 'danger' : item.severity === '中' ? 'warning' : 'info'}>{item.severity}</Tag>
                </div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.reason}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-muted)' }}>{item.slaHint}</div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      <DataCard icon={<Bot size={16} />} title="员工端 AI 表达原则" subtitle="同一份 AI 能力在员工端必须更短、更可执行、更强调 SLA。">
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            '员工端 AI 首屏优先展示 3 条以内的重点对象，不应把所有解释堆成长文本。',
            '对报警和任务建议，必须输出“先做什么”，而不是只解释为什么。',
            '交接班 AI 草稿要默认突出未闭环任务、异常对象和下一班动作。',
          ].map(item => (
            <div key={item} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>
              {item}
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}