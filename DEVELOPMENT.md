# 🦌 鹿了吗 — 开发回顾

> 2026 年 8 月 3 日～4 日，从灵感到跨三平台的全过程记录。

---

## 一、项目缘起

8 月 3 日晚，和 **JiaHao Wang** 语音聊天。聊到桌面宠物的话题——"如果桌面上有一只等你回家的小东西就好了"。

当晚写下了 `deer.md` 产品文档，确立了核心玩法：

- 一只 furry 二次元小鹿常驻桌面
- 三种状态（挺拔/满足/沮丧）由「上次被抚摸时间」驱动
- 2 小时不摸，她会想你，弹出提醒

这个简单的三状态机制是整个应用的情感核心。

---

## 二、技术架构

### 选型

| 层 | 技术 | 理由 |
|---|------|------|
| 桌面框架 | Tauri 2.x | 跨平台 + 小体积 + Rust 性能 |
| 前端 | React 19 + TypeScript | 生态成熟，组件化方便 |
| 动画 | PIXI.js + CSS + SVG | 预留给 Live2D 的接口，当前纯 SVG |
| 状态管理 | Zustand | 轻量，适合小应用 |
| 样式 | Tailwind CSS 4 | 快速原型 |
| 持久化 | JSON 文件 + serde | 轻量，单文件，无需数据库 |

### 数据流

```
用户点击/触摸 → Zustand store.pet()
  → invoke("pet_deer") [Tauri IPC]
    → Rust deer.pet() 获取锁
      → 更新好感度/等级/成就
      → 返回新状态
    ← JSON 响应
  ← store 更新 deerState
→ 所有组件重新渲染
```

后台线程每 30 秒：刷新状态 → 检查提醒 → 发送系统通知 → 持久化到 `deer_state.json`。

### 文件清单（55 个源文件）

核心文件：
- `src-tauri/src/deer_state.rs` (277行) — Rust 状态引擎：Mood 枚举 + DeerState 结构体 + 成就检查
- `src-tauri/src/commands.rs` (130行) — 8 个 Tauri IPC 命令 + 系统通知
- `src-tauri/src/lib.rs` (85行) — 应用初始化、状态恢复、后台线程
- `src/types/deer.ts` (118行) — TypeScript 类型、11 个成就定义、MOOD_INFO 映射
- `src/stores/deerStore.ts` (140行) — Zustand 状态管理
- `src/components/DeerCanvas.tsx` (526行) — SVG 小鹿渲染 + 三种状态 + 触摸交互
- `src/App.tsx` (74行) — 根组件布局
- 其余 7 个组件：StatusBar, InteractionPanel, ParticleLayer, ReminderToast, AchievementToast, AchievementsPanel, SettingsDialog, CreditsPanel

---

## 三、跨平台构建

### macOS — 最顺利

```bash
cd deer-app && cargo tauri build
```

输出 `鹿了吗_v0.1.0.dmg`（4.2MB）。无边框透明窗口在 macOS 上体验最好。

### Android — 踩坑最多

整个过程经历了大约 2 小时的试错：

**1. 环境缺失**
- 没装 Java → `brew install openjdk@17`（必须是 17，不能更高）
- 没装 Android SDK → 手动下载 commandline-tools 到 `~/Library/Android/sdk/`
- 没装 NDK → `sdkmanager` 安装 ndk 27.0
- 没装 Rust Android 目标 → `rustup target add aarch64-linux-android ...`

**2. Gradle 下载超时**
- `gradlew` 从 `services.gradle.org` 下载 Gradle 8.14.3 超时
- 解决：`brew install gradle` → 打包本地 `/opt/homebrew/Cellar/gradle/8.14/libexec/` 为 zip
- 修改 `gradle-wrapper.properties` 指向 `file:/tmp/gradle-8.14-bin.zip`
- 注意：zip 根目录只能有 1 个文件夹，否则报 "too many directories"

**3. Google Maven 仓库 TLS 握手失败**
- `dl.google.com` 在国内间歇性不可用
- 解决：在 `build.gradle.kts` 和 `buildSrc/build.gradle.kts` 的 `repositories {}` 最前面加上阿里云镜像：
  ```kotlin
  maven { url = uri("https://maven.aliyun.com/repository/google") }
  maven { url = uri("https://maven.aliyun.com/repository/public") }
  maven { url = uri("https://maven.aliyun.com/repository/gradle-plugin") }
  ```

**4. 签名配置**
- `keytool -genkey` 生成 `.jks` 密钥
- 创建 `keystore.properties`，修改 `app/build.gradle.kts` 添加 release signingConfig
- `storeFile` 必须用 `rootProject.file()` 解析

最终输出 `鹿了吗_v0.1.0.apk`（47MB）。体积大的原因：APK 是 universal 包，包含 4 个 CPU 架构的原生库各 ~12MB。

### Windows — 交叉编译

从 macOS 交叉编译到 Windows：

```bash
brew install mingw-w64
rustup target add x86_64-pc-windows-gnu
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER="x86_64-w64-mingw32-gcc" \
  cargo tauri build --target x86_64-pc-windows-gnu
```

`.exe` 编译成功（23MB），但 NSIS 安装器制作时 `nsis_tauri_utils.dll` 从 GitHub 下载超时。解决：直接压缩 `.exe` 为 zip 分发。Windows 10/11 自带 WebView2，双击即运行。

---

## 四、GitHub 发布

### 踩坑

1. **中文仓库名** — `gh repo create 鹿了吗` 在 GitHub 上变成了 `-`（空名字）
   - 解决：`gh repo rename deer-app`
2. **Git 连不上 GitHub** — 开了代理（127.0.0.1:7891）但 git 没配
   - 解决：`git config --global http.proxy http://127.0.0.1:7891`
3. **提交规范** — `.gitignore` 排除了 `releases/`、`target/`、`gen/`（含签名密钥），确保源码干净

最终仓库：**https://github.com/tangpinpin/deer-app**

---

## 五、最终产物

| 平台 | 文件 | 大小 |
|------|------|------|
| macOS | `鹿了吗_v0.1.0.dmg` | 4.2 MB |
| Android | `鹿了吗_v0.1.0.apk` | 47 MB |
| Windows | `鹿了吗_v0.1.0_windows.zip` | 6.2 MB |

---

## 六、经验总结

### 下次应该提前做

1. **仓库名用英文** — GitHub 不支持中文 repo 名，一开始就定好英文名
2. **预先检测网络** — 构建前 `curl -I` 测试 `dl.google.com`、`services.gradle.org`、`github.com` 连通性
3. **镜像先行** — Gradle/Android SDK 镜像配置在初始化时就写好
4. **单架构 APK** — 微信分发场景下，只打 ARM64 APK 可减到 14MB
5. **CI/CD** — 多平台构建流程应该自动化，避免每次手动配环境

### 做得好的

- 架构设计清晰，Rust 状态引擎 + Zustand 前端解耦良好
- 三状态机制简单但有效，情感驱动力强
- `.gitignore` 配置合理，没有泄露密钥和构建产物
- 产品文档先行，代码后行

---

> 感谢 JiaHao Wang 的灵感碰撞，感谢 Claude 协助完成跨平台构建。  
> 愿小鹿带给你每一天的温暖与陪伴 🦌
