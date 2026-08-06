#!/bin/bash
set -e

cd /Users/lidasheng/Desktop/鹿了吗

# 提交
git commit -m "init: 鹿了吗 v0.1.0 — 桌面宠物小鹿陪伴应用

Tauri 2 + React 19 + TypeScript + PIXI.js 跨平台桌面应用
支持 macOS / Windows / Android

Co-Authored-By: Claude <noreply@anthropic.com>"

# 创建 GitHub 仓库并推送
gh repo create 鹿了吗 --source . --public --push
