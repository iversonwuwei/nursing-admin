"use client";

import { InstitutionalAdmissionFormSections } from "@/components/elderly/InstitutionalAdmissionFormSections";
import { DataCard, InteractionRailLayout, PageHelpCard, Tag } from "@/components/nh";
import { createAdminElderAdmission } from "@/lib/elderly/admin-elderly-api";
import { buildAdminCreateElderAdmissionRequest } from "@/lib/elderly/admin-elderly-form";
import {
  EMPTY_FORM,
  upsertAdmissionApplication,
  validateAdmissionForm,
  type AdmissionFormState,
} from "@/lib/mock/assessment-workflow";
import { AlertCircle, ArrowLeft, Bot, ClipboardCheck, Save, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewElderlyPage() {
  const router = useRouter();
  const [form, setForm] = useState<AdmissionFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const helpHref = "/elderly/help";

  function updateForm<K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateAdmissionForm(form, { requireInstitutionalEntrustment: true });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const admission = await createAdminElderAdmission(buildAdminCreateElderAdmissionRequest(form));
      const application = upsertAdmissionApplication(admission.elderId, form, {
        fallbackId: admission.elderId,
        fallbackStatus: "待人工确认",
        fallbackCreatedAt: admission.createdAtUtc.slice(0, 10),
        sourceType: "manual-form",
        sourceLabel: "Elder Service 主档",
        sourceSummary: "已同步 elder profile 主档，并保留本地 workflow 兼容快照。",
      });

      router.push(`/elderly/checkin?selected=${application.id}&entry=elderly-new`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "老人建档失败，请稍后重试。");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>新增老人</h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>录入首批主数据后，进入个案评定与认定结论生成闭环。</p>
        </div>
      </div>

      <InteractionRailLayout
        main={(
          <>
            <DataCard
              icon={<Bot size={18} />}
              title="新建闭环说明"
              subtitle="当前先落地老人创建的首条闭环，后续机构、房间、活动等新建流程复用同一治理范式。"
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {[
                  { title: "1. 首次录入", description: "采集入住评估最小字段集，避免先建空档案。", icon: <User size={16} /> },
                  { title: "2. AI 建议", description: "提交后立即生成护理等级建议与关注标签。", icon: <Bot size={16} /> },
                  { title: "3. 人工确认", description: "跳转个案评定页，由评估主管确认或调整级别。", icon: <ClipboardCheck size={16} /> },
                  { title: "4. 闭环入册", description: "计划同步任务与提醒，标记已入住后进入老人台账。", icon: <ShieldCheck size={16} /> },
                ].map((item) => (
                  <div key={item.title} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 14, background: "var(--color-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                      {item.icon}
                      {item.title}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)" }}>{item.description}</div>
                  </div>
                ))}
              </div>
            </DataCard>

            <form onSubmit={handleSubmit}>
              {error ? (
                <div className="form-error" style={{ marginTop: 16 }}>
                  <AlertCircle size={16} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
                  <span className="form-error-text">{error}</span>
                </div>
              ) : null}

              <div style={{ marginTop: 16 }}>
                <InstitutionalAdmissionFormSections form={form} onChange={updateForm} />
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
                <Link href="/elderly" className="btn btn-ghost btn-md">取消</Link>
                <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
                  {loading ? (
                    <span className="login-spinner animate-spin" />
                  ) : (
                    <>
                      <Save size={15} />提交并进入个案评定
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
        rail={(
          <>
            <DataCard title="新建边界" subtitle="主区只保留录入表单和提交动作。" badge={<Tag variant="warning">Boundary</Tag>}>
              <div style={{ display: "grid", gap: 10 }}>
                <div className="page-help-card-item">提交后先进入个案评定，不直接回到老人台账。</div>
                <div className="page-help-card-item">AI 建议只作为认定前辅助，最终结论仍由人工确认。</div>
                <div className="page-help-card-item">完整页面定位和认定边界迁移到帮助页。</div>
              </div>
            </DataCard>

            <PageHelpCard
              title="页面帮助"
              subtitle="完整老人建档说明迁移到显式帮助页"
              summary="新增老人页现在只保留录入闭环和表单字段，页面解释与认定顺序统一后置。"
              items={[
                '先录入首批主数据，再提交进入个案评定。',
                '认定前不直接进入稳定老人台账。',
                '若需要完整说明，进入老人帮助页查看。',
              ]}
              href={helpHref}
              actionLabel="查看老人帮助"
            />
          </>
        )}
      />
    </div>
  );
}
