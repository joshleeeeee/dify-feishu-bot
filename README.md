<div align="center">

# 🤖 Dify Feishu Bot

**将 Dify AI 能力无缝接入飞书，打造专属智能助手**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

[English](./README.en.md) | **中文**

</div>

---

## 📖 项目介绍

Dify Feishu Bot 是一个开源项目，让你可以轻松地将 [Dify](https://dify.ai/) 的 AI 能力集成到飞书中。通过简单的配置，你的飞书用户就可以与 Dify 智能体进行自然语言对话。

### 🎯 适用场景

- 🏢 企业内部智能客服 / 知识库问答
- 📚 基于文档的 AI 助手
- 🤝 团队协作 AI 工具
- 🔧 自定义工作流自动化

### 📸 界面预览

<div align="center">

**仪表盘 - 系统概览与快速入门**

![Dashboard](./docs/screenshots/dashboard.png)

**飞书配置 - WebSocket 长连接模式**

![Feishu Config](./docs/screenshots/feishu-config.png)

**Dify 配置 - API 连接设置**

![Dify Config](./docs/screenshots/dify-config.png)

**智能体管理 - 多智能体配置**

![Agent Management](./docs/screenshots/agents.png)

</div>

---

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🔌 **WebSocket 长连接** | 无需公网 IP、无需域名、无需配置 Webhook |
| 🤖 **多智能体支持** | 可配置多个 AI 智能体，用户自由切换 |
| 💬 **会话管理** | 自动管理对话上下文，支持多轮对话 |
| ⚙️ **可视化配置** | 提供 Web 管理面板，所有配置可视化操作 |
| 🔒 **安全认证** | 基于 Token 的管理面板访问控制 |
| 📝 **对话记录** | 保存完整对话历史，便于追溯 |

---

## 🏗️ 技术架构

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   飞书客户端     │ ◄─────────────────► │  Dify Feishu Bot │
└─────────────────┘     长连接          └────────┬────────┘
                                                 │
                                                 │ HTTP API
                                                 ▼
                                        ┌─────────────────┐
                                        │   Dify Server   │
                                        │   (自部署)       │
                                        └─────────────────┘
```

**技术栈：**
- **运行时**: Node.js 18+
- **框架**: Next.js 15 (App Router)
- **数据库**: SQLite + Prisma ORM
- **飞书 SDK**: @larksuiteoapi/node-sdk
- **UI**: React + Tailwind CSS

---

## 🚀 快速开始

### 前置要求

在开始之前，请确保你已经准备好：

- [x] Node.js 18 或更高版本
- [x] 一个 [飞书开放平台](https://open.feishu.cn/) 应用
- [x] 一个自部署的 [Dify](https://github.com/langgenius/dify) 实例

### 第一步：克隆项目

```bash
git clone https://github.com/joshleeeeee/dify-feishu-bot.git
cd dify-feishu-bot
```

### 第二步：安装依赖

```bash
npm install
```

### 第三步：初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 第四步：配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置管理面板的访问 Token：

```bash
# 管理面板访问 Token（请修改为你自己的安全 Token）
ADMIN_TOKEN=your-secure-token-here

# 数据库路径（默认即可）
DATABASE_URL="file:./dev.db"
```

### 第五步：启动服务

```bash
npm run dev
```

服务启动后，访问管理面板进行配置：

```
http://localhost:3000/admin?token=your-secure-token-here
```

---

## ⚙️ 详细配置

### 1️⃣ 创建飞书应用

1. 登录 [飞书开放平台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用名称和描述
4. 进入应用，获取 **App ID** 和 **App Secret**

### 2️⃣ 配置应用权限

在「权限管理」中添加以下权限：

| 权限 | 说明 |
|------|------|
| `im:message` | 获取与发送单聊、群组消息 |
| `im:message:send_as_bot` | 以应用的身份发送消息 |

### 3️⃣ 启用长连接

在「事件订阅」页面：

1. 找到「使用长连接接收事件」选项
2. **开启** 此功能

> 💡 **提示**: 使用长连接模式无需配置回调地址，这是本项目的核心优势！

### 4️⃣ 发布应用

1. 在「版本管理与发布」中创建版本
2. 提交审核并发布

### 5️⃣ 在管理面板中配置

1. **飞书配置**: 填入 App ID 和 App Secret，点击「启动连接」
2. **Dify 配置**: 填入 Dify 的 Base URL 和 API Key
3. **智能体管理**: 添加至少一个智能体

---

## 💬 使用方法

配置完成后，用户可以在飞书中与 Bot 对话：

### 可用命令

| 命令 | 说明 |
|------|------|
| `/help` 或 `帮助` | 显示帮助信息 |
| `/agent` 或 `选择助手` | 切换 AI 智能体 |
| `/new` 或 `新对话` | 开始新的对话 |

### 对话流程

1. 用户在飞书中找到 Bot 并发送消息
2. 首次对话会提示选择智能体（如果有多个）
3. 选择后即可开始对话
4. 发送 `/new` 可重置对话上下文

---

## 📁 项目结构

```
dify-feishu-bot/
├── src/
│   ├── app/
│   │   ├── admin/              # 管理面板页面
│   │   │   ├── page.tsx        # 仪表盘
│   │   │   ├── feishu/         # 飞书配置
│   │   │   ├── dify/           # Dify 配置
│   │   │   ├── agents/         # 智能体管理
│   │   │   └── conversations/  # 会话记录
│   │   └── api/admin/          # 管理 API
│   ├── components/             # UI 组件
│   └── lib/                    # 核心逻辑
│       ├── feishu.ts           # 飞书 SDK 封装
│       ├── dify.ts             # Dify API 客户端
│       ├── config.ts           # 配置管理
│       ├── db.ts               # 数据库操作
│       └── cards.ts            # 卡片消息模板
├── config/
│   └── settings.json           # 运行时配置
├── prisma/
│   └── schema.prisma           # 数据库模型
└── .env                        # 环境变量
```

---

## 🚢 生产部署

### 使用 PM2 部署

```bash
# 构建
npm run build

# 使用 PM2 启动（必须使用配置文件来加载 .env 环境变量）
pm2 start ecosystem.config.js

# 查看日志
pm2 logs dify-feishu-bot

# 重启服务
pm2 restart dify-feishu-bot

# 停止服务
pm2 stop dify-feishu-bot
```

> ⚠️ **重要**: PM2 默认不会加载 `.env` 文件！必须使用 `ecosystem.config.js` 启动，否则 `ADMIN_TOKEN` 等环境变量不会生效。

### 使用 Docker 部署

#### 方式一：使用 Docker Compose（推荐）

```bash
# 1. 复制环境变量配置
cp .env.example .env
# 编辑 .env 设置你的 ADMIN_TOKEN

# 2. 启动服务
docker-compose up -d

# 3. 初始化数据库
docker-compose exec dify-feishu-bot npx prisma db push

# 4. 查看日志
docker-compose logs -f
```

#### 方式二：手动构建运行

```bash
# 构建镜像
docker build -t dify-feishu-bot .

# 运行容器
docker run -d \
  --name dify-feishu-bot \
  -p 3000:3000 \
  -e ADMIN_TOKEN=your-secure-token \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/prisma:/app/prisma \
  --restart unless-stopped \
  dify-feishu-bot
```

> 💡 **提示**: 配置和数据库文件通过 volume 挂载实现持久化，重启容器不会丢失数据。

---

## ❓ 常见问题

### Q: 为什么选择 WebSocket 长连接而不是 Webhook？

**A:** WebSocket 长连接模式有以下优势：
- 无需公网 IP 或域名
- 无需配置回调 URL
- 本地开发无需内网穿透
- 更简单的部署流程

### Q: 支持群聊吗？

**A:** 目前仅支持单聊场景。群聊支持计划在后续版本中添加。

### Q: 如何更新配置？

**A:** 在 Web 管理面板中修改配置后会自动保存。修改飞书配置后需要重新点击「启动连接」。

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

---

## 🙏 致谢

- [Dify](https://github.com/langgenius/dify) - 强大的 LLM 应用开发平台
- [飞书开放平台](https://open.feishu.cn/) - 提供完善的 SDK 支持
- [Next.js](https://nextjs.org/) - 优秀的 React 全栈框架

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

</div>
