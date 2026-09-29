# 界面、两级地图与数据契约

依赖：[总设计](README.md)、[内容质量](02-reading-content-and-quality.md)。这是实施设计，不表示相应路由/字段已存在。

## 1. 信息层级

主导航“知识地图”改为“综述阅读”。保留论文阅读、方向与路线、技术学习等其他入口。

| 页面 | 主体 | 默认行为 |
|---|---|---|
| 综述书架 `#/surveys` | 已制作文章、主题检索、添加请求入口 | 首先看到真实可读材料，每篇说明覆盖范围和独特价值 |
| 文章概览 `#/survey/<id>` | 导读、推荐起点、二级图、作者目录 | 先看到一篇的结构，不显示所有文章的概念 |
| 阅读单元 `#/survey/<id>/unit/<unitId>` | 宽松正文、目录、来源、前后导航 | 沉浸阅读；目录和返回图的位置保持稳定 |
| 文章间关系 `#/surveys?view=graph` | 一级图，一篇综述一个节点 | 后续阶段启用；筛主题/选文献后高亮有关文章 |
| 旧背景 `#/map` 与旧 node 参数 | 现有领域导读及旧专题图 | 从“背景导读”访问，兼容已有书签 |

阅读单元页不是第三级知识图，只是二级图节点的正文。第一期不能把旧 20 个概念搬成 20 篇“综述”。

首页只替换知识地图区的名称、说明和直达入口，保留已有其他区域。不附带首页大改，不让制作入口、维护状态抢占阅读区。

## 2. 桌面布局与视觉方向

采用偏书籍的阅读界面：暖白底、深灰正文、少量蓝绿定位色，较轻的边线与足够段落间距。现有侧栏可以保留，阅读时提供收窄/收起空间；不使用满页徽章、圆圈编号或大面积渐变。

### 文章概览

```text
综述阅读 / Agent 记忆
论文中文短题名                         年份 · 刊会/预印本 · 原文
两三段说明：这篇覆盖什么、为什么读、缺什么

[从推荐起点阅读] [按作者目录] [关系图]             本文内查找

 ┌────章节分组───────────────────────────────────────────┐
 │  定义与动机 → 分类与形式 → 写入 / 管理 / 读取 → 评价    │
 │                         点击分组展开；其余保持收拢    │
 └─────────────────────────────────────────────────────┘
 图例：包含关系 / 解释联系 / 建议读序       定位选中 · 适应画布

当前选中：记忆操作
这一组解决什么问题；关联章节与单元入口（不塞长文）
```

图节点使用能读清的标题块，有章节/主题分组边界。正文不随图缩小。节点预览最多给导航信息，点击“阅读本节”进入正文。选中节点时显示其一跳关系及说明，弱化其他边；允许键盘选择，不能只有 hover 才能看到含义。

### 阅读单元

```text
← 回到本文关系图       Agent 记忆 / 记忆操作 / 记忆管理

目录（约 220px）       正文（约 680–820px）       来源抽屉（默认关闭）
  定义与范围          为什么留下历史还不够？
  记忆来源            连贯讲解段落…… [§5.3]
  记忆形式            具体例子……
  操作                方法对照 / 图解 / 公式
    写入              限制及常见误解……
  > 管理              与下一部分的联系……
    读取

                      ← 上一单元      下一单元 →
```

正文建议 18px 起，行高约 1.75–1.9；标题 26–34px、节标题 21–24px。宽度范围是初稿，实施者用真实长文在 1280/1440 核对；不因并列来源栏将正文压成细长列。表格可局部横向滚动，不能使整页横向溢出。阅读主文不默认折叠。

来源在正文相邻位置用节号/图号短链接，点击打开抽屉或新页定位。术语解释在首次出现附近展开，不强迫跳到文末。借鉴 ScholarPhi 的就地解释思路，首期不重建一套 PDF 阅读器。

返回地图保留文章、选中分支和视图位置；浏览器前进/后退、刷新和复制深链有效。记住位置不等于认定已读：首期用 hash + history/sessionStorage 临时状态即可；不要修改 notes v3 或长期学习记录。

## 3. 两种图各自表达什么

### 二级：文章内部

至少有三个相互独立的数据视图：

1. **作者结构**：正文节和子节的包含关系，可作为树；显示作者分类时忠实于原文。
2. **解释关系**：某概念用于解释、比较或依赖另一概念。每条边有类型和一句理由；作者表达的关系附原文，编辑新增的关系明确标识。
3. **阅读顺序**：为了当前读者安排的序列，通常是路径，不宣称作者如此组织或学术上必须先学。

初始只展开章/主题组。展开一个组时显示组内单元和有关连线；仍可“一次展开全部”，但不是默认。树的包含关系、语义关系与读序可以重叠，图层开关分别控制。语义网络允许环，目录树不能成环，推荐读序不能死循环。

布局先做分组的树/分层图，边连接节点边界而非穿过文字；缩放是辅助，不能用把所有东西缩小来解决拥挤。每条可见边的方向、关系和理由可点开；选中后文字关系列表与图同步。

### 一级：文章之间

节点是一篇固定身份的综述，多个版本不算多个独立研究对象。年份和范围可见；完整/部分讲解是资料状态，不是个人阅读进度。没有关系依据就保持孤点。

第一批可支持以下边：

- `cites`：A 明确引用 B，方向 A→B，有参考项定位；共同引用其他文献不能当 A 引 B。
- `overlaps`：两篇在某范围重叠，通常为编辑比较，来源要指到两篇对应单元。
- `complements`：两篇互补，说明一篇回答什么而另一篇补什么；不自动表示先后。
- `contrasts`：定义/分类/观点不同，要指出同一个比较对象及条件，不把措辞不同夸大为矛盾。

“建议接着读”单独作为编辑路径，不加成学术边；“更新了某领域”也不能自动等于“取代旧综述”。相似度或模型建议只能进入候选边，复核后才展示成正式关系。

初期按主题查看局部图，搜索一篇后展示有关邻居。后期文章很多再增加聚合和更多筛选，不建无限画布知识管理平台。

## 4. 前端实现选择

首期保留原生 JS/CSS，使用专用综述渲染模块，避免继续扩大现有五千行 `library.js`。图视图与目录/阅读正文共享数据，不为图复制第二套讲解。

建议首期自定义分层 SVG：布局与文章目录相符，支持分组展开、定位、选中高亮和基本缩放即可。它必须通过真实复杂样稿的连线与文字检查；不能把现有“固定三列圆点”原样搬来。

[Cytoscape.js](https://github.com/cytoscape/cytoscape.js) 可用于后期文章网络；它具备网络交互与布局能力，但不会自动理解语义或把复杂关系变得可读。首期不强制引入。若原生 SVG 无法在试点的实际结构中满足布局门槛，可在设计复核中说明并采用本地锁版本依赖，同时保留文字目录；不从 CDN 加载，不扩大 CSP 到任意外域，不为它迁移 React。

## 5. 最小数据契约

以下是字段含义和校验约束，不是已存在的 TypeScript API。正式 schema 在工作包 B 建立；不要求引入数据库。

```text
LIBRARY.surveys
  schemaVersion: 1
  articles: SurveyReading[]
  relations: SurveyRelation[]       # 一级图；首期可为空

SurveyReading
  id: 稳定综述阅读包 ID
  paperId: LIBRARY.papers 内已有/新建论文 ID
  edition: { sourceUrl, sourceVersion, titleAtVersion, contentHash? }
  revision: 阅读包修订号（不当成论文版本）
  state: partial | complete         # 发布资料状态，无 read/learned
  scope: { question, includes[], excludes[], literatureCutoff? }
  introduction: ContentBlock[]
  outline: SourceSection[]
  units: ReadingUnit[]
  edges: UnitRelation[]
  readingPaths: ReadingPath[]
  evidence: Evidence[]
  coverage: { sections[], figures[], tables[], appendices[], gaps[] }

SourceSection
  id, parentId?, title, order, locator
  disposition: taught | reference-only | missing
  unitIds[], reason?                # 非 taught 必须有原因

ReadingUnit
  id, title, lead, kind, sourceSectionIds[]
  blocks: ContentBlock[]
  readingActions[]                  # 原文 / 讲解 / 暂不展开，附定位和理由

ContentBlock
  id, type                         # paragraph | list | comparison | figure | formula
  role                             # source-explanation | teaching-example | editorial-connection | update
  content                          # 各类型的结构化正文，禁止任意 HTML
  evidenceIds[]                    # source-explanation / update 的事实必须有依据

Evidence
  id, sourceUrl, version, locator
  locator: { sectionTitle?, sectionId?, physicalPage?, figure?, table?, anchor? }
  basis: text | figure | table | metadata
  provenance: direct | survey-reports

UnitRelation
  id, from, to, kind                # contains | depends-on | explains | contrasts | related
  origin: author | editorial
  reason, evidenceIds[]

ReadingPath
  id, title, purpose, steps[]       # 每步 { unitId, reason, action }
  origin: editorial

SurveyRelation
  id, fromSurveyId, toSurveyId, kind
  origin: citation | editorial
  reason, fromEvidenceIds[], toEvidenceIds[]
```

作者、DOI、刊会等身份信息以 `LIBRARY.papers` 为权威；综述阅读包不维护第二份可漂移的书目。版本专属标题/正文 URL 单列，不能因为 arXiv 与正式版名称不同就重复建论文。新文献正常核查后登记，不由正文渲染器凭 URL 猜身份。

解析与阅读过程的逐项时间/工具信息保留在制作报告；发布数据保留足以展示缺口和回查的覆盖结果即可，不把完整运行日志装进浏览器。

`ContentBlock.content` 的正式 schema 须逐类型定义：段落为文本与显式链接片段；list 为条目数组；comparison 为列名/行/单元格；figure 为白名单资源或外部原图链接、caption、alt、编辑重绘标记；formula 为安全的表达式文本/公式资源及符号解释。外部 URL 只接受 http/https，内部链接由 renderer 构造；不能将模型给出的 SVG/HTML/JS 直接注入 DOM。长正文和引用不能被 preview 字段替代。

校验至少覆盖：唯一 ID、所有引用可解析、版本一致、原文节映射、关系两端存在、作者边有证据、比较双方有定位、完整状态无必需缺口、路径可走完。目录包含关系无环，语义边不误套无环限制。新增数据的缺省值是空集合，旧库无 surveys 时旧页面仍可工作。

## 6. 更新、旧数据和发布

- 新模块建议 `public/content/surveys.js` 导出数据，`public/surveys.js` 处理专用页面；聚合器导出保持兼容。服务只加对应确切静态路径，图片等资源逐项登记，不开放整个 docs/private 目录。
- `LIBRARY.landscape` 和 `LIBRARY.map` 原样保留，旧参数路由优先识别。导学覆盖层仅影响原有支持对象；新 survey 不挂到其 map 白名单。
- 旧 `surveyTree` 与新完整阅读包不自动等价。完整发布后旧论文页添加“打开综述阅读”主入口，旧树作为简版索引或折叠历史导读；先保留旧内容，避免两处主正文并行维护。
- 不改变 notes v3 的 key、论文 ID 和个人状态。未来如确需单元笔记，另设计局部引用与迁移，不能将“制作完毕”映射为“已读”。
- 新论文版本产生新 edition 的证据和差异稿；不能静默将旧节号指向新版。保留旧公开阅读包快照于 docs/history 或等价版本目录，旧深链有明确兼容提示，资料修订与用户记录分开。
- 生产者在 docs 写稿，经复核后由单一实现者将经审内容编入 public；网页首期不直接导入任意生成文件执行。可重复生产的适配方式先用轻量转换/校验脚本，不需要 MCP 或状态数据库。

### 本轮 B 的实际单源选择

当前数据未迁移到 JSON→JS 编译链：`public/content/surveys.js` 暂作为唯一可执行发布正文源；`docs/research/surveys/<id>/` 保存选材、版本 hash、逐节覆盖、非全文复制式提取笔记和人工审查/限制，不再另存第二份长正文 `reading.json`。运行 `npm run validate:surveys` 可检查单元、目录映射、关系、阅读路径和完整状态的结构一致性，但验证器不判断解释是否忠于论文。未来若要恢复 JSON 权威输入，必须先实现确定性转换并一次性迁移，禁止双重手改。

当前发布对象是本节完整契约的一个静态子集：文章保存 `id/title/authors/venue/year/localFileName/edition/state/brief/scope/relevance/limits/outline/units/unitRelations/readingPaths/coverage`；目录逐节带 `disposition/unitIds/reason`；单元 block 支持带局部唯一 `id/text/level` 的 `heading`、带 `role/text/source` 的 `paragraph` 与带 `headers/rows/caption` 的 `comparison`，引用用固定版本中的人类可读定位字符串。单元可声明由受控数据生成的交互图，包含 root、axis、child 说明、来源定位与可选 `targetHeadingId`；校验器检查节点 ID 和正文锚点，renderer 生成键盘可操作的 SVG 节点与正文跳转。跨文章关系通过 `fromSurveyId/toSurveyId/fromUnitIds/toUnitIds` 定位两端。结构化证据 ID、可点击 PDF 页/版本 URL 和自动化导入接口仍未实现，不应被误认为已有能力。需要新类型时先扩校验和渲染，再发布相应内容。
