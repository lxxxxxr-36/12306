# 12306 复刻 Web 部署指南

一个基于 React + TypeScript + Vite 的前端项目，提供 12306 网站核心页面的演示复刻。本文档简洁说明如何在本地开发、构建与部署。

## 环境要求

- Node.js `20.19+` 或 `22.12+`（低于此版本运行会有警告）
- npm `10+`

## 本地开发

1. 进入项目：
   ```bash
   cd web
   npm install
   ```
2. 启动开发服务：
   ```bash
   npm run dev
   ```
   打开 `http://localhost:5173/`（若 5173 已占用，Vite 