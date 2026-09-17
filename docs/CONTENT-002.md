# CONTENT-002 研究导航公开内容包

2026-09-14 v1，scout核查公开arXiv摘要页与CCF官网。全部为编辑性建议，不是本人画像/已读记录；来源范围：摘要与元数据，非全文精读。以下问题是阅读提示，不把问题中的可能局限冒充论文已证明事实。不声称已完成2026最新研究空白检索。

## 方向及排序裁决

默认编辑阅读顺序agent、rag、peft。是低承诺的研究理解顺序，不是录用概率。用户由协调者择方向，旧主线仅参考。工程经验可降低理解工具链门槛，但不等于掌握研究方法。拒绝“PEFT门槛最低因此最适合”的无条件判断：训练预算与公平调参不明，不能据容易跑LoRA推断容易发表。

agent：研究问题“工具调用成功是否真的完成了用户任务，如何得到可复核的完成证据？”适合系统/LLM工程积累者先读。研究机会假设：区分调用成功和任务成功，研究验证证据、评审偏差与成本约束；需要后续系统查新，不是新颖性结论。风险：真实API非平稳、LLM裁判噪声、基准构造偏差、成本。方法对比：模型自报（便宜但自证不足）、LLM裁判（灵活但偏差/成本）、环境状态断言（可核验但任务特定）。潜在产物是清晰问题定义、可靠评价协议或可泛化验证方法，不是包装工作流就够发表。首读Toolformer再ToolLLM；达到理解标准后比较“会调用”与“做完任务”。

rag：研究问题“回答依据是否充分，检索失败与生成失败怎样区分？”与agent作为对照，适合检索/信息组织兴趣者。机会假设：证据不足时拒答、检索噪声影响、引用支持性；竞争密集，不能把添加一个检索器叫创新。风险：知识库质量、标注成本、评价与泄漏。方法对比：纯参数生成（知识更新难）、固定检索（透明但噪声）、动态/模块化检索（灵活但链路复杂）。首读Gao综述再Lewis；后续比较“答对”与“证据支持”的差异。

peft：研究问题“有限训练与调参预算下，适配方法比较是否公平且可迁移？”算力/方法基础不明时不主推。机会假设：预算约束和跨任务稳健性，不是宣称发明新LoRA。风险：公平基线、多随机种子、计算预算、成熟拥挤领域。方法对比：全量微调（成本高）、低秩适配（参数省但仍需训练）、提示/适配模块（容量与推理开销各异）。首读LoRA再Lialin综述；后续比较任务、模型与调参预算是否可比。

## 核心论文

### toolformer / agent / 基础方法 / 首读
- 标题：Toolformer: Language Models Can Teach Themselves to Use Tools
- 作者：Timo Schick et al.；2023；https://arxiv.org/abs/2302.04761
- 摘要级导读：用自监督数据构造让语言模型学习何时、如何调用外部工具，将工具返回结果纳入预测；少量API示例用于生成和筛选训练数据。不要将语言建模损失改善自动视为用户任务已完成。
- 必读定位：方法部分的数据构造与调用筛选，再对照评估设置；章节编号本版未全文核验，不写固定页码。
- 必学前置：自回归预测、训练损失、API输入输出；熟悉者跳过。自查：能说清候选调用如何筛选；能区分工具调用有帮助与最终任务成功；能指出一项尚需额外证据的可靠性判断。
- 阅读问题：调用筛选依据是什么？哪些错误能被筛掉、哪些不一定？训练式工具使用与提示式调用有哪些取舍？
- 下一步：不清楚损失先补条件概率与语言建模目标；理解后对照toolllm的任务规模和评价协议。

### toolllm / agent / 评估与系统 / 对照
- 标题：ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs
- 作者：Yujia Qin et al.；2023；https://arxiv.org/abs/2307.16789
- 摘要级导读：结合真实API的数据构造、模型训练和自动评估，提供ToolBench/ToolEval及工具使用模型。API覆盖规模不等同于每项任务都得到可靠验证。
- 必读定位：数据构建、评估定义、泛化设置；必学前置：评估集、分布外泛化、自动裁判。
- 自查：能区分通过率与比较胜率；能列出评估依赖的环境条件；能说明自动裁判与环境证据并非同一类证据。
- 阅读问题：评估器看到了什么？真实API变更会影响什么？数据构造与评估器是否存在共同偏差？
- 下一步：不清楚评价先回看指标定义；理解后与toolformer比较学习目标和评价目标。

### rag-survey / rag / 综述 / 首读
- 标题：Retrieval-Augmented Generation for Large Language Models: A Survey
- 作者：Yunfan Gao et al.；2023；https://arxiv.org/abs/2312.10997
- 摘要级导读：综述RAG技术范式、检索与生成环节及评估方向，帮助建立方法地图。综述指出的挑战是历史线索，不证明今天仍未解决。
- 必读定位：范式分类、评估与挑战；必学前置：向量检索、上下文、回答事实性。
- 自查：能比较三类RAG范式；能把一个失败分到检索或生成环节并指出不确定性；能区分正确性与证据支持。
- 阅读问题：评估维度对应什么失败？哪些问题需回溯原始论文？综述的时间范围会遗漏什么？
- 下一步：术语不清先补检索召回与排序；理解后读rag-original的方法定义。

### rag-original / rag / 基础方法 / 精读候选
- 标题：Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks
- 作者：Patrick Lewis et al.；2020；https://arxiv.org/abs/2005.11401
- 录用来源：arXiv comments核查Accepted at NeurIPS 2020；仅本篇标已核查NeurIPS 2020，会议目录与当年录用证据分开。
- 摘要级导读：把参数记忆的生成模型与非参数记忆的检索器结合，提出RAG-Sequence和RAG-Token两种条件化形式，评估知识密集任务。
- 必读定位：方法两种形式、任务与证据；必学前置：条件概率、潜变量、稠密检索。
- 自查：能说清两种条件化差异；能说明检索器与生成器各负责什么；能指出论文任务结果无法直接支持的实际部署结论。
- 阅读问题：段落怎样参与生成？检索到错证据时如何追踪错误？实验覆盖与实际应用差在哪？
- 下一步：公式不清补条件概率；理解后回到rag-survey定位后续方法演进。

### lora / peft / 基础方法 / 首读
- 标题：LoRA: Low-Rank Adaptation of Large Language Models
- 作者：Edward J. Hu et al.；2021；https://arxiv.org/abs/2106.09685
- 摘要级导读：冻结预训练权重，以可训练低秩矩阵表示权重更新，减少适配参数；具体效率收益依模型和设置，不把原文单一数字泛化到所有任务。
- 必读定位：低秩更新方法与秩相关分析；必学前置：矩阵乘法、秩、梯度训练。
- 自查：能写出W+BA并解释形状；能区分可训练参数与总训练资源；能列出比较方法时必须固定的条件。
- 阅读问题：低秩假设是什么？怎样合并权重？改变秩和预算怎样影响公平比较？
- 下一步：形状不清补矩阵代数；理解后读peft-guide作方法范围比较。

### peft-guide / peft / 综述 / 对照
- 标题：Scaling Down to Scale Up: A Guide to Parameter-Efficient Fine-Tuning
- 作者：Vladislav Lialin et al.；2023；https://arxiv.org/abs/2303.15647
- 摘要级导读：整理参数高效微调方法与分类，为理解适配方法取舍提供入口。未全文复核前不在产品中引用具体方法数、实验规模或排名结论。
- 必读定位：分类法、比较与资源讨论；必学前置：LoRA与适配器、训练和调参预算。
- 自查：能按机制区分方法；能指出比较结论依赖的资源条件；能解释为什么更少参数不自动意味着更低总成本。
- 阅读问题：方法比较固定了哪些条件？预算和任务改变后结论是否保持？哪些主张应回到原始论文核查？
- 下一步：不清楚基线先回lora；理解后形成一个待查新的受约束研究问题，不自动认定创新。

以上三组关联均标“编辑推荐对照阅读，非已核验引用关系”。五篇未单独核验录用信息，不标CCF论文等级。

## CCF成果目标参考

scout访问日期2026-09-14；版本公告https://www.ccf.org.cn/Academic_Evaluation/By_category/ ，AI类目https://www.ccf.org.cn/Academic_Evaluation/AI/ 。核查报告为第七版2026-03-31发布（4月9日勘误）；类目页自身无版本文字，来源分列。
A期刊：Artificial Intelligence、IEEE Transactions on Pattern Analysis and Machine Intelligence、International Journal of Computer Vision、Journal of Machine Learning Research。
A会议：AAAI、NeurIPS、ACL、CVPR、ICCV、ICML、IJCAI。
此为目录事实，不是全部推荐投稿。当前文本/工具方向可先了解AI、JMLR与AAAI/ACL/NeurIPS/ICML/IJCAI主题要求；视觉期刊/会议不因A标签就推荐。不声称已核查当年CFP、截止日期或录用概率，目标匹配仍需看具体成果与最新征稿范围。

## 每日发现固定契约

来源Crossref REST（公开正式出版元数据，非完整arXiv覆盖）。scout实测query和created-date过滤HTTP200，arxiv搜索API429，因此本版不使用该接口或自动降级。
按最近7个UTC日登记的记录：from-created-date为今日减6天、until-created-date为今日，sort=created&order=desc&rows=20&select=DOI,title,author,abstract,created,published,container-title。query固定agent='language model tool use'、rag='retrieval augmented generation'、peft='parameter efficient fine tuning'。检索语义明确“近期收录，不等于近期发表”，不称新发表论文。created.date-time必须合法且在窗口；缺失丢弃并报filteredCount。published.date-parts仅展示（年/年月/年月日原精度），缺失显示出版日期未知，不借created替代。DOI和title为必需，DOI去重；摘要可缺失显示来源未提供，非编造补全。
摘要清洗JATS标签且只textContent展示，不执行HTML；原文摘要标语言原文，不伪称在线中文模型摘要。用户可选阅读原文。结果相关性仅关键词匹配待本人筛选。动态条目本版可读摘要和打开来源，不自动入六篇精读库，不自动保存已读；界面明确该边界。
缓存15分钟以原fetchedAt，cached=true；超时12秒/2MiB超限/429/无效JSON返回明确错误，无种子回退。全局上游间隔至少3秒、同主题请求合并、每主题每天最多5次真实成功或失败尝试，限额时503说明稍后/次日再试。无联系邮箱不伪造，普通User-Agent ResearchWorkbench/0.2 (local research reader)。query无用户自由文本、额外参数拒绝，不转发画像笔记。
