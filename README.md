# 🎂 BirthVault

> 精美的生日记录 Web 应用 — 记录亲朋好友的生日，再也不会忘记！

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Cloudflare](https://img.shields.io/badge/deploy-Cloudflare%20Pages-orange.svg)

## ✨ 功能

- 🔐 **管理员登录** — Cookie + HMAC Token 认证保护，只有授权用户可访问
- 📋 **生日管理** — 添加、编辑、删除亲朋好友的生日记录
- 🌙 **农历/公历** — 支持农历和公历日期选择
- ⏰ **智能倒计时** — 实时显示距离下一个生日还有多少天
- 🔍 **搜索过滤** — 按姓名搜索，按关系分类筛选
- 🌗 **深色模式** — 精美的深色/浅色主题切换
- 📱 **响应式设计** — 完美适配手机、平板和桌面端
- 🎨 **精美 UI** — Glassmorphism 毛玻璃设计风格

## 🛠 技术栈

- **前端**: 原生 HTML + CSS + JavaScript（零依赖）
- **后端**: Cloudflare Functions (Workers)
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: HMAC-SHA256 Token + HttpOnly Cookie
- **部署**: Cloudflare Pages

## 🚀 本地开发

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/quanyipinghe/BirthVault.git
cd BirthVault

# 2. 初始化本地数据库
npm run db:init

# 3. 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:8788`，使用默认凭据登录：

- **用户名**: `admin`
- **密码**: `birthvault2025`

> 本地凭据在 `wrangler.toml` 的 `[vars]` 中配置。

## ☁️ 部署到 Cloudflare

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create birthvault-db
```

将返回的 `database_id` 填入 `wrangler.toml`。

### 2. 执行数据库迁移

```bash
npx wrangler d1 execute birthvault-db --remote --file=./migrations/0001_initial.sql
```

### 3. 部署

将项目推送到 GitHub，然后在 Cloudflare Dashboard 中连接 GitHub 仓库即可自动部署。

**Pages 配置：**
- 构建命令: _(留空)_
- 构建输出目录: `public`
- D1 数据库绑定: `DB` → `birthvault-db`

### 4. 配置生产环境密码

部署后，在 Cloudflare Dashboard 中设置**加密的环境变量**以覆盖默认凭据：

1. 进入 **Workers & Pages** → `birthvault` → **Settings** → **Environment Variables**
2. 添加以下变量（勾选 **Encrypt**）：

| 变量名 | 说明 |
|--------|------|
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码（请使用强密码） |
| `AUTH_SECRET` | Token 签名密钥（建议用 `openssl rand -hex 32` 生成） |

## 📁 项目结构

```
BirthVault/
├── public/                  # 前端静态文件
│   ├── index.html           # 主页面
│   ├── login.html           # 登录页面
│   ├── css/style.css        # 样式
│   └── js/                  # JavaScript 模块
│       ├── app.js           # 主应用逻辑
│       ├── api.js           # API 请求封装
│       ├── components.js    # UI 组件
│       ├── utils.js         # 工具函数
│       └── lunar.js         # 农历转换
├── functions/               # Cloudflare Functions (后端)
│   ├── _middleware.js       # 认证中间件 + 数据库初始化
│   └── api/
│       ├── birthdays.js     # GET /api/birthdays
│       ├── birthday.js      # POST /api/birthday
│       ├── birthday/[id].js # PUT/DELETE /api/birthday/:id
│       ├── login.js         # POST /api/login
│       ├── logout.js        # POST /api/logout
│       └── auth-check.js    # GET /api/auth-check
├── migrations/              # 数据库迁移
├── wrangler.toml            # Cloudflare 配置
└── package.json
```

## 📄 开源协议

[MIT License](LICENSE)
