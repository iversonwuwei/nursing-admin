"use client"
import { Bot, Clock, Send, Sparkles, ThumbsUp, User } from "lucide-react"
import { useState } from "react"

const SUGGESTIONS = [
  "分析本月护理质量报告",
  "生成下周排班建议",
  "统计各楼层入住率",
  "查找本周异常情况",
]

const HISTORY = [
  { q: "本月护理质量如何？", a: "本月护理质量整体良好，KPI得分92分。主要扣分项：摔倒事件2起（同比减少1起），压疮发生0例（达标），用药准时率98.5%（达标）。", time: "10:30", useful: true },
  { q: "有哪些老人需要重点关注？", a: "以下3位老人需要重点关注：①张桂英（201-1）- 血压持续偏高，建议调整用药；②李秀兰（205-1）- 血糖波动较大；③王建国（203-2）- 最近情绪低落，建议增加心理关怀。", time: "10:15", useful: true },
]

export default function AIAssistantPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{role: "user" | "ai"; content: string}[]>([])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: "user", content: input }])
    setInput("")
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", content: "正在分析您的请求，请稍候..." }])
    }, 800)
  }

  return (
    <div className="page-root animate-fade-up ai-page">
      <div className="ai-header">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.03em" }}>AI助手</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>智能分析 · 数据洞察 · 管理建议</p>
        </div>
        <div className="ai-status">
          <span className="ai-status-dot" style={{ background: "var(--color-success)" }} />AI运行中
        </div>
      </div>

      <div className="ai-layout">
        {/* Chat area */}
        <div className="data-card ai-chat-card">
          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-empty">
                <div className="ai-empty-icon" style={{ background: "linear-gradient(145deg, var(--color-primary-light), var(--color-primary))" }}>
                  <Bot size={28} style={{ color: "white" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="ai-empty-title">您好，我是AI助手</div>
                  <div className="ai-empty-sub">可以问我关于养老院运营管理的任何问题</div>
                </div>
                <div className="ai-suggestions">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); handleSend() }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      <Sparkles size={12} style={{ color: "var(--color-primary)" }} />{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="ai-message">
                <div className="ai-avatar" style={{ background: msg.role === "ai" ? "var(--color-primary-light)" : "rgba(59,130,246,0.1)" }}>
                  {msg.role === "ai" ? <Bot size={16} style={{ color: "var(--color-primary)" }} /> : <User size={16} style={{ color: "var(--color-info)" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>{msg.role === "ai" ? "AI助手" : "我"}</div>
                  <div className={`ai-bubble ${msg.role === "ai" ? "ai" : "user"}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="ai-input-row">
            <div className="input-wrap" style={{ flex: 1 }}>
              <textarea
                className="input"
                placeholder="输入问题，AI助手将为您解答..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={1}
                style={{ width: "100%", resize: "none", height: 44, padding: "10px 14px" }}
              />
            </div>
            <button className="btn btn-primary btn-icon" onClick={handleSend} style={{ height: 44, width: 44, flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="ai-sidebar">
          <div className="data-card ai-history-card">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>最近对话</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {HISTORY.map((h, i) => (
                <div key={i} className="ai-history-item">
                  <div className="ai-history-q">Q: {h.q}</div>
                  <div className="ai-history-a">{h.a.substring(0, 60)}...</div>
                  <div className="ai-history-meta">
                    <span className="ai-history-time"><Clock size={10} />{h.time}</span>
                    {h.useful && <span className="ai-history-useful"><ThumbsUp size={10} />有用</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="data-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>快捷功能</div>
            <div className="ai-quick-funcs">
              {["生成月度报告","智能排班建议","老人健康摘要","护理质量分析"].map(f => (
                <button key={f} className="btn btn-ghost ai-quick-btn">
                  <Sparkles size={12} style={{ color: "var(--color-primary)" }} />{f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
