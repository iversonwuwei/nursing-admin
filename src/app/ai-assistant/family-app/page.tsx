'use client'

import { AdminAiNav } from '@/components/ai/admin-ai-nav'
import { DataCard, PageHeader, StatCard, Tag } from '@/components/nh'
import { FAMILY_APP_AI_MODULES, FAMILY_APP_SUMMARIES, getVisitAiSuggestions } from '@/lib/mock/app-ai'
import { Bot, CalendarHeart, HeartPulse, MessageSquareHeart, Smartphone } from 'lucide-react'

export default function FamilyAppAiPage() {
  const visitSuggestions = getVisitAiSuggestions()

  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="家属 APP + AI 预览"
        subtitle="在当前 Web 仓库中预览家属端 AI 今日摘要、健康解释、探视助手与护理问答。"
        actions={<Tag variant="primary">Family Friendly</Tag>}
      />

      <AdminAiNav />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={<Smartphone size={18} />} label="预览模块" value={FAMILY_APP_AI_MODULES.length} sub="覆盖首页 / 健康 / 探视 / 问答" color="primary" />
        <StatCard icon={<HeartPulse size={18} />} label="状态摘要" value={FAMILY_APP_SUMMARIES.length} sub="家属友好表达" color="success" />
        <StatCard icon={<CalendarHeart size={18} />} label="探视建议" value={visitSuggestions.length} sub="现场 / 视频 / 沟通" color="warning" />
        <StatCard icon={<Bot size={18} />} label="当前阶段" value="预览" sub="先验证沟通体验" color="info" />
      </div>

      <div className="dashboard-grid-2" style={{ marginBottom: 16 }}>
        <DataCard icon={<Smartphone size={16} />} title="家属端 AI 模块" subtitle="先验证信任、透明、沟通三类体验，再迁移到真实 APP。">
          <div style={{ display: 'grid', gap: 10 }}>
            {FAMILY_APP_AI_MODULES.map(item => (
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

        <DataCard icon={<MessageSquareHeart size={16} />} title="今日状态 AI 摘要" subtitle="同样的数据到家属端必须转成更温和、更结论导向的表达。">
          <div style={{ display: 'grid', gap: 10 }}>
            {FAMILY_APP_SUMMARIES.map(item => (
              <div key={item.title} style={{ borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', padding: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: 'var(--color-text)' }}>{item.summary}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-muted)' }}>情绪标签 {item.mood}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.recommendation}</div>
              </div>
            ))}
          </div>
        </DataCard>
      </div>

      <DataCard icon={<CalendarHeart size={16} />} title="探视与沟通助手" subtitle="把探视安排、视频通话和家属沟通建议统一收口。">
        <div style={{ display: 'grid', gap: 10 }}>
          {visitSuggestions.map(item => (
            <div key={item.title} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</span>
                <Tag variant={item.type === '视频' ? 'info' : item.type === '现场' ? 'warning' : 'primary'}>{item.type}</Tag>
              </div>
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: 'var(--color-text)' }}>{item.summary}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{item.action}</div>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  )
}