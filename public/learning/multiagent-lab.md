# 多智能体架构贯通练习教材（SCAFFOLD-008 / 008.2）

对应技术路线「多智能体架构」的 ma-u1…ma-u4 四个单元（`labSection` 与本教材小节标识一致）。
纯文本教材：浏览器只负责阅读/下载，不解析执行代码；按下方步骤复制到**独立练习目录**运行。

## 0. 适用基础与边界

- 基础：能运行 Python，理解函数、列表/字典与异常。不涉及训练、部署或 K8s；CPU 即可，不需要 GPU。
- 任务全貌：一个小型算术任务助手。执行者把输入表达式转成**受限的**加减乘除工具调用（禁止任意代码执行，不用 eval）；宿主确定性执行工具；复核者检查结果与工具证据，必要时退回；重试有上限，之后人工接管或停止。
- 它是理解架构的教学例子：**不是**科学实验，**不是**跨 harness 性能证据，不验证 Handoff Tax/Debt 的任何结论，也不验证「结构化状态优于文档」。
- 数据边界：只处理你输入的合成算式；不访问任何论文、仓库或个人记录。检查点数据库与教学记录只写在你运行命令时所在的目录。

## 1. 环境与依赖（锁定到本次实测版本）

实测环境（2026-09-22，Windows）：CPython **3.12.4**，langgraph **1.2.12**，langchain-core **1.6.4**，langgraph-checkpoint-sqlite **3.1.1**，uv 0.6.17。安装依赖需要联网下载；mock 模式不需要任何 API 密钥、不调用网络模型。

PowerShell（Windows）：

```powershell
uv venv --python "D:\ProgramData\anaconda3\python.exe" .venv   # 或任何 Python 3.10+ 解释器
.venv\Scripts\python.exe -m pip install langgraph==1.2.12 langgraph-checkpoint-sqlite==3.1.1
```

常见终端（bash/zsh，命令相同，激活换成 `source .venv/bin/activate`）：

```bash
uv venv .venv
uv pip install --python .venv/bin/python langgraph==1.2.12 langgraph-checkpoint-sqlite==3.1.1
```

本教材只承诺上述版本组合的行为；其它大版本请按报错自行核对（LangGraph 的 interrupt/checkpoint API 在 0.x 与 1.x 之间有变动）。

## 2. 四阶段目录（预计操作而非承诺学习时长）

| 小节 | 对应单元 | 这一阶段的练习增加什么 |
|---|---|---|
| ma-u1 | phase1 | 完整工具循环；工具名/参数/除零校验；正常完成、工具错误、最大步数三种出口 |
| ma-u2 | phase2 | 同一任务第一步后中断，用 SQLite 检查点跨连接恢复；分清快照/消息历史/事件 |
| ma-u3 | phase3 | 执行者后接复核者；注入一次错误答案被退回，修改后通过；模型意见与确定性检查分开报告 |
| ma-u4 | phase4 | 复核不通过最多重试两次；重试耗尽后人工 approve/cancel；恢复不重复产生副作用 |

每个阶段用同一份代码、同一个状态结构、同一个任务；差异只在运行参数。

## 3. 完整代码（multiagent-lab.py）

无省略号、无“自行补 model_call”：mock 与 real 两种模型都实现在本文件内。

```python
# -*- coding: utf-8 -*-
"""multiagent-lab.py —— SCAFFOLD-008 多智能体架构贯通练习（教材 public/learning/multiagent-lab.md 的配套代码）。

任务：小型算术任务助手。执行者把输入转为受限加减乘除工具调用，复核者检查结果与工具证据。
默认 mock 模式：模型替身产生固定消息，但真实经过 LangGraph 节点、条件边、检查点与恢复。
可选 real 模式：经 OpenAI 兼容接口调用真实模型（需环境变量，见 --help 与教材 §real）。

只处理公开合成输入；工具禁止任意代码执行（eval 被禁用）；不访问任何用户论文、仓库或个人记录。
"""
from __future__ import annotations

import argparse
import json
import operator
import os
import sqlite3
import sys
import uuid
from typing import Any, TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

# ---------------------------------------------------------------------------
# 受限工具表：只允许加减乘除；除零在工具内拒绝。宿主执行，模型只提建议。
# ---------------------------------------------------------------------------
OPS = {
    "add": operator.add,
    "sub": operator.sub,
    "mul": operator.mul,
    "div": operator.truediv,
}


def run_tool(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """宿主侧确定性工具执行。返回结构化结果；非法工具名或参数抛 ToolError。"""
    if name not in OPS:
        raise ToolError(f"未知工具：{name}（允许：{'/'.join(OPS)}）")
    a, b = args.get("a"), args.get("b")
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise ToolError(f"参数必须是数字，收到：{args!r}")
    if name == "div" and b == 0:
        raise ToolError("除零：div 的第二个参数不能为 0")
    return {"tool": name, "a": a, "b": b, "value": OPS[name](a, b)}


class ToolError(Exception):
    pass


# ---------------------------------------------------------------------------
# 状态：任务字段即共享状态；工具结果与复核报告是共享工件；消息是通信通道。
# ---------------------------------------------------------------------------
class TaskState(TypedDict, total=False):
    request_id: str
    expression: str
    steps: int
    max_steps: int
    plan: list[dict[str, Any]]      # 执行者提出的工具调用（模型建议）
    tool_log: list[dict[str, Any]]  # 宿主执行结果（共享工件，证据）
    final_answer: Any
    review_verdict: str
    review_comment: str
    retries: int
    max_retries: int
    stop_reason: str
    injected_error: bool            # 教学用：是否注入一次错误答案


# ---------------------------------------------------------------------------
# Mock 模型替身：产生固定消息，但走与真实模型相同的节点结构。
# ---------------------------------------------------------------------------
class MockExecutor:
    """按剧本产出“模型建议”。real 模式换成真实模型调用，节点不变。"""

    def __init__(self, scenario: str):
        self.scenario = scenario
        self._idx = 0

    def propose(self, state: TaskState) -> dict[str, Any]:
        expr = state["expression"]
        a, op, b = parse_simple(expr)
        if self.scenario == "invalid_tool":
            return {"action": "tool_call", "name": "hack", "args": {"a": a, "b": b}}
        if self.scenario == "step_cap":
            # 永远只提工具调用、从不给最终答案，用来触发步数上限。
            return {"action": "tool_call", "name": "add", "args": {"a": a, "b": 0}}
        # 两步计划：先算 a<b>，再与剩余部分合并（教材任务均为二元表达式，一步即可）。
        if self._idx == 0:
            self._idx += 1
            return {"action": "tool_call", "name": op, "args": {"a": a, "b": b}}
        return {"action": "final_answer", "value": state["tool_log"][-1]["result"]["value"]}


class MockReviewer:
    """复核者：确定性重算 + 剧本化意见；模型意见与确定性检查分开报告。"""

    def __init__(self, scenario: str):
        self.scenario = scenario

    def review(self, state: TaskState) -> dict[str, Any]:
        a, op, b = parse_simple(state["expression"])
        expected = OPS[op](a, b)
        answer = state.get("final_answer")
        deterministic_ok = answer == expected
        if self.scenario == "review_retry" and state.get("injected_error"):
            opinion = "我认为答案可疑，建议重试。"
        elif self.scenario == "retry_exhaust":
            opinion = "我无法确认这个答案，始终要求重试。"
        else:
            opinion = "计算与工具证据一致。"
        return {
            "verdict": "pass" if deterministic_ok and self.scenario != "retry_exhaust" else "fail",
            "deterministic_ok": deterministic_ok,
            "expected": expected,
            "comment": opinion,
        }


def parse_simple(expr: str) -> tuple[float, str, float]:
    """把 '3 + 4 * 2' 这类简单表达式解析成 (a, op, b)；只支持单个二元运算的教学输入。"""
    for sym, name in (("+", "add"), ("-", "sub"), ("*", "mul"), ("/", "div")):
        if sym in expr:
            left, right = expr.split(sym, 1)
            return float(left.strip()), name, float(right.strip())
    raise ValueError(f"教学解析器只支持单个二元运算，收到：{expr}")


# ---------------------------------------------------------------------------
# 节点
# ---------------------------------------------------------------------------
def make_executor_node(executor_model):
    def executor_node(state: TaskState) -> dict[str, Any]:
        proposal = executor_model.propose(state)
        if proposal["action"] == "tool_call":
            # 宿主执行前先做参数与工具名校验（教材 ma-u1 的补强项）。
            record = {"request_id": state["request_id"], "proposal": proposal}
            try:
                result = run_tool(proposal["name"], proposal["args"])
            except ToolError as exc:
                return {"steps": state["steps"] + 1, "stop_reason": f"工具错误：{exc}", "tool_log": state["tool_log"] + [record]}
            record["result"] = result
            return {"steps": state["steps"] + 1, "tool_log": state["tool_log"] + [record], "stop_reason": None}
        # final_answer：复核前可做注入（教学场景）。
        value = proposal["value"]
        if state.get("injected_error"):
            value = value + 1  # 注入一次错误答案
            return {"steps": state["steps"] + 1, "final_answer": value, "injected_error": False, "stop_reason": None}
        return {"steps": state["steps"] + 1, "final_answer": value, "stop_reason": None}

    return executor_node


def route_after_executor(state: TaskState) -> str:
    if state.get("stop_reason"):
        return "end"
    if state.get("final_answer") is not None:
        return "review"
    if state["steps"] >= state["max_steps"]:
        return "cap"
    return "executor"


def make_reviewer_node(reviewer_model):
    def reviewer_node(state: TaskState) -> Command:
        report = reviewer_model.review(state)
        updates: dict[str, Any] = {
            "review_verdict": report["verdict"],
            "review_comment": (
                f"确定性检查：{'通过' if report['deterministic_ok'] else '不通过'}"
                f"（期望 {report['expected']}）；复核意见：{report['comment']}"
            ),
            "stop_reason": "复核退回，继续修改" if report["verdict"] != "pass" else "复核通过",
        }
        if report["verdict"] == "pass":
            return Command(update=updates, goto=END)
        return Command(update=updates, goto="retry_gate")

    return reviewer_node


def retry_gate_node(state: TaskState) -> Command:
    # 计数在独立节点落盘：interrupt 恢复只重跑人工门，重试计数不丢（教材 ma-u4 的重执行边界）。
    retries = state["retries"] + 1
    if retries >= state["max_retries"]:
        return Command(update={"retries": retries, "stop_reason": "重试耗尽，等待人工决定"}, goto="human_gate")
    return Command(update={"retries": retries}, goto="executor")


def human_gate_node(state: TaskState) -> Command:
    # 人工接管点。恢复时本节点会重跑：因此本节点只做只读判断 + 终止决策，不产生副作用。
    decision = interrupt({"question": "复核连续不通过；输入 approve 接受当前答案，cancel 终止任务。"})
    if decision == "approve":
        return Command(update={"stop_reason": "人工接受答案"}, goto=END)
    return Command(update={"stop_reason": "人工取消"}, goto=END)


def build_graph(executor_model, reviewer_model, checkpointer=None):
    g = StateGraph(TaskState)
    g.add_node("executor", make_executor_node(executor_model))
    g.add_node("reviewer", make_reviewer_node(reviewer_model))
    g.add_node("retry_gate", retry_gate_node)
    g.add_node("human_gate", human_gate_node)
    g.add_edge(START, "executor")
    g.add_conditional_edges("executor", route_after_executor, {"executor": "executor", "review": "reviewer", "cap": "cap_node", "end": END})
    g.add_node("cap_node", lambda state: {"stop_reason": f"达到步数上限 {state['max_steps']}"} | {})
    g.add_edge("cap_node", END)
    return g.compile(checkpointer=checkpointer)


# ---------------------------------------------------------------------------
# 教学记录
# ---------------------------------------------------------------------------
def emit_record(handle, phase: str, state: TaskState) -> None:
    record = {
        "phase": phase,
        "request_id": state["request_id"],
        "expression": state["expression"],
        "steps": state["steps"],
        "tool_results": [e.get("result") for e in state["tool_log"]],
        "final_answer": state.get("final_answer"),
        "review": {"verdict": state.get("review_verdict"), "comment": state.get("review_comment")},
        "retries": state["retries"],
        "stop_reason": state.get("stop_reason"),
    }
    handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    handle.flush()


# ---------------------------------------------------------------------------
# 四个阶段
# ---------------------------------------------------------------------------
def fresh_state(expression: str, scenario: str, max_steps: int = 6, max_retries: int = 2) -> TaskState:
    return TaskState(
        request_id=str(uuid.uuid4()),
        expression=expression,
        steps=0,
        max_steps=max_steps,
        tool_log=[],
        retries=0,
        max_retries=max_retries,
        injected_error=(scenario == "review_retry"),
    )


def phase1(scenario: str, out) -> None:
    graph = build_graph(MockExecutor(scenario), MockReviewer(scenario))
    state = graph.invoke(fresh_state("3 + 4", scenario))
    emit_record(out, "ma-u1", state)
    print(f"[ma-u1:{scenario}] stop_reason={state.get('stop_reason')} steps={state['steps']} log={len(state['tool_log'])}")


def phase2(db_path: str, out) -> None:
    """同一任务运行中断，用 SQLite 检查点跨进程恢复。恢复从检查点边界开始，中断节点可能重跑。"""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    saver = SqliteSaver(conn)
    thread_id = "lab-recover-1"
    cfg = {"configurable": {"thread_id": thread_id}}
    # 第一次运行：模拟在复核前被 Ctrl+C。教材用 crash_before_review 标记中断点。
    graph = build_graph(MockExecutor("normal"), MockReviewer("normal"), checkpointer=saver)
    partial = fresh_state("6 / 2", "normal")
    interrupted = None
    for event in graph.stream(partial, cfg, stream_mode="values"):
        interrupted = event
        if event.get("steps", 0) >= 1:
            break  # 模拟在第一步后中断（等效 Ctrl+C / 进程被杀）
    print(f"[ma-u2:中断点] steps={interrupted['steps']} final_answer={interrupted.get('final_answer')} stop_reason={interrupted.get('stop_reason')}")
    conn.close()

    # 新进程恢复（此处同进程重连，语义相同：检查点在磁盘上）。
    conn2 = sqlite3.connect(db_path, check_same_thread=False)
    saver2 = SqliteSaver(conn2)
    graph2 = build_graph(MockExecutor("normal"), MockReviewer("normal"), checkpointer=saver2)
    state = graph2.invoke(None, cfg)
    conn2.close()
    emit_record(out, "ma-u2", state)
    print(f"[ma-u2:恢复后] stop_reason={state.get('stop_reason')} steps={state['steps']} answer={state.get('final_answer')}")


def phase3(out) -> None:
    graph = build_graph(MockExecutor("review_retry"), MockReviewer("review_retry"))
    state = graph.invoke(fresh_state("3 * 4", "review_retry"))
    emit_record(out, "ma-u3", state)
    print(f"[ma-u3] stop_reason={state.get('stop_reason')} retries={state['retries']} answer={state.get('final_answer')}")


def phase4(decision: str, db_path: str, out) -> None:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    saver = SqliteSaver(conn)
    thread_id = f"lab-retry-{decision}"
    cfg = {"configurable": {"thread_id": thread_id}}
    graph = build_graph(MockExecutor("retry_exhaust"), MockReviewer("retry_exhaust"), checkpointer=saver)
    try:
        graph.invoke(fresh_state("5 - 2", "retry_exhaust"), cfg)
    except Exception as exc:  # interrupt 以特殊异常挂起，教材流程用 resume 继续
        pass
    state = graph.invoke(Command(resume=decision), cfg)
    conn.close()
    emit_record(out, "ma-u4", state)
    print(f"[ma-u4:{decision}] stop_reason={state.get('stop_reason')} retries={state['retries']}")


def real_mode(expression: str) -> None:
    """可选真实 API 模式：未提供凭据时只打印运行条件，不编造结果。"""
    if not os.environ.get("OPENAI_API_KEY"):
        print("real 模式需要环境变量 OPENAI_API_KEY；未提供凭据，本次只显示运行条件，不编造真实模型结果。")
        print("需要：pip install langchain-openai；EXECUTOR_MODEL / REVIEWER_MODEL（缺省 gpt-4o-mini）；网络可达；按 token 计费。")
        return
    from langchain_openai import ChatOpenAI

    executor_llm = ChatOpenAI(model=os.environ.get("EXECUTOR_MODEL", "gpt-4o-mini"), timeout=30)
    reviewer_llm = ChatOpenAI(model=os.environ.get("REVIEWER_MODEL", "gpt-4o-mini"), timeout=30)

    class RealExecutor(MockExecutor):
        def propose(self, state: TaskState):
            prompt = (
                "你是算术执行者。只使用工具 add/sub/mul/div（参数 a、b 为数字），"
                "先调用工具计算表达式 " + state["expression"] +
                "，然后在下一步给出 final_answer。当前工具记录：" + json.dumps(state["tool_log"], ensure_ascii=False)
            )
            resp = executor_llm.invoke(prompt)
            return json.loads(resp.content)

    class RealReviewer(MockReviewer):
        def review(self, state: TaskState):
            a, op, b = parse_simple(state["expression"])
            expected = OPS[op](a, b)
            prompt = (
                "你是复核者。确定性期望值为 " + str(expected) +
                "；执行者答案为 " + str(state.get("final_answer")) +
                "；工具记录：" + json.dumps(state["tool_log"], ensure_ascii=False) +
                "。只输出 JSON：{\"verdict\": \"pass\"|\"fail\", \"comment\": \"...\"}"
            )
            resp = reviewer_llm.invoke(prompt)
            data = json.loads(resp.content)
            return {"verdict": data["verdict"], "deterministic_ok": state.get("final_answer") == expected, "expected": expected, "comment": data["comment"]}

    graph = build_graph(RealExecutor("normal"), RealReviewer("normal"))
    state = graph.invoke(fresh_state(expression, "normal"))
    usage = "未知（当前客户端未返回 usage）"
    print(f"[real] stop_reason={state.get('stop_reason')} answer={state.get('final_answer')} usage={usage}")


def main() -> None:
    parser = argparse.ArgumentParser(description="SCAFFOLD-008 多智能体架构贯通练习（mock 默认，不需要密钥）")
    parser.add_argument("phase", choices=["phase1", "phase2", "phase3", "phase4", "real"])
    parser.add_argument("--scenario", default="normal", choices=["normal", "invalid_tool", "step_cap"])
    parser.add_argument("--decision", default="cancel", choices=["approve", "cancel"])
    parser.add_argument("--expression", default="3 + 4")
    parser.add_argument("--db", default="lab_checkpoints.sqlite")
    parser.add_argument("--record", default="lab_records.jsonl")
    args = parser.parse_args()

    out = open(args.record, "a", encoding="utf-8")
    try:
        if args.phase == "phase1":
            phase1(args.scenario, out)
        elif args.phase == "phase2":
            phase2(args.db, out)
        elif args.phase == "phase3":
            phase3(out)
        elif args.phase == "phase4":
            phase4(args.decision, args.db, out)
        elif args.phase == "real":
            real_mode(args.expression)
    finally:
        out.close()


if __name__ == "__main__":
    main()

```

## 4. mock 模式与 real 模式

- 默认 mock：模型替身产生固定消息，但**真实经过** LangGraph 的节点、条件边、检查点与恢复；不需要密钥、不调用网络。mock 只能证明教材的代码路径可用，**不能**用来证明任何模型能力。
- 可选 real：安装 `langchain-openai`，设置环境变量 `OPENAI_API_KEY`（以及可选的 `EXECUTOR_MODEL` / `REVIEWER_MODEL`，缺省 `gpt-4o-mini`），超时 30 秒。密钥只从环境读，不要写进代码或日志。未提供凭据时运行 `real` 只打印运行条件，不编造真实模型结果。usage 若客户端未返回则记“未知”，不编造 token/价格；mock 的成本记“不适用”。

## 5. 七类运行检查（2026-09-22 实测输出）

在独立练习目录依次执行（`PY` 为你的解释器路径）：

```bash
$PY multiagent-lab.py phase1 --scenario normal
[ma-u1:normal] stop_reason=复核通过 steps=2 log=1

$PY multiagent-lab.py phase1 --scenario invalid_tool
[ma-u1:invalid_tool] stop_reason=工具错误：未知工具：hack（允许：add/sub/mul/div） steps=1 log=1

$PY multiagent-lab.py phase1 --scenario step_cap
[ma-u1:step_cap] stop_reason=达到步数上限 6 steps=6 log=6

$PY multiagent-lab.py phase2
[ma-u2:中断点] steps=1 final_answer=None stop_reason=None
[ma-u2:恢复后] stop_reason=复核通过 steps=3 answer=3.0

$PY multiagent-lab.py phase3
[ma-u3] stop_reason=复核通过 retries=1 answer=12.0

$PY multiagent-lab.py phase4 --decision cancel
[ma-u4:cancel] stop_reason=人工取消 retries=2

$PY multiagent-lab.py phase4 --decision approve
[ma-u4:approve] stop_reason=人工接受答案 retries=2

$PY multiagent-lab.py real        # 无凭据时只打印运行条件
real 模式需要环境变量 OPENAI_API_KEY；未提供凭据，本次只显示运行条件，不编造真实模型结果。
```

七类检查覆盖：正常任务、非法工具、步数上限、磁盘恢复（中断点 steps=1 → 恢复后复核通过）、复核退回再通过（retries=1）、重试耗尽后人工取消、人工接受。每条运行追加一行 JSON 教学记录（阶段、输入、工具结果、复核报告、停止原因）到 `lab_records.jsonl`；检查点写 `lab_checkpoints.sqlite`，两个文件都在运行目录内，删除目录即清空全部痕迹。

## 6. 检查点与恢复的语义边界（重要）

- 恢复从**检查点边界**开始：被中断的**节点会从头重跑**（LangGraph 的节点重执行边界），不是从断行续跑。因此：重试计数放在独立的 `retry_gate` 节点落盘；`human_gate` 只做只读判断与终止决策——恢复重跑它们不会重复计数或重复副作用。
- 如果练习要演示“写入”类副作用（本教材未演示），必须用 `request_id` 去重，**不能**因为“用了框架”就承诺恰好一次执行。
- `InMemorySaver` 重启即丢失；跨进程恢复用 SQLite 检查点（本教材 ma-u2）。快照、消息历史与事件不是同一物。

## 7. 通信、共享状态与工件的区分（对照 ma-u3/ma-u4）

同一份代码里三者各有落点：执行者→复核者的请求与反馈是**消息**（状态里的 plan/verdict 字段）；任务字段（expression、retries）是**共享状态**；工具结果与复核报告是**共享工件**（tool_log/review_comment，留在状态里供复盘）。这只是在**同一运行时**内的机制；另一个工具里的 Agent 看不到这些内存与检查点——跨 harness 时要显式决定复制哪些已公开字段，本教材不比较通道胜负。

## 8. 不要把练习读成研究结论

两个角色不保证优于一个 Agent；本例没有跨公司 harness，不验证 Handoff Tax/Debt 的任何结果，也不验证结构化状态优于自由文档。练习只证明：带校验的工具循环、磁盘检查点恢复、复核回路、有界重试与人工接管这些**机制**可以被你亲手跑通。
