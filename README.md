# 🦌 鹿了吗

> 忙碌时陪伴，空闲时治愈

「鹿了吗」是一款桌面宠物陪伴应用，以一只 **furry 风格二次元小鹿** 为核心，定时提醒你抚摸互动。灵感来自 2026 年 8 月 3 日与朋友的一次深夜聊天——"如果桌面上有一只等你回家的小鹿就好了"。

---

## ✨ 核心玩法

小鹿有三种状态，由你上次抚摸她的时间决定：

| 状态 | 触发条件 | 表现 |
|:---:|---|---|
| 🟢 **挺拔** | 2 小时内被抚摸过 | 站姿挺拔、眼睛明亮、活泼灵动 |
| 🟡 **满足** | 正在被抚摸 | 眯眼享受、脸颊微红、冒出爱心 |
| 🔴 **沮丧** | 超过 2 小时没被摸 | 垂头丧气、眼角含泪、微微发抖 |

> 超过 2 小时不摸，她会想你的 💔

---

## 🎮 功能

- 🖐️ **抚摸互动** — 鼠标拖拽、点击即为抚摸
- ⏰ **2 小时提醒** — 久不摸鹿时弹出系统通知
- 📈 **养成系统** — 好感度、连续天数、成就徽章、等级

---

## 📦 下载安装

| 平台 | 下载 | 大小 |
|:---:|---|---|
| 🤖 Android | [鹿了吗_v0.1.0.apk](https://github.com/tangpinpin/deer-app/releases) | 47 MB |
| 🍎 macOS | [鹿了吗_v0.1.0.dmg](https://github.com/tangpinpin/deer-app/releases) | 4.2 MB |
| 🪟 Windows | [鹿了吗_v0.1.0_windows.zip](https://github.com/tangpinpin/deer-app/releases) | 6.2 MB |

> iOS 版暂不支持（iOS 限制侧载安装）

---

## 🛠 技术栈

| 层级 | 技术 |
|:---:|---|
| 桌面框架 | **Tauri 2.x**（Rust 后端） |
| 前端 | **React 19** + **TypeScript** |
| 动画 | **PIXI.js** WebGL 渲染 |
| 状态管理 | **Zustand** |
| 样式 | **Tailwind CSS 4** + **Framer Motion** |
| UI 组件 | **Radix UI** |
| 数据存储 | **SQLite** (tauri-plugin-sql) |
| 系统通知 | **tauri-plugin-notification** |

---

## 🚀 本地开发

### 环境要求

- [Node.js](https://nodejs.org/) ≥ 18
- [Rust](https://www.rust-lang.org/) ≥ 1.77
- macOS / Windows / Linux

### 启动

```bash
# 安装依赖
cd deer-app
npm install

# 启动开发服务器（热更新）
npm run dev

# 或在 Tauri 桌面窗口中运行
cargo tauri dev
```

### 构建

```bash
# 构建当前平台
cargo tauri build

# 构建 Android（需额外配置 Android SDK + NDK）
cargo tauri android build

# 构建 Windows（macOS 上交叉编译）
brew install mingw-w64
rustup target add x86_64-pc-windows-gnu
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc cargo tauri build --target x86_64-pc-windows-gnu
```

---

## 📁 项目结构

```
鹿了吗/
├── deer-app/                  # 主应用
│   ├── src/                   # React 前端源码
│   │   ├── components/        # UI 组件
│   │   ├── stores/            # Zustand 状态管理
│   │   └── types/             # TypeScript 类型
│   ├── src-tauri/             # Tauri / Rust 后端
│   │   ├── src/               # Rust 源码
│   │   └── tauri.conf.json    # Tauri 配置
│   └── package.json
├── releases/                  # 构建安装包（不上传 Git）
└── deer.md                    # 产品需求文档
```

---

## 🤝 致谢

这个小鹿是深夜聊天催生的小巧思——感谢 JiaHao Wang 的灵感碰撞 🦌

大部分代码由 vibecoding 生成，由 Claude 协助完成跨平台构建。

---

