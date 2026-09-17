# 页面升级验收（2026-09-15）

## 完成范围
依据用户de-ai-flavor与impeccable请求，重写新版四入口页面文案与布局。设计独立审查通过后由唯一builder实施，最终文案/代码独立审查pass。

- 220px深墨导航、冷白主区和青绿强调，首页首读推荐与分层方向区。
- 纵向阅读步骤，论文18px宋体正文与目录/原文/前后篇辅助栏。
- 移动端顶部导航单栏，原文入口不再藏在来源折叠内。
- 去掉正文中的机器分类标签、内部任务语言和重复边界说明；来源/未读/作者论断与整理者分析仍可辨。
- 未改变15个条目的身份、标题、URL、分类、coverage、日期及路线顺序；旧版CSS前321行与基线字节一致。

## 验证
主协调复跑npm test：193项，192通过、0失败、1条件跳过（Windows符号链接权限）。独立reviewer对结构化字段/日期和三standard正文比对，无事实漂移；核心目录滚动与hash分离、前后篇和原文入口检查通过。

impeccable detect执行一次，仅报告旧CSS118/129两处侧边框warning；该段是保护的legacy样式，不为升级新版而改旧页。

桌面1280视口document scrollWidth1265；移动390视口scrollWidth375，无水平溢出。实际DOM检查显示新版侧栏、首读主推荐、三个方向和四入口均存在。截图生成成功，但工具仅返回路径，当前无法可靠检视视觉图像；不称视觉验收通过。真实指针全链路也没有在本轮完整验证。

## 文件与保护
产品修改：public/index.html、public/library.js、public/library-content.js、public/styles.css、tests/library.test.mjs。
设计记录：PRODUCT.md、DESIGN.md、docs/DESIGN-004-reading-upgrade.md。
未改private/.grad/插件、legacy页面、旧存储。未提交、推送或公开部署。升级比对用的临时基线与内容缓存目录在验收通过后已删除；docs/research/reading-cards保留前次已审内容快照，本轮网页只是措辞升级，非重新全文阅读。

## 侧栏高度修复（同日追加）
用户反馈左侧深色栏只到内容底部。原因：`.lib-side` 的 `align-self: start` 使网格项不拉伸。改为 sticky + height:100vh（滚动时始终覆盖左侧视口），并在900px以下断点同步把已废弃的 max-height 重置改为 height:auto，手机端恢复内容高度。桌面1280（顶/底滚动）与手机390实测确认；npm test 193项，192通过、0失败、1条件跳过。
