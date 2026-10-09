# READING-015 · 阅读体验与全站视觉优化

版本：v1.0 · 2026-10-04，设计冻结；验收按用户修订 A1 收敛（见 REVIEW）。独立只读设计复核 GO；W0/W1 已记录放行。2026-10-05：W2–W5 代表页面普通视口核查已记录；W2/W3 修复轮经独立只读代码复核 GO；W6 收尾记录已补。桌面展示为主要验收面，不补手机专项或复杂页面测试；全量矩阵与缩放未执行，最终整体视觉验收仍由用户完成。

## 设计依据与本轮交付

用户已明确认可 [frontend-craft 阅读 Demo](../../../demos/frontend-craft/README.md)，并要求沿此思路提供详细设计与实施计划。本包按 frontend-craft v0.2.0 的任务、内容关系、空间、排版与真实视觉核查顺序，将已认可的阅读气质转成可执行规格，再扩展到首页、综述图谱、路线和书库。阅读 Demo 是视觉方向的用户认可证据；其他页面的结构已按本包规格实施，用户对整体视觉效果的最终验收仍待其查看实际页面。

实施基线为 45b45d4（2026-10-01 前端展示全面优化），当前工作区是 D:\Program Project\ResearchWorkbench。2026-10-04 核查时已有 55 篇论文、5 篇材料、4 个方向（2 active / 2 deferred）、13 条技术路线、11 篇经典和 3 篇综述。技术首页的三条 featured 路线以 featuredTechnicalRoutes(LIBRARY) 的结果为准，不能猜测数据字段。内容版本字符串仍标 v5.4；它不能代替 Git 和实际代码判断实施状态。

交付包含设计、页面规格、交互兼容约定、实施工作包和验收清单。产品实施按 W0–W6 顺序进行；代表内容与普通视口核查覆盖 W1–W5，W6 记录静态校核、复核结论和未执行范围，详见 evidence/。SPEC/BACKLOG 保留本设计包的导航指针。

## 阅读顺序

| 文件 | 用途 | 谁必须读 |
|---|---|---|
| [01-design.md](01-design.md) | 决策、范围、信息架构、内容保全 | 主会话、实现者、审查者 |
| [02-design-system.md](02-design-system.md) | 颜色、字体、尺寸、响应式与公共部件 | 实现者、视觉验收者 |
| [03-page-specs.md](03-page-specs.md) | 全部页面的结构、真实字段与特殊情况 | 实现者、审查者 |
| [04-interactions-and-compatibility.md](04-interactions-and-compatibility.md) | hash 路由、目录、焦点、记录与视图状态 | 实现者、回归验收者 |
| [05-implementation-plan.md](05-implementation-plan.md) | 分阶段派单、文件边界、门槛、回退 | 主会话、下一位执行者 |
| [06-acceptance.md](06-acceptance.md) | 验收编号、页面矩阵、证据格式与拒收标准 | 全部角色 |
| [REVIEW.md](REVIEW.md) | 独立审查、修订闭合及最终放行状态 | 主会话、下一位执行者 |
| [W0-baseline.md](evidence/W0-baseline.md) | 本次实际代码、数据、测试和实页基线 | 主会话、下一位执行者 |

实施者不得只读取 README 后开始编码。正式任务包必须引用本包版本与具体阶段；版本冲突先以 REVIEW 的最终裁决和修订记录为准。

## 已认可的视觉基线

![已认可的桌面阅读 Demo](../../../demos/frontend-craft/previews/desktop-1440.jpg)

- [390×844 窄屏截图](../../../demos/frontend-craft/previews/mobile-390.jpg)
- [同内容原版 1440×1000 截图](../../../demos/frontend-craft/previews/original-1440.jpg)
- [Demo 源码](../../../demos/frontend-craft/index.html)与 [样式](../../../demos/frontend-craft/reading.css)

以截图的构图、字号层级、色彩面积、正文节奏为视觉基线，以本包的兼容要求为产品行为依据。Demo 的数组下标取内容、普通 #scene 锚点和固定下一篇链接只适用于小样，禁止原样迁入产品。

## 控制实施效果的门槛

1. 先将这一篇导读迁到正式渲染链路，与已认可截图逐项对照；代表页未通过不得批量铺开。
2. 全站扩展前，首页、图谱、路线、书库各提交真实内容的代表页；先解决结构偏差，再做细节。
3. 每阶段同时交付内容映射、行为回归与实际截图。测试成功不能代替视觉验收。
4. 个人记录和导学覆盖层保持原协议；字号、图选中和阅读位置都不等于本人掌握状态。
5. 内容少、空目录、长题名、待核材料和错误链接都纳入验收。不能用缺少标题的页面挤成窄栏，也不能凭数据齐全假定页面可读。

## 文档衔接

本包承接 [SPEC](../../SPEC.md)、[BACKLOG](../../BACKLOG.md) 的产品与记录约束；在视觉布局上更新 READING-014。014 的内容、ID、来路与来源纪律继续有效，其旧“尚未实施”文字不作为现状；实际实施事实见其 [IMPLEMENTATION-REPORT](../READING-014/IMPLEMENTATION-REPORT.md) 和本轮 Git 核查。

设计审查结论与实施复核记录见 [REVIEW](REVIEW.md)。只有阶段证据中实际执行并核对的普通视口项才可称已核查；全量内容、交互矩阵和最终视觉验收均保留各自状态，不能由 W2/W3 代码 GO 或本 README 替代。
