# 从这里继续

## 最新状态：PLAN-005 阶段 0–7 已实施完成，等独立验收（2026-09-15）

用户已批准决策点 D1–D4（D1 方案 A 第五导航 `#/foundations` + 首页第五区；D2 个人待读清单纳入 v3；D3 CCF 事实并入方向页；D4 本轮不拆内容模块），并下令实施。阶段 0–7 已全部落地：

- **阶段 1 v3 阅读记录**：新增 `public/notes.js`，独立键 `research-workbench:v3`，不读写 v1/v2；状态/待答问题/笔记/个人待读清单/Markdown 导出；显式保存、脏状态提示、Web Locks 串行写、存储不可用降级为只读。
- **阶段 2 每日精选接通** `/api/discover`：三主题 tab、点击才请求、保留"登记≠发表"提示、错误态明确。
- **阶段 3 经典书目**：新增第五导航 `#/foundations` 与首页第五区，11 篇基础经典 entry/quick 元数据卡。
- **阶段 4 方向候选补充**：按 RESEARCH-005 入库 14 篇（方向一 5、方向二 3、方向三 6），全部 entry/quick 元数据卡并挂载到路线阶段。
- **阶段 5 链接卫生**：新增零依赖 `scripts/check-links.mjs`（npm run check-links）。
- **阶段 6 旧版退役**：按 LEGACY-AUDIT-005 条件 A–D，删除 legacy.html/app.js/domain.js/content.js 与旧版 styles 段，server 白名单与导航同步清理。
- **阶段 7 清理与首次提交**：`.gitignore` 定稿（含 `private/`、`.grad/`、`.workbuddy/`、密钥、node 产物）；完成首次**本地**提交，**未推送、未配置 remote**（用户选择"先只提交，推送以后再说"）。

实施后 `npm test` **122 项通过、0 失败、0 跳过**（本机）。完整证据、实测与仍缺项见 **[docs/ACCEPTANCE-006.md](ACCEPTANCE-006.md)**。

**仍未做（如实记录，不宣称完成）**：grad-radar 隔离登记与同源 Markdown 导出；桌面 1280/1440 与手机 390 全矩阵视觉核验与真实鼠标点击；深读卡生产（SWE-bench/FreshLLMs/GNNGuard/Attention/InstructGPT/ReAct）；P1.5 路线差异表、P1.6 写作侧出口、P1.7 投稿信息（暂缓，见 PLAN-005 §六）。

### PLAN-005 调研与计划（历史，已被实施覆盖）

产出三份文件：**docs/plans/PLAN-005-content-completion.md**（总计划，已是实施状态）、**docs/RESEARCH-005-candidate-papers.md**（25 篇候选，全部经公开检索核实身份与主题）、**docs/LEGACY-AUDIT-005.md**（旧版 7 个价值点逐条审计，退役条件 A–D 已满足并执行）。

### PLAN-004 实施摘要（历史，已完成）

依据 docs/plans/PLAN-004-personal-platform.md 与配套 DESIGN-005、READING-TEMPLATES-005、TECH-LEARNING-005 完成实施：新增 #/home 首页四区与首次使用说明；方向页补上研究对象、当前研究情况（带 asOf）、选择理由、限制与来源，路线按阶段分组；阅读卡按 deliveredDepth 分四种结构并完成 1 张真实 deep（Astute RAG，本次实际读取 arXiv HTML 全文，含明确标注的辅助例子）；正文改为有限 block 渲染并统一字体职责；技术学习改为六条独立必学主干（T1–T6，19 单元，主资源已定向核查）加按需支线，旧公开内容作为支线保留原摘要级覆盖。

独立验收见 docs/REVIEW-PLAN-004.md（有条件通过主体功能，6 项 P2 待修）。回流修复已完成：目录与正文标题统一由 sectionTitle 生成；手机目录 details 可折叠（≤900px 默认折叠）；阶段提示按实际分组顺序生成；首页 h3 标题作用域修正；home 字段校验补齐；ACCEPTANCE-005/本计划记录修正；新增 tests/render.test.mjs 渲染探针回归；另修复侧栏 details+flex 导致的链接横排问题。修复后 `npm test` 201 项通过、0 失败（本机）。

未迁移或删除任何旧记录，未提交、未推送、未部署。下面的PLAN003/004视觉验收历史不是本轮新功能已完成的证明。

## 交接来源（上一轮仅规划）

用户上一轮反馈要求只做策划与设计，不改应用。范围：首页四区、方向导读、证据约束的分级模板、统一排版、独立Agent技术主干及旧公开内容支线。保留现有运行版；不迁移个人记录、不删除legacy。下面的PLAN003/004视觉验收历史不是本轮新功能已完成的证明。

## 当前有效状态（用户纠正后）

用户已否决以入门实验为中心的产品，认可研究方向引导、文献筛选、参考文献辅助阅读、技术路线和每日论文摘要为中心，并授权新版开发。希望基于本人情况评估成果机会，CCF A期刊和会议均考虑，不承诺发表。用户授权仅读取本地历史资料核对候选事实，不自动导入、不外传。

当前需求以 docs/SPEC.md 与 docs/plans/PLAN-004-personal-platform.md（含 PLAN-003 保留的阅读能力）为准。2026-09-15 用户接受 Codex 三方向结论：代码修复验证、动态多源可信 RAG、部分观测图有害融合。重点是完整阅读路线、实际阅读卡、技术教程和 harness 更新的精选简报，不重新排名，不继续扩张画像打分。PLAN-001/002 保留历史，旧代码和个人存储不删除。PLAN-003 首批实现与内容已落盘并通过独立定点复审，npm test为183通过、0失败、1条件跳过。默认4173可本地试读；鼠标点击与视觉验收受浏览器工具限制未完成，详见ACCEPTANCE-003。下方为前序历史，不得据其中旧定位继续实施。


## 已完成

独立目录：D:/Program Project/ResearchWorkbench。
旧项目保留不动；历史导出逐文件一致地复制至 private/legacy-export，未导入用户进度或插件记录。
立项已获认可，当前开始首版策划；范围草案在 SPEC.md，执行顺序在 plans/PLAN-001-bootstrap.md。

## 最新模型决定

用户已保存配置，主协调者已读取确认 profile 中字段：
- research-workbench-scout：qwen3.8-max（用户选择，取代先前 glm5.3 建议）
- research-workbench-builder：glm-5.3-flash
- research-workbench-reviewer：gpt-6-astra
- 主协调者：gpt6astra

research-workbench-kickoff.md 是原工作区启动准备的原样快照，其 glm5.3 推荐、配置待保存及旧路径状态已被本文件更新；不按旧状态执行。

## 派发验证状态（2026-09-14 更新）

本会话已在 D:/Program Project/ResearchWorkbench 成功派发 scout、builder、reviewer 三个命名类型，三者均成功读取本文件并报告零写入。原会话的 type not found 阻塞已解除。当前调度结果证明命名类型可发现且能执行，不以代理自称核验底层模型；实际模型以宿主配置和运行元数据为准。

已进入首版定向调研与设计预审，设计草案见 DESIGN-001.md。尚未冻结实施任务。

以下保留原会话继续提示，已完成其派发验证前置条件：

> 读取 AGENTS.md、docs/START-HERE.md、docs/SPEC.md 和当前 PLAN。沿用已批准立项，由主会话负责策划设计。先验证 research-workbench-scout、research-workbench-builder、research-workbench-reviewer 的无写入任务派发；成功后继续首版策划、独立设计审查、实施与验收，不重新做立项。

验证任务：给每名代理明确本工作区绝对路径，请只读 START-HERE.md 并返回职责、一个保护边界和当前阶段。不以模型自称验证身份，不让验证任务改文件。若仍不可发现，检查宿主子智能体加载，不能反复重试相同类型或用默认代理冒充指定模型。

## 验证后首个调研任务

派发给 scout：只读检查已安装 grad-companion 0.4.0 的 grad-radar 及必要脚本/记录格式；必要时对照 D:/Program Project/grad-companion（若存在）但严格区分开发源与已安装版本。返回适合首版的最小读写/交接方案、记录身份与状态、冲突保护、是否需要宿主能力、不能直接实现的限制与具体来源。不初始化、不执行写入脚本、不上传私人材料。

主协调者据此定稿首版范围和设计，reviewer 审查后才冻结实施任务。具体技术栈、内容包和集成方式尚未决定。
