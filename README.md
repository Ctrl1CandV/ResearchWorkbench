# ResearchWorkbench

个人研究平台：方向阅读路线、分级论文阅读卡、Agent 技术学习主干、经典书目、每日精选与近期登记发现、本人阅读记录（仅本机，独立 v3 存储）。

首页 `#/home` 说明五区用途与进入方式；方向页给出研究对象、当前研究情况（含核查截止日期）、选择理由与限制；阅读卡按实际依据分为正文精读、正文选读、摘要级与原文入口；技术学习不要求先选方向；经典书目 `#/foundations` 收录不绑定方向的基础经典。

当前状态：内容 `LIBRARY-CONTENT v5.0`（49 篇分级卡、2 篇导读材料、4 方向（2 起步 + 2 延后）、经典 11 篇、技术 13 路线含默认三条、简报 2 期样例（09-21 回溯补记 + 09-22 空窗口期；2026-09-22 应用户要求重组，旧四期备份于 .grad/radar/archive/）。**SCAFFOLD-008 / 008.2 全部工作包已于 2026-09-22 实施完成（未提交、未推送）**：主方向为输入/输出预算约束下的跨工具智能体协作机制比较（5 步混媒介路线），第二条为代码智能体修复验证（4 步）；带路线上下文的首读导读、材料页无个人记录、双轨路线导航、Python+LangGraph 贯通教材（mock 七类检查已实跑，真实 API 未运行）均已落地，测试 143 项 142 通过 1 条件跳过。逐包证据见 [docs/SCAFFOLD-008/IMPLEMENTATION-REPORT.md](docs/SCAFFOLD-008/IMPLEMENTATION-REPORT.md)。2026-09-21 完成的设计重构（阅读动线优先、首页时间锚点、标签纯文本化）与内容库模块化继续有效，根因与方案见 [docs/DESIGN-REWORK-007.md](docs/DESIGN-REWORK-007.md)。行为契约与文档地图见 [docs/SPEC.md](docs/SPEC.md)，历次结论见 [docs/HISTORY.md](docs/HISTORY.md)，未闭合项见 [docs/BACKLOG.md](docs/BACKLOG.md)。交付以验收记录为准，不以代码存在代替验收。

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
- 当前旧库三方向是历史内容；008.2 目标是两条起步方向，延后方向不删除。研究引导不是完整课表，不保证创新或发表。期刊与会议分别标注。
- `private/`、`.grad/`、`.workbuddy/`、密钥和个人研究材料不提交、不上传、不作为公共产品资源。

## 项目结构

- `public/`：前端静态资源（`library.js` 渲染与路由、`library-content.js` 公开内容聚合器 + `content/` 六个数据模块（方向/路线论文/补充论文/经典/技术/简报）、`notes.js` 本人记录、`styles.css`）。
- `server.mjs` / `discovery.mjs`：本机静态服务与同源 `/api/discover`（Crossref 近期登记查询）。
- `tests/`：契约、内容、渲染、存储与服务的自动测试（`node --test`）——测试即验收证据的一部分，必须保留。
- `scripts/check-links.mjs`：外链可达性检查，手动触发。
- `docs/`：SPEC（行为契约与文档地图）、DESIGN（设计系统）、READING-TEMPLATES-005 / TECH-LEARNING-005 / DAILY-BRIEF-006（内容生产与工作流契约）、BACKLOG（待办与未闭合项）、HISTORY（历次计划与验收的压缩时间线）、research/（方向证据、深读卡来源材料与历史研究路线索引）。历史过程文档不再入库，本地备份与出处见 HISTORY。

## 协作

先读 [AGENTS.md](AGENTS.md)、[SPEC](docs/SPEC.md)、[BACKLOG](docs/BACKLOG.md)（需要历史脉络再读 [HISTORY](docs/HISTORY.md)）。分析设计、实施、独立审查分开；改动须经授权后才提交、推送或公开部署（首次推送已按用户明确授权执行，2026-09-16）。

