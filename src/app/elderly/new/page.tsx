"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Heart, Phone, AlertCircle } from "lucide-react";

export default function NewElderlyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push("/elderly");
  };

  const inputClass = `w-full h-9 px-3 rounded-lg border border-border text-sm text-foreground bg-background
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                       placeholder:text-muted-foreground transition-colors`;

  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/elderly"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">新增老人</h1>
          <p className="text-sm text-muted-foreground mt-0.5">填写老人基本信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5 border border-danger/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-3 border-b border-border">
            <User className="w-4 h-4 text-primary" />
            基本信息
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>姓名 <span className="text-danger">*</span></label>
              <input type="text" required placeholder="请输入姓名" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>性别 <span className="text-danger">*</span></label>
              <select required className={`${inputClass} cursor-pointer`}>
                <option value="">请选择</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>年龄 <span className="text-danger">*</span></label>
              <input type="number" required min={60} max={120} placeholder="60~120" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>身份证号</label>
              <input type="text" maxLength={18} placeholder="18位身份证号" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>房间号 <span className="text-danger">*</span></label>
              <input type="text" required placeholder="如 2-101" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>护理等级 <span className="text-danger">*</span></label>
              <select required className={`${inputClass} cursor-pointer`}>
                <option value="">请选择</option>
                <option>特级护理</option>
                <option>一级护理</option>
                <option>二级护理</option>
                <option>三级护理</option>
              </select>
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-3 border-b border-border">
            <Heart className="w-4 h-4 text-danger" />
            健康档案
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>血型</label>
              <select className={`${inputClass} cursor-pointer`}>
                <option value="">请选择</option>
                <option>A型</option>
                <option>B型</option>
                <option>AB型</option>
                <option>O型</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>慢性病</label>
              <input type="text" placeholder="如 高血压、糖尿病" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>过敏史</label>
              <input type="text" placeholder="如 青霉素、海鲜" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>紧急用药</label>
              <input type="text" placeholder="如 速效救心丸" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-3 border-b border-border">
            <Phone className="w-4 h-4 text-success" />
            紧急联系人
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>联系人姓名</label>
              <input type="text" placeholder="请输入联系人姓名" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>关系</label>
              <input type="text" placeholder="如 儿子、女儿" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>联系电话</label>
              <input type="tel" placeholder="请输入联系电话" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/elderly"
            className="h-9 px-4 rounded-xl border border-border bg-card text-sm text-foreground
                       hover:bg-accent/50 transition-colors flex items-center"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-5 bg-primary hover:bg-primary/90 disabled:bg-primary/50
                       text-primary-foreground text-sm font-medium rounded-xl
                       flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
