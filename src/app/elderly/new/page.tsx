"use client";

import { DataCard } from "@/components/nh";
import {
  addAdmissionApplication,
  CARE_LEVELS,
  COGNITIVE_LEVELS,
  EMPTY_FORM,
  validateAdmissionForm,
  type AdmissionFormState,
  type CareLevel,
} from "@/lib/mock/assessment-workflow";
import { AlertCircle, ArrowLeft, Bot, ClipboardCheck, Save, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass = "input";
const textareaStyle = { width: "100%", height: "auto", padding: "10px 12px", resize: "vertical" } as const;

export default function NewElderlyPage() {
  const router = useRouter();
  const [form, setForm] = useState<AdmissionFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm<K extends keyof AdmissionFormState>(key: K, value: AdmissionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateAdmissionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const application = addAdmissionApplication(form);
    router.push(`/elderly/checkin?selected=${application.id}&entry=elderly-new`);
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
          <DataCard icon={<User size={18} />} title="基础信息" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">姓名 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="text" className={inputClass} placeholder="请输入姓名" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              </div>
              <div>
                <label className="form-label">性别 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <select className={inputClass} value={form.gender} onChange={(event) => updateForm("gender", event.target.value as AdmissionFormState["gender"])}>
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="form-label">年龄 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="number" className={inputClass} placeholder="请输入年龄" value={form.age} onChange={(event) => updateForm("age", event.target.value)} />
              </div>
              <div>
                <label className="form-label">申请护理等级</label>
                <select className={inputClass} value={form.requestedLevel} onChange={(event) => updateForm("requestedLevel", event.target.value as CareLevel)}>
                  {CARE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">联系电话 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="tel" className={inputClass} placeholder="请输入手机号" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </div>
              <div>
                <label className="form-label">入住房间 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="text" className={inputClass} placeholder="如 201-1" value={form.room} onChange={(event) => updateForm("room", event.target.value)} />
              </div>
              <div className="form-grid-full">
                <label className="form-label">紧急联系人 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="text" className={inputClass} placeholder="姓名 + 电话，如 张敏 13900001111" value={form.emergency} onChange={(event) => updateForm("emergency", event.target.value)} />
              </div>
            </div>
          </DataCard>
        </div>

        <div style={{ marginTop: 16 }}>
          <DataCard icon={<ShieldCheck size={18} />} title="评估输入" bodyClassName="form-section">
            <div className="form-grid">
              <div>
                <label className="form-label">ADL 评分 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <input type="number" className={inputClass} placeholder="0 - 100" value={form.adlScore} onChange={(event) => updateForm("adlScore", event.target.value)} />
              </div>
              <div>
                <label className="form-label">认知状态 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                <select className={inputClass} value={form.cognitiveLevel} onChange={(event) => updateForm("cognitiveLevel", event.target.value as AdmissionFormState["cognitiveLevel"])}>
                  <option value="">请选择</option>
                  {COGNITIVE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div className="form-grid-full">
                <label className="form-label">慢病与既往病史</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：高血压、糖尿病、冠心病" value={form.chronicConditions} onChange={(event) => updateForm("chronicConditions", event.target.value)} />
              </div>
              <div>
                <label className="form-label">长期用药</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：缬沙坦、二甲双胍" value={form.medicationSummary} onChange={(event) => updateForm("medicationSummary", event.target.value)} />
              </div>
              <div>
                <label className="form-label">过敏史</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：青霉素过敏 / 无" value={form.allergySummary} onChange={(event) => updateForm("allergySummary", event.target.value)} />
              </div>
              <div className="form-grid-full">
                <label className="form-label">风险备注</label>
                <textarea className={inputClass} rows={3} style={textareaStyle} placeholder="例如：近半年有跌倒史、吞咽困难、夜间失眠、压疮风险" value={form.riskNotes} onChange={(event) => updateForm("riskNotes", event.target.value)} />
              </div>
            </div>
          </DataCard>
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
    </div>
  );
}
