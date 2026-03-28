"use client";

import { useState, useMemo } from "react";
import { organizations, totalStats } from "@/lib/data";

export default function OrganizationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => organizations.find(o => o.id === selectedId) || null, [selectedId]);

  const occRate = (o: typeof organizations[0]) =>
    o.totalBeds > 0 ? Math.round((o.occupiedBeds / o.totalBeds) * 100) : 0;

  const rateColor = (rate: number) =>
    rate >= 90 ? "bg-red-500" : rate >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">机构管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">共 {organizations.length} 家连锁机构</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新增机构
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-purple-500">
          <div className="text-xs font-medium text-muted-foreground">机构总数</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalStats.totalOrgs}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-gray-400">
          <div className="text-xs font-medium text-muted-foreground">床位总数</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalStats.totalBeds}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-emerald-500">
          <div className="text-xs font-medium text-muted-foreground">入住人数</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalStats.totalElderly}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-amber-500">
          <div className="text-xs font-medium text-muted-foreground">平均入住率</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalStats.avgOccupancy}%</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["机构名称", "地址", "床位", "入住率", "员工", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organizations.map(org => {
                const rate = occRate(org);
                const isSelected = selectedId === org.id;
                return (
                  <tr
                    key={org.id}
                    onClick={() => setSelectedId(isSelected ? null : org.id)}
                    className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${isSelected ? 'bg-muted/30' : 'hover:bg-muted/20'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-sm">{org.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{org.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{org.address}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm whitespace-nowrap">
                      {org.occupiedBeds}/{org.totalBeds}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rateColor(rate)}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{org.staffCount} 人</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedId(org.id); }}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        详情 →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">{selected.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{selected.address}</p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "床位使用",   value: `${selected.occupiedBeds}/${selected.totalBeds}` },
              { label: "入住率",     value: `${occRate(selected)}%` },
              { label: "员工数量",   value: `${selected.staffCount} 人` },
              { label: "入住老人",   value: `${selected.elderlyCount} 人` },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl border border-border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="text-base font-bold text-foreground tracking-tight">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
