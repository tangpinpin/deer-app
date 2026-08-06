#!/bin/bash
cd /Users/lidasheng/Desktop/鹿了吗

# 1. 给 git 配置代理
git config --global http.proxy http://127.0.0.1:7891
git config --global https.proxy http://127.0.0.1:7891

# 2. 移除旧的错误 remote，指向改名后的仓库
git remote remove origin 2>/dev/null
git remote add origin https://github.com/tangpinpin/deer-app.git

# 3. 推送
git push -u origin main

echo "完成！访问 https://github.com/tangpinpin/deer-app"
