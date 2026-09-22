# 论文分级、阅读模板与内容生产契约

本文件是后续实现和内容生产的共同规范。本轮不生成新的精读结论。沿用grad-radar的重要性、难度、类型独立判断；区别推荐投入与实际读取范围。

## 1. 三条轴，不用一个分数代替

| 轴 | 值 | 用途 |
|---|---|---|
| 对当前路线重要性 | core / relevant / peripheral / unknown | 是否决定理解主线；不是会议档次或引用数排名 |
| 读者难度 | accessible / needs_background / challenging / unknown | 决定补哪些概念，不决定论文价值 |
| 论文类型 | method / survey / theory / system / evaluation / other | 决定正文组织，而非只换徽章 |

另加推荐模板 `recommendedDepth: deep|standard|quick` 和实际交付 `deliveredDepth: deep|standard|quick|entry`。原 `reading` 在兼容期表达实际档位；不能一边reading=quick一边deliveredDepth=deep。最终以deliveredDepth为唯一可写权威；兼容期旧reading由适配函数派生（deep不得降成standard显示），旧数据若没有deliveredDepth则只读映射其reading，冲突数据校验拒绝。禁止两个独立可写值长期并存。

“经典”增加 `role: foundation|baseline|frontier|counterexample|background` 与 `roleReason`，不以发表年份自动判。基础论文可以经典却不必为当前问题全篇精读；近期论文可以因直接竞争成为core。默认core建议deep，relevant建议standard，peripheral建议quick，但编辑可附理由调整。资源不可得只降低交付深度，不降低重要性。

## 2. 三种内容模板

### A. 核心精读（deep）
对象：决定主线理解的基础作、关键方法或直接竞争。正文约1800–3500中文字为常用规模，上限不是目标；复杂推导另折叠。不得只扩写摘要。

必备：
1. 首屏概览：具体问题、关键贡献、为什么现在读、实际覆盖。
2. 阅读前需要的1–3概念：直觉、本文用途及可靠先修链接。
3. 问题定义：输入、输出、假设、与前作区别；明确评价对象。
4. 核心机制/论证逐步解释：依论文类型组织，给至少一个明确标注的辅助例子；若例子不能忠实表达可省略并说明。
5. 关键证据：至少一项最能支撑主张的实验或论证，写基线、数据/设置、指标分母、结论边界；数字未经核对不填。
6. 本人值得细读的2–4个定位：章节/页码/图表、读的理由和要回答的问题；只有看过图片才能解读图。
7. 相关文献：一项真实引用或有明确理由的推荐；两种关系分开。
8. 局限与待核问题：作者承认与整理者追问分开。
9. 读后检查：能解释的问题而非必做实验；下一篇/下一章节。

准入：与解释有关的正文、必要上下文和关键设置已实际读取；核心图/公式不可识别而影响机制时不能称deep完成。允许“核心精读待补，当前提供标准阅读”。

### B. 重点理解（standard）
对象：相关方法、基线或路线关键节点。约800–1500字参考。

必备：问题与价值；关键思想及机制（3–5步以内）；关键证据及适用范围；1–3处本人细读位置；必要背景；局限；自查与下一篇。省略长推导、全面综述和不相关实验。至少有相关正文依据，不能只有摘要。

### C. 快速判断（quick）
对象：背景、外围、日常初筛，或者重要论文暂时只取得摘要。约150–300字参考。

必备：正式标题/作者信息的已知部分、年份/来源；它研究什么；独特做法或摘要覆盖范围；为什么值得留意/何时不必读；推荐下一动作；清楚写仅摘要依据。没有必要的长目录、不展示空实验/方法栏目。只能指出“建议先看方法部分”，不能猜章节编号。

**§2C 澄清（2026-09-21，SCAFFOLD-008 / 008.1）**：quick 是**简短交付**，不强制来源仅限摘要。已定向核查部分正文的条目仍可交付 quick，但覆盖必须准确，显示「简读卡 · 摘要及指定正文已核」（展开 coverage 可见具体 sections），不再显示「仅摘要依据」。有部分正文**不自动满足** standard 的全部内容要求；本澄清只纠正来源与交付的混同，不放宽「无正文依据不得交 standard/deep」的门槛。

### D. 原文入口（entry，不是第四种阅读完成档位）
仅有可靠身份，没有可靠摘要。展示论文身份、原文入口、路线角色和待获取材料。不能写内容摘要或标已阅读。建议精读的entry仍是entry。

## 3. 同一深度按论文类型组织

| 类型 | 主体章节 | 不应硬套 |
|---|---|---|
| method | 输入/输出 → 改了什么 → 机制 → 关键对照 → 边界 | 没有证据的“提升显著” |
| survey | 综述范围 → 分类地图 → 分支差异 → 代表作 → 下一阅读顺序 | 新算法和提升百分比 |
| theory | 定义/假设 → 定理结论 → 直觉 → 证明主线 → 反例边界 | 编造遗漏推导 |
| system | 需求/架构 → 数据与控制流 → 取舍 → 测量设置 | 只复述模块名字 |
| evaluation | 测量目标 → 数据/真值 → 协议 → 发现 → 外推限制 | 把榜单分数当普适能力 |
| other | 问题/做法/证据，注明分类暂不明确 | 强行补六种之一 |

不建设18套组件。使用3种深度布局+6种编辑章节配置，底层复用同一block渲染器。

## 4. 数据最小示意

```js
paper = {
  id, title, displayTitle, url,
  importance, difficulty, type,
  role, roleReason,
  recommendedDepth, deliveredDepth,
  coverage: { basis, version, sections, limitations, checkedAt },
  templateVersion: 1,
  lead,
  sections: [{ id, heading, blocks: [
    { kind: 'paragraph', spans: [{ kind: 'text', text: '...' }] },
    { kind: 'list', ordered: true, items: ['...'] }
  ] }],
  references: [{ paperId, relation: 'citation|editorial', sourceLocator, reason }]
}
```
这只是契约示意，不给实现者未核查的论文身份。保留已有id/title/url/coverage及本人状态隔离。旧paragraphs可只读适配为paragraph block，先不删除旧结构；同一section只允许一种权威正文来源，迁移时校验不要重复渲染。

## 5. 首批论文安排（建议投入，不冒充已完成）

| 条目 | 路线角色 | 推荐模板 | 当前实际材料/交付 |
|---|---|---|---|
| TOSEM测试验收实证 | 核心问题与反例 | deep，evaluation | 当前standard正文选读；补关键设置/本人精读解释后才升级 |
| Astute RAG | 冲突处理关键方法 | deep，method | 当前standard；可优先补机制解释与必要图示原文核对 |
| CAMERA | 图融合相邻方法 | standard，method | 保持standard；不因公式多就自动升deep |
| RAG Survey | 基础地图 | deep选读，survey | 当前quick；先取分类正文，再交标准/精读，不扩写摘要 |
| 谱聚类教程 | 数学基础 | deep分单元，theory/教程 | 当前quick；首单元拉普拉斯与图割，证明按需，不能假装通读 |
| Sufficient Context、HoH、TimelyRAG、ComPass | 评价/近期竞争 | standard | 当前quick；保持标签至正文获取 |
| OAGL、BRIDGE | 图方法比较 | standard | 当前quick |
| Le、Ye、SURE、APPT | 前作/基线入口 | standard建议 | 当前entry；先获取摘要，不承诺即成标准卡 |

首批真实内容目标：完成TOSEM或Astute中至少一张deep（以材料能支撑者为准），保留至少一张合格standard和一张quick，在页面呈现真实差别。若核心全文无法取得，必须交付明确阻塞与已有深度，不允许以漂亮占位精读替代。其余旧卡按现覆盖迁移，不同时要求15篇全精读。

## 6. 内容生产与审查流程

1. 锁定身份和版本；读现有记录/覆盖，不把公开报告转述当本轮正文已读。
2. 按grad-radar协议获取相关章节；公开源码/作者资源只作相应用途，不等于实测有效。
3. 用上述类型结构写卡；关键数据紧跟设置和来源；生成辅助解释明确标注。
4. 用de-ai-flavor整理表达；随后对照原始卡与论文核事实，不以词表全绿代替内容审查。
5. 在明确授权的隔离内容构建目录用reading_record登记/保存；不初始化用户个人.grad，不设本人read状态。网页保存的是公开AI整理。
6. 单一公开内容源导出网页数据与Markdown卡，避免两份长期手改。旧Markdown标历史快照，只有已审新版才替换其当前入口；不要静默覆盖个人批注。
7. reviewer核实阅读价值、来源定位、实际深度、类型适配与无事实漂移。记录审查结论不是生成一个自评勾选表。

## 7. 模板验收

同一篇降级/升级测试能证明来源不足时不会出现精读完成；三种深度各有真实样本；综述与方法不是同一章节标题套壳；没有空栏目；正文样式与block安全测试通过；任何表格/图/公式都能对应已核原文或清楚的辅助解释。
