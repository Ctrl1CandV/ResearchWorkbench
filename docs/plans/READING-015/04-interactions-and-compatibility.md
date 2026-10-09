# 交互与兼容契约

版本：v1.0 · 2026-10-04，设计冻结。以下为实施硬约束，视觉变化不能改变这些行为。

## 1. 路由与来路

继续使用 `parseHash`、`buildHash`、`buildContextHash` 和现有实体 ID。不新增独立 reading 路由，不改 query 白名单；所有旧深链和 `tech-t4` 别名继续有效。

| 现有入口/上下文 | 必须保留 |
|---|---|
| 当前九个列表入口（`#/home`、`#/map` 等，见 03） | 正常进入各栏目 |
| `#/route/{id}?section=start`，或 section 为 topic / archive | 对应栏目；step 仅在当前许可组合中有效 |
| `#/paper/{id}`、`#/material/{id}` | 无 route/track 就不推断所属路线 |
| `#/learn/{id}?unit={unitId}` | 定位单元，同时保留全路线内容 |
| `#/survey/{id}/unit/{unitId}` | 选定的真实文章与单元 |
| paper/material/learn 的显式 route + track | 仅匹配真实路线位置才出现路线导航 |
| map 的 node/path/layout/y | 保留现有校验与状态语义，不用于其他页 |

重复参数、非法编码、未知键、错误组合和实体不存在的错误行为保留。解析失败不能默默变成成功首页。有效实体携带不匹配的上下文，按现有降级提示显示，不拼一条推测路线。

Demo 中普通 `#scene` 会替换应用路由，产品禁止使用。页内目录、概念图“读这一段”和来源入口使用按钮，查找稳定 DOM ID、滚动并聚焦目标，不写 location.hash、不新增历史项。跨实体链接仍通过现有构造器生成 hash。

读取当前栏目时先解析、校验与解析实体，再确定壳类型。不能凭 hash 字符串包含 paper/map 选择布局；每次导航明确重置 page-kind、临时专注状态和无效对象提示。

## 2. 页内目录与来源

- 每页只生成实际存在的目录目标；原有章节 DOM ID 不改。代表材料新增展示章节 ID 带材料前缀，避免与其他模块重复。
- 目录点击后滚动到标题，以 `tabindex=-1` 等方式使其可聚焦；目标被 sticky 顶栏遮挡时用 scroll-margin 处理。当前位置同时有视觉标识与 `aria-current`。
- 用 IntersectionObserver 跟随当前阅读位置；不存在 heading 的单元不创建无效观察器。正文布局不依赖目录是否显示。
- 导航离开时断开观察器、清除窗口监听和临时引用。尤其 `renderApp` 清空旧 view 前先调用页面清理，不能只等下一篇文章调用 bind 才清旧观察器。
- 页首来源按钮展开对应 details，然后滚动并聚焦其 summary；段落 locator 的展开不触发全页重渲染。必须保留 source-explanation / editorial-connection / teaching-example 的身份与原文位置。
- 页面内单一目录组件在宽/窄位置切换；若选择两个副本，隐藏副本必须 inert/不可聚焦、无重复 ID，并保持选中和设置同步。优先单组件方案。

## 3. 字号与专注模式

### 状态范围

仅在前端内存保留 `standard|large` 的阅读字号；标准档桌面 18px、手机 17px，放大档 20px。窗口宽度变化依据 CSS 重排，选择不丢；重新加载恢复默认。专注状态属于当前阅读页，跨实体导航退出。不增加 localStorage/sessionStorage 键，不写本人记录。

### 不重建正文

通过阅读根节点 data 属性或 class 切换样式，不调用 `renderApp`、不重新生成笔记和导学表单。必须同时作用于段落、列表、例子与 callout；小元数据和操作标签可保留各自字号。按钮以“标准 / 放大”标记并用 aria-pressed 表达当前选择，不能在手机用“18”误示实际 17px。

### 进入、退出和位置

1. 操作前保存最近可见的稳定章节/正文节点及其视口内偏移；字号或专注切换后恢复该内容位置。没有章节用正文节点，节点不存在则保留可实现的滚动位置。
2. 专注隐藏辅助栏及非必要面包屑，保持正文/图/必要范围说明；退出按钮始终可见，不遮文字。保留能找回全站导航的退出路径。
3. Escape 和退出按钮具有同一退出行为；退出后恢复原来路与目录，按钮焦点可回到有效触发点。触发元素被移除时聚焦可见的阅读设置或标题。
4. 不进入浏览器全屏。目录展开、字号改变和专注转换不能写已读、完成、读序进度。

未保存笔记、搜索文本、来源 details 的展开状态和当前选中对象必须保留。焦点、滚动与折叠状态作为交互结果验收，不能以 DOM 中仍有文字代替。

## 4. 全站菜单与移动目录

“栏目”按钮具有 aria-expanded 与 aria-controls；菜单在流中展开，Escape 关闭并回焦点。选择真实链接后正常导航。菜单关闭后的内容不参与 Tab；不建立额外模态层和焦点陷阱。

流内目录默认收起，包含目录与阅读设置；侧栏无论在哪个屏宽退出并排，都转用这一入口。展开不会改变当前字号/章节；选择章节后可收起并将焦点交给正文目标。图中节点、普通目录和全站栏目都有清楚的可访问名称，不能只暴露序号。

## 5. 图谱与读序

继续使用 `survey-map-v1:{articleId}` 的现有 session 协议及 normalizeMapState；不扩展为个人进度。实际字段为 selected、collapsed、layout、readingPathId、readingPathUnitId、readingPathUnitIds、zoom、relations、reading、scrollLeft、scrollTop；按已有字段和合法值处理，缩放范围仍为 0.65–1.8。

- 图/列表/读序视图切换共享当前选中项；搜索与主题折叠不篡改数据；空结果有清除动作。复位沿用现有含义，不顺便清个人记录。
- 点击预览的“进入正文”转到该单元；返回图时恢复合法的现有 session 选择和图位置。不得新造已读节点填色。
- 建议读序的状态由 activeReadingPathForUnit 判定：合法 readingPathId、本单元确在路径中、且本单元已被明确进入并记录在 readingPathUnitIds，三者同时满足才沿用路径。同 session 的已访问单元，其直接深链、刷新及 Back/Forward 保留路径；未访问深链不能凭匹配步骤继承。readingPathUnitIds 是本次路径访问边界，不是掌握集合。
- 自由探索按现有协议解除 active path；随后浏览器 Back 不承诺自动恢复已经清掉的路径，降回全篇顺序。界面需按当前真实状态标位置，不能残留路径标题。
- 窄屏首次进入默认同源列表；用户主动改为图后保留合法选择。画布的拖动/局部横滚不产生整个页面横滚，键盘仍有等价列表入口。
- 图的测量、重排或浏览器缩放不丢 selected 和 path。关系图不能以视觉线条制造无来源学术关系。

## 6. 来源、文本与展示配置

### 数据保全

继续使用 `computeEffective` 的生效库单入口；首页、路线、书库和阅读页不能有的读基线有的读覆盖层。使用真实 `SURVEYS`，不能从 Demo 复制文字。

核对内容时比较原事实字段和正文树，不能只比较实体数量或字符串长度。论文/材料题名、正文 spans、公式、表格 cells、问题、引用、覆盖、readingActions、learner、nextAction 以及所有旧实体/章节 ID 保持原值。展示标签的调整单列审查，不自动改内容源。

`safeExternalHref`、https、外链新窗口的 noopener noreferrer 保留。不存在的安全链接不渲染为可点假动作，来源回查不触发上传或自动抓取。

### 代表材料的可选配置契约

仅 `mat-cross-harness-map` 的顶层 body.blocks 增补稳定 id；增补 readingLayout。最小结构示意：

```js
readingLayout: {
  sections: [
    { id: 'scene', heading: '先把场景说清', blockIds: ['scene-context'] },
    { id: 'mechanisms', heading: '机制与表示',
      blockIds: ['collaboration-mechanisms', 'information-representation'] },
    // budget / examples / takeaway 按 01 的完整映射继续
  ],
  figure: {
    blockId: 'four-layer-comparison',
    targets: [
      { rowKey: '场景', sectionId: 'scene' },
      { rowKey: '机制', sectionId: 'mechanisms' },
      { rowKey: '表示', sectionId: 'mechanisms' },
      { rowKey: '传输', sectionId: 'examples' },
    ],
  },
}
```

rowKey 匹配该 comparison 的第一列原值，必须唯一。sections 和 figure 合计恰好覆盖全部顶层块；同一正文块不能在两章完整重复显示，figure 块由概念图加完整表格承担展示。nested callout 的原层级与标题保留，不重编其内容。

运行时引用无法解析、存在未分配块、重复章节/块引用、表结构变化或非法类型时，整份配置回退为原完整正文，不半页成功半页丢失。数据校验应覆盖上述条件；合法/缺省/坏引用/漏块至少各有一个反例检验。配置的 heading 是新展示文字，需要人工确认；不放进导学提案白名单，不由覆盖层动态重编排。

该配置不扩展为通用编辑器，不加新运行时模块；辅助函数放在现有 module 的阅读渲染邻近处。

## 7. 个人记录与导学

既有存储键与协议固定：`research-workbench:v3`（notes.js）、`research-workbench:guidance:v1`（guidance.js）。旧 v1/v2 的禁读写规则继续生效，不能添加隐藏迁移。

字号、窗口重排、目录、专注、图选中、页面访问、建议读序都不触发上述键写入。本人状态继续由本人显式保存；导学继续白名单校验、差异预览、显式确认与可撤销。视觉状态不覆盖本人数据和临时输入。

本轮不修改 notes.js/guidance.js 的存储算法；仅允许公共壳及针对组件 class 的样式适配。若发现真实存储缺陷，单列问题与修复范围复审后另开任务，不能在视觉工作中顺带重写。

存储回归使用隔离测试 origin 和明确标注的合成记录，不读取、复制或导出用户当前浏览器记录。自动化用 mock storage 断言非保存操作零写入；端到端显式保存/导入回归只操作合成记录。失败时保留输入和恢复动作，不静默清空 storage。

## 8. 代码与运行边界

保持原生 JS/CSS、Node 现有运行方式和 server 的精确静态白名单/CSP。不加框架、字体下载、外部 CDN、内联脚本或新后端；HTML 中的行为仍由已有外部 JS 实现。

实施需明确页面生命周期清理函数，由 renderApp 在离开旧页面前调用；只有当前页面保留观察器、滚动监听和 Escape 处理器。样式切换不清 view；跨页渲染按现有路由和生效库处理。

既有同步页面不引入假的加载动画或延迟。每日发现只在用户点击时请求，频率、错误和日期语义照现有契约。控制台无新增未处理异常；发生展示配置错误时可诊断并完整回退，普通界面仍能阅读。
