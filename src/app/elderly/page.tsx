"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { elderlyList } from "@/lib/data";

const NURSING_LEVELS = ["全部", "特级护理", "全护理", "半自理", "自理"];
const STATUS_OPTIONS = ["全部", "入住", "离院", "待入住"];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "特级护理": { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  "全护理":   { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
  "半自理":   { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  "自理":     { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "入住":    { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
  "离院":    { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  "待入住":  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
};

export default function ElderlyListPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("全部");
  const [status, setStatus] = useState("全部");

  const filtered = useMemo(() => {
    return elderlyList.filter((e) => {
      const matchSearch = !search || e.name.includes(search) || e.roomNumber.includes(search);
      const matchLevel = level === "全部" || e.careLevel === level;
      const matchStatus = status === "全部" || e.status === status;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [search, level, status]);

  const clearAll = () => { setSearch(""); setLevel("全部"); setStatus("全部"); };
  const hasFilters = search || level !== "全部" || status !== "全部";

  const statInHospital = filtered.filter(e => e.status === "入住").length;
  const statCritical   = filtered.filter(e => e.careLevel === "特级护理").length;
  const statPending    = filtered.filter(e => e.status === "待入住").length;

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">老人管理</h1>
          <p className="text-xs text-muted-foreground mt-0.5">共 {filtered.length} 位登记</p>
        </div>
        <Link
          href="/elderly/new"
          className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新增
        </Link>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-primary">
          <div className="text-xs font-medium text-muted-foreground">在院</div>
          <div className="text-2xl font-bold text-foreground mt-1">{statInHospital}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-danger">
          <div className="text-xs font-medium text-muted-foreground">特级护理</div>
          <div className="text-2xl font-bold text-foreground mt-1">{statCritical}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 border-l-warning">
          <div className="text-xs font-medium text-muted-foreground">待入住</div>
          <div className="text-2xl font-bold text-foreground mt-1">{statPending}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名或房间号..."
              className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-input bg-background focus:border-ring focus:ring-1 focus:ring-ring transition-colors outline-none"
            />
          </div>

          {/* Selects */}
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:border-ring focus:ring-1 focus:ring-ring transition-colors outline-none cursor-pointer"
          >
            {NURSING_LEVELS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:border-ring focus:ring-1 focus:ring-ring transition-colors outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["姓名", "房间", "护理等级", "既往病史", "入住日期", "状态", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">暂无数据</td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors last:border-0">
                  {/* 姓名 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-muted-foreground">{e.name.slice(0, 1)}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.gender} · {e.age}岁</div>
                      </div>
                    </div>
                  </td>
                  {/* 房间 */}
                  <td className="px-4 py-3 text-muted-foreground text-sm">{e.roomNumber}</td>
                  {/* 护理等级 */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
                      style={{
                        background: LEVEL_COLORS[e.careLevel]?.bg ?? '#F3F4F6',
                        color: LEVEL_COLORS[e.careLevel]?.text ?? '#6B7280',
                        borderColor: LEVEL_COLORS[e.careLevel]?.border ?? '#E5E7EB',
                      }}>
                      {e.careLevel}
                    </span>
                  </td>
                  {/* 病史 */}
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">
                    {e.medicalHistory.length > 0 ? e.medicalHistory.join("、") : "—"}
                  </td>
                  {/* 入住日期 */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(e.checkInDate).toLocaleDateString("zh-CN")}
                  </td>
                  {/* 状态 */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
                      style={{
                        background: STATUS_COLORS[e.status]?.bg ?? '#F3F4F6',
                        color: STATUS_COLORS[e.status]?.text ?? '#6B7280',
                        borderColor: STATUS_COLORS[e.status]?.border ?? '#E5E7EB',
                      }}>
                      {e.status}
                    </span>
                  </td>
                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <Link href={`/elderly/${e.id}`} className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
                      详情 →
                    </Link>
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
