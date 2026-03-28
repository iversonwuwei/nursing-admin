"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  User,
  Heart,
  AlertTriangle,
  Pill,
  Activity,
  Calendar,
  CreditCard,
  Users,
  FileText,
  Plus,
} from "lucide-react";

const tabs = [
  { id: "basic", label: "基本信息", icon: <User className="w-3.5 h-3.5" /> },
  { id: "health", label: "健康档案", icon: <Heart className="w-3.5 h-3.5" /> },
  { id: "medicine", label: "用药记录", icon: <Pill className="w-3.5 h-3.5" /> },
  { id: "vitals", label: "生命体征", icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "fee", label: "费用记录", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: "visit", label: "来访记录", icon: <Users className="w-3.5 h-3.5" /> },
];

const elderlyData = {
  id: "1",
  name: "王秀英",
  gender: "女",
  age: 82,
  idCard: "310101194204156789",
  phone: "138****1234",
  room: "201",
  bed: "2号床",
  careLevel: "特级护理",
  admissionDate: "2022-03-15",
  healthStatus: "需关注",
  bloodType: "A型",
  allergy: "青霉素",
  chronic: "高血压、糖尿病",
  emergency: "硝苯地平、二甲双胍",
  contact: "李小红",
  contactRelation: "女儿",
  contactPhone: "139****5678",
};

const medications = [
  { name: "硝苯地平缓释片", dose: "20mg", frequency: "每日1次", time: "早餐后" },
  { name: "二甲双胍", dose: "0.5g", frequency: "每日2次", time: "餐中" },
  { name: "阿司匹林肠溶片", dose: "100mg", frequency: "每日1次", time: "睡前" },
];

const vitals = [
  { date: "03-20", bp: "145/90", hr: "76", temp: "36.5", glucose: "6.8" },
  { date: "03-19", bp: "142/88", hr: "74", temp: "36.4", glucose: "6.5" },
  { date: "03-18", bp: "148/92", hr: "78", temp: "36.6", glucose: "7.1" },
  { date: "03-17", bp: "140/86", hr: "73", temp: "36.3", glucose: "6.4" },
  { date: "03-16", bp: "143/89", hr: "75", temp: "36.5", glucose: "6.7" },
];

const fees = [
  { month: "2024-03", accommodation: 6000, care: 4000, food: 2000, total: 12000, status: "正常" },
  { month: "2024-02", accommodation: 6000, care: 4000, food: 2000, total: 12000, status: "已缴" },
  { month: "2024-01", accommodation: 6000, care: 4000, food: 2000, total: 12000, status: "已缴" },
];

const visits = [
  { date: "03-18 14:30", visitor: "李小红", relation: "女儿", duration: "1小时", note: "带水果" },
  { date: "03-15 10:00", visitor: "李明", relation: "儿子", duration: "2小时", note: "" },
  { date: "03-10 15:00", visitor: "李小红", relation: "女儿", duration: "1.5小时", note: "" },
];

export default function ElderlyDetailPage() {
  const [activeTab, setActiveTab] = useState("basic");

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/elderly" className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{elderlyData.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {elderlyData.gender} · {elderlyData.age}岁 · 房间 {elderlyData.room}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/elderly/${elderlyData.id}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            编辑
          </Link>
          <button className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <FileText className="w-4 h-4" />
            打印档案
          </button>
        </div>
      </div>

      {/* Health Alert */}
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-sm font-semibold text-danger">健康预警：需重点关注</p>
            <p className="text-xs text-danger/80 mt-0.5">血压偏高，血糖波动较大，建议增加监测频率</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* 基本信息 */}
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{elderlyData.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{elderlyData.name}</p>
                    <p className="text-sm text-muted-foreground">{elderlyData.gender} · {elderlyData.age}岁</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">身份证</span>
                    <span className="text-foreground font-mono text-xs">{elderlyData.idCard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">联系电话</span>
                    <span className="text-foreground">{elderlyData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">入住日期</span>
                    <span className="text-foreground">{elderlyData.admissionDate}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-danger" />
                  入住信息
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">房间号</span>
                    <span className="text-foreground font-semibold">{elderlyData.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">床位</span>
                    <span className="text-foreground">{elderlyData.bed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">护理等级</span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{elderlyData.careLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">健康状态</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                      {elderlyData.healthStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-success" />
                  紧急联系人
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">姓名</span>
                    <span className="text-foreground">{elderlyData.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">关系</span>
                    <span className="text-foreground">{elderlyData.contactRelation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">电话</span>
                    <span className="text-foreground">{elderlyData.contactPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 健康档案 */}
          {activeTab === "health" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "血型", value: elderlyData.bloodType, color: "border-l-primary" },
                  { label: "过敏源", value: elderlyData.allergy, color: "border-l-danger" },
                  { label: "慢病", value: elderlyData.chronic, color: "border-l-warning" },
                  { label: "紧急用药", value: elderlyData.emergency, color: "border-l-success" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl border border-border bg-card p-4 shadow-sm border-l-4 ${item.color}`}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 用药记录 */}
          {activeTab === "medicine" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">当前用药</h3>
              </div>
              <div className="divide-y divide-border">
                {medications.map((med, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{med.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{med.dose} · {med.frequency} · {med.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 生命体征 */}
          {activeTab === "vitals" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">近7天体征数据</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">日期</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">血压(mmHg)</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">心率(bpm)</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">体温(°C)</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">血糖(mmol/L)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vitals.map((v) => (
                      <tr key={v.date} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 text-sm text-muted-foreground">{v.date}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-foreground">{v.bp}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{v.hr}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{v.temp}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{v.glucose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 费用记录 */}
          {activeTab === "fee" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">月份</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">住宿费</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">护理费</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">餐费</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 px-4">合计</th>
                      <th className="text-center text-xs font-medium text-muted-foreground py-3 px-4">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fees.map((f) => (
                      <tr key={f.month} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{f.month}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">¥{f.accommodation.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">¥{f.care.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">¥{f.food.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground">¥{f.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            f.status === "正常" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                          }`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 来访记录 */}
          {activeTab === "visit" && (
            <div className="space-y-3">
              {visits.map((v, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4 shadow-sm hover:bg-accent/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{v.visitor}</span>
                      <span className="text-xs text-muted-foreground">{v.relation}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{v.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{v.note ? `${v.duration} · ${v.note}` : v.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
