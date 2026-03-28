'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

const elderlyData = {
  name: '王秀英',
  gender: '女',
  age: 82,
  idCard: '31010119420512XXXX',
  room: '2-101',
  careLevel: '特级护理',
  bloodType: 'A型',
  chronic: '高血压、糖尿病',
  allergy: '青霉素',
  emergency: '速效救心丸',
  contact: '王小明',
  contactRelation: '儿子',
  contactPhone: '13812345678',
};

export default function EditElderlyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push('/elderly/1');
  };

  const inputClass = `w-full h-9 px-3 rounded-lg border border-input text-sm text-foreground bg-background
                       focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring
                       placeholder:text-muted-foreground transition-colors`;
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/elderly/1"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground
                     hover:bg-accent transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">编辑老人信息</h1>
          <p className="text-sm text-muted-foreground mt-0.5">修改 {elderlyData.name} 的信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '姓名', value: elderlyData.name, required: true },
              { label: '年龄', value: elderlyData.age, type: 'number', required: true },
            ].map((f) => (
              <div key={f.label}>
                <label className={labelClass}>{f.label} {f.required && '*'}</label>
                <input type={f.type || 'text'} defaultValue={f.value} required={f.required} className={inputClass} />
              </div>
            ))}
            <div>
              <label className={labelClass}>性别 *</label>
              <select defaultValue={elderlyData.gender} required className={inputClass + ' cursor-pointer'}>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>护理等级 *</label>
              <select defaultValue={elderlyData.careLevel} required className={inputClass + ' cursor-pointer'}>
                <option>特级护理</option>
                <option>一级护理</option>
                <option>二级护理</option>
                <option>三级护理</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>房间号</label>
              <input type="text" defaultValue={elderlyData.room} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">健康档案</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>血型</label>
              <select defaultValue={elderlyData.bloodType} className={inputClass + ' cursor-pointer'}>
                <option>A型</option>
                <option>B型</option>
                <option>AB型</option>
                <option>O型</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>慢性病</label>
              <input type="text" defaultValue={elderlyData.chronic} placeholder="如 高血压、糖尿病" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>过敏史</label>
              <input type="text" defaultValue={elderlyData.allergy} placeholder="如 青霉素、海鲜" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground pb-3 border-b border-border">紧急联系人</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>联系人</label>
              <input type="text" defaultValue={elderlyData.contact} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>关系</label>
              <input type="text" defaultValue={elderlyData.contactRelation} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>联系电话</label>
              <input type="tel" defaultValue={elderlyData.contactPhone} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/elderly/1" className="h-9 px-4 rounded-xl border border-border text-sm text-foreground hover:bg-accent transition-colors flex items-center cursor-pointer">
            取消
          </Link>
          <button type="submit" disabled={loading} className="h-9 px-5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground text-sm font-medium rounded-xl flex items-center gap-2 transition-colors cursor-pointer">
            {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Save className="w-4 h-4" />保存</>}
          </button>
        </div>
      </form>
    </div>
  );
}
