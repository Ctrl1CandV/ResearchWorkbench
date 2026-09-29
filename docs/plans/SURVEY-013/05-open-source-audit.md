# 开源能力核查与采用建议

核查日期：2026-09-28。区分读过源码/说明与本机运行过：下列研究工具没有在本项目安装或完成端到端试跑，不据宣传效果认定适配成功。

调研方式：先看 skills.sh，再执行 literature review 关键词的 skills find（当前返回未找到），随后检索仓库并读取官方文件。CLI 首次被 npm 缓存目录权限阻止，改用临时目录缓存后完成；未执行 skills add。GitHub 的 shell SSL 失败后使用 GitHub 只读连接器，没有绕过证书校验。Firecrawl/Exa 当前不可用，使用网页检索与 GitHub 源码读取。

## 1. 最值得借用的组件

| 来源 | 本轮核查层级 | 借用内容 | 本项目的取舍 |
|---|---|---|---|
| [grad-companion / grad-radar](https://github.com/Ctrl1CandV/grad-companion-plugin/tree/55657c61e96908e7fff85bfe3991fa0f4d74c26e/plugin/skills/grad-radar) | 完整 SKILL、reading-protocol、note-templates、tiering；树 SHA 固定 | 单篇身份/版本、章节获取、材料不足降级、AI 与本人状态分离 | 优先复用；明确不做系统性检索，不能当综述发现服务；本轮未调用保存脚本 |
| [K-Dense literature-review](https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/literature-review) | SKILL.md、verify_citations.py 前 185 行、核心流程说明页 | 查询日志、筛选理由、提取后综合、引用身份核验 | 取方法与局部脚本，不原样启用全套；它以写综述为主，本项目是读已有综述 |
| [K-Dense scientific-critical-thinking](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/skills/scientific-critical-thinking/SKILL.md) | 完整 SKILL.md | 主张与证据强度分开、针对具体表/句指出问题 | 转成审查问题；不机械搬临床 GRADE/ROB 层级来给 CS 综述打分 |
| [PaperQA / PaperQA2](https://github.com/Future-House/paper-qa) | README、prompts.py、agents/tools.py 前 170 行；树 SHA 57e89f7223b0960d5ee5ea048c69e3c47e088572 | 提取证据后回答、有效引用键、缺证据拒答、图表辅助解析 | 最值得参考内容生产设计；问答型 RAG 不保证全篇覆盖 |
| [OpenScholar](https://github.com/AkariAsai/OpenScholar) | README、官方论文摘要；未跑推理 | 检索、重排、生成反馈再补证据的思路 | 用于补查讲解缺口；不部署大索引，不把自反馈当独立验证 |
| [Docling](https://github.com/docling-project/docling) | 官方 README 的格式、输出和本地能力说明 | 阅读顺序、表格、公式、版面解析与结构化输出 | HTML 缺失时的 PDF 候选；先测真实双栏/表格，不宣称零错误 |
| [GROBID](https://github.com/grobidOrg/grobid) | 官方 README 的正文结构、参考项与坐标说明 | 学术 PDF 结构和定位、参考文献解析 | 需要参考项/坐标时引入，不作为首期安装前置 |
| [ScholarPhi](https://scholarphi.org/) / [源码](https://github.com/allenai/scholarphi) | 项目说明、目录与 README | 术语/符号在阅读现场解释、保留位置上下文 | 借交互方式，不照搬 PDF 阅读器、API 和全部处理基础设施 |
| [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) | 官方 README 与网络交互能力说明 | 文章网络的图形模型与交互 | 后续一级图备选；首期 SVG 满足要求时不引入 |

K-Dense 仓库在本次网页显示约 46.9k stars，ScholarPhi 约 429 stars；只说明可发现性，不能证明输出质量。没有取得可验证的单 skill 安装量，不编造安装数，也不依赖榜单推荐。许可证、当前 commit、依赖和实际脚本行为须在采用当日固定。

## 2. 找论文：接口分工

| 来源 | 已核能力 | 不能由此推出 |
|---|---|---|
| [Semantic Scholar Academic Graph](https://api.semanticscholar.org/api-docs/snippets) | 论文发现、引用字段与过滤接口说明 | 引用高就是质量高；接口稳定免限流 |
| [OpenAlex Works/Citations](https://help.openalex.org/data/works/citations/) / [检索说明](https://help.openalex.org/how-to/api-recipes/) | 被引数、参考关系、检索过滤与开放版本线索 | 不同库引用数相同；未知引用等于不存在 |
| [Crossref 出版日期与过滤](https://www.crossref.org/documentation/retrieve-metadata/rest-api/rest-api-filters/) | online/print 出版日期与登记日期分开 | 项目当前 created 七日窗口适合综述筛选 |

刊会/年份与引用数是元数据核验；是否适合学习仍须查看范围、目录、分类与正文。API 做候选聚合，出版方/正式记录做身份核验，全文支持内容判断。

## 3. 输出材料：源码中有用的地方

### PaperQA 的证据中间层

已读 [prompts.py](https://github.com/Future-House/paper-qa/blob/57e89f7223b0960d5ee5ea048c69e3c47e088572/src/paperqa/prompts.py)。证据提取与最终回答提示分开，要求使用给定证据键，多模态描述区分图像与附近文字。对应本项目：逐节提取稿到带证据的原创讲解。

按问题取片段可能漏掉未进入 top-k 的章节；README 也讨论了文本检索遗漏图表。SURVEY-013 增加全文清单与逐节循环，不以问答性能替代全篇完整性。这里未做本地性能比较。

### 引用脚本只解决部分问题

已读 [verify_citations.py](https://github.com/K-Dense-AI/scientific-agent-skills/blob/main/skills/literature-review/scripts/verify_citations.py) 的 DOI/元数据验证路径。它查 DOI 与 Crossref，可发现部分身份问题，但不能判断讲解是否被引用内容支持。网络异常归入失败结果，适配时须区分访问失败与身份无效。

literature-review SKILL 还要求生成 AI 图及依赖其他工具，不适合原样作为项目主流程。只借查询记录、筛选和引用核验；知识图由已核结构渲染，生成图片不能替代可点击的语义关系数据。

### grad-radar 与现有工程衔接最好

已核固定提交的 [reading-protocol.md](https://github.com/Ctrl1CandV/grad-companion-plugin/blob/55657c61e96908e7fff85bfe3991fa0f4d74c26e/plugin/skills/grad-radar/references/reading-protocol.md) 和 [note-templates.md](https://github.com/Ctrl1CandV/grad-companion-plugin/blob/55657c61e96908e7fff85bfe3991fa0f4d74c26e/plugin/skills/grad-radar/references/note-templates.md)。已有连贯段落、条件保留、出处定位与辅助解释区分，不必重造读取基础。

缺的是综述完整覆盖、分类比较、长正文和两级关系，而非再加一句写深入。standard 字数参考不作整篇综述上限；每日 tiering 也不能替代综述选文，学习经典和关注当天新论文不是同一任务。

## 4. 推荐组合

现有 grad-radar 的获取与诚实纪律 + 小型综述发现流程 + 必要的 PDF 解析 + PaperQA 式证据组织 + 本项目教学写作规范 + 独立来源核对 + 原生阅读页面。

流程用两篇真实综述验证后，可封装项目专用 survey-reading skill。入口只写输入路由、阶段顺序和规范链接；模板、校验、样例分文件。skill 教 Agent 执行，脚本查结构，网页承载阅读。不改全局 grad-companion 安装文件，不把外部 SKILL 的安装/上传要求直接带入项目。

暂不采用整套科学 Agent 平台、百万篇向量库、统一五段摘要、未经核对的自动关系发布、整篇一次生成。PDF 转 Markdown 成功不等于读完，聊天记录也不直接拼成教材。

## 5. 本轮边界

仅用已有记忆综述 v1 的 §5.3 文字校准一个教学样例：[原文](https://arxiv.org/html/2404.13501v1)。未重新完整阅读两篇综述，未完成领域候选比较，未查询最新引用数，未新增正式推荐排名。

实际选文和全文处理属于 A/C；本页推荐核查到表中所列层级。网页与 main 分支会变化，实施者应固定采用版本；取得树 SHA 的两个仓库可据固定链接复查。
