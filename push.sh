#!/bin/bash
cd /Users/lidasheng/Desktop/鹿了吗

# 1. 配置 git 走代理
git config --global http.proxy http://127.0.0.1:7891
git config --global https.proxy http://127.0.0.1:7891

# 2. 修正远程地址
git remote set-url origin https://github.com/tangpinpin/deer-app.git

# 3. 推送
git push -u origin main
