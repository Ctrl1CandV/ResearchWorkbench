# PLAN-003：以论文阅读为主的首版

## 元数据
- 日期：2026-09-15。
- 状态：首批实现已可本地试读；独立内容/代码复审通过，183测试通过、0失败、1条件跳过。浏览器真实指针与视觉验收受工具限制未完成，详见 ../ACCEPTANCE-003.md。
- 取代 PLAN-002 的产品呈现与内容范围；保留原实现和验收历史，不删除个人数据。
- 用户批准 Codex 的三方向结论，不重新排名。公开证据来自 docs/research/DIRECTION-SCREENING-2026-09-15.md；私人适配原文保持在 private，不复制个人背景到产品。

## 冻结范围
1. 方向：代码智能体修复正确性与预算受限验证；动态、多源知识下的可信检索与回答；部分观测图数据中的有害融合识别。三个选项而非同时开展三个课题。期刊匹配和成果机会不等于录用保证。
2. 每方向一条有先后关系的阅读路线，约五篇，覆盖基础、方法、评价与近期竞争。每步说明为什么读、读什么、读懂标准和下一步。推荐关系默认是编辑安排，只有核查原文才标真实引用。
3. 每方向至少一篇实际正文依据的标准阅读卡，其余可为明确标注的快速判断卡。按 grad-radar 协议区分重要性、难度、类型；交付问题、论文价值、新思想、方法、证据边界、值得本人细读的段落、必要概念与阅读自查。采用 de-ai-flavor 写作纪律。来源、版本、获取时间和未覆盖可展开查看，不让免责声明淹没正文。
4. 三条技术学习路线，每条至少两个可靠教程，明确先后、关联论文和掌握标准，不要求先完成无关入门实验。
5. 一期日期明确的精选论文简报，少量有价值内容、推荐理由、与阅读路线的关系；区分本次整理日期与论文发表日期。允许 harness 更新项目内容，不承诺无人值守定时更新；旧文精选不得标成当天新论文。网络失败不冒充零结果。
6. 简洁网页四入口：方向与路线、论文阅读、技术学习、每日精选。首屏直接给第一方向及第一篇入口。不让画像问卷、匹配分数、配置和系统状态占主位。

## 实施设计

2026-09-15 用户授权全面升级页面文案和前端；视觉与排版规格现以 ../DESIGN-004-reading-upgrade.md 为准，已独立设计审查通过。下方原视觉参数保留为历史，功能/来源/存储保护不变。
复用原生 HTML/CSS/JS 和本地 HTTP 服务，不加数据库、模型后端、账号或框架。新阅读体验使用独立 /library.js 与 /library-content.js；index.html 引用新入口，旧 app/domain/content 留存，以免无意破坏旧记录。新页面不读写旧 localStorage，不声称迁移已有笔记；保留“旧版笔记入口”到专门 legacy.html（原 index 的结构）以便访问。服务仍白名单，不提供 private/.grad 或任意文件读取。内容静态化由 harness 更新，非网页调用插件。

数据契约：library-content.js 导出 directions、papers、technicalRoutes、briefs。稳定 id 关联，路线包含 paperId/purpose/readWhen/check；paper 包含真实 title/url/type/importance/difficulty/reasons、coverage（mode、basis、version、sections、limitations、checkedAt）、lead、sections（heading、paragraphs）、deepRead、questions、next。brief 包含 date、scope、items（paperId或独立真实来源、reason、summary、published、tier）。没有正文就明确 quick，不补编 standard。

阅读界面采用白色书页与淡蓝灰背景（#F3F6FA）、墨蓝正文（#203148）、蓝色链接（#2859A6）、灰色辅助文字（#607087）、浅线（#DCE4EF）。标题用本地宋体栈克制点缀，正文系统中文无衬线，正文行高约1.85、阅读列约44rem。特色是有实际先后含义的“阅读进阶”列表，旁侧展示正在读的卡片；不用指标仪表盘、花哨动效和外部字体。窄屏自然单列即可。

## 分工与验收
- 主协调者：docs/README、范围与内容裁决、最终验收。
- scout：只读公开资料与插件协议，提供论文正文证据，不接收私人材料。
- 唯一 builder：public/library.js、public/library-content.js、public/legacy.html、public/index.html、public/styles.css、server.mjs、tests/library.test.mjs；先读再编辑。不改private/.grad/插件/AGENTS，不删旧代码或旧测试。
- reviewer：只读设计/内容/代码，不修复。设计审查通过才下发实现。
- 核心验收：三条可顺序阅读的路线；至少三张有实际正文依据的卡；教程可对应研究需要；一期来源透明的精选；方向→论文→下一篇和技术/每日关联可实际点击；旧笔记入口仍可访问；npm test；无私人信息泄露。审查关注内容真实性与可用性，避免继续扩张边缘功能。

## 记录
- 独立 reviewer 已审查并 pass：范围、内容覆盖、隐私与旧数据保护无设计阻塞；内容和代码仍需另验。
- grad-radar 的协议和模板用于实际生产卡片，记录脚本在全新临时内容构建目录运行；不初始化工作区个人 .grad。对外展示只转出公开论文的 AI 阅读内容，不转出个人状态。
原报告作为方向结论接受，但完整引用和阅读卡仍需核对相应原文。不能把 Codex 阅读过等同本轮已经精读，也不改写两份输入报告。
