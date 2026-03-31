# nursing-admin-v2

养老护理管理后台前端工程，基于 Next.js 16、React 19 与 Tailwind CSS。

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址为 <http://localhost:3000。>

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## 文档约定

自 2026-03-30 起，跨工程 Markdown 文档统一维护在独立的 nursing-documents 工程中，不再在当前仓库新增产品、架构、设计、数据库或运维类 Markdown 文档。

当前规则如下：

- 平台级文档统一放在 nursing-documents/docs/platform/
- 运维与历史归档放在 nursing-documents/docs/operations/
- 当前仓库仅保留工程运行与协作所需的少量根级文件，例如 README.md、AGENTS.md、CLAUDE.md

文档站验证命令：

```bash
cd ../nursing-documents
npm install
npm run docs:build
```

## Harness 交付模板

当前仓库没有独立 docs 目录，管理端页面和路由改动默认使用根目录的 FRONTEND_DELIVERY_TEMPLATE.md 作为本地交付模板入口；跨工程模板总表仍以 nursing-documents/templates/ 为准。

route-level 交付正文现已统一归档到 ../nursing-documents/docs/ui/admin-delivery/index.md。

本地交付入口索引见 DELIVERY_INDEX.md，本地仍保留验证清单、路由清单和执行门禁说明。

## 仓库边界

本仓库负责管理后台前端实现与本地开发配置；跨项目说明、需求沉淀、架构设计、接口文档与发布手册统一在 nursing-documents 中维护。
