# ResearchWorkbench

个人研究平台：方向阅读路线、分级论文阅读卡、Agent 技术学习主干、经典书目、每日精选与近期登记发现、本人阅读记录（仅本机，独立 v3 存储）。

首页 `#/home` 说明五区用途与进入方式；方向页给出研究对象、当前研究情况（含核查截止日期）、选择理由与限制；阅读卡按实际依据分为正文精读、正文选读、摘要级与原文入口；技术学习不要求先选方向；经典书目 `#/foundations` 收录不绑定方向的基础经典。

当前状态：内容 `LIBRARY-CONTENT v4.2`（45 篇分级卡、3 方向、经典 11 篇、技术 11 路线、简报 4 期），行为契约与文档地图见 [docs/SPEC.md](docs/SPEC.md)，历次计划与验收的结论见 [docs/HISTORY.md](docs/HISTORY.md)（原始过程文档已归档、不入库），未闭合项见 [docs/BACKLOG.md](docs/BACKLOG.md)。交付以验收记录为准，不以代码存在代替验收。

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
- 精选允许在 harness 中更新项目内容，网页展示整理结果。不是网页自动调用插件，也不是无人值守定时服务；动态登记条目不进入内容库、不写入个人记录。工作日每日精选按 [docs/DAILY-BRIEF-006.md](docs/DAILY-BRIEF-006.md) 由每日论文漏斗产出，历史工作日可在 `#/brief` 回看；缺日即当日未产出，不补写。
- 三条方向是选题备选，不是同时开展三个研究项目，不保证创新或发表。期刊与会议分别标注。
- `private/`、`.grad/`、`.workbuddy/`、密钥和个人研究材料不提交、不上传、不作为公共产品资源。

## 项目结构

- `public/`：前端静态资源（`library.js` 渲染与路由、`library-content.js` 公开内容、`notes.js` 本人记录、`styles.css`）。
- `server.mjs` / `discovery.mjs`：本机静态服务与同源 `/api/discover`（Crossref 近期登记查询）。
- `tests/`：契约、内容、渲染、存储与服务的自动测试（`node --test`）——测试即验收证据的一部分，必须保留。
- `scripts/check-links.mjs`：外链可达性检查，手动触发。
- `docs/`：SPEC（行为契约与文档地图）、DESIGN（设计系统）、READING-TEMPLATES-005 / TECH-LEARNING-005 / DAILY-BRIEF-006（内容生产与工作流契约）、BACKLOG（待办与未闭合项）、HISTORY（历次计划与验收的压缩时间线）、research/（方向证据初筛与深读卡来源材料）。历史过程文档不再入库，本地备份与出处见 HISTORY。

## 协作

先读 [AGENTS.md](AGENTS.md)、[SPEC](docs/SPEC.md)、[BACKLOG](docs/BACKLOG.md)（需要历史脉络再读 [HISTORY](docs/HISTORY.md)）。分析设计、实施、独立审查分开；改动须经授权后才提交、推送或公开部署（首次推送已按用户明确授权执行，2026-09-16）。

