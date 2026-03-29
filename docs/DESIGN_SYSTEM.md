# nursing-admin-v2 Design System
> UI/UX Pro Max — 养老院管理系统设计规范 v2.0

---

## 1. Design Tokens

### 色彩系统（CSS Variables）

```css
/* 主色系 */
--color-primary:       #0D9488;  /* teal-600, 主按钮/链接/高亮 */
--color-primary-light: #CCFBF1;  /* teal-100, 浅色背景 */
--color-primary-dark:  #0F766E;  /* teal-700, hover 态 */

/* 功能色 */
--color-success:  #22C55E;  /* 绿色-完成/正常 */
--color-warning:  #F59E0B;  /* 橙色-警告/进行中 */
--color-danger:   #EF4444;  /* 红色-危险/紧急 */
--color-info:    #3B82F6;  /* 蓝色-信息 */
--color-purple:  #8B5CF6;  /* 紫色-特殊 */

/* 中性色 */
--color-bg:            #FAFAF8;  /* 页面背景 */
--color-card:          #FFFFFF;  /* 卡片/组件背景 */
--color-border:        #E7E5E4;  /* 边框/分隔线 */
--color-border-strong: #D4D0CC;  /* hover 边框 */
--color-text:          #1C1917;  /* 主要文字 */
--color-muted:        #78716C;  /* 次要/辅助文字 */

/* 侧边栏（深色）*/
--color-sidebar:       #1C1917;
--color-sidebar-hover: #292524;
```

### 字体
- 主字体：`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- 等宽字体：`'Fira Code', 'SF Mono', monospace`（数字/代码）
- 字重：400(正文) / 500(中等) / 600(强调) / 700(标题) / 800(大标题)

### 圆角
| Token | Value | 用途 |
|-------|-------|------|
| `--radius-sm` | 6px | 标签/小按钮 |
| `--radius-md` | 10px | 输入框/卡片 |
| `--radius-lg` | 14px | 大卡片/模态框 |

### 阴影
| Token | Value | 用途 |
|-------|-------|------|
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.04)` | 默认卡片 |
| `--shadow-hover` | `0 4px 12px rgba(0,0,0,0.08)` | 悬停效果 |
| `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.12)` | 弹窗 |

---

## 2. 布局系统

### 页面结构
```
AppShell
├── TopNavbar (固定顶部, z-50)
│   ├── Logo 区
│   ├── 导航项（横向）| 移动端: 汉堡菜单
│   └── 右侧操作区（通知/设置/用户头像）
└── PageBody (flex-1, overflow-y-auto, padding-6)
```

### 栅格系统
```
页面最大宽度: 1440px (居中)
内容区左右内边距:
  - mobile (< 640px):  16px
  - tablet (640-1024): 24px
  - desktop (> 1024):  32px

StatCard 网格: auto-fill, minmax(220px, 1fr), gap-4
DataCard 网格: 通常 2:1 或 1:1 布局
```

### 响应式断点
```
sm:  640px  移动竖屏
md:  768px  移动横屏/小平板
lg:  1024px 平板/桌面小屏
xl:  1280px 桌面标准
2xl: 1536px 大屏
```

---

## 3. 导航栏 (Huawei Style)

### 外观
- 高度: 60px（桌面）/ 56px（移动）
- 背景: `#FFFFFF`，底部 `1px solid --color-border`
- 阴影: `0 1px 3px rgba(0,0,0,0.04)`（可选）
- Logo 左侧，导航居中偏左，右侧图标居右

### 导航项
- 高度: 60px，横向排列
- 默认态: `color: --color-muted`，无下划线
- Hover 态: `color: --color-text`，`background: --color-primary-light`
- 激活态: `color: --color-primary`，`border-bottom: 2px solid --color-primary`
- 有子菜单时: 右侧 ChevronDown 图标

### 下拉菜单
- 触发: hover（桌面）/ 点击（移动）
- 外观: 白色卡片，圆角 12px，阴影 `--shadow-modal`
- 布局: 2-4 列网格，列宽 180px
- 内边距: 8px padding
- 每项: 高度 36px，hover 浅 teal 背景
- 指示条: 左侧 2px primary 色

### 移动端
- < 1024px: 汉堡菜单按钮替代导航
- 汉堡打开: 左侧抽屉式侧边栏（白色，全高，阴影）
- 侧边栏包含 Logo + 全部导航项（垂直排列）

---

## 4. 组件规范

### StatCard（统计卡片）
```
高度: 96px（固定）
左侧: 4px 彩色边条（由 color prop 控制）
Icon: 40×40px，8px 圆角，浅色背景，深色图标
标签: 12px, 500weight, --color-muted
数值: 24px, 800weight, --color-text, letter-spacing: -0.03em
副文本: 11.5px, --color-muted
趋势: 右上角小标签
间距: p-5（20px）
```
Props:
```ts
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; direction: 'up' | 'down' }
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  icon?: React.ReactNode
}
```

### DataCard（数据卡片）
```
背景: --color-card
边框: 1px solid --color-border
圆角: 14px
Header: padding 16px 20px, border-bottom
Body: padding 16px 20px
Hover: box-shadow: --shadow-hover
```
Props:
```ts
interface DataCardProps {
  icon?: React.ReactNode
  title?: string
  subtitle?: React.ReactNode
  action?: React.ReactNode       // 右侧操作按钮
  badge?: React.ReactNode         // 角标
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}
```

### Tag（标签）
```
高度: 24px，内边距 2px 8px，圆角 999px
字体: 11.5px，600weight
变体（背景/文字）:
  success:  rgba(34,197,94,0.12)  / #16A34A
  warning:  rgba(245,158,11,0.12) / #D97706
  danger:   rgba(239,68,68,0.12)  / #DC2626
  info:     rgba(59,130,246,0.12) / #2563EB
  primary:  rgba(13,148,136,0.12) / #0D9488
  purple:   rgba(139,92,246,0.12) / #7C3AED
  neutral:  --color-bg            / --color-muted
```
Props:
```ts
interface TagProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'purple' | 'neutral'
  children: React.ReactNode
  className?: string
}
```

### ProgressBar（进度条）
```
高度: 6px，圆角 full，背景 --color-bg
填充色: 由 color prop 控制，默认 --color-primary
动画: width 400ms ease
```
Props:
```ts
interface ProgressBarProps {
  value: number       // 0-100
  color?: string      // CSS color
  showLabel?: boolean  // 显示百分比
  size?: 'sm' | 'md'
}
```

### Badge（徽章）
```
用于数字角标（待处理数量等）
圆形，min-width: 18px，高度 18px
背景: --color-danger，颜色白色
字体: 10px，700weight
```

### Avatar（头像）
```
圆形，由 size 控制尺寸
sm: 28px | md: 36px | lg: 44px
背景: rgba(13,148,136,0.1)
颜色: --color-primary
字体: 700weight
```

### Button（按钮）
```
主按钮: bg --color-primary，白字，hover --color-primary-dark
次要: bg white，border --color-border，hover --color-bg
幽灵: bg transparent，hover --color-bg
危险: bg rgba(239,68,68,0.08)，红字，hover 纯红
高度: sm=32px, md=38px, lg=44px
圆角: 10px
过渡: all 120ms ease
```

### Input / Select（输入框/下拉框）
```
高度: 38px
圆角: 10px
边框: 1.5px solid --color-border
hover: border-color --color-border-strong
focus: border-color --color-primary, box-shadow 3px rgba(13,148,136,0.1)
placeholder: --color-muted
```

### FilterBar（筛选栏）
```
背景: --color-card
边框: 1px solid --color-border
圆角: 10px
内边距: 12px 16px
内部元素用 gap-3 分隔
```

---

## 5. 页面模板结构

```tsx
// 标准页面组成
<PageBody>
  <PageHeader
    title="页面标题"
    subtitle="副标题/描述"
    actions={<Button>操作</Button>}
  />

  {/* 统计卡片区 */}
  <div className="kpi-grid">
    <StatCard ... />
    <StatCard ... />
  </div>

  {/* 筛选栏（可选）*/}
  <FilterBar>
    <Input placeholder="搜索..." />
    <Select options={...} />
    <Button variant="secondary">重置</Button>
  </FilterBar>

  {/* 表格/列表 */}
  <Table>
    <thead>...</thead>
    <tbody>...</tbody>
  </Table>

  {/* 分页（可选）*/}
  <Pagination
    current={1}
    total={100}
    pageSize={20}
    onChange={...}
  />
</PageBody>
```

---

## 6. CSS Variable 正确用法

> ⚠️ **重要**: 所有组件和页面必须使用 CSS 变量，不使用 `hsl()` 函数

```tsx
// ✅ 正确
<div style={{ color: 'var(--color-text)' }}>文字</div>
<div style={{ color: 'var(--color-muted)' }}>次要文字</div>
<div style={{ background: 'var(--color-bg)' }}>背景</div>

// ❌ 错误（这些 CSS 变量未定义）
style={{ color: 'hsl(var(--foreground))' }}
style={{ color: 'hsl(var(--muted-foreground))' }}
```

---

## 7. 目录结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页/Dashboard
│   ├── login/page.tsx
│   ├── activities/
│   ├── elderly/
│   ├── rooms/
│   ├── equipment/
│   ├── staff/
│   ├── incidents/
│   ├── supplies/
│   └── financial/
├── components/
│   ├── nh/                 # 统一业务组件
│   │   ├── StatCard.tsx
│   │   ├── DataCard.tsx
│   │   ├── Tag.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── FilterBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Pagination.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts
│   ├── layout/             # 布局组件
│   │   ├── TopNavbar.tsx   # Huawei 风格顶栏
│   │   ├── AppShell.tsx    # 响应式外壳
│   │   └── ...
│   └── ui/                 # shadcn/ui 基础组件
└── lib/
    └── data/               # Mock 数据
```

---

## 8. 动画规范

| 动画 | 时长 | 缓动 |
|------|------|------|
| 页面进入 | 300ms | `cubic-bezier(0.22,1,0.36,1)` |
| Hover | 120ms | `ease` |
| 下拉展开 | 200ms | `ease` |
| 进度条 | 400ms | `ease` |
| 渐变 | 150ms | `ease` |

---

*规范版本: 2.0 | 更新: 2026-03-29*
