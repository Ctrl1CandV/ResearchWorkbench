# ACCEPTANCE-001 验收证据

日期：2026-09-14。当前进行中，不是最终通过声明。

## 命名派发

scout、builder、reviewer 三个命名类型均成功派发并返回指定 START-HERE 文件读取结果，零写入。仅证明命名类型可执行；实际底层模型以宿主元数据为准，不采用模型自称。

## 设计审查

reviewer 预审 changes-required：要求强制 Web Locks、明确静态白名单/Host、AC-06 核验层次。协调者修订 v2 并显式收敛未冻结 AC-06 为手动交接准备。最终设计审查 pass，批准切片 A 后再 B；不等于产品验收。

## grad-companion 0.4.0 真实只读契约验证

系统 Python 3.12.9，直接 python -B 调用安装版 skills/grad-radar/scripts/reading_record.py；--repo 指向新建系统临时空目录，未读取工作区 .grad 或任何个人记录。不联网、不经 uv、不安装依赖。

- list --repo <临时空目录> --json：退出0，stdout `{"ok":true,"data":{"count":0,"items":[]}}`，stderr 空。
- show --repo <临时空目录> --paper any-nonexistent-title --json：退出1，stdout `{"ok":false,"error":"NOT_FOUND","detail":"没有匹配 'any-nonexistent-title' 的论文记录；先用 /grad:radar 阅读入口或直接 register 登记"}`，stderr 空。NOT_FOUND 是预期契约，不照其中提示运行登记。
- 两次后临时目录仍为空；插件 scripts 目录的文件路径、大小、mtime_ns 前后快照一致。

这是实际 CLI 空记录/错误响应验证，不是宿主模型阅读、每日发现、论文注册或笔记生成接入。网页无法据此检测用户宿主状态；展示文案必须继续声明“手动交接准备，未接收结果”。

## 待验收

切片实现测试、实际浏览器场景、独立代码审查及最终结论尚未完成。
