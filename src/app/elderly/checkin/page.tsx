"use client"
import { useState } from "react"
import { UserPlus, CalendarDays, Home as HomeIcon, Phone, Shield, Plus, Search } from "lucide-react"
import { DataCard, Tag } from "@/components/nh"

const ELDERLY_LIST = [
  { id: "E001", name: "张桂英", age: 82, gender: "女", room: "201-1", level: "特级护理", status: "待审核", date: "2026-03-28" },
  { id: "E002", name: "王建国", age: 78, gender: "男", room: "203-2", level: "一级护理", status: "待审核", date: "2026-03-27" },
  { id: "E003", name: "李秀兰", age: 85, gender: "女", room: "205-1", level: "二级护理", status: "已入住", date: "2026-03-20" },
]

export default function CheckinPage() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", age: "", gender: "", phone: "", emergency: "", room: "", level: "二级护理", note: "" })

  const filtered = ELDERLY_LIST.filter(e => e.name.includes(search) || e.id.includes(search))

  return (
    <div className="page-root animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>办理入住</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>新建入住登记 · 共 {ELDERLY_LIST.length} 条待审核</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />新建入住
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "本月新增", value: 8, icon: UserPlus, color: "var(--color-primary)", bg: "var(--color-primary-light)" },
          { label: "待审核", value: 2, icon: CalendarDays, color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
          { label: "已入住", value: 124, icon: HomeIcon, color: "var(--color-success)", bg: "rgba(34,197,94,0.1)" },
          { label: "本月退住", value: 3, icon: Shield, color: "var(--color-danger)", bg: "rgba(239,68,68,0.1)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="data-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em", marginTop: 4 }}>{value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <DataCard>
          <div className="data-card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="data-card-icon-wrap" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                <UserPlus size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">入住登记表</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>请填写老人基本信息</div>
              </div>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { label: "姓名", key: "name", placeholder: "请输入姓名", type: "text" },
              { label: "年龄", key: "age", placeholder: "请输入年龄", type: "number" },
              { label: "联系电话", key: "phone", placeholder: "手机号码", type: "tel" },
              { label: "紧急联系人", key: "emergency", placeholder: "姓名+电话", type: "text" },
              { label: "入住房间", key: "room", placeholder: "如 201-1", type: "text" },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  className="input"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>性别</label>
              <div className="select-wrap" style={{ width: "100%" }}>
                <select className="select" style={{ width: "100%" }} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>护理等级</label>
              <div className="select-wrap" style={{ width: "100%" }}>
                <select className="select" style={{ width: "100%" }} value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  {["特级护理", "一级护理", "二级护理", "三级护理"].map(l => <option key={l}>{l}</option>)}
                </select>
                <span className="select-arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>备注</label>
              <textarea className="input" placeholder="健康状况、过敏史、特殊需求..." rows={3} style={{ width: "100%", height: "auto", padding: "10px 12px", resize: "vertical" }} />
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
            <button className="btn btn-primary">提交审核</button>
          </div>
        </DataCard>
      )}

      {/* List */}
      <DataCard>
        <div className="data-card-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="data-card-icon-wrap" style={{ background: "rgba(59,130,246,0.1)", color: "var(--color-info)" }}>
              <CalendarDays size={18} />
            </div>
            <div>
              <div className="text-sm font-bold">入住申请</div>
              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>待审核入住申请</div>
            </div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>姓名</th><th>年龄</th><th>性别</th><th>入住房间</th><th>护理等级</th><th>申请日期</th><th>状态</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td><div className="font-semibold text-sm">{e.name}</div><div className="text-[10px]" style={{ color: "var(--color-muted)" }}>{e.id}</div></td>
                  <td><span className="text-sm">{e.age}岁</span></td>
                  <td><span className="text-sm">{e.gender}</span></td>
                  <td><span className="text-sm">{e.room}</span></td>
                  <td><Tag variant={e.level === "特级护理" ? "danger" : e.level === "一级护理" ? "warning" : "info"}>{e.level}</Tag></td>
                  <td><span className="text-xs" style={{ color: "var(--color-muted)" }}>{e.date}</span></td>
                  <td><Tag variant={e.status === "待审核" ? "warning" : "success"}>{e.status}</Tag></td>
                  <td><button className="btn btn-primary btn-sm" style={{ fontSize: 12, height: 28 }}>审核</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </div>
  )
}
