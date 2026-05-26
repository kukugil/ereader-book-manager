# OpenAPI 文档生成 — 设计文档

**日期**: 2026-05-26

## 目标

为 plan-a Express 后端自动生成 OpenAPI 3.0 文档，通过 Swagger UI 提供可交互的 API 文档页面。

## 方案

使用 `swagger-jsdoc` + `swagger-ui-express`，在现有 Express 路由文件中添加 JSDoc 注释来定义 API 规范。

## 依赖

- `swagger-jsdoc`: 从 JSDoc 注释生成 OpenAPI spec
- `swagger-ui-express`: 在 `/api-docs` 渲染 Swagger UI

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `server/swagger.js` | 新增 | OpenAPI 基础定义 + swagger-jsdoc 配置 |
| `server/routes/upload.js` | 修改 | 添加 JSDoc 注释 |
| `server/routes/device.js` | 修改 | 添加 JSDoc 注释 |
| `server/index.js` | 修改 | 挂载 /api-docs 路由 |
| `package.json` | 修改 | 添加两个依赖 |

## 路由覆盖

- `POST /api/v1/books/upload` — 单本书上传
- `POST /api/v1/books/batch-upload` — 批量上传
- `GET /api/v1/devices/{sn}/books` — 设备图书列表
- `DELETE /api/v1/devices/{sn}/books/{bookId}` — 删除图书
- `PUT /api/v1/devices/{sn}/books/reorder` — 重新排序
- `GET /health` — 健康检查

## 不覆盖

- `/dl/:sn/*` 静态文件下载路由（设备端使用，非 API）

## Swagger UI 路径

- UI: `/api-docs`
- Raw spec: `/api-docs.json`
