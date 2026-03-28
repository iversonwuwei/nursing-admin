"use client";

import { useState, useMemo } from "react";
import { equipmentList, equipmentAlarms, equipmentCategories } from "@/lib/data";
import { Equipment } from "@/lib/types";

export default function EquipmentPage() {
  const [category, setCategory] = useState("全部");

  const filtered = useMemo((): Equipment[] => {
    if (category === "全部") return equipmentList;
    return equipmentList.filter(e => e.category === category);
  }, [category]);

  const stats = useMemo(() => ({
    total:       equipmentList.length,
    normal:     equipmentList.filter(e => e.status === "正常").length,
    maintenance: equipmentList.filter(e => e.status === "维修中").length,
    fault:      equipmentList.filter(e => e.status === "待维修").length,
    warning:    equipmentAlarms.filter(a => a.status === "待处理").length,
  }), []);

  const pendingAlarms = useMemo(() => equipmentAlarms.filter(a => a.status === "待处理"), []);

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">设备管理</h1>
          <p className="text-xs mt-0.5 text-muted-foreground">共 {filtered.length} 台设备</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加设备
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "设备总数",   value: stats.total,       borderColor: "border-l-primary",   badge: "bg-primary/10 text-primary" },
          { label: "正常运行",   value: stats.normal,      borderColor: "border-l-success",   badge: "text-success" },
          { label: "维修中",     value: stats.maintenance, borderColor: "border-l-warning",   badge: "text-warning" },
          { label: "待维修",     value: stats.fault,       borderColor: "border-l-danger",    badge: "text-danger" },
          { label: "待处理告警", value: stats.warning,     borderColor: "border-l-danger",    badge: "text-danger" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 ${s.borderColor}`}>
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.badge}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alarms */}
      {pendingAlarms.length > 0 && (
        <div className="rounded-xl border p-4 border-red-500/30 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className="font-bold text-sm text-foreground">待处理告警 {pendingAlarms.length} 条</h3>
          </div>
          <div className="space-y-2">
            {pendingAlarms.map(alarm => (
              <div key={alarm.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 border-red-500/20 bg-card">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`
                    inline-flex px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0
                    ${alarm.type === "故障" || alarm.type === "异常" ? "bg-red-500 text-white" : ""}
                    ${alarm.type === "维保到期" ? "bg-amber-500 text-white" : ""}
                    ${alarm.type === "电量不足" ? "bg-muted text-muted-foreground" : ""}
                  `}>
                    {alarm.type}
                  </span>
                  <span className="text-xs font-semibold truncate text-foreground">{alarm.equipmentName}</span>
                  <span className="text-xs truncate text-muted-foreground">{alarm.message}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{alarm.createdAt}</span>
                  <button className="h-7 px-3 rounded-lg text-xs font-medium text-white cursor-pointer transition-opacity hover:opacity-90 bg-red-500">
                    处理
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {equipmentCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`
              inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all cursor-pointer
              ${category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border"}
            `}
          >
            {cat}
          </button>
        ))}
        {category !== "全部" && (
          <button onClick={() => setCategory("全部")}
            className="inline-flex items-center h-8 px-3 rounded-lg text-xs transition-colors cursor-pointer text-muted-foreground">
            清除
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["设备名称", "分类", "型号", "序列号", "位置", "状态", "维护日期", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs text-muted-foreground">暂无数据</td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm text-foreground">{e.name}</div>
                    <div className="text-[10px] font-mono mt-0.5 text-muted-foreground">{e.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`
                      inline-flex px-2 py-0.5 rounded-md text-xs font-semibold
                      ${e.category === "医疗设备" ? "bg-danger/10 text-danger" : ""}
                      ${e.category === "康复设备" ? "bg-primary/10 text-primary" : ""}
                      ${e.category === "生活设备" ? "bg-muted text-muted-foreground" : ""}
                      ${e.category === "智能设备" ? "bg-amber-50 text-amber-600" : ""}
                    `}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.model}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-muted-foreground">{e.serialNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.location}</td>
                  <td className="px-4 py-3">
                    <span className={`
                      inline-flex px-2 py-0.5 rounded-md text-xs font-semibold
                      ${e.status === "正常" ? "bg-success/10 text-success" : ""}
                      ${e.status === "维修中" ? "bg-amber-50 text-amber-600" : ""}
                      ${e.status === "已报废" ? "bg-muted text-muted-foreground" : ""}
                      ${e.status === "待维修" ? "bg-danger/10 text-danger" : ""}
                    `}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{e.maintenanceDate}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                      详情 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
