# DYNAMIC-GUIDANCE-009 · Agent 动态导学平台

状态：用户已批准目标与方案；**R 包三轮修订后复核 GO；A 包（内容与地图）已实施（基线 `LIBRARY.map` 10 节点/12 边＋R7 执行记录＋起步动线数据侧），A 包第一轮独立审查判定 NO-GO（B1/B2；A11–A15 五项当日已按派单修复——见「A 包独立审查与修复轮」段），A11–A15 修复轮的独立复核待执行；B1/B2 窄面修复同日完成（见同段「B1/B2 修复轮」），其独立复核未执行；B 包（首页/地图/阅读展示）已实施——general-purpose 实施者，非 builder、非指定模型（见下「B 包实施」段），其独立只读审查与真人实页走查未执行；C 包（本机更新闭环）已实施——general-purpose 实施者，非 builder、非指定模型（见下「C 包实施」段）；C 包独立只读审查已执行判定 NO-GO（阻断 B1/B2/B3），三项已于同日修复（见「C 包审查与修复轮」段）；其复核再判 NO-GO（C1 非法候选先写后验破坏写原子性＋累计 append 上限漏判、C2 撤销槽未按基线校验），两项已同日再修复（见「C 包复核修复轮」段），C1/C2 的再复核与真实浏览器实页走查未执行，视觉门槛（R8-B/C 的 390/1280/1440＋键盘）仍开放；**D 进行中（2026-09-23）：独立只读代码审查判定 GO——A11–A15／B1・B2／C B1–B3／C1・C2 各修复轮在代码面的待复核项随本审查消解；但真实浏览器实页走查未通过**：IAB 打开 `127.0.0.1:4174` 隔离 origin（无先前 v3 存储），首页 DOM 可见，点击「打开地图」两次超时（定位器唯一命中），成因未判定（不判应用缺陷、不判工具问题）；390/1280/1440＋键盘＋真实端到端闭环仍未通过，截图工件存在但不构成视觉通过。详见文末「D 包进展记录」**。工作区：`D:\Program Project\ResearchWorkbench`。

## 目的与依据

网站从固定的研究路线陈列，转为以 Agent 入门为主、由本人理解变化驱动展示的**动态导学平台**：首先回答「做什么、读什么、怎么读」；通过领域认识、读前导引、原文与本人文字记录形成起步闭环；来自本人、导师或 AI 的新认识只能形成**有来源、可预览、由本人确认**的指导调整。帮助积累与思考，不自动判断已读、掌握、创新或发表潜力。

依据：用户批准的本会话方案、`docs/SPEC.md`、`docs/BACKLOG.md` 和历史会话 `sess_cfcdae70-b3fc-48b0-8eb7-0d8891ff5d5b`。该会话读取接口提供截断摘要而非完整逐字原文：导师方法是用户转述；AI 的地图数量、导读标题、页面数及研究候选不等于用户逐项批准。用户明确要求首批有领域地图、选文理由、读前导读，个人产出以文本为主，视觉展示同样重要，不新增阅读练习，不在当前阶段细谈选题。

本次新授权覆盖旧里程碑的“前端后置”“仅静态路线”的产品范围，但**不自动授权**删除现有方向、改变论文事实或覆盖本人笔记。`cross-harness-collab` 暂保留为当前兴趣场景和阅读上下文，不能陈述为已经定稿的论文题目；`code-agent-verification` 等旧方向、旧书签、稳定论文 ID 均保留。具体方向集合变化须另获明确授权。

## 交付行为与边界

1. **首页与地图**：首屏说明编辑建议的当前关注、下一步阅读、选文理由和读法；没有个人记录时不暗示已读或已掌握。以「Agent 研究对象／问题」和「方法／解决思想」两侧构成小型文字地图，有限关系注明其语义和来源，未连接处仅提示待查问题。每日精选、经典和技术路线仍可达，不抢占主阅读动线。
2. **可信导读**：先审查现有 5+4 路线、两篇站内材料和起步卡，至少走通一条真实的「背景与术语→选文理由→原文定位→本人文本」动线。每篇说明补足的认识缺口与第一遍要读什么。只有摘要时明确摘要级，不编造全文或图表指引；精确节、图、表须核对实际版本，区分论文原文事实、AI 整理与阅读建议。保留可靠内容、补实不足内容，不凑数量和占位。
3. **本人记录**：继续显式保存手动状态、问题与笔记；不因打开页面、AI 文字或提案而更改已读状态。优先复用 v3 文本字段；如确实需要多次修订史，先设计兼容与备份，未经单独核查不迁移、不覆盖旧键，更不读写 v1/v2。导学撤销不撤销原始笔记。
4. **动态闭环**：本人主动粘贴或导入有版本的结构化调整提案；提案含来源类型与日期、稳定目标、旧版依据、拟变更指导、理由和证据边界。网站对目标／格式／旧版本及变更后的内容做白名单校验，再展示差异，明确确认或不采纳；确认后重新打开首页和相应入口仍有变化。保留基本历史、允许撤销最近一次指导调整，并提供备份的导出／导入和冲突说明。原始聊天文本无法解析时提示“尚未形成可应用调整”，不宣称路线已更新。优先使用独立本机存储覆盖层，维持只读 Node 服务，不自动上传私人资料。
5. **拒绝越界**：提案不得写任意对象路径、脚本、HTML、任意外链、本人已读状态或伪造论文事实；不得通过本机覆盖层绕开方向集合授权及来源审查。存储损坏、版本冲突、非法目标和写入失败均需显式提示且不影响原记录。不做实时聊天／模型调用、自动画像推荐、自动检索建库、图谱编辑器、实验平台、创新或发表评分、打卡、账号或云同步。

## 顺序工作包与验收

**R · 契约与设计审查（代码前置门槛）**。读取 AGENTS、SPEC、BACKLOG、008 相关契约、设计文档、现有内容和测试。只写本任务包的勘误、必要的 SPEC 增量和精简设计说明，不改产品代码。提出地图节点／关系语义、首页与导读文字线框、结构化提案的有界可改字段与冲突处理、来源核验清单。独立 reviewer 只读审查；未解决的阻断项不能进入产品实现。

**A · 内容与地图**。单一实现者逐条核查起步材料的身份、版本及使用到的正文范围，制作少量有据可查的地图节点和导读。读者无需先选择论文方向也能进入；不因聊天提到论文就自动入库。必要时改 `public/content/`、聚合器、内容测试；保留旧 ID、链接及延期内容。

**B · 首页、地图、阅读的展示**。在 A 的共享文件改动完成后顺序执行。调整 `public/index.html`、`public/library.js`、`public/styles.css` 与渲染测试；无记录／有记录／待核／待确认的可见语义各自清楚。键盘操作与 390、1280、1440 宽度实页核验，不能只凭 DOM 测试宣布视觉通过。

**C · 本机更新闭环**。在 B 后顺序执行。新增小型纯数据模块和严格 schema，触及 `library.js`、服务精确白名单与相应测试；优先不改 `notes.js`。预览与确认间重新校验冲突，写入完整成功或旧状态不变；撤销只恢复指导，不丢笔记。导入不能默认覆盖别处更新。服务继续仅限 loopback、GET/HEAD、Host 与 CSP 边界。

**D · 独立只读审查与验收**。reviewer 不改代码；实施者按意见修正。跑 `npm test`，如实记录通过、跳过、未执行；真人走查首页→地图→导读与原文→本人文字→**明确标为示例**的提案预览→确认→重载→撤销，使用隔离存储，不拿真实个人记录试删或覆盖。核查旧深链、私人资源不能被服务、内容真实性和窄屏布局。无独立审查时须说明未执行，不得宣称通过。未经用户明确授权，不提交、不推送、不公开部署。

## R 包设计细则（2026-09-23 文档实施交付；经首轮 6 项阻断与复核 6 项矛盾两轮修订，待第三轮复核）

以下字段名取自现有数据（`public/content/directions.js`、论文卡四模块、`public/notes.js`、`server.mjs` 白名单）。A–C 实施包按本节填写，只许收紧、不许放宽；本轮未改任何产品代码。

### R0 勘误与盘点（事实）

- `LIBRARY.contentVersion` 实际为 **v5.1**（2026-09-22，`public/library-content.js`）；SPEC 内容段原写 v5.0，已按审查意见当日同步为 v5.1（计数与事实不变，仅版本注记）。提案与冲突比较以 R3 的**逐字段快照 `expectedBase`** 锚定，不依赖版本字符串。
- 现有起步盘点：主方向 `step-collab-1…5`（引用 `mat-cross-harness-map`、`beyond-frameworks`、`memgpt`、`handoff-tax`、`handoff-debt`）；第二方向 `step-code-1…4`（引用 `mat-read-empirical`、`tosem2025-acceptance`、`agentless`、`swe-bench`）；两篇 primer 材料；featured 技术路线 `tech-multiagent` / `tech-rag` / `tech-graph-simple`。来源核查基线见 `docs/SCAFFOLD-008/07-source-audit.md`。
- v3 阅读记录键与结构（`research-workbench:v3` 的 `papers{id→status,question,note,updatedAt}` 与 `readingList`）本轮不改；导学覆盖层是独立新键，两者互不读写、互不迁移。
- **提交/推送事实（2026-09-23 独立审查勘误）**：`be41029`（008.2 全量落地）现同时位于 `main` 与 `origin/main`（同一 SHA，无领先/落后）；此前 SPEC/BACKLOG 中「008 改动未提交、未推送」及「已推送的是 09-20 前状态」的表述已过时，两份文档已按观察事实更正。该次提交推送的历史授权过程本文不重述、不推断；**自本次文档修改起的新提交/推送仍须用户明确授权**。本 009 文档包自身未提交。
- 首页「首读」不变式（审查阻断 1 对应事实）：`home.startHere` 是 typed NodeTarget（`routeId`＋`track='start'`），内容测试强制其为该方向 startRoute **第一节点**、且与旧 `startHerePaperId` 互斥（`public/library.js` L1443–1458）。覆盖层不得改写该基线数据，R3 的 home-focus 设计据此改为「只写方向与附注，步骤由生效路线推导」。

### R1 地图模型（节点与关系语义）

- **两侧**固定：`problem`（Agent 研究对象／问题，含开放问题）与 `method`（方法／解决思想）。节点是少量文字，不是图形编辑器，也不是知识图谱平台。
- **节点** `mapNode = { id, side, label≤40字, summary≤300字, refs[], source }`：`id` 稳定且匹配 `^map-[a-z0-9][a-z0-9.-]{1,47}$`，一经发布不改义、不回收复用；`refs` 只允许站内已存在 ID（paper / material / direction / tech-route / step-*），渲染时解析；`source = { originType: 封闭枚举 'content'|'advisor'|'ai'|'self'（中文标签仅 UI 映射，与提案 origin.sourceType 同一词表）, note≤200字, asOf }`。`advisor` 与 `ai` 只能承载问题侧或建议依据，不得承载论文事实。
- **关系** `mapEdge = { id, from, to, meaning, evidence[], source }`：`id` 形如 `map-edge-*`；`meaning` 固定五值词汇——`addresses`（方法→问题）、`variant-of`、`conflicts`、`depends-on`、`inspires`，每条注明其语义即词汇含义＋来源；`source` 用与节点相同的封闭枚举。**来源限制（复核阻断 6）**：方法—方法之间与 `addresses` 的边，其唯一 source 只能是 `content`（指向站内已核条目）或 `self`；`advisor`/`ai` 只能以问题侧「待查问题」文字行给线索，**不得成边**。**evidence 三层校验**：schema 层——`evidence[]` 每项必须解析为站内 ID（解析不了 ⇒ 校验 ③ 整案拒绝，而非默默降级）；核查层——evidence 必须指向 R7 清单结论「保留可用」的条目，指向「保留收窄/待复核」者不得成边；渲染层——任一层失败的边降级为「待查问题」文字出现，**不画线、不暗示连接**。
- **生效总额上限**：基线＋覆盖层合并后（含示例条目）≤12 节点、≤15 边；提案导致越限即整案拒绝。提高上限属于 A 包内容工作，不得经覆盖层塞入。
- **基线承载（审查阻断 5）**：A 包产出的基线地图数据承载于聚合器 `public/library-content.js` 的 `LIBRARY.map` 字段（该文件已在服务白名单内，**不新增服务路径**）；如 A 包实施时改为独立模块，必须同包修改 `server.mjs` 精确白名单与 `tests/server.test.mjs` 并在任务包中声明。基线与覆盖层节点/边共用同一 id 命名空间，insert 冲突检查含 tombstones（R5）。
- 关系语义≠引用关系：沿用 PF-07，编辑排定的顺序与关联不冒充论文引用。

### R2 页面与文字线框

首页首屏（B 包落地；既有各区保留入口、下移不抢动线）：

```
┌ 首页 · 今日视角 ─────────────────────────────────────────┐
│ 当前关注 · cross-harness-collab                ← 编辑建议（附来源＋日期行）│
│ 下一步 · 生效 startRoute 首节点推导（当前：step-collab-1《跨工具协作：先把研究问题分清楚》）    │
│   为什么选它：…（step.purpose；如经覆盖层调整，附来源行）      │
│   怎么读它：地图浏览（passMode=map；站内 primer 本身即地图）  │
│ 我的记录：在读 2 篇（仅本人手动标记，不显示百分比/连续天数）    │
│ [打开地图] [导读：分清问题] [有 1 条待确认提案 → 预览]         │
├ 每日精选 · 经典 · 技术路线 · 方向 · 材料（一行入口，不占主动线）┤
└ 无记录时：「尚无阅读记录——以下为编辑建议的起步路线，不是你的进度」┘
```

- 「待确认提案」横幅只在存在 pending 提案时出现，点击进入提案预览页；无提案时该行整体不出现，不留占位。**pending 提案仅存在于页面会话内存、不落盘**（审查阻断 2）：未经确认即刷新/关闭=整案丢弃，横幅随会话消失，需重新粘贴或导入，不存在「半写入」中间态。
- 「下一步」不存直接写死的步骤指针：由 `resolveHomeFocus()` 从生效 startRoute 首节点推导（R3 home-focus 行、R5 单一来源），与 `home.startHere` 既有不变式一致；覆盖层调整步骤顺序/字段后，推导结果随之变化。
- **默认焦点（复核小项）**：覆盖层无 `homeFocus` 时，当前关注＝`status=active` 中 order 最小的方向（现 `cross-harness-collab`），下一步＝其生效 startRoute 首节点（现 `step-collab-1`），与基线 `home.startHere` 完全一致；`homeFocus.routeId` 只可切到 active 方向，deferred 不经覆盖层前置。`resolveHomeFocus` 对 example 条目的过滤规则见 R6。
- 导读四段动线（A 包至少走通一条真实动线，建议主方向 `step-collab-1→2`）：**背景与术语**（learner.gist）→ **为什么选它**（reasons / step.purpose，AI 整理须标来源类别）→ **原文定位**（coverage.basis＋sections＋version；摘要级卡不得给出节/图级指引）→ **读完写下**（问题指向论文卡 question 与 v3 面板；材料只读、无记录面板，「写下」指向下一步论文的读前问题）。
- 提案预览页：

```
┌ 提案 prop-2026-09-23-01 · 来源：AI 建议（2026-09-23，经本人转述导入）┐
│ 证据边界：origin.evidenceNote 全文展示，不截断                   │
│ #1 route-step step-collab-3 · readWhen                        │
│    旧值：……   新值：……        [✓ 采纳此条] [✗ 保持旧值]           │
│ #2 map-node map-budget-cost（新增）         [✓] [✗]            │
│ 冲突：#3 旧值与当前生效值不一致 → 三格对照，逐条选择，不自动合并      │
│ [确认并写入] [整案不采纳]（两个都是显式动作；关闭=不采纳）           │
│ ⚠ example=true：顶部常驻黄字横幅「示例 · 非真实指导」              │
└──────────────────────────────────────────────────┘
```

### R3 结构化提案 Schema（有界）与可改字段白名单

```jsonc
{
  "kind": "rw.guidance-proposal",        // 固定字面量
  "schemaVersion": 1,
  "id": "prop-2026-09-23-01",            // ^prop-[a-z0-9.-]{1,58}$；example:true 时 id 必须含 example 段
  "createdAt": "2026-09-23",             // YYYY-MM-DD
  "example": false,                      // true ⇒ UI 强制示例标记
  "origin": {
    "sourceType": "self|advisor|ai",     // 仅此三值
    "label": "≤80字 来源简述",
    "asOf": "2026-09-22",                // 来源信息获得日期
    "evidenceNote": "≤300字 必填：证据与边界"
  },
  "changes": [                            // 1–10 条；结构性非法（含重复 targetRef、条目相互依赖，见下「提案内独立性」）⇒ 整案拒绝；stale-base 属冲突、非非法，可进预览
    {
      "op": "set|append|insert|remove",  // insert/remove 仅 route-step 与 map-node/map-edge；remove 仅限覆盖层自有对象；insert 的 id 不得与 tombstones（R5）冲突
      "target": { "type": "route-step|paper|material|direction|map-node|map-edge|home-focus",
                  "id": "站内 ID 或覆盖层自有新 ID", "field": "白名单内字段名" },
      "expectedBase": "canonicalSerialize(该 targetRef 应用前生效值)（见下，复核阻断 2），≤600 UTF-16 码元；set/remove/append 必填",
      "value": "新值（结构与上限见下表）",
      "reason": "≤200字，必填"
    }
  ]
}
```

**可改字段白名单（唯一权威表；未列出字段一律拒绝）：**

| 目标 type | 允许 op | 允许 field | 界 |
|---|---|---|---|
| route-step（基线 step-*） | set | purpose, readWhen, check, stage（STAGE_ORDER 五值）, required（必读\|选读）, passMode（map\|core\|deep） | 字符串 ≤500字；基线步骤只可改字段、不可删除 |
| route-step（覆盖层新增） | insert / remove | kind=paper\|article ＋ paperId/materialId（必须已存在于站内库）＋上行字段；id `step-ov-*` | insert 必须给 anchor（某现有 step 之后或路线末尾，同一 track）；remove 仅限覆盖层自有步骤 |
| paper | set / append | learner.gist / learner.value / learner.intent；questions（append 一条） | 字符串 ≤500字；append ≤1 条 |
| material | set / append | 同 paper | 同 paper |
| direction | append | openQuestions | 每条 ≤200字；title/status/summary/overview/stateOfField/sources/asOf 全部禁改——方向集合与事实陈述属 A 包与用户授权 |
| map-node / map-edge | set / insert / remove | R1 字段 | 生效总额（基线＋覆盖层，含示例）≤12/≤15，越限整案拒绝（R1）；基线（A 包产出，`LIBRARY.map`）地图内容只可 set，不可删 id；remove 仅限覆盖层自有节点/边，删除后 id 入 tombstones |
| home-focus | set | routeId, note（≤200字） | routeId 必须解析为生效态 `status=active` 的方向；**不可直接写步骤指针**（审查阻断 1）：「下一步」一律由 `resolveHomeFocus()` 取该方向生效 startRoute（含覆盖层 insert/remove/字段变更后）的第一节点推导，基线 `home.startHere` 数据不被覆盖层改写、其内容测试不变式继续生效；提案写 `stepId` 等其它字段按非白名单整案拒绝。推导为空理论上不可能（基线步骤不可删），仍失败则回退基线 startHere 并显示一行显式提示，不静默 |

**提案内独立性（部分采纳 sound 的前提，复核阻断 1）：** 同一 `targetRef`（＝type＋id＋field；insert/remove 按该 id 计）至多出现一次；每条 `expectedBase` 与 insert 的 anchor 一律按**应用本提案之前的生效态**计算，不得引用本提案另一条目将产生的值或将新建/删除的节点（anchor 不得同时是本提案某 remove 的目标）。违例属结构性非法 ⇒ 校验 ② 整案拒绝。只有满足独立性，预览页的逐条「采纳/保持旧值」才是 sound 部分采纳：任意采纳子集可独立、原子应用，条目之间无先后依赖。

**`canonicalSerialize`（基线快照唯一序列化，复核阻断 2）：** 输入 targetRef 的应用前生效值：字符串＝原文（不 trim，换行统一 `\n`）；枚举＝值原文；字符串数组（openQuestions/questions/refs/evidence）＝逐元素以 `\u001F` 连接；对象（步骤节点、地图节点/边）＝按**白名单字段声明序**以 `\u001E` 连接 `key=value`（固定序，非字典序；未设字段不输出）。长度按序列化结果的 UTF-16 码元计，≤600。撰写提案时基线取自站点预览页/字段的「复制规范基线」导出（C 包以同一函数提供）；手抄不一致按 stale-base 冲突进预览，不静默拒绝。校验、比对、三格 diff 复用这一函数，提案内不携带整对象副本。

**硬禁止（schema 层直接拒绝）：** 非白名单字段（coverage、sources、url、title、type、importance、difficulty、role、recommendedDepth、deliveredDepth、readingActions.explain、direction.status、archiveRoute）；任意对象路径 / `__proto__` / `constructor` 等计算键；URL、HTML 标签、脚本片段；对 v3 状态或本人笔记的任何引用；超长与控制字符。`explain` 块是实际讲解内容（PF-11「Explain 必须有实际讲解」），只能经 A 包来源审查生产，不得由提案带入。

**校验顺序（复核阻断 1 定死边界）：** ① JSON 解析（截断、多对象、BOM 均拒绝）→ ② schema、上限、白名单与枚举、提案内独立性（重复 targetRef、条目相互依赖均在此整案拒绝）→ ③ 目标可解析（对**应用前生效态**；含 insert 撞 tombstones、总额上限复校）——**①–③ 任一失败：提示「尚未形成可应用调整」＋首个错误定位，不出预览、不宣称任何更新**。④ 逐条 `canonicalSerialize(expectedBase)` 比对：不符 ⇒ 该条标记 `stale-base`，**仍作为冲突进入预览**出三格对照、逐条采纳——stale-base 永不整案拒绝、永不阻止预览。⑤ 确认瞬间重跑 ①–④（防竞态），通过才原子写入。

### R4 来源（Provenance）展示规则

- 覆盖层生效的每个字段，页面以纯文本 meta 行显示：`导学调整 · AI建议 2026-09-23（本人确认）`；其下保留编辑原文来源行。不加徽章、不靠颜色区分（DESIGN-REWORK-007 口径）。
- 三种来源语义严格区分：`self`=本人陈述；`advisor`=用户转述（网站只显示「转述」，不声称逐字原文）；`ai`=AI 建议，永不呈现为事实或「导师要求」。
- 覆盖层替换编辑文案时，旧值在历史区可见（R5），内容模块文件永不被覆盖层改写。

### R5 存储、冲突与回滚

- 新键 `research-workbench:guidance:v1`（独立于 v3；不读写 v1/v2）：`{ version:1, seq, base: {contentVersionLabel（仅信息注记，比较一律不依赖版本串）}, entries{targetRef→{value, origin{sourceType,label,asOf,evidenceNote}, proposalId, appliedAt, example}}, history[≤20]{seq, kind:'apply'|'undo'|'import'|'reset', proposalId, origin, appliedAt, summary, acceptedCount/rejectedCount（逐条选择后采纳/放弃条数，复核小项）, example}, homeFocus?, map{nodes[],edges[]}（各条含 example 标记）, tombstones{被 remove 的覆盖层自有 id → removedAt}, **undoSlot?{overlayBefore(应用前完整覆盖层快照), proposalId}** }`。整份 JSON 一次写入，成功或保持原状；Web Locks 口径同 `notes.js`；存储不可用/损坏给明确文案，页面降级为 base 内容显示，v3 不受影响。**`undoSlot` 本机专用（复核阻断 3）**：导出文件不含 `undoSlot`（导出格式＝其余字段）；导入档若含 `undoSlot` 按未知字段拒绝。
- **seq 单调**：`seq` 是本机覆盖层的写入序号，任何成功写入（提案确认应用、撤销、import 合并、reset 后再次应用）都 `seq+1`，永不复用、不回退；history[≤20] 截断时只丢最旧条目的摘要（不影响撤销，撤销只依赖 `undoSlot` 的完整快照）；import 比较以 seq＋appliedAt＋生效内容 hash 为准（见冲突）。
- **tombstones 语义**：`remove` 成功后被删的覆盖层自有 id（step-ov-*、覆盖层 map-*）进入 tombstones，insert 校验与 history 均视其为占用——**释放后不复用**，防止同名复活造成 `expectedBase` 歧义；tombstones 仅对覆盖层自有对象有意义（基线步骤与基线地图 id 本就不可删），上限 40，超限提示先 reset 或走 A 包；**reset 连同覆盖层清空 tombstones**（新周期可复用 `step-ov-*`/覆盖层 map id；此时旧提案的 `expectedBase` 与新生效态不符，按 stale-base 进预览，不再产生歧义）。
- **示例标记持久化**（首轮阻断 4）：`example` 是 entries / history / map 节点与边 / homeFocus 各条的**持久字段**（随覆盖层 JSON 落盘），非仅存在于会话内存中的提案对象；刷新/重开后示例横幅照常显示，import 后同样保留（tombstones 仅 id 与时间，不涉 UI 展示）。示例条目与首页推导/其他视图的显示边界按 R6 两规则执行。
- **单一覆盖层来源**：覆盖层是指导调整字段的**唯一生效副本**；页面任何位置（首页、路线、卡片、地图、预览）读取生效值只经 `computeEffective(base, overlay)` 一个入口，禁止第二存储键或多处缓存副本（审查非阻断项：single overlay source）。
- **冲突分类**：`stale-base`（`expectedBase` 与当前生效值不符）→ **属预览内冲突，不整案拒绝、不阻止预览（R3 校验 ④）**；三格对照（提案旧值／当前生效值／提案新值），逐条确认或放弃，不自动合并；`target-missing` → 校验 ③ 整案拒绝；`双标签页竞态` → 确认瞬间重跑 ①–⑤，有变化则重新预览；`corrupt` → 明确提示＋保留坏档供导出自查，不猜测修复、不静默清空。
- **import 冲突（审查阻断 3）**：换浏览器的覆盖层 JSON 导入时，同时比较两侧 `seq`、末条 `appliedAt` 与**生效内容 hash**（`computeEffective` 结果规范化后取摘要）。三者全等 → 提示「与本机一致，未写入」，no-op；否则 **一律不默认覆盖本机**：先出逐 targetRef 差异（含 seq 落后但内容不同、撤销致 seq 新值回旧值等情况），「保持本机」或「导出本机后替换」都是显式动作；替换按导入档重建覆盖层并记一条 `kind:'import'` history（seq 在本机原值上继续 +1，不采外来 seq）；替换瞬间 `undoSlot`＝**本机替换前的完整覆盖层快照**（复核阻断 3：导入档不带撤销槽，本机「撤销最近一次导学调整」仍可撤销本次替换，前向写入 seq+1）。提案（proposal）导入同理：以 `expectedBase` 为准，不以版本串为准。
- **回滚（审查阻断 3）**：「撤销最近一次导学调整」= 恢复 `undoSlot.overlayBefore` 的**完整覆盖层快照**（多字段提案一次全回，不留半套；只回指导覆盖层，绝不触碰 v3 笔记）；撤销实现为**新的前向写入**（`kind:'undo'`，`seq+1`，history 只追加不回删、seq 不回退），保证 import 比较基准健全。仅支持撤销最近一次 apply（history 末条 `kind` 非 undo/reset 时按钮可用），连续回退走「重置导学覆盖层」= 先导出 JSON、再确认清空（记 `kind:'reset'`，同样 seq+1；清空含 `undoSlot` 与 `tombstones`，**reset 后不可再撤销**，导出档是唯一找回途径）。v3 的 Markdown 导出仍是本人记录唯一备份；导学覆盖层备份为 JSON 导出/导入（只含指导、来源与示例标记，不含本人笔记）。
- **服务边界不变**：提案导入/导出、覆盖层读写全部发生在浏览器内（localStorage＋文件下载/上传）；`server.mjs` 维持仅 GET/HEAD＋精确路径白名单。C 包新增前端纯数据模块（建议 `public/guidance.js`：schema、序列化、校验、diff）时只扩白名单精确路径，不新增写接口、不新增 API。

### R6 示例数据边界

- `example:true` 的提案，以及由这类提案写入并**持久继承 example 字段**的覆盖层条目（entries/history/map 节点与边/homeFocus，见 R5），按**两规则划界（复核阻断 4）**：① 首页「当前关注／下一步」的 `resolveHomeFocus` 推导**永久过滤 example 条目**——示例不改写首节点推导、不冒充真实下一步建议；② 其它视图（路线步骤列表、地图、被调整的卡内字段）在示例生效时**照常渲染，但必须带常驻示例横幅**「示例 · 非真实指导」，横幅从持久字段重建、随刷新/重开/import 保留，并非仅预览可见。
- `npm test` fixture 与 D 包走查只用示例＋隔离存储，不拿真实 v3 试删或覆盖；示例地图条目与真实条目同受生效总额 12/15 上限约束。
- 示例走查结论写入实施报告时如实标注「示例，非真实导学调整」。

### R7 内容来源审查清单（A 包输入）

逐项核查并落表（列：目标 id／身份／版本／实际使用正文范围／获取路径／既有核查记录／结论=保留可用|保留收窄|待复核／checkedAt）：

1. 两篇 primer（`mat-cross-harness-map`、`mat-read-empirical`）：实际正文、编辑陈述与来源说明（00 §5）；
2. 四张新论文卡的 `coverage.basis/version` 与 07 审计记录逐条对照（beyond-frameworks＝ACL 2025／arXiv:2505.12467，§3.2–3.5 已核；memgpt；handoff-tax＝arXiv v1；handoff-debt＝arXiv v2＋§5.1 表2）；
3. `step-code-*` 引用件（tosem2025-acceptance、agentless、swe-bench）当前深度声明核对：凡「只有摘要级判断」者，导读与路线文案不得出现节/图级指引；
4. 主方向 `sources` 四条公开链接与 `openQuestions` 各条的依据归属；
5. **新增地图节点/关系**：每条边的 `evidence[]` 必须逐条指向本清单结论为「保留可用」的条目（R1 三层校验）；边 `source` 受 R1 来源限制——`advisor`/`ai` 不得为方法间或 `addresses` 边的唯一来源，导师转述与 AI 建议只进问题侧「待查问题」文字行或提案理由，不进方法节点的论文事实；
6. 至少一条完整动线（背景与术语→为什么选它→原文定位→读完写下）经页面实位核验后，B 包方可启动；受阻项如实 `pending`＋原因，不凑占位卡。

### R7 审查执行记录（2026-09-23，A 包实施者填写；当日网络定向检索＋站内交叉核对）

列：目标 id／身份／版本／实际使用正文范围／获取路径／既有核查记录／结论／checkedAt。「本轮复核」指 2026-09-23 A 包实施会话对原文的重新定向读取；结论＝保留可用｜保留收窄｜待复核（R1 核查层：只有「保留可用」条目可作为边 evidence）。

| 目标 id | 身份／版本 | 实际使用正文范围 | 获取路径 | 既有核查记录 | 结论 | checkedAt |
|---|---|---|---|---|---|---|
| mat-cross-harness-map | 站内 primer（编辑说明，非论文）／— | primer 全文（约 900 字，四层小表、两个编辑举例组合、Skip 理由）；其指涉的四篇论文按下列各行复核 | 站内文件＋四篇原文 | 07 §1、008.2 包3 报告 | **保留可用**（编辑条目：来源说明与「编辑举例／编辑构造」标注齐备） | 2026-09-23 |
| mat-read-empirical | 站内 primer／— | primer 全文（三遍读法＋四问题＋编辑举例）；对 TOSEM 的指涉仅用到其卡已登记 §3 级内容 | 站内文件＋TOSEM 卡 | 07 §1、008.2 包3 | **保留可用**（编辑条目；TOSEM 事实部分以卡登记范围为限） | 2026-09-23 |
| beyond-frameworks | ACL 2025 长文 2025.acl-long.1037，pp.21361–21375，Wang/Zhao/Wang/Qiang/Qin/Liu；arXiv:2505.12467v1（2025-05-18） | 摘要与引言；§3.2 治理、§3.3 参与、§3.4 交互（I1–I4）、§3.5 上下文管理（三策略；C1＝上一轮完整日志，非全任务轨迹）；§4.1 场景（DEI＝MIMIC-III 出院去向预测，SES＝证据基事实核查）；Limitations | ACL 官方页＋arXiv HTML v1（本轮在线重读） | 07 §1/§2（09-22 核身份与 §3/§3.5/Limitations） | **保留可用**（本轮逐节复核一致；coverage.sections 已细化到小节） | 2026-09-23 |
| memgpt | arXiv:2310.08560（v1 2023-10-12；v2 2024-02-12），Packer 等 7 人 | 摘要、引言、§2.1 主上下文（系统指令/工作上下文/FIFO）、§2.2 队列管理（告警/溢出阈值、换出＋递归摘要）、§2.3 函数执行器、§2.4 控制流与函数链 | arXiv abs＋HTML v2（本轮在线重读） | 07 §1（09-22 核 §2 概述） | **保留可用**（单 Agent 机制例子边界在卡内保留；不引任何实验分数） | 2026-09-23 |
| handoff-tax | arXiv:2608.24358 v1（2026-08-25），Ganz/Nacson/Kalyanpur/Litman | 摘要；§3 四条件（Raw/Compact_pre/Compact_suf/Traj-drop，均保留工作树、只改轨迹信息）与「同 mini-swe-agent 脚手架/工具/提示」；§4 QRec（升配 Raw≈47%/36%，Traj-drop≈64%/84%）与降配 CSRet 分模型对（Claude 对≈80%，GPT 对≈14%）；局限（hard 子集 N̄≈24 属探索性、单轮、两对模型、切换点预设） | arXiv abs＋HTML v1（本轮在线重读） | 07 §1/§2、包3 报告 | **保留可用**；**修正一处口径（B1 修复轮）**：原记录与卡内登记写作「降配 CSRet≈80%」属无条件单数口径，与 §4 原文分模型对表述（Claude 对≈80%、GPT 对≈14%）不符 → 卡 coverage.basis、地图 map-meth-cond 节点摘要与 map-edge-cond-reverses-intuition 边文案已按原文改正，不再有无条件 80% | 2026-09-23 |
| handoff-debt | arXiv:2606.02875 v2（v1 2026-06；末修 2026-08-30），KC & Budathoki | 摘要（四视图、75 源任务/181 交接点/每模型 724 次运行）；§4.3（OpenHands 式环境、Qwen 前任）；§5.1 表2（Qwen 后任 602k vs 811k；Gemma 300k vs 319k；Devstral 1.66M vs 2.30M）；§5.3 初始字符中位（87k vs 7.2k/9.8k/10.0k）；§5.5 与局限（每交接点每视图单轮） | arXiv abs＋HTML v2（本轮在线重读） | 07 §1/§2、包3 报告 | **保留可用**；**修正一处口径**：卡内「表 2 为字符/相对变化口径」与已读内容不符 → 改为「表 2＝agent 事件数＋累计 prompt token 两列口径；字符口径指 §5.3 初始长度」（与 07 §2 一致） | 2026-09-23 |
| tosem2025-acceptance | TOSEM 34(3) Art.57（2025-02，DOI 10.1145/3702971）（按卡与制作记录登记） | 本轮未能重读正文：PDF 抓取格式不受支持、ACM 页拒绝直连；只核对了卡内 §3 级散文叙述与 primer/路线文案一致 | 作者 PDF（008.1 pdftotext 制作）；本轮 DOI 跳转被拒 | docs/research/reading-cards/tosem2025-acceptance.md（2026-09-15 逐节定位） | **保留收窄**：卡内已登记文字与路线照旧保留（其自身核查成立），但本轮未独立重读 → **不得作为基线地图边 evidence**；checkedAt 保持 2026-09-15 不刷新 | 2026-09-15 |
| agentless | arXiv:2407.01489（v1 2024-07-01；v2 2024-10-29） | 本轮复读当前摘要：三阶段（localization/repair/patch validation）、「不让 LLM 自主决定行动/不用复杂工具」、SWE-bench Lite 评估与人工过滤问题条目构造更严格子集——均摘要可见；性能/成本数字按纪律仍不引 | arXiv abs（本轮在线重读） | 07 §1（沿用原卡）、原卡 basis 09-15 | **保留可用（摘要级）**；step-code-3 文案核对：无节/图级指引 ✓；不入地图边（摘要级选目） | 2026-09-23 |
| swe-bench | arXiv:2310.06770（v1 2023-10-10；v2 2024-04-05；v3 2024-11-11；comments 标 ICLR 2024） | 本轮逐句复读 v3 摘要：issue+对应 PR、12 个 Python 仓库、跨函数/文件难点可证；**摘要未述判定测试机制**——原卡把「失败转通过/通过保通过（fail-to-pass/pass-to-pass）」当摘要级事实陈述 | arXiv abs（本轮在线重读） | 原卡 basis 09-15（自称仅摘要） | **保留收窄→本轮修正**：lead/gist/roleReason/questions 与 step-code-4、archive-code-3 文案改为「判定测试构造属正文、待核」；不作地图边 evidence；版本号补 v2 日期 | 2026-09-23（摘要）／正文待核 |
| 主方向 sources 四条 | 2025.acl-long.1037 页；abs/2310.08560；abs/2608.24358；abs/2606.02875 | 四条公开链接本轮全部实取成功，标题/作者/日期/身份与各卡登记一致 | 官方页（本轮） | 07 §1 | **保留可用** | 2026-09-23 |
| 主方向 openQuestions 四条 | 方向定义文字（用户 008.2 授权） | 归属核对：Q1→方向定义＋导读「两本账」＋Debt 分账例子（已复核）；Q2→Tax 方向反转（已复核）＋Debt 后任模型差异（已复核）；Q3→导读「持续分工/反馈往返」＋MemGPT §2（已复核）＋Tax/Debt 单轮局限（已复核）；Q4→导读 callout（编辑标注） | 站内文字＋上述行 | 00 §1/§3、07 | **保留可用**（均为编辑问题陈述，非论文事实） | 2026-09-23 |
| cross-harness-collab（主方向条目） | 站内方向定义（编辑条目，非论文；用户 2026-09-21/22 授权，008.1/008.2）／— | 方向 summary/overview 与 startRoute 构成文字；其论文事实与来源链接逐条由本表「主方向 sources 四条」「主方向 openQuestions 四条」与四卡行承载，本行不新增论文事实 | 站内文件（public/content/directions.js）＋本表上述行 | 07 §1、00 §1 | **保留可用**（B2 修复轮补登记：编辑方向陈述，可作地图 refs/evidence 的方向文字条目） | 2026-09-23 |
| step-collab-1…5（主方向起步路线五步） | 站内路线步骤（编辑导学文字，非论文；随方向定义经用户 008.2 授权）／— | 五步 purpose/readWhen/check 全部文字（步骤数据无 nextAction 字段——该字段只在 primer 材料上；原登记笔误已在 B 包审查勘误，2026-09-23。含 A04 核对过的节级定位：step-collab-2/3 的 §3.2–3.5、§2.1–2.4；step-collab-4/5 的 Tax/Debt 设置口径）；步骤所指论文与 primer 内容以本表对应行为准 | 站内文件（public/content/directions.js）＋本表 primer/四卡行 | 07 §1/§5、包3 报告、A04 动线走通 | **保留可用**（B2 修复轮补登记：编辑路线文字条目，不独立承载论文数字；12 条基线边中 7 条边引用 step-collab-* 的 evidence 落点即此行与本表 primer/四卡行） | 2026-09-23 |
| 第二方向 sources 三条 | TOSEM 链接＋ComPass abs 2602.07561＋OpenAI 审计页 | 本轮不在 R7 必核清单（第 4 项限主方向）；ComPass 与 OpenAI 页未复核 | — | 07 §1、原卡 | **未复核（如实记录，不涉及本包改动）** | — |

R7-5（地图边复核）：基线 `LIBRARY.map` 12 条边的 evidence 全部命中上表「保留可用」条目（100%，tests DG009-A02 锁定）；来源全部 `content`；advisor/ai 未成边。**B2 修复轮说明**：其中 7 条边的 evidence 含 step-collab-1…5 或 cross-harness-collab，原执行记录表未登记这些条目（该口径当时不成立）→ 已按上表补两条编辑条目审计行（方向条目、路线五步；核对范围为路线文字，论文事实仍绑定 primer/四卡行）后成立，非事后追认未做过的核查。code-agent-verification 相关条目（TOSEM/SWE-bench）因本轮结论为「保留收窄」，其节点**未进入**基线地图（R1 核查层）；留待后续复核正文后再经内容工作补充（上限余量已预留）。

R7-6（完整动线）：step-collab-1→2「背景与术语→为什么选它→原文定位→读完写下」的数据侧已走通并由 DG009-A04 锁定（节/版本定位均为本轮实读核对）；**页面实位核验（真实浏览器点击）属 B 包范围，本包未执行，如实标注 pending-B**。

### R8 阶段验收标准

- **R（本包）**：本节＋SPEC/BACKLOG 最小增量完成即交独立 reviewer 只读审查；审查重点＝白名单不含事实字段、无绕开方向集合授权的通路、冲突/回滚语义自洽、示例边界不冒充真实。阻断项未解决不得进入 A。
- **A**：地图节点/边 evidence 100% 命中 R7「保留可用」条目；旧 ID 与深链不变；内容测试更新并绿；基线地图按 R1 承载于 `LIBRARY.map`（若改独立模块，`server.mjs` 白名单与 `tests/server.test.mjs` 同步改并在任务包声明）。
- **B**：无记录／有记录／待核来源／待确认提案四态文案各自可辨（纯文字即可辨）；键盘可达；390/1280/1440 实页核验，DOM 测试不代替视觉通过。
- **C**：schema 测试覆盖每一拒绝类（未知字段、非白名单、超长、目标缺失、写失败；stale-base 不在拒绝类——断言其仅作为预览内冲突出现，另测 import 三路比较），另加：home-focus 带 stepId 字段→整案拒绝、insert 的 id 命中 tombstones→拒绝、生效总额 12/15 越限→拒绝、**重复 targetRef→整案拒绝、expectedBase/anchor 引用本提案另一条目结果→整案拒绝、单条 stale-base 冲突仍进预览且任意采纳子集可独立应用（断言）、含 undoSlot 的导入档→拒绝、导入替换后撤销可用且 undoSlot＝本机替换前快照、reset 清空 tombstones/undoSlot 后旧提案按 stale-base 进预览、地图边 evidence 解析失败→整案拒绝（复核阻断 1–6 对应项）**）；原子写入「全部成功或旧状态不变」；撤销=恢复 `undoSlot` 完整快照并 `seq+1` 前向写入（断言多字段提案一次全回、history 无回删）；pending 不落盘（刷新后预览页无残留，断言）；示例横幅刷新/import 后仍在（example 持久字段断言）；首页推导过滤 example、其它视图示例条目带横幅渲染（两规则断言）；history 记采纳/放弃条数；生效值仅经 `computeEffective` 单入口（测试断言无第二读取来源）；v3 键逐字节不变；服务仍无任何写路径。
- **D**：真人在隔离存储用示例提案走查 预览→确认→重载→撤销；通过/跳过/未执行如实记录；无独立审查时须写明未执行，不得宣称通过。

## 调度与现状

遵守 `AGENTS.md` 角色约束：主会话 gpt6astra 策划、设计、调度与最终验收；审查者只读、不修实现；共享文件仅一个实施者顺序修改；每次派包写明工作区、文档版本、读写范围、验收标准与交付格式。派单前核对宿主可发现性；不反复猜测名称、不用默认代理冒充指定模型。

**实施者角色的现行口径（2026-09-23 勘误，替代此前「必须等待命名 builder」的表述）**：本会话对 `builder` 的验证返回 `Agent type 'builder' not found`；用户已在本会话**明确授权由默认 general-purpose 子代理担任 009 期间（R–D）的实施任务包**。该授权如实记录为「general-purpose 实施者，非 builder、非指定模型」，仅覆盖 009 阶段；命名智能体日后恢复可发现时优先恢复原角色，超出 009 的新里程碑或改用其它指定模型仍须用户重新授权。reviewer 仍须独立只读审查：若命名 reviewer 亦不可发现，由独立只读会话执行并在审查记录中如实标注实际执行者，不冒名。

**A 包独立审查与修复轮（2026-09-23）**：A 包第一轮独立只读审查判定 **NO-GO**（阻断项 B1/B2；另开列出 A11–A15 五项）。同日 A 包实施者按派单在 A 写范围内修复：A11 修复「真实 LIBRARY 规模」测试标题的遗留错配（11 条技术路线→13 条含 featured 3；断言本就 13，008.2 包4 起标题未同步，非本次地图改动引入）；A12 在 DG009-A01 钉住 `contentVersion v5.2`、`LIBRARY.map` 登记与 `meta.updatedOn`，地图数据变更从此有版本锚；A13 把节点 label 规则收紧为「≤40 字名词性标签、不得混入句读（。！？；）」并加同规则反例回归对（现有 10 节点标签全部合规、无需改数据；「测试节点」为 DG009-A03 反例夹具的 4 字名词标签，非地图节点）；A14 在 DG009-A05 增加摘要级**正例**断言（step-code-3 文案含「摘要级」＋`depthBasisLabel(agentless)==='摘要级判断'`）；A15 为每条边增加逐条 PF-07 声明的计数断言与「声明缺失即拒绝」反例——**核对记录**：本工作区基线为 **12 边**，脚本计数 12/12 逐条自带「非（论文）引用」声明，未复现「19 边中 7 条缺声明」的状态；若审查方依据的是含覆盖层/示例条目或后续扩边的地图快照，该差异应在复核时以其数据重查（校验器规则本身保证任何未来新边漏声明即红）。**（B 包核查结案，2026-09-23：本工作区地图自 v5.0/v5.1 起不存在，v5.2 才首次产出基线，且唯一基线为 12 边、DG009-A01 计数断言 `declared===12` 逐条通过；git 历史中亦无任何 19 边地图提交，覆盖层（含示例条目的扩边）尚未实现（属 C 包，B 未启动写入）。故审查方报的「19 边／7 条缺声明」不对应本仓库任何版本的状态，判定为审查侧引用的外部/示例快照与本工作区的历史错配，非本包待办的数据缺口——按历史错配结案，不再挂「待对账」；如日后覆盖层扩边至 19，校验器会对其逐条重新要求 PF-07 声明。）** 修复后 `npm test` **148 项 / 147 通过 / 0 失败 / 1 条件跳过**；B/C 未启动。**A11–A15 修复轮的独立复核未执行（待复核）**。
**B1/B2 修复轮（2026-09-23，窄派单，仅覆盖两项阻断与一处死测试）**：B1——无条件「降配 CSRet≈80%」字样的四处（handoff-tax 卡 coverage.basis、map-meth-cond 节点 summary、map-edge-cond-reverses-intuition 边 meaning、本文件 R7 执行记录 handoff-tax 行）已按 arXiv:2608.24358v1 §4 分模型对表述改为「Claude 对≈80%、GPT 对≈14%」，不再留无条件 80%（卡内 Explain 块原有「Claude 下降配时」限定措辞不在这四处内，未改）；B2——R7 执行记录补 cross-harness-collab 与 step-collab-1…5 两条编辑条目「保留可用」审计行（核查对象＝方向/路线的编辑文字，论文事实仍绑定表内 primer/四卡行，不冒充对未做的论文正文核查作事后追认），12 条基线边 evidence 落点自此完整（R7-5 口径同步改写）；另修 tests/library.test.mjs DG009-A02 死检查：未复核条目断言原误匹配 map-* 节点 id（恒真），作用域改至节点 refs，并在 DG009-A03 增加两条同规则反例回归。修复后 `npm test` **148 项 / 147 通过 / 0 失败 / 1 条件跳过**（同一环境项；本轮为当日已发布 v5.2 文字面口径修正，DG009-A01 钉住的版本号不升，理由如上）。本轮修复的独立复核未执行。

**第三轮复核与 A 包（2026-09-23）**：第三轮独立只读复核判定 GO，用户随即派 A 包（内容与地图，general-purpose 实施者，非 builder、非指定模型）。A 包交付：① 基线 `LIBRARY.map`（10 节点：problem 5／method 5；12 边：addresses 10／conflicts 1／depends-on 1，variant-of/inspires 本轮无有据关系未使用；全部来源 content，总额低于 12/15 上限，为覆盖层预留余量），承载于聚合器 `public/library-content.js`（R1 基线承载，未新增服务路径，server.mjs 未改）；② 边 evidence 100% 命中 R7「保留可用」条目（含本轮逐节重读 Beyond Frameworks/MemGPT/Tax/Debt 原文的核对记录，见「R7 审查执行记录」表）；③ 起步动线 step-collab-1→2 数据侧走通（读前术语、选文理由、节/版本定位、自查问题；页面实位核验归 B）；④ R7 执行两处修正：SWE-bench 卡「两类测试判据」超摘要级口径→降级为正文待核（step-code-4/archive-code-3 同步），Handoff Debt 表 2 口径措辞改准；TOSEM 本轮无法重读→保留收窄、不入地图边、checkedAt 不刷新；⑤ 内容测试新增 5 项（DG009-A01–A05：地图形状/上限/两侧语义/contentVersion 钉住、refs 与 evidence 可解析与 R7 命中、19 条反例拒绝［B 包核对：DG009-A03 现共 19 条＝A 包当时 17 条＋B2 修复轮补的 refs 作用域 2 条，见下；此处「17」系 A 包当时的旧数，B 包按实际测试计数同步为 19］、动线四段数据定位、未复核条目纪律正反面断言），`npm test` **148 项 / 147 通过 / 0 失败 / 1 条件跳过**（符号链接 EPERM，环境性沿原条件）；旧 ID、深链、方向集合、papers 拼接顺序与 008.2 全部原断言不变通过。本包改动未提交、未推送；B/C/D 未启动。**A 包实施者自检；对 A 包改动面的独立只读审查未执行**（R8-D 前须补，或如实标注）。

现状（两轮审查记录）：R 包由获授权的 general-purpose 文档实施者起草。**首轮**独立只读审查 6 项阻断当日修订（home-focus 推导化、pending 不落盘、撤销全快照＋seq 单调、example 持久化、地图基线承载 `LIBRARY.map`、提交/推送勘误）。**复核判定 NO-GO（六处文档内矛盾），2026-09-23 当日全部修订**：① `stale-base` 定死为预览内冲突（永不整案拒绝、不阻止预览），并以「提案内独立性」（重复 targetRef 禁止、条目不得相互引用）保证逐条部分采纳 sound；② `expectedBase` 改由唯一 `canonicalSerialize`（白名单声明序、`\u001E`/`\u001F` 分隔、UTF-16 码元计数、站点复制基线）生成，全文一致引用；③ `undoSlot` 本机专用——导出档不含、导入档含之即拒；导入替换以本机替换前快照为撤销槽；reset 清空 undoSlot 与 tombstones 且不可再撤销；seq 单调表述覆盖 apply/undo/import/reset 全部写入；④ example 两规则划界：首页推导永久过滤，其它视图照常渲染但必带常驻持久横幅（删去「仅预览可见」矛盾）；⑤ 线框「下一步」更正为首节点 `step-collab-1`（primer），读法行随之修正；⑥ 地图边补来源限制（advisor/ai 不成边）与 evidence 三层校验（schema 拒绝/核查保留可用/渲染降级）。小项落实：history 记采纳/放弃条数、tombstone 的 reset 行为、默认焦点定义。**待第三轮复核**；通过后 A–D 方可启动。本文件与 SPEC/BACKLOG 增量未提交、未推送；新的提交/推送须用户明确授权。

**B 包实施（2026-09-23，general-purpose 实施者，非 builder、非指定模型；R8-B）**：只做展示层（`public/index.html`/`public/library.js`/`public/styles.css`＋`tests/render.test.mjs`），不改内容/服务/记录；实现① 首页首屏「做什么／读什么／怎么读」动线卡（当前关注＝active order 最小方向、下一步＝生效 startRoute 首节点，经 `resolveHomeFocus()` 推导而非写死指针，与 `home.startHere` 不变式一致；含「兴趣场景≠定稿题目」声明、有/无记录两态、「打开地图」「导读」主入口、次级一行入口保留每日精选/经典/技术/方向/材料可达不抢主动线）；② 新 `#/map` 两侧文字地图（problem/method 分栏、每条边注明固定语义词汇＋来源＋站内可解析 evidence、节点 refs 解析为导读/论文/方向链接形成 map→primer→原文→本人文本可读动线；端点或 evidence 解析不了时降级为「待查问题」文字不画线不产生假链接，R1 渲染层）；③ 生效值单入口 `computeEffective()`＋`currentGuidanceOverlay()` 接缝（B 恒 null＝基线，C 覆盖层接入后自动生效，页面无第二存储读取副本）；④ 动态文本全程 textContent/createTextNode，注入串作字面文字呈现、不生成元素（XSS 面）；⑤ 旧 hash／deferred 方向／本人笔记路径不动。**R7-6 页面实位核验（真实浏览器 390/1280/1440＋键盘走查）见「B 包验收记录」段，工具不可用则如实标注未执行。** 本包新增 DG009-B 渲染探针，`npm test` **155 项 / 154 通过 / 0 失败 / 1 条件跳过**（符号链接 EPERM 环境项）。**B-Q1 修复轮（同日，B 写范围）**：审查项 B-Q1——首屏「我的记录」原按"在读数＝0"就显示"尚无阅读记录"，会把（a）只有"已读"标记、（b）只有问题/笔记、（c）只有待读清单、（d）存储损坏/不可用四种状态误报为"无记录"；新增 `v3RecordSummary()` 按"是否存在任何本人手动标记"判定四态分别呈现（已读/问题笔记/待读各自计数，损坏与不可用显式说"读不到"而绝不称"尚无"），并加仅测试用的 `__setV3ForTest/__getV3ForTest` 接缝（与 `__setRenderLibrary` 同类，不写盘、不接入 C 覆盖层），配 done-only／note-only／list-only／混合／corrupt／unavailable 独立 fixture 回归（用例自带 setup/teardown，不依赖其它用例顺序）。同轮顺带两处地图展示修正：关系两端标签改由 `node.side` 派生（原硬标"方法→问题"，但 depends-on 两端同为问题侧会标错）；"未入图方向"文案不再写死条目名，改按当前 active 方向与地图 ref/evidence 差集派生（避免数据变化后文案陈旧）。**B 包改动未提交、未推送；**对 B 包改动面的独立只读审查未执行（待 D 或独立会话补），不得据自检宣称通过（R8-D）**。C/D 未开始。

**C 包实施（2026-09-23，general-purpose 实施者，非 builder、非指定模型；R8-C）**：本机提案闭环落地为**有界、真实、可核验**的最小闭环。改动面：新增 `public/guidance.js`（提案 Schema 与字段白名单、`canonicalSerialize`、①–⑤ 顺序校验、`computeEffective` 生效物化、覆盖层存储/损坏分类、tombstones、seq 单调、undoSlot、导出/导入三路比较、Web Locks 整键写入；纯数据模块，无 DOM、无网络、无模型调用）；`public/library.js` 接线（生效读取单入口：`currentGuidanceOverlay`→`research-workbench:guidance:v1`，损坏/不可用降级基线并有明确文案；新 `#/guidance` 页：粘贴或本地文件提交→拒绝仅提示「尚未形成可应用调整」＋首个错误定位→通过则逐条三格（提案旧值/当前生效值/新值）预览＋「采纳此条/保持旧值」显式二选一→「确认并写入」子集原子写入/「整案不采纳」；pending 仅会话内存不落盘，刷新即丢；首页待确认横幅；R4 纯文本 meta 行（`导学调整 · 来源 日期（本人确认）`）渲染于路线步骤、卡片三问、追加问题、地图节点/边、首屏当前关注；example 条目按 R6 两规则：首页推导永久过滤、其它视图照常渲染＋常驻「示例 · 非真实指导」横幅（从持久字段重建，刷新/import 后仍在）；撤销最近一次（完整快照一次全回、前向写入 seq+1、history 只追加含采纳/放弃条数）；历史列表；导出（不含 undoSlot）/导入（含 undoSlot 即按未知字段拒绝；三路比较全等⇒no-op，不等⇒逐项差异＋「保持本机」或「导出本机后替换」两个显式动作，替换 seq 本机+1、撤销槽＝替换前本机快照）；重置两步（清空 entries/tombstones/undoSlot，reset 后不可再撤销、坏档需先导出原文）；「复制规范基线」以同一 `canonicalSerialize` 导出；`public/index.html` 未改，`public/styles.css` 追加导学区样式；`server.mjs` 精确路径白名单唯一新增 `/guidance.js` 一行（仍仅 GET/HEAD＋Host/CSP/no-store 边界不变，无写接口）。**C 包实现口径（只收紧、对应 R3–R6 的落地选择）**：map-node/map-edge 的 set 字段收窄为 label/summary/refs 与 meaning/evidence（端点/side/source 不可改；改端点即换关系，超出字段授权）；insert 的 anchor 以 `value.anchor={routeId, track?, afterStepId?}` 承载，插入步骤要求 purpose＋readWhen；home-focus 以固定 id `home` 寻址；覆盖层新增边 evidence 限 R7「保留可用」名单（名单更新属 A 包内容工作）；R5「reset 后旧提案按 stale-base 进预览」适用于目标仍存在的 set/append——指向已不存在的覆盖层自有对象（reset 后的 step-ov-*/覆盖层地图 id）按 R3 ③ target-missing 整案拒绝（两类各有测试钉住）；站内两篇材料无 `questions` 字段，对其 append 按目标缺失拒绝（learner 三问可 set）。测试：新增 `tests/guidance.test.mjs` 30 项（含审查修复轮 3 项）（每一拒绝类：未知字段/非白名单（含 home-focus stepId、__proto__、URL/HTML/控制字符）/超长（值、expectedBase 600）/目标缺失/tombstones 撞车与 40 上限/总额 12/15 越限（全案与子集两级）/重复 targetRef/anchor-端点引用本提案产物/写失败与锁失败/损坏与不可用；stale-base 断言**不**属拒绝类且任意采纳子集独立应用；确认瞬间重跑①–④与 preview-stale 竞态拒绝；原子「整份一次写＋回读校验、失败旧状态逐字节不变」；撤销多字段一次全回＋seq+1＋history 无回删；import 三路比较/含 undoSlot 拒绝/替换后可撤销；reset 清 tombstones 后同名 id 复用；example 持久字段随存储与导出/导入保留；v3 fixture 字符串逐字节不变；`canonicalSerialize` 换行/分隔符/声明序）。`tests/render.test.mjs` 新增 DG009-C 8 项（含审查修复轮 4 项）（常量对表防枚举漂移；DOM 全链路：预览阶段零写盘→确认恰好一次整键写入→路线页生效＋R4 meta→新模块实例重载后生效仍在→撤销回旧值且 seq=2；刷新后预览页无残留；R6 两规则与示例横幅在重载后仍在；真实 homeFocus 切换首屏（下一步推导）＋两步重置回基线；渲染读取仅触 v3 与覆盖层两键；审查修复轮新增：首步 purpose 被覆盖后首屏「为什么选它」随生效值变化＋来源行、note-only 焦点附注与来源行、手工塞入非白名单条目的本机档⇒基线降级＋损坏明示＋坏档原文导出＋零写入、导学页全部输入控件带 aria-label）；`tests/server.test.mjs` 白名单 15→16 路径并新增 POST/PUT/DELETE `/guidance.js` 405 断言。`npm test` 修复轮后 **193 项 / 192 通过 / 0 失败 / 1 条件跳过**（符号链接 EPERM，沿同一环境项；实施首轮为 186/185/0/1）。v3 读写路径（`public/notes.js`）与 `public/content/`、`private/` 未触碰；本包改动未提交、未推送。**R8-C 未闭合门槛（如实）**：真实浏览器 390/1280/1440＋键盘走查（提案粘贴→预览→确认→重载→撤销，隔离存储＋示例提案）未执行（DOM 桩不代替视觉与实页验收，R8-D/B 视觉门槛同样仍开放）；对 C 包改动面的独立只读审查未执行，不得据自检宣称通过。

**C 包审查与修复轮（2026-09-23，同日，C 写范围）**：C 包独立只读审查判定 **NO-GO**（阻断 B1/B2/B3），三项已由 general-purpose 实施者按派单在 C 写范围内修复；**复核又查出两项阻断（C1/C2），同日已修复——见本段末「C 包复核修复轮」**。
- **B1（严重：导入/本机覆盖层绕开白名单）**：覆盖层 entries 是生效值唯一权威副本，此前 `normalizeOverlay` 只按 type 前缀与形状放行——导入档或手工改存储可写入 `title`/`coverage.basis`/`deliveredDepth`/`__proto__` 等非白名单 field、任意值、名单外证据，并可经 `setPath` 触到原型链。修复：`normalizeOverlay(raw, base)` 对每条 entry 走与提案同一内容门槛（field/op 白名单、枚举、上限、文本禁面、append 形态、insert 值与 id 命名、证据 R7 名单、home-focus 固定 id）；给基线时再校验目标可解析、refs/evidence 可解析、routeId∈active、edges 端点侧别与来源限制、entries↔tombstones 互斥（insert 撞封存 id、对已封存 id 的残留条目、基线 id 进 tombstones 均坏档）、地图生效总额 ≤12/15；任一违例整档按 corrupt（页面降级基线显示、明确文案、坏档原文保留供导出，不部分采纳、不猜测修复、不静默清空）。渲染读取、导学页、撤销、重置、导入比较、导入替换全部传基线；`importReplaceOverlay` 替换前对导入档再走一遍基线校验（不信任调用方引用）；`setPath/getPath/applyMapSet` 增加 `__proto__|constructor|prototype` 拒绝的第二道防线；写入回读要求逐字节等于写入内容。测试钉住 27 个负例构造类在带/不带基线两路均被拒（可解析性类按契约仅要求带基线拒绝）。
- **B2（首屏读基线库＋note-only 焦点无来源）**：`resolveHomeFocus` 的方向与轨道改读 `computeEffective` 的生效库——覆盖层改写生效首步 purpose/readWhen/check 后，首屏「为什么选它」随之变化并带 R4 来源行（此前读基线库，生效值不上首屏）；homeFocus 仅有 note（未切方向）时也渲染 `导学调整 · 来源 日期（本人确认） · 附注：…` 来源行（noteVisible 语义），example homeFocus 仍被首屏永久过滤。
- **B3（map-edge set meaning 缺侧别/来源复校）**：set meaning 与 insert 同规则——固定词汇开头之外，改后按该边现有端点与来源复校：addresses 必须方法→问题，addresses/方法间边的来源不得 advisor/ai（存储侧无基线时至少词汇＋证据名单，带基线时同复校侧别/来源，正反例钉住）。
- 修复轮测试：`tests/guidance.test.mjs` 27→30 项（构造坏档矩阵／导入与本机读取缝与 tombstone 互斥／B3 正反例），`tests/render.test.mjs` DG009-C 4→8 项（B2 两条、B1 本机篡改降级＋坏档导出零写入、导学页控件 aria-label）。真实浏览器 390/1280/1440＋键盘走查与 D 包验收仍开放；改动未提交、未推送。

**C 包复核修复轮（2026-09-23，同日，C 写范围；针对复核阻断 C1/C2）**：
- **C1（写原子性破坏＋累计上限漏判）**：① 累计 append ≤50 改在提案校验 ③ 阶段判定——存储侧已有 50 条时第 51 条整案拒绝（不进预览、不进写盘；测试钉住「第 50 条可预览并写入、第 51 条拒绝且拒绝路径零新增写入、旧档逐字节不变」）；② `writeOverlay` 改为先以 `normalizeOverlay(候选, base)` 写前自检、通过才 `setItem`（此前「先写后验」在验证失败时已把可辨认旧档覆盖为坏档，破坏 R5「写入完整成功或保持原状」；非法候选⇒零 setItem 直接失败；回读失败⇒如实报告存储当前不可信），落盘内容改为自检通过的规范化候选（回读逐字节一致）。`writeOverlay` 导出仅为测试缝，页面仍只经 apply/undo/import/reset 包装调用。
- **C2（撤销槽按基线漏校验）**：`normalizeOverlay` 对 `undoSlot.overlayBefore` 的校验由「仅结构」升级为「与整档同按传入 base 校验」（目标可解析、entries↔tombstones 互斥、总额上限等）——构造快照塞入指向不存在目标的合法外形条目，载入即整档 corrupt、页面按基线降级、撤销在执行前拒绝且原文逐字节不变；真实链路产生的合法撤销槽回归不受影响（正反例均有测试）。本轮未改其它功能面。
- 复核修复轮测试：`tests/guidance.test.mjs` 30→33 项（C1 上限两侧＋写前自检零写入＋回读失败、C2 构造槽拒绝与真实槽回归）。`npm test` **196 项 / 195 通过 / 0 失败 / 1 条件跳过**（同一环境项）。C1/C2 修复的再复核与真实浏览器走查仍未执行；改动未提交、未推送。

**D 包进展记录（2026-09-23，文档实施者按调度方口径登记；D 包本身不改产品代码）**：
- **独立只读代码审查：判定 GO**。审查范围为 009 全部改动面（A/B/C 三包与其各修复轮：A11–A15、B1/B2、C 审查修复轮 B1–B3、复核修复轮 C1/C2）；此前各段挂「独立复核未执行／待 D 补」的代码面复核项随本判定消解（功能面表述与测试断言的对应关系经审查确认）。`npm test` 同日实跑复核：**196 项 / 195 通过 / 0 失败 / 1 条件跳过**（符号链接 EPERM，同一环境项）。
- **真实浏览器走查：首轮尝试未通过，门槛保持开放**。内置浏览器（IAB）打开 `http://127.0.0.1:4174`——端口 4174 为走查另起实例（默认 4173 可能被已有服务占用），该 origin 隔离、无先前 v3 与导学覆盖层存储，符合 R6 隔离存储要求；首页 DOM 渲染可见。其后点击「打开地图」**两次均超时**，所用定位器唯一命中（排除多元素歧义）。**成因未判定**：现有证据不足以认定应用缺陷（未经第二浏览器/环境对照、未经人工操作复现），也不足以认定工具问题；不得据此下任何一侧根因结论。
- **视觉与端到端门槛（未通过，逐项如实）**：① 390/1280/1440 三宽度实页核验**未通过**；② 键盘可达走查**未执行**；③ 真人端到端（首页→地图→导读与原文→本人文字→示例提案预览→确认→重载→撤销）**未通过**（在「打开地图」一步即受阻）。走查过程有首页截图工件留存（工具侧产物，未入仓库），但按 R8-B/D 口径，截图不构成视觉通过，不得以「有截图」宣布视觉门槛闭合。
- **D 包剩余事项**：更换浏览器或人工实机重试「打开地图」点击并判定受阻性质；完成三宽度＋键盘＋提案闭环端到端走查；走查通过/跳过/未执行如实回写本节与 SPEC/BACKLOG；经用户明确授权后方可提交推送。在此之前，**不得宣称 D 通过或 009 验收完成**（R8-D）。
