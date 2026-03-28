# 养老院管理系统 - 设计规范

## 设计方向

**方向**: 温馨专业 (Warm Professional)
- 适合养老服务场景：温暖、不冰冷
- 但保持专业感：适合机构管理人员使用
- 参考：高端养老院品牌风格

## 色彩系统

### 主色调
```css
--primary: #7C6FCD          /* 紫藤色 - 主按钮、重点内容 */
--primary-hover: #6B5EB8     /* 深紫藤 - hover状态 */
--primary-light: #EDE9FE     /* 淡紫藤 - 背景、标签 */
```

### 辅助色
```css
--success: #34D399           /* 翠绿 - 健康状态、正常 */
--warning: #FBBF24           /* 琥珀 - 提醒、关注 */
--danger: #F87171            /* 珊瑚红 - 危险、紧急 */
--info: #60A5FA              /* 天蓝 - 信息、链接 */
```

### 中性色
```css
--background: #FAFAF9        /* 米白 - 页面背景 */
--surface: #FFFFFF           /* 纯白 - 卡片背景 */
--card: #FFFFFF              /* 卡片 */
--border: #E5E5E4            /* 边框 */
--muted: #A3A3A0             /* 次要文本 */
--text: #1C1C1A              /* 主文本 */
```

### 语义色（健康状态）
```css
--health-excellent: #22C55E  /* 极好 */
--health-good: #84CC16       /* 良好 */
--health-stable: #60A5FA     /* 稳定 */
--health-warning: #F59E0B     /* 需关注 */
--health-critical: #EF4444   /* 危急 */
```

## 字体系统

```css
--font-display: "Noto Sans SC", system-ui, sans-serif
--font-body: "Noto Sans SC", system-ui, sans-serif
--font-mono: "JetBrains Mono", monospace

--text-xs: 0.75rem    /* 12px - 标签、次要 */
--text-sm: 0.875rem   /* 14px - 辅助文本 */
--text-base: 1rem      /* 16px - 正文 */
--text-lg: 1.125rem   /* 18px - 标题 */
--text-xl: 1.25rem    /* 20px - 卡片标题 */
--text-2xl: 1.5rem    /* 24px - 页面标题 */
--text-3xl: 1.875rem  /* 30px - 大标题 */
```

## 间距系统 (8px 基准)

```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem      /* 8px */
--space-3: 0.75rem     /* 12px */
--space-4: 1rem        /* 16px */
--space-5: 1.25rem     /* 20px */
--space-6: 1.5rem      /* 24px */
--space-8: 2rem        /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem       /* 48px */
```

## 圆角

```css
--radius-sm: 0.375rem   /* 6px - 小元素 */
--radius-md: 0.5rem      /* 8px - 按钮、输入框 */
--radius-lg: 0.75rem    /* 12px - 卡片 */
--radius-xl: 1rem        /* 16px - 大卡片 */
--radius-full: 9999px   /* 圆形 */
```

## 阴影

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

## 组件规范

### 按钮

| 类型 | 样式 | 使用场景 |
|------|------|----------|
| Primary | 紫色背景，白色文字 | 主要操作 |
| Secondary | 白色背景，紫色边框 | 次要操作 |
| Ghost | 透明背景，hover显示 | 辅助操作 |
| Danger | 红色背景，白色文字 | 危险操作 |

### 卡片

- 背景：白色
- 边框：1px solid var(--border)
- 圆角：12px
- 阴影：shadow-sm
- 内边距：24px

### 表格

- 表头：背景 var(--primary-light)，文字加粗
- 行hover：背景 rgba(0,0,0,0.02)
- 边框：底部边框 1px solid var(--border)

### 表单

- 输入框高度：40px
- 标签：14px，加粗
- 错误提示：红色，12px

## 页面布局

### 仪表盘

- 网格布局：3-4 列 KPI 卡片
- 卡片高度：auto
- 间距：24px

### 列表页

- 筛选栏：顶部，水平排列
- 操作栏：右侧 + 新增按钮
- 表格：全宽，带分页

### 详情页

- 标签切换：顶部 Tab
- 信息分组：卡片式
- 右侧：操作面板

## 状态设计

### 健康状态颜色编码

```
绿色 (#22C55E) → 极好
黄绿 (#84CC16) → 良好
蓝色 (#60A5FA) → 稳定
橙色 (#F59E0B) → 需关注
红色 (#EF4444) → 危急
```

### 设备状态

```
绿色 → 正常
蓝色 → 待机
橙色 → 维护中
红色 → 故障
灰色 → 已报废
```

## 动画

```css
--transition-fast: 150ms ease-out
--transition-normal: 250ms ease-out
--transition-slow: 350ms ease-out
```

## 响应式断点

| 名称 | 宽度 | 布局 |
|------|------|------|
| mobile | < 640px | 单列 |
| tablet | 640-1024px | 双列 |
| desktop | > 1024px | 多列 |
