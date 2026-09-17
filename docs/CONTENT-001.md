# CONTENT-001 · 已核查首版内容

版本 2026-09-14 / v1。scout 当日实际抓取四个官方页面；以下学习任务与排序是 AI 策划建议，来源覆盖不代表用户读过。不是研究创新承诺。

## evaluation · 优先：先判断结果是否可信

依据：先学会区分训练表现与泛化，比立刻追复杂模型更有助于判断实验。未知：你的 Python、统计基础与兴趣尚未确认。前置：能运行 Python、导入库、读数组切片；若做不到，先在下列 Getting Started 跟跑 fit/predict 示例并解释 X 的行与列，再开始实验。环境自备 Python + scikit-learn，CPU 即可；工作台不会安装学习环境或执行实验。

必读（按顺序，只读指定部分）：
- Getting Started：https://scikit-learn.org/stable/getting_started.html ，读 Fitting and predicting、Pipelines、Model evaluation。理解 fit 只使用训练数据，predict 使用相同特征形式。
- Metrics and scoring: quantifying the quality of predictions：https://scikit-learn.org/stable/modules/model_evaluation.html ，读 classification metrics 下 accuracy、precision/recall/F-measures、confusion matrix；不用通读整个指标目录。

必学：train_test_split、stratify、固定 random_state、训练/测试隔离、Pipeline、DummyClassifier 基线、confusion_matrix 与 macro-F1。可选：后续再读交叉验证，首任务不要求超参搜索。

当前任务：给 Iris 分类做一次可信的评估。
输入：sklearn.datasets.load_iris()，test_size=0.2、stratify=y、random_state=42；不下载私人数据。
步骤：1. 划分后仅训练集 fit；2. 用 StandardScaler + LogisticRegression(max_iter=200) Pipeline 与 DummyClassifier(strategy='most_frequent') 比较；3. 在同一测试集输出两者 accuracy、macro-F1 和模型混淆矩阵；4. 写出“为何不汇报训练集分数作为泛化结果”和一个误判观察。
产物：一个可重跑的 .py/notebook + 一张两模型指标表 + 两句解释。合格检查：测试集30样本，混淆矩阵3×3且元素和30；每个指标在[0,1]；同种子重复结果一致；说明训练集和测试集用途。不要求达到指定高分，不以模型胜过基线作为硬门槛。结果不合理时先查划分、标签和 fit 位置。

## autograd · 备选：拆开模型的学习过程

依据：适合更想理解模型为何会更新参数、已有简单求导基础的人；比训练大模型便宜，CPU即可验证。未知：你是否掌握函数求导与张量 shape。前置补习：先读 Tensors 并运行 shape/索引/逐元素乘法；若不会求导，先推导 d(w*x+b-y)^2/dw=2*(w*x+b-y)*x 与 db=2*(w*x+b-y)，再进入梯度对照。

必读（按顺序）：
- Tensors：https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html ，读 Initializing、Attributes、Operations；GPU 迁移为选读。
- Automatic Differentiation with torch.autograd：https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html ，读 Computing Gradients、Disabling Gradient Tracking、计算图说明及梯度累积提示；Jacobian 为选读。

必学：浮点张量、requires_grad、标量 loss、backward、grad、清零梯度和重新构图。环境自备 Python + PyTorch；不要求 GPU，不自动安装。
当前任务：用一个标量实验核对自动微分。
输入：x=2.0、y=5.0、w=1.0、b=0.0，w/b 为 float64 且 requires_grad=True。
步骤：1. 算 prediction=w*x+b、loss=(prediction-y)^2；2. backward 后打印 w.grad/b.grad；3. 与解析梯度比较；4. 重新计算 loss 再 backward，不清零观察累积；5. 将 grad 清零，重新计算 loss/backward 验证恢复。
产物：一个可重跑脚本 + 梯度对照表 + 两句解释。合格检查：首次梯度(-12,-6)，绝对误差<1e-6；第二次未清零为(-24,-12)，清零重算恢复(-12,-6)；解释“计算图重建”和“梯度清零”不是一回事。复制代码跑通不自动算本人能解释，反馈由本人决定。

## 来源与集成事实

已安装插件根（宿主用户目录下的 .zcode 插件缓存）中的 grad-companion-marketplace/grad-companion/0.4.0。
scout 核验：commands/grad/radar.md:1-16 为宿主命令；skills/grad-radar/scripts/reading_record.py:10-20 定义 CLI 与状态限制，105-115 为身份，431-433 为歧义，682-717 为带用户原话的 set-status；skills/grad-radar/SKILL.md:62-69 区分笔记与本人已读，102 的 seen 不等于读过。
教程不是带 arXiv/DOI/文件哈希的论文，不能用本次官方 URL 冒充可注册论文身份。首版不接入个人记录或日更发现。
