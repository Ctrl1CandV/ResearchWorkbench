# ResearchWorkbench

个人研究平台：方向阅读路线、分级论文阅读卡、Agent 技术学习主干、经典书目、每日精选与近期登记发现、本人阅读记录（仅本机，独立 v3 存储）。

首页 `#/home` 说明五区用途与进入方式；方向页给出研究对象、当前研究情况（含核查截止日期）、选择理由与限制；阅读卡按实际依据分为正文精读、正文选读、摘要级与原文入口；技术学习不要求先选方向；经典书目 `#/foundations` 收录不绑定方向的基础经典。

当前按 [PLAN-005](docs/plans/PLAN-005-content-completion.md) 实施，**阶段 0–7 已完成**（v3 阅读记录、每日精选接通、经典书目、方向候选、链接卫生、旧版退役、清理与首次本地提交）。产品交付以 [验收记录 ACCEPTANCE-006](docs/ACCEPTANCE-006.md) 为准，不以代码存在代替验收。

## 本地运行

需要 Node.js 20 或更高版本，无第三方运行时依赖。

```bash
npm start
```

打开 [本地工作台](http://127.0.0.1:4173)。服务仅绑定本机；如端口被占用，先确认已有服务，不自动终止其他进程。可用 `PORT` 环境变量指定另一个端口。

```bash
npm test        # 契约、内容、渲染、服务测试
npm run check-links   # 外链可达性检查（手动触发，不接定时任务）
```

## 内容与能力边界

- 阅读卡依据 grad-companion 的阅读协议与真实来源制作；摘要卡和正文卡明确区分。AI 整理不是本人已读。
- **本人阅读记录**（状态/问题/笔记/待读清单）保存在本机浏览器 `research-workbench:v3`；与旧版 v1/v2 互不读写；换浏览器或清数据即丢失，**导出 Markdown 是唯一备份手段**。
- 精选允许在 harness 中更新项目内容，网页展示整理结果。不是网页自动调用插件，也不是无人值守定时服务；动态登记条目不进入内容库、不写入个人记录。
- 三条方向是选题备选，不是同时开展三个研究项目，不保证创新或发表。期刊与会议分别标注。
- `private/`、`.grad/`、`.workbuddy/`、密钥和个人研究材料不提交、不上传、不作为公共产品资源。

## 项目结构

- `public/`：前端静态资源（`library.js` 渲染与路由、`library-content.js` 公开内容、`notes.js` 本人记录、`styles.css`）。
- `server.mjs` / `discovery.mjs`：本机静态服务与同源 `/api/discover`（Crossref 近期登记查询）。
- `tests/`：契约、内容、渲染、存储与服务的自动测试（`node --test`）。
- `scripts/check-links.mjs`：外链可达性检查，手动触发。
- `docs/`：SPEC（行为契约）、PLAN-001…005（实施计划与记录）、ACCEPTANCE/REVIEW（验收与审查）、DESIGN/CONTENT/READING-TEMPLATES/TECH-LEARNING/RESEARCH-005（设计与内容依据）。

## 协作

先读 [AGENTS.md](AGENTS.md)、[START-HERE](docs/START-HERE.md)、[SPEC](docs/SPEC.md) 和当前计划。分析设计、实施、独立审查分开；改动须经授权后才推送或公开部署（首次推送已按用户明确授权执行）。

