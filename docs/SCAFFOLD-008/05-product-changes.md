# 05 产品改动：文件、兼容与验收矩阵

版本：008.2。仅让 01–04 的内容可见、导航走通，不重做视觉系统。字段与行为以 03、04 为准；不保留“实现时任选存储方案”之类分岔。

## 1. 读写清单

| 文件 | 允许修改 |
|---|---|
| public/content/directions.js | 四方向、active/deferred、startRoute/archiveRoute；新主方向与旧谱系 |
| public/content/materials.js（新增） | 恰好两个起步材料（问题导读、实证研究读法） |
| public/content/papers-collab.js（新增） | 四张新论文卡；固定拆到此文件，不在两个备选文件间摇摆 |
| public/content/papers-routes.js | 仅 TOSEM/Agentless/SWE-bench 的 learner、动作和必要的起步文案；保留原 id、next、已核正文与覆盖 |
| public/content/technical-routes.js | featured 三条、T4 别名对应的规范 id、连续教学指引；其他数据保留 |
| public/learning/multiagent-lab.md（新增） | 04 规定的静态可复制教材，不是服务端运行脚本 |
| public/library-content.js | 聚合新模块、typed startHere、首页/全局文案与版本；原 45 篇相对顺序不变，新四篇追加 |
| public/library.js | 目标解析、路由参数、三问/讲解/材料、track 导航、过滤与折叠、技术教材链接、安全校验 |
| server.mjs | 仅精确增加两个模块路径及一个教材路径；不改 discover、Host/CSP/符号链接保护 |
| tests/library.test.mjs、tests/render.test.mjs、tests/server.test.mjs | 合同、回归、无副作用与静态白名单测试 |
| docs/SPEC.md、docs/BACKLOG.md、docs/DESIGN.md、docs/TECH-LEARNING-005.md、docs/READING-TEMPLATES-005.md、README.md | 同步本期目标、兼容关系、实施中/已验收状态 |
| docs/SCAFFOLD-008/IMPLEMENTATION-REPORT.md（已有，续写） | 工作包、证据、测试、待核与未执行项 |

public/notes.js 与 notes 测试原件不改；用新渲染测试验证旧记录行为。public/styles.css 不在计划修改范围：优先复用原文本、details、按钮与排版；确有新增内容导致溢出时仅可做局部兼容修复，在报告逐条解释，不更换设计系统。discovery.mjs、briefs 历史数据、论文支线与经典数据、package.json 均不属于本期改动。

当前工作区已有未提交改动；上述清单是可接触范围，不意味着可以覆盖其中原有工作。实施前记录基线，遇重叠先合并理解，不回滚用户改动。

## 2. 固定数据规模与兼容层

相对 2026-09-22 已核内容基线的最终目标（不是当前已实现规模；如果续做现场已新增旧版卡，先按 09 保留并明确规模差额，不能删数据凑数）：

- directions=4，active=2（主方向/代码验证），deferred=2；start 长度为 5/4/0/0。
- archive 长度为 3/9/8/11。主方向三项都是 external 按需目录；其余保留旧论文步骤与顺序。
- papers=49（原45加 Beyond Frameworks/MemGPT/Tax/Debt 四张）、materials=2、经典书目=11 不变。
- technicalRoutes=13（原11，其中 T4 改规范 id，加主线与浅图2条），featured=3，折叠其他10条；units=26（旧19加4+3）。旧 T4 三单元 id 保留。
- 简报与用户记录不新增、不迁移、不删除。

这些数值放在针对真实 LIBRARY 的里程碑验收测试，不硬编码到通用 validateLibrary：小型 fixture、空态与旧格式兼容仍须可测。不得用占位标题/空正文/临时假方向凑数量通过测试。

兼容层先于真实数据切换：缺 materials 视为 []；旧 direction.route 只读回退、旧 status 缺省按 active 读取；新方向必须有明确 status 与两个 track，route 与新字段同时出现报错。旧 home.startHerePaperId 只读适配，新旧同时出现报错。旧无 query 的 parseHash 输出不变。技术解析先匹配现有精确id，找不到tech-t4时才转tech-rag，因此包2的原T4仍可用；最终只存tech-rag，不复制一条RAG数据。

STAGE_ORDER 保留原四阶段，新增“建立概念”；required 继续使用“必读/选读”，passMode 新枚举 map/core/deep（起步无 deep）。02 的每张表 id 是目标 id，路线 step id 按 03 生成；“为什么现在”映射 purpose，“读到能解释”映射 check，readWhen 由前后顺序补成一句可执行提示，不需向用户提问。

## 3. 呈现与安全

主方向折叠目录标题为“按需查阅（不必接着读）”，其余旧谱系仍显示原说明。首页材料固定 mat-cross-harness-map，并携带 route=cross-harness-collab/track=start；新四论文 id 和主线顺序以 02 为准。

方向页：对象→现状→理由→限制→初期用法→startRoute→折叠 archive→问题。默认入口（首页、方向列表、侧栏）统一 active；延后方向直达保留横幅与 archive。材料页、三问与 Explain 的顺序以 03 为准。旧纸面下一篇只能是延伸阅读，连目录里的“下一篇”标题也要同步，避免页面同时出现两个主下一步。

material 详情可归属方向导航激活项；技术 unit 详情归技术项。页内讲解定位使用现有 scrollIntoView，不用第二个 hash 抹掉 route/track。安全 blocks 复用既有白名单，所有文字以 textContent/createTextNode 写入，未知字段不当 HTML，外链仍仅 https。

教材用普通同源链接，路径固定 /learning/multiagent-lab.md。服务器以 text/plain; charset=utf-8 返回，保留 nosniff/CSP 和 GET/HEAD 行为；链接标“打开/下载教材”，旁边指出 MA 单元章节。浏览器显示纯文本不承诺 Markdown 锚点跳转，下载后按目录定位。不得做通用 /learning/* 文件服务、Markdown HTML 注入或执行 Python；静态请求含 query/编码/大小写变体仍按原契约拒绝。

coverage 与 deliveredDepth 分开；quick 有定向正文时，列表、卡页、路线、全局 notices 不能再说仅摘要。更新旧全局“所有图表均未核”绝对文案为按卡标注，不能覆盖新 Debt 表格核查；也不能反过来说所有旧卡图表已核。旧 coverage 日期不因加 learner 自动刷新为今天。

## 4. 每日精选和首页

首页 typed startHere、firstUse 与两方向/三技术计数在真实数据接入同包切换；不保留“查看三个方向”“按十一条主干顺序学”。meta.directionSourceNote 写本轮授权与日期，不继续说当前三方向。

首页精选 purpose/howToUse、brief 页 intro 明说“感知相关/前沿工作及方法，不是今天的阅读作业，通常无需读正文”。保留日期、漏斗边界与近期登记≠发表，不为精选写 Preserve/Skip，不自动灌入 startRoute 或 v3。

不改 /api/discover 三主题、漏斗生产流程或 .grad 配置。不运行全天发现或全网 check-links；仅定向核本期使用的资源。

## 5. 自动验收矩阵

每项至少有正例、关键反例；断言用户能看到/点到的行为，不能仅搜索源码字符串。

| 编号 | 必测行为 |
|---|---|
| A01 | NodeTarget 唯一外键；paper/material id 冲突、未知 kind、悬空 unit、同 track 重复目标拒绝 |
| A02 | 两个 track、新旧 route 冲突、pending 必有原因；external 仅 archive；5+4 全 ready 是最终验收条件 |
| A03 | Explain 的 inline/sectionId 二选一、空讲解/失效引用/非法 block 拒绝；目标真的在当前深度渲染。Skip 必有 why |
| A04 | 首页材料标题与 href 正确，不送 getPaper；旧 startHerePaperId 单独可读，两者并存失败 |
| A05 | hash 参数可往返，非法编码/重复参数/未知参数/错误 track/非 learn 的 unit 拒绝；无参数旧返回形状不变；目标非 track 成员明确未找到 |
| A06 | 主线导读→Beyond Frameworks→MemGPT→Tax→Debt（结束）；TOSEM start→Agentless，archive→Le；SWE-bench start 无主下一篇；旧 next 保留为延伸，不以其旧 note 再写“下一篇”误导 |
| A07 | route/track 的刷新、历史后退与复制链接持久；尾节点不跳 archive，pending 不被跳过；unitRef 合成 fixture 验证深链而不新增起步节点 |
| A08 | 首页/列表/侧栏仅 active；两条 deferred 旧书签和论文库仍可用，routesContaining 保留 archive 关联 |
| A09 | learner 在正文前；Explain 可读/可定位；记录在正文导航后、覆盖前；无 learner 旧卡不伪填 |
| A10 | 材料无记录操作，浏览前后 localStorage 无写入；论文仍用原 id，不把 query 写进记录；既有 v3 保存导出与 v1/v2 隔离测试全部保留 |
| A11 | featured 三条与其他 details；tech-t4 别名含单元定位；G3 lesson 不为空，ready外部资源型单元恰有一个主资源；pending行为按04，最终10个featured单元全ready；labPath只准精确值且章节标签合法 |
| A12 | 材料/新论文 JS 和教材精确路径返回正确 MIME；未知、哨兵、遍历、query、编码及符号链接保护不放宽 |
| A13 | 新旧 quick 依据文案正确；不靠正则声称能证明内容真实，真实章节/数字另按人工验收 |
| A14 | 真实库精确规模、原45 id与相对顺序、三条旧 archive 顺序、原经典和简报数据保留；技术旧单元/资源不得无说明丢失 |
| A15 | 首页与 brief 感知口径；未知路由/空库依旧明确空态；原所有测试继续通过 |

A07 的真实浏览器行为不能仅靠 parser 单测替代。测试数量按实施结果报告，不强制仍是127。符号链接 EPERM 只在原来同一条件下跳过，不能泛化成忽略失败。

## 6. 内容与教学人工验收

- 5+4 每节点各看三问是否具体、读法是否与真实覆盖一致；不要求所有项都有 Explain，但至少兑现 03 的三种抽检形态。
- Tax 的升/降结论写明设置；Debt 的事件数、累计 token、初始长度分开，定位见 07。若需数字，读取原文对应表/段再写，不能拿讨论文档充 coverage.basis。
- TOSEM 的 Explain 可引用现卡 design 部分，题目应是“四工具的技术类别与复核流程”，不是承诺现卡没有的四套详细算法。只加学习建议不冒充重新精读。
- 技术主资源不止“网页可打开”：核到指定教程内容；教材 mock 的七项实际运行检查由 04/06 验收。其他技术以官方教程与范围指引交付，真实 API 未测如实列明。
- 真实桌面浏览主线五步、代码线四步，切换 start/archive，再验证旧书签、材料无记录、讲解定位和教材下载。对本期新增长链接/讲解做窄屏溢出冒烟，不承担 BACKLOG 的全站390/1440视觉矩阵。

测试绿、内容审查、教材运行、浏览器点击分别记证据；缺哪项写哪项未验收，不用“测试全过”替代全部交付。

## 7. 本轮文档更新对实施的影响

必须检查内容、关联、计数测试和点击序列，不能只换标题。当前包 2 未完成，已有 1 项基线测试失败，详见 09；原有半成品应合并补齐，不从零覆盖。研究定义至少同时出现隔离 harness、异构 Agent、输入/输出预算、机制及表示组合与条件化效果；任何页面不得暗示已经确定状态+packet 或某格式是答案。该语义验收由读者核查，不靠关键词正则代替。
