# 03 阅读系统：三问、动作、混媒介与导航

版本：008.2。数据和行为以本文件为准；四档深度沿用 READING-TEMPLATES-005，并按 00 澄清 quick 与 coverage 的关系。

## 1. 起步卡首屏

标题、实际覆盖短行之后，正文之前，用现有文本样式给出 learner.gist（讲什么）、learner.value（路线价值）、learner.intent（阅读目的）。所有ready起步节点必填，最终验收为5+4全部ready；暂时pending的身份入口只显示身份和待核原因，不伪造三问或动作。与 lead 重复的内容只显示一次。旧卡无 learner 则沿用旧 lead/reasons，不自动复制三遍或凭空填阅读目的。

learner 为该卡的默认起步说明；本期每个起步节点仅属于一条 startRoute。archive/旧链接可显示该说明并标“起步阅读建议”。同一卡在不同方向的目的，以各方向步骤 purpose/readWhen/check 表达。

四档 deliveredDepth 不变；passMode=core 仅显示“读核心”。quick 若只核摘要仍显示“摘要级”；核过指定正文的 quick 显示“简读卡 · 摘要及指定正文已核”，展开 coverage 可见具体 sections。更新 header、列表、路线和 notices 的共同文案函数，不能一面列正文依据一面声称“正文未核”。有正文不自动升 standard。

## 2. 章节动作与讲解交付

```js
readingActions: {
  preserve: [{ target: '摘要中的问题定义', why: '先建立评价对象' }],
  explain: [{
    target: '事件数与 token 的区别', why: '先借解释理解两个指标',
    blocks: [{ kind: 'paragraph', spans: [{ kind: 'text', text: '这里必须填写实际讲解。' }] }]
  }],
  skip: [{ target: '附录实现细节', why: '当前只区分四类视图，不需要复现实现' }]
}
```

- Preserve / Explain / Skip 的 target、why 均非空。entry 不得有内容性动作；身份入口和路线角色另行展示。
- quick 可以指向已核摘要、引言和定向正文；精确章节/图号必须与 coverage 及原文一致。未看过的章节不作“不重要”的判断，只写“未核，本次暂不进入”。
- 每个 Explain 必须二选一：非空 blocks，或 sectionId 引用本卡实际渲染的正文 section。两者同时存在、引用失效、空 blocks、非法 block、只有 target/why 均拒绝。不以普通外链代替已承诺的站内整理。
- inline blocks 直接显示在“可以先看整理”下；sectionId 使用与目录相同的滚动操作，保留路由 hash，不重复拷贝正文。验证目标确实渲染，而非仅在数据中存在。
- 三项是顺序排列的文本列表，不建立三列 CSS 栅格。空列表不显示标题。
- 02 给出讲解题材；来源不足则省略该 Explain 并记录制作缺口，不让 AI 补造。核心三问与真实来源仍须完成。

验收取 TOSEM 一项正文讲解引用、新 quick 卡一项短 inline 讲解及站内问题导读一项辅助例子，逐项打开核对。辅助例子注明“编辑举例”，不伪装论文实验。

## 3. 节点与材料数据

三个站内目标沿用对应外键，只能选其一：

```js
// NodeTarget 判别联合，不是同一对象同时填写三种外键
{ kind: 'paper', paperId: 'handoff-tax' }
{ kind: 'article', materialId: 'mat-cross-harness-map' }
{ kind: 'unit', unitRef: { routeId: 'tech-multiagent', unitId: 'ma-u2' } }
```

路线 step = NodeTarget + id/stage/required/passMode/purpose/readWhen/check/availability。availability 为 ready|pending，pending 必须有 pendingReason。startRoute 的 id 固定为 step-collab-1…5、step-code-1…4；同一 track 不重复引用目标。未知 kind、混填、悬空 paper/material/unit 均失败。论文和材料 id 在两个集合之间也不得重名。

主方向 archive 用独立外链目录分支：

```js
{ id: 'archive-collab-survey', kind: 'external', title: '...',
  url: 'https://...', role: '...', note: '...',
  availability: 'ready', checkedAt: 'YYYY-MM-DD' }
```

external 只允许在 archiveRoute；不含 paperId/materialId/unitRef，不伪造论文深度。pending 外链显示身份和待核原因。代码验证及延后方向的 archive 继续用原论文步骤（补 kind/id，保留目的、顺序）。旧步骤没写 availability 时兼容读取为 ready，但不改变既有论文 coverage。

LIBRARY.materials 来自新增 public/content/materials.js。本期恰好两个：mat-cross-harness-map、mat-read-empirical，均为 editorial-primer，必须有实际正文。主线论文 id 为 beyond-frameworks/memgpt/handoff-tax/handoff-debt，不建立 coala 起步卡。

```js
{
  id, title, url, // primer 可空，其他类型必须 https
  format: 'blog' | 'docs' | 'tutorial' | 'video' | 'primer',
  lead, learner, readingActions,
  coverage: { mode, basis, version, sections, limitations, checkedAt },
  body: { blocks: [] }, // primer 必填非空，博客按实际讲解需要填写
  nextAction: '...' // 可选，无状态副作用
}
```

材料 coverage.mode 仅允许 web-page|partial-text|editorial-primer|identity。网页记录读取段落；identity 仅用于 pending 材料，不发布内容判断。primer 用 editorial-primer，basis 写站内编辑，非论文。body.blocks 复用安全 block 白名单。可用 sections 提供 sectionId 讲解目标，形状与论文一致；body 与 sections 不重复承载同一正文。本期无必看视频，不做播放器。

## 4. 带类型的首页入口

home.startHere = NodeTarget + { routeId, track: 'start' }。真实库仅保留新字段。旧输入只有 startHerePaperId 时适配成 paper；新旧同时配置报错。校验入口确为指定 startRoute 第一节点；pending 时首页显示该节点待核，可开站内说明但不称“可开始”。

共用目标解析函数生成标题、href、可用性；首页、路线、前后节点、unit 链接均使用它。旧 paper 专用函数不得接 materialId。

## 5. 路线上下文与前后节点

```text
#/material/mat-cross-harness-map?route=cross-harness-collab&track=start
#/paper/tosem2025-acceptance?route=code-agent-verification&track=start
#/paper/tosem2025-acceptance?route=code-agent-verification&track=archive
#/learn/tech-multiagent?unit=ma-u2
```

query 位于 hash 内部；先分开 path/query 再解码。原无 query 的 parseHash 返回与语义兼容；有 query 时附加 routeId/track/unitId。仅支持 route、track、unit；route/track 必须成对且只用于 paper/material/learn 详情，learn 带 route/track 时还须有 unit 定位该步骤。unit 只用于 learn 详情，可单独使用。重复/未知参数、错误 track、非 learn 带 unit、列表或方向页带这些参数均返回无效路由。语法可解析但方向/成员不存在时显示未找到，不静默套其他路线。

1. 从路线进入：按指定方向与 track 提供前后节点，论文和材料均适用。刷新、后退、复制链接保持上下文；unitRef 链定位具体单元并验证该单元在指定 track 内。
2. 无上下文的旧链接：目标若唯一属于 active startRoute，推导起步上下文；否则只提供返回相关路线，不擅自选 archive 顺序。unit-only 深链只定位单元。
3. paper.next 数据保留，改作“延伸阅读（非本段下一步）”；与路线下一节点相同则去重，不作为竞争的主按钮。
4. 最后节点显示“本段到此”与 nextAction，不自动进 archive。TOSEM 起步下一步必须是 Agentless；SWE-bench 起步结束。主线导读→Beyond Frameworks→MemGPT→Tax→Debt 有可点击导航，Debt 起步结束。
5. archive 上下文沿原序。外链目录不接管站内前后节点，直接开 https；返回方向可展开目录。pending 节点保留序位并显示待核，不自动跳过。

首页、方向列表、侧栏统一过滤 active；论文库保留延后内容。routesContaining 应携带 track，不能因为默认入口过滤而丢失 archive 关联。startRoute/archiveRoute 是新数据的权威；旧 direction.route 仅作读取回退，不能与新字段同时写。

## 6. 存储与深度显示

材料页无“我的记录”、无保存/状态按钮，不读取或写入材料状态。notes.js、v3 结构/键/导出不变。论文记录面板仍在正文及导航后、覆盖前；存储使用原 paperId，query 不参与 id。浏览任何新节点不写 localStorage。

路线元信息纯文本连接：必读/选读、地图/读核心/精读、实际覆盖。材料显示博客导读/站内方法说明等媒介名，不伪造论文档位。页脚只增加一次：“整理依据已标明；建议自己看的部分请打开原文。打开网页不会变成已读。”

## 7. 本版迁移边界

本次不扩充研究因素数据库。01/02 的研究问法落在已有 overview/openQuestions/learner/questions 等文本中；不要求新增统一实验 schema。step 是路线位置，paperId/materialId 才是内容身份；改顺序不重命名既有论文或移动个人记录。旧教学/来源未重新读取，不刷新 coverage 日期。意外发现旧版材料已落地时按 09 保留，不用新内容覆盖旧 id。
