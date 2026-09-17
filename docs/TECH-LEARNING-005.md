# Agent研究生技术学习体系

## 1. 选择原则

研究方向可以换，技术主干应稳定。目标不是“学完所有Agent框架”，而是能理解模型边界、把工具连接成可控系统、发现失败原因并用证据改进。以下为编辑推荐，不是本人能力认定。已经掌握的单元可通过自查跳过；不要求先完成练习才能读论文。

必学指能力类别，不指某一厂商产品。每单元首选一个主教程，最多一个补充来源。先读公开免费文字内容；付费/API/GPU/登录要求提前标注，不能把平台注册设为平台浏览前提。

## 2. 六条主干及顺序

### T1 软件工程与可复现工作（共同起点）
要解决：代码能跑不等于可维护、可复查。单元：Python模块与类型/数据验证 → 异步I/O与HTTP超时 → pytest与测试替身 → Git/依赖锁定/配置与密钥 → 结构化日志和可重放输入。
先修：Python基础；未确认掌握时提供自查，不重新让用户读整套语法课。
掌握标准：能解释如何隔离模型API做测试，如何复现一次失败，为什么重试必须考虑幂等；可选练习为给已有小服务补一项测试，不安排Iris实验。
资源：Python官方教程 https://docs.python.org/3/tutorial/ 、pytest https://docs.pytest.org/en/stable/ 、Git https://git-scm.com/book/en/v2 属实施时定向核查入口，本轮未逐章核验；课程环境准备可参考已核HF Unit0和Microsoft Lesson00，但两者不能冒充软件工程全课。

### T2 LLM原理、调用与可靠输出
单元：token/上下文/注意力与预训练直觉 → 消息与提示边界 → 结构化输出与schema校验 → 流式响应/错误/成本 → 模型选择与小规模比较。
先修：T1基本接口能力；注意力推导和训练留进阶，不用数学课阻塞API理解。
掌握标准：能解释上下文窗口与持久记忆区别、格式正确与答案正确区别、为何温度和重试不保证结果可靠。
主资源：Microsoft Generative AI for Beginners Lessons01–02及04–06（仓库课程级核查）；补充FSDL LLM Bootcamp 2023 LLM Foundations（站点级核查，旧API不照抄）。

### T3 工具调用、状态与工作流（核心）
单元：工具schema/参数验证/权限 → 单智能体循环与停止条件 → 确定性工作流和自主决策的取舍 → 状态/检查点/恢复 → 人工确认/副作用/取消。
先修：T1与T2；从无框架流程理解输入输出，再选择一种实现。
掌握标准：能画清模型建议、宿主执行与真实状态的边界；工具成功不等于任务完成；恢复不能重复扣款、发消息或写文件。
主资源：HF Agents Course Unit1；实现示例从Unit2三框架任选一个。状态编排参考LangGraph官方overview及其链接到的持久化/人工介入概念，后两项深链实施时核验。默认建议先用原生Python读懂循环，再用LangGraph理解显式状态，不同时学习所有框架。

### T4 数据、检索与记忆
单元：文档获取/许可/版本与切分 → BM25与向量检索 → 重排 → 引文与充分性 → 会话状态/长期记忆/失效更新。
先修：T2；可与T3并行。并非每个Agent都必须用向量数据库。
掌握标准：能区分检索相关与足够回答；知道重排救不了漏召回；知道记忆何时应过期及私有数据边界。
主资源：LlamaIndex Introduction to RAG https://developers.llamaindex.ai/python/framework/understanding/rag/ ；Sentence Transformers Retrieve & Re-Rank https://www.sbert.net/examples/applications/retrieve_rerank/README.html 。两者前轮已核官方页面，本轮不重跑。与RAG研究路线的关系是可选关联，不把其论文作为先修门槛。

### T5 评估、调试与可观测性（必学，不放最后才看）
在T2开始时引入最小评价，完成T3后集中学习。单元：任务与验收标准 → 固定样本/切分/泄漏 → 轨迹与工具事件 → 失败分类/回归/重复运行 → 成本延迟与质量取舍。
掌握标准：能解释样本级成功、工具成功和LLM judge分数区别；能复查一个失败轨迹；比较同信息/预算条件，不能把缓存重放当独立重复。
主资源：HF附加Agent Observability and Evaluation；补充FSDL测试/部署监控课程（需锁定年份与具体讲次）。LangSmith Essentials只是可选产品示例，不能要求把私有轨迹上传。平台自带阅读自查和模板必须覆盖基本评价，即使不使用这些服务也能学。

### T6 安全、服务化与运行边界
安全从T1/T3开始贯穿，部署在工作流可测试后学。单元：不可信输入/提示注入/最小权限 → 人工确认与审计 → API服务/容器/环境隔离 → 超时/限流/队列 → 监控/版本回滚与数据保留。
掌握标准：模型输出不是授权；检索文档不能改变工具权限；能够说明哪些操作必须确认，如何停止/回滚，并避免日志泄露密钥。
主资源：Microsoft Lesson03负责任使用；FSDL部署/监控为补充。它们不等于完整安全课。OWASP GenAI https://genai.owasp.org/ 、FastAPI https://fastapi.tiangolo.com/tutorial/ 、Docker https://docs.docker.com/get-started/ 为后续定向核查入口，不在核验前称已选完整课程。只做防御与授权场景，不提供攻击外部系统练习。

建议顺序：T1 → T2 → T3；T4按应用需要与T3并行；T5从T2贯穿，在T3后系统化；T6安全早期引入，部署后置。不是六课必须线性学完。

## 3. 条件进阶与旧内容支线

- 模型训练与适配：PyTorch、优化、LoRA、训练数据与公平比较。需要训练目标与算力；旧LoRA/PEFT指南复用为摘要选读。
- 工具使用研究：Toolformer、ToolLLM，帮助理解工具能力如何训练与评价，不替代工程工具调用课。
- RAG研究基础：Lewis原始RAG + 当前Gao综述；综述同身份去重。
- 图学习与多源融合：线代/谱聚类/图拉普拉斯/GCN/无监督评价，服务第三方向，是研究专项而非Agent工程人人必修。
- 多智能体协作：只有单智能体基线、可解释协作收益与成本对比需要时进入；不以角色数量当能力。
- 推理系统/模型部署优化：有硬件与性能目标后学批处理、缓存、调度；初期不建推理集群。

## 4. 成熟平台参考（本轮定向核查）

| 来源 | 已核查层次 | 借鉴 | 不照搬 |
|---|---|---|---|
| https://huggingface.co/learn/agents-course | 课程总结构/先修/Unit0–4与附加单元 | 先概念后框架、每单元目标与资源、选学内容分组 | Spaces账号、排行榜、证书不作为本平台必需 |
| https://fullstackdeeplearning.com/ | 站点与多年度课程目录，未逐讲 | 全栈能力视角、讲解配可选动手材料 | 不混用2021/2022/2023版本，不宣称覆盖所有安全评价 |
| https://github.com/microsoft/generative-ai-for-beginners | README课程结构，未逐课读全部内容 | Learn/Build区别、文字与代码并列、安装前提明确 | 不默认绑定Azure或商业API |
| https://docs.langchain.com/oss/python/langgraph/overview | 官方overview和旧地址迁移 | models/tools先修、状态编排所在层次 | 不把框架文档当完整学习路线 |
| https://academy.langchain.com/ | 课程目录存在，章节/价格未核 | Quickstart/Foundation/Project层次 | 不假定某课程存在或免费，不强制LangSmith |
| https://roadmap.sh/ai-engineer | 页面角色定义与交互入口；图内节点未核 | 区分AI工程/研究角色、路线概览与详情分离 | 不抄未核查节点，不引入进度平台 |

以上共同启发是“概览 → 有先修的单元 → 主资源 → 自查”，不是证明六家都具有完全相同功能。引用课程名+真实URL+核查日期+核查层级；深链可用时保留并提供课程首页回退，不因链接迁移频繁而只留域名。

## 5. 实施内容最低量

首批六主干概览必须完整，每主干至少3个真实学习单元说明；六条主干各至少一个可立即开始的单元，具备已核查到具体章节的主资源、访问条件和自查。T4可以复用已核教程；T1、T5、T6的资源缺口由实施阶段定向补核，未达到门槛则报告该路线未完成，不冒充可开始。未核候选放编辑待办，不混在用户可开始资源中。支线可先接公开旧内容，保持原来源覆盖。

每资源字段：id/title/provider/url/language/format/checkedAt/checkLevel/access（open/login/paid/unknown）/versionNote/primary。不要估计完成小时数；确有课程建议时标来源建议，不承诺用户速度。每单元字段：id/title/goal/prerequisites/resourceIds/selfCheck/optionalPractice/skipWhen/relatedPaperIds；relatedPaperIds可空，禁止方向必填。
