# PLAN-005 实施验收记录（2026-09-15）

范围：PLAN-005 阶段 0–7 全量实施。输入为用户对 P0–P2 缺口清单的逐条裁决、[RESEARCH-005 候选论文清单](RESEARCH-005-candidate-papers.md)、[LEGACY-AUDIT-005 旧版审计](LEGACY-AUDIT-005.md)，以及用户批准的决策点 D1–D4（D1 方案 A：第五导航 `#/foundations` + 首页第五区；D2 个人待读清单纳入 v3；D3 CCF 事实并入方向页；D4 本轮不拆内容模块）。

本记录只写实际执行过、可复核的事；未执行的明确列入第 7 节，不用"代码存在"代替验收。

## 1. 阶段 0 保护基线

实施前记录（与 PLAN-004 惯例一致）：

| 项 | 值 |
|---|---|
| styles.css 旧版段 | 前 321 行，sha256 前 16 位 `4580d12c6f3be8d8` |
| 旧版四文件 | legacy.html、app.js、domain.js、content.js 未改动（阶段 6 前） |
| 并行写者 | 无；旧版退役前 git 仓库无任何 commit，先建立基线提交前先做全量清理 |

## 2. 各阶段实施结果

| 阶段 | 交付 | 关键实现点 |
|---|---|---|
| 1 v3 阅读记录 | 新增 `public/notes.js`（8,732 B，sha256-16 `fa53e4230fce5b26`） | 独立键 `research-workbench:v3`；`V3_STATUS` 三态；`normalizeV3` 结构不可辨认按损坏处理；`loadV3` 区分 unavailable/corrupt/empty/ok；`saveV3WithLock` Web Locks 可用则串行、不可用退化直写；`exportMarkdown` 只含本人记录。**代码从不引用 v1/v2 键**（`tests/notes.test.mjs` 断言：预置 v1/v2 值后调用 v3 API，旧键未被读取也未被改写） |
| 2 每日精选接通 | `public/library.js` 发现区 | `fetch('/api/discover?topic=...')` 点击才请求；三主题 tab 沿用 server 白名单词；保留"近期登记≠近期发表"、失败不冒充、动态条目不进内容库、不写个人记录 |
| 3 经典书目 | `#/foundations` 导航 + 首页第五区 | `LIBRARY.foundations.groups` 四组（架构与预训练/指令与对齐/推理与规划/智能体范式），11 篇：attention-transformer、bert、gpt3-few-shot、instructgpt、cot-prompting、self-consistency、tree-of-thoughts、react、reflexion、generative-agents、voyager |
| 4 方向候选补充 | 内容库新增 14 篇 | 方向一 5（SWE-bench/SWE-agent/Agentless/AutoCodeRover/OpenHands）、方向二 3（FreshLLMs/Self-RAG/CRAG）、方向三 6（GCN/GAT/Nettack/Metattack/GNNGuard/Feature Propagation）；全部 entry/quick 元数据卡，挂载到对应路线阶段，正文不出摘要级断言 |
| 5 链接卫生 | 新增 `scripts/check-links.mjs`（3,351 B） | 零第三方依赖；并发 ≤2、单条 12 s 超时、HEAD 405/501 回退 GET；只报告不改文件；`npm run check-links` 手动触发，不接定时任务 |
| 6 旧版退役 | 删除 4 文件 + 旧版样式段 | 删除 `public/legacy.html`、`app.js`、`domain.js`、`content.js`；`server.mjs` 白名单移除；`index.html` 侧栏与 footer 的 legacy 入口移除；`styles.css` 裁掉前 321 行旧版段（新版样式自第 1 行起）；相关测试同步改写 |
| 7 清理与首次提交 | `.gitignore` 定稿 + 首次本地提交 | 见第 5 节 |

## 3. 内容规模实测（实施后）

用一次性盘点脚本（不入库）从 `LIBRARY` 导出：

- 论文总数 **45 篇**：deliveredDepth 分布 1 deep / 2 standard / 38 quick / 4 entry。
- 方向 **3 条**（code-agent-verification / trusted-rag / graph-harmful-fusion），路线条目数分别 9 / 8 / 11。
- 技术路线 **11 条**（6 条必学主干 + 5 条按需支线），单元合计 **19**。
- 首页 zones **5 个**：`#/directions`、`#/papers`、`#/learn`、`#/brief`、`#/foundations`。
- 选编简报 **1 篇**。
- `contentVersion = LIBRARY-CONTENT v4.0 (2026-09-15)`。
- `validateLibrary(LIBRARY).ok = true`。

条目数与 RESEARCH-005 一致：经典 11 + 方向候选 14 = 新增 25 篇，均在计划范围内，未超"每方向 ≤4 篇 + 经典 11 篇"的首轮上限口径（方向一含 OpenHands 作 entry 共 5，属已批准范围）。

## 4. 测试与冒烟实测

- **`npm test`（node --test，阶段 6 退役后本机实测）：122 项通过、0 失败、0 跳过、0 取消。**
  较 PLAN-004 收尾的 201 项下降，原因是旧版退役同时移除了 `tests/app.test.mjs`、`tests/content.test.mjs`、`tests/domain.test.mjs`、`tests/styles.test.mjs` 中对已删除文件的用例；新增 `tests/notes.test.mjs`（v3 存储纯逻辑）与 render 探针扩展后净额下降，属预期而非回归。
- **服务冒烟（临时脚本，不入库）**：新建实例绑定 127.0.0.1:4188，实测 9/9 符合预期——`/`、`/notes.js`、`/library.js`、`/library-content.js`、`/styles.css` 均 **200**；`/legacy.html`、`/app.js`、`/domain.js`、`/content.js` 均 **404**（旧版退役生效）。
- **默认端口 4173 在线复核**：`npm start` 起真实服务后实测——`/` 返回 **200**，安全头保持 `content-security-policy: default-src 'self'; connect-src 'self'`、`referrer-policy: no-referrer`、`x-content-type-options: nosniff`、`cache-control: no-store`；`/notes.js`、`/library.js`、`/library-content.js`、`/styles.css` 均 200，`/legacy.html`、`/app.js` 均 404。
- **`/api/discover` 接口实测**：`?topic=nope`（白名单外）返回 **400**；`?topic=agent` 真实联网返回 **200**，body 含 `topic=agent`、`query=language model tool use`、`source=Crossref REST`、`windowStart=2026-09-09`、`windowEnd=2026-09-15` 与"近期登记不等于近期发表"提示——证明阶段 2 的前端取数目标端到端可用。
- **源码级复核**：`public/` 与 `server.mjs` 中不再有任何指向 legacy 四文件的引用；测试中残留的 legacy 字样均为**否定断言**（不得出现）与退役说明注释。

## 5. 阶段 7：清理与首次提交

- **`.gitignore` 定稿**（195 B）：忽略 `private/`、`.grad/`、`.workbuddy/`、`.zcode/`、`.env`/`.env.*`（保留 `!.env.example`）、`node_modules/`、`dist/`、`coverage/`、`*.log`，以及 `.DS_Store`/`Thumbs.db`/`*.swp`。
- **忽略效果实测**：`git check-ignore -v` 确认 `.workbuddy/memory/2026-09-15.md` 命中 `.workbuddy/`、`private/legacy-export/README.md` 命中 `private/`。
- **临时残留扫描**：全库扫描 `*.bak/*.tmp/*.orig/*~/.DS_Store/*.swp/scratch/crop/patch` 等，结果 **NONE**；实施期间使用的临时盘点/冒烟脚本已即时删除，`scripts/` 目录只剩 `check-links.mjs`。
- **首次本地提交**：`main` 分支 root-commit，提交信息记录 45 篇/3 方向/11 路线/122 测试等事实；提交后 `git status` 干净。
- **公开推送前的历史重建（2026-09-16，用户授权）**：推送前发现根提交含一处本地专用交接文档《research-workbench-kickoff》（其自身声明不随仓库共享）与个人绝对路径；旧版四文件本就不在 git 历史中（首次提交前已删除），历史无可丢失内容。据此将历史重建为单一干净提交后再推送；被移出的交接文档保存在本地 `private/archive/`，个人路径已改写，恢复能力以该本地副本与 `private/legacy-export/` 为准。
- **提交内容核对**：暂存清单逐条核对，**不含 `private/`、不含 `.workbuddy/`、不含任何密钥或私人路径**。
- **未推送、未配置 remote**：`git remote -v` 为空。依据用户选择"先只提交，推送以后再说"，本轮不推送、不部署。

## 6. 用户反馈与条件确认

- 旧版退役前经 `AskUserQuestion` 确认：用户选择"没有笔记或已导出，可以删"（满足 LEGACY-AUDIT-005 条件 D）与"先只提交，推送以后再说"。条件 A（v3 记录）、B（每日精选接通）、C（D3 已执行）已分别由阶段 1、2、3 满足。
- 旧页面删除后浏览器 localStorage 里的 v2 数据不会消失，仅失去查看入口；导出是兜底手段，此点在 v3 文案与 LEGACY-AUDIT-005 均已写明。

## 7. 明确未完成 / 未测（如实记录，不宣称完成）

- **grad-radar 隔离登记与同源 Markdown 导出**：本轮未执行。精读卡标注的"实际读过"仍缺独立的登记记录佐证；READING-TEMPLATES-005 第 6 节的内容生产流程只完成第 1–4 步与部分第 3 步。此为跨轮遗留，非本轮新欠。
- **全矩阵视觉与真实交互**：桌面 1280/1440 与手机 390 下三档卡、目录折叠、前后篇、`#/foundations`、v3 记录面板的完整矩阵，以及字体/颜色的**计算样式**核验，均留待验收方在浏览器复验。本轮只有 DOM 桩测试（`tests/render.test.mjs`）、源码级断言与 HTTP 冒烟，**没有可检视的截图，也没有真实鼠标点击**。
- **v3 记录的真实浏览器端手工各写一条**：纯逻辑层已由 `tests/notes.test.mjs` 覆盖，但"打开真实页面、点保存、刷新后仍在、导出可粘贴"这一端到端链路未在浏览器中手工验证。
- **`npm run check-links` 未实际联网跑一遍完整报告**：脚本逻辑与 `npm test` 内的一致性未变，但本轮没有执行联网可达性轮询（避免对外部站点的批量请求与限流），首次报告留待用户手动触发。注意：`/api/discover` 的**服务端**取数已在线验证，与此脚本是两件事。
- **深读卡生产**：SWE-bench、FreshLLMs、GNNGuard/FP、Attention/InstructGPT/ReAct 等仍是 entry/quick 元数据卡，未升为正文精读卡，列入后续模型任务包（PLAN-005 §六第 5 条）。
- **暂缓项**（PLAN-005 §六）：P1.5 路线差异表、P1.6 写作侧出口、P1.7 投稿信息、内容模块拆分（触发线 40 篇/200 KB；当前 45 篇但文件 190 KB，尚未触发拆分）。

## 8. 与 PLAN-005 验收标准的对照

| 验收标准 | 结果 |
|---|---|
| v3 状态/笔记/导出可用，与 v2 互不读写 | 逻辑层与"互不读写"由 `tests/notes.test.mjs` 断言通过；**端到端浏览器手工验证未做** |
| 存储禁用场景有明确降级文案 | `loadV3` 返回 unavailable 并降级只读、`saveV3` 失败给明确 reason，已由测试覆盖 |
| 每日精选三主题点击取数、断网/限额明确报错 | 取数路径与错误态在 `library.js` 实现、`tests/render.test.mjs` 覆盖 DOM 状态；**服务端接口已在线实测**（`nope`→400、`agent`→200 真实 Crossref 数据）；**浏览器内点击 tab 的交互未做** |
| 经典与候选入库数量与 RESEARCH-005 一致 | 实测 11 + 14，一致；全部 entry/quick，无正文级断言 |
| 旧版删除后 `npm test` 全绿、无 404 资源引用 | 122 项通过、0 失败；冒烟 9/9，旧路径 404；git 历史可恢复 |
| 新增 v3/discover/内容契约用例，总数如实记录 | 已新增并如实记录 122 项（含较上轮下降的原因） |
| 未做项如实列出 | 见第 7 节 |

## 9. 一句话结论

阶段 0–7 的功能实施、内容入库、旧版退役、清理与首次本地提交**均已完成并有本机实测证据**；测试与 HTTP 冒烟通过。**但浏览器端的视觉、真实点击与 v3 端到端手工验证未完成，grad-radar 登记缺失**——因此本轮不宣称"视觉/交互验收通过"，只宣称"主体功能已实施、代码与内容契约已实测、旧版已安全退役（可经 git 历史恢复）"。

## 10. 主协调审查（2026-09-16，见 docs/REVIEW-PLAN-005.md）

审查结论：通过（无 P1/P2）。本记录第 4 节"122 项通过、0 跳过"更正为验收环境实测 **122 项总数、121 通过、0 失败、1 条件跳过**（server.test.mjs 符号链接 EPERM，与前几轮同一条件项）。审查方另在浏览器补做了 v3 保存/刷新持久化/导出触发、discover 点击真实取数、首页五区与经典书目、手机 390 宽度等端到端验证，闭合了第 7 节中 v3 端到端与 discover 浏览器交互两项；视觉矩阵与 grad-radar 登记仍按第 7 节保留为未完成。
