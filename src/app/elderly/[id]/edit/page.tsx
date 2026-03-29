"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DataCard } from "@/components/nh";
import { ArrowLeft, Save, User, Heart, Phone, AlertCircle } from "lucide-react";

const elderlyData = {
  name: '王秀英', gender: '女', age: 82,
  idCard: '310101194204156789', phone: '138****1234',
  room: '201', careLevel: '特级护理', bloodType: 'A型',
  allergy: '青霉素', chronic: '高血压、糖尿病',
  emergency: '速效救心丸',
  contact: '李小红', contactRelation: '女儿', contactPhone: '139****5678',
};

const inputClass = "input";

export default function EditElderlyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push('/elderly/1');
  };

  return (
    <div className="page-root animate-fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
        <Link href="/elderly/1" className="btn btn-ghost btn-icon-sm btn-icon">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>编辑老人信息</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>修改 {elderlyData.name} 的基本信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span className="form-error-text">{error}</span>
          </div>
        )}

        {/* 基本信息 */}
        <DataCard
          icon={<User size={18} />}
          title="基本信息"
          bodyClassName="form-section"
        >
          <div className="form-grid">
            <div>
              <label className="form-label">姓名</label>
              <input type="text" className={inputClass} defaultValue={elderlyData.name} />
            </div>
            <div>
              <label className="form-label">性别</label>
              <select className={inputClass} defaultValue={elderlyData.gender}>
                <option>男</option><option>女</option>
              </select>
            </div>
            <div>
              <label className="form-label">年龄</label>
              <input type="number" className={inputClass} defaultValue={elderlyData.age} />
            </div>
            <div>
              <label className="form-label">身份证号</label>
              <input type="text" className={inputClass} defaultValue={elderlyData.idCard} />
            </div>
            <div>
              <label className="form-label">房间号</label>
              <input type="text" className={inputClass} defaultValue={elderlyData.room} />
            </div>
            <div>
              <label className="form-label">联系电话</label>
              <input type="tel" className={inputClass} defaultValue={elderlyData.phone} />
            </div>
          </div>
        </DataCard>

        {/* 健康信息 */}
        <div style={{ marginTop: 16 }}>
          <DataCard
            icon={<Heart size={18} />}
            title="健康信息"
            bodyClassName="form-section"
          >
            <div className="form-grid">
              <div>
                <label className="form-label">护理等级</label>
                <select className={inputClass} defaultValue={elderlyData.careLevel}>
                  <option>自理</option><option>半自理</option><option>全护理</option><option>特级护理</option>
                </select>
              </div>
              <div>
                <label className="form-label">血型</label>
                <select className={inputClass} defaultValue={elderlyData.bloodType}>
                  <option>A型</option><option>B型</option><option>O型</option><option>AB型</option>
                </select>
              </div>
              <div className="form-grid-full">
                <label className="form-label">既往病史</label>
                <input type="text" className={inputClass} defaultValue={elderlyData.chronic} />
              </div>
              <div className="form-grid-full">
                <label className="form-label">过敏史</label>
                <input type="text" className={inputClass} defaultValue={elderlyData.allergy} />
              </div>
            </div>
          </DataCard>
        </div>

        {/* 紧急联系人 */}
        <div style={{ marginTop: 16 }}>
          <DataCard
            icon={<Phone size={18} />}
            title="紧急联系人"
            bodyClassName="form-section"
          >
            <div className="form-grid">
              <div>
                <label className="form-label">联系人</label>
                <input type="text" className={inputClass} defaultValue={elderlyData.contact} />
              </div>
              <div>
                <label className="form-label">关系</label>
                <input type="text" className={inputClass} defaultValue={elderlyData.contactRelation} />
              </div>
              <div>
                <label className="form-label">电话</label>
                <input type="tel" className={inputClass} defaultValue={elderlyData.contactPhone} />
              </div>
            </div>
          </DataCard>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
          <Link href="/elderly/1" className="btn btn-ghost btn-md">取消</Link>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading ? (
              <span className="login-spinner animate-spin" />
            ) : (
              <>
                <Save size={15} />保存修改
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
