# GitHub Trending 极客深度科技分析看板 (UI Refined)

这是一个专为极客开发者与技术研究者设计的 GitHub 趋势深度追踪看板。项目经过了**极致的 UI 重设计 (Minimalist Tech Premium Style)** 并进行了**原生的移动端多维手势适配 (Mobile Bottom-Dock & Bottom Sheet)**。

---

## ✨ 视觉与交互重设计亮点 (Redesign Specs)

### 🎨 1. 材质与色调：星空高透毛玻璃
* 统一换用 **科技高亮靛蓝 (Digital Indigo, #6366f1)** 作为全站唯一的活跃点缀色。
* 暗色模式使用 **真暗炭黑底色 `#09090b` (Zinc-950)**，配合毛玻璃容器（`backdrop-blur-xl` + 内折射边缘高光线）。
* 卡片与按钮支持物理按压回弹 `scale-[0.98]`。

### 📊 2. 精密排版：等宽数值指标对齐
* Stars、Forks、Growth 等指标使用 **等宽数字排版 `.font-mono-tabular`**，多卡片对比时数字对齐。

### 📱 3. 移动端原生化适配：单手触控底座
* 窄屏下提供 **悬浮毛玻璃底座导航栏 (Mobile Floating Bottom Dock)**。
* 筛选与分析功能通过 **半屏抽屉 (Bottom Sheets)** 从底部滑出。

---

## 🚀 本地启动（Windows + WSL，推荐方案 1）

项目代码位于 WSL (`\\wsl$\Ubuntu\home\hermes\projects\trending-dashboard`)。  
**不要**直接在 UNC 路径下运行 `npm install` / `npm run dev`，Windows CMD 会报错：

```text
UNC 路径不受支持。默认值设为 Windows 目录。
'vite' 不是内部或外部命令
```

### 前置要求

| 环境 | 要求 |
|------|------|
| Windows | Node.js >= 20.19（建议 22.x，用于辅助工具） |
| WSL | Ubuntu，首次启动脚本会自动安装 Node 22（nvm） |
| 浏览器 | Chrome / Edge，验收移动端请开 DevTools 设备模式 |

### 一键启动（推荐）

在 **Windows PowerShell** 中执行：

```powershell
# 可选：将 WSL 映射为 Z: 盘，方便在资源管理器中访问项目
net use Z: \\wsl$\Ubuntu

# 进入项目并启动（依赖安装 + Vite 均在 WSL 内完成）
Z:
cd \home\hermes\projects\trending-dashboard
.\scripts\dev.ps1
```

启动成功后，终端会输出访问地址，例如：

```text
➜  Local:   http://localhost:5173/trending-dashboard/
```

> 若 5173 端口被占用，Vite 会自动切换到 5174 等端口，以终端实际输出为准。  
> 注意：项目配置了 `base: '/trending-dashboard/'`，请访问带后缀的完整路径。

### 首次安装依赖（仅需一次）

若 `dev.ps1` 提示缺少原生模块，可在 WSL 内手动重装：

```powershell
wsl -d Ubuntu --cd /home/hermes/projects/trending-dashboard -e bash scripts/install-wsl.sh
```

然后再运行 `.\scripts\dev.ps1`。

### 脚本说明

| 脚本 | 作用 |
|------|------|
| `scripts/dev.ps1` | Windows 入口：映射 Z: 盘，在 WSL 内启动 Vite |
| `scripts/dev-wsl.sh` | WSL 内：确保 Node 22，安装依赖并启动开发服务器 |
| `scripts/install-wsl.sh` | WSL 内：清理并重装 `node_modules`（Linux 原生绑定） |

### 为什么不在 Windows 侧直接跑 Vite？

1. **`\\wsl$\...` UNC 路径**：Windows 的 `npm`/`cmd` 无法将其作为工作目录，导致找不到 `vite`。
2. **Z: 映射盘 + Windows Node 安装**：可以安装依赖，但 Vite 8 的文件监听在跨文件系统上会失败（`EISDIR`）。
3. **正确做法**：依赖安装与 dev server 均在 **WSL 内**执行；Windows 侧只负责一键脚本触发。

### 常见问题

**Q: `net use Z:` 提示“本地设备名已在使用中”**  
A: 说明 Z: 已映射，可跳过该步骤，直接 `cd Z:\home\hermes\projects\trending-dashboard`。

**Q: `Cannot find native binding (rolldown)`**  
A: 说明曾在 Windows 侧安装过依赖。运行 `scripts/install-wsl.sh` 在 WSL 内重装即可。

**Q: 页面空白或 404**  
A: 确认访问的是 `http://localhost:<端口>/trending-dashboard/`，不要漏掉 base 路径。

---

## 🛠️ 核心功能与套件指引

* **高级筛选过滤**：桌面端在列表上方；移动端点击底部 Dock「筛选」打开 Bottom Sheet。
* **智能极客分析套件**：桌面端在 Header「分析套件」下拉；移动端在 Dock「智能套件」磁贴面板。
* **GitHub Token 联动**：设置 ⚙️ 中配置 Token，支持批量 Fork 与 Fork 历史同步。

---

## 📦 其他命令（在 WSL 内）

```bash
cd /home/hermes/projects/trending-dashboard
npm run build    # 生产构建
npm run preview  # 预览构建结果
npm run lint     # ESLint 检查
```
