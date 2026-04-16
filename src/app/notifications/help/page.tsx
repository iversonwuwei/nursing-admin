import { DataCard, InteractionRailLayout, PageHeader, Tag } from '@/components/nh'
import { BellRing, Send, Users } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsHelpPage() {
  return (
    <div className="page-root animate-fade-up">
      <PageHeader
        title="通知中心帮助"
        subtitle="承接通知页的渠道说明、升级规则和广播口径，避免主工作台被长说明占满。"
        actions={<Link href="/notifications" className="btn btn-secondary btn-sm">返回通知中心</Link>}
      />

      <InteractionRailLayout
        main={(
          <>
            <DataCard icon={<Send size={16} />} title="主任务顺序" badge={<Tag variant="warning">Notification Workflow</Tag>}>
              <div className="page-help-card-list">
                <div className="page-help-card-item">先处理待发送和失败消息，再处理已读后的补充备注与升级动作。</div>
                <div className="page-help-card-item">探视通知和公告广播属于专项通道，页面只保留计数概览，完整说明迁到本页。</div>
                <div className="page-help-card-item">如果当前队列为空，以 live 空态为准，不再把 demo 说明混入工作台首屏。</div>
              </div>
            </DataCard>

            <DataCard icon={<BellRing size={16} />} title="渠道与升级规则" subtitle="帮助页保留完整规则，主页面只保留当前状态与入口。">
              <div className="page-help-card-list">
                <div className="page-help-card-item">短信 / 推送：承接账单、催缴、异常和运营通知。</div>
                <div className="page-help-card-item">探视通知：承接预约确认、改期、签到提醒和触达留痕。</div>
                <div className="page-help-card-item">定时提醒 / 广播：承接护理计划、用药、回访和面向机构范围的公告。</div>
              </div>
            </DataCard>
          </>
        )}
        rail={(
          <DataCard icon={<Users size={16} />} title="失败边界" badge={<Tag variant="info">Escalation</Tag>}>
            <div className="page-help-card-list">
              <div className="page-help-card-item">发送失败或长时间待发送的消息，应进入人工补发或主管升级，而不是停留在说明卡片里。</div>
              <div className="page-help-card-item">live 模式下页面只读展示真实通知数据；demo 模式下才展示本地提醒闭环编辑能力。</div>
              <div className="page-help-card-item">帮助页用于说明口径，不替代页面内的实时 API 状态卡与空态提示。</div>
            </div>
          </DataCard>
        )}
      />
    </div>
  )
}