# Agentic Workflow Rules

The agents in this environment must structure and execute their workflows end-to-end according to the following query optimization and execution stages:

## 1. Parsing the Workflow
*   **Domain-Specific Language (DSL):** Represent workflows using a clean template structure.
*   **DAG Construction:** Translate the workflow into a Directed Acyclic Graph (DAG), where nodes (operators) represent prompt-related actions, tool invocations, or data transformations, and edges represent the flow of data.
*   **Placeholders:** Mark inputs with symbolic placeholders to compile the graph and bind it to specific datasets before execution.

## 2. Logical Plan Optimization
Before executing workflows, rewrite the logical plan to eliminate redundancies:
*   **Operator Pruning:** Prune unused speculative branches or operators that do not contribute to final outputs.
*   **Common Subgraph Elimination (CSE):** Detect and merge structurally identical subgraphs to compute duplicate tasks only once.
*   **Prompt Cache Substitution:** Substitute deterministic operators with lightweight `CacheFetch` operations if inputs match existing cached records.

## 3. Execution Planning and Processing
Maximize execution and hardware efficiency:
*   **Templated Radix Tree (TRT):** Map prompt prefix structures to identify static templates and shared dependencies.
*   **Cache-Aware Scheduling:** Assign tasks to LLM workers to maximize KV-cache reuse.
*   **Proactive Cache Management:** Precompute static prompt prefixes and store KV-caches upfront.

## 4. Architectural Patterns
Apply appropriate structural patterns based on the task:
*   **Plan-and-Execute:** Use a Planner to stream task DAGs, Executors to handle tasks, and a Joiner to loop/replan if needed.
*   **Routing & Parallelization:** Dispatcher routes inputs to specialized sub-agents running concurrently, synthesized by an aggregator.
*   **State Machine Loops:** For rigorous environments, operate on the loop: **Sense** (read state) -> **Decide** (transition/select tool) -> **Update** (execute tool and log).

---

# Advanced Agent Capabilities and Architecture

To build advanced, production-ready systems, agents must have the following capabilities:

## 1. Unified and Agentic Memory Management
Agents must use specialized memory management to manage short-term and long-term memory autonomously:
*   **Long-Term Memory (LTM):** Autonomously decide what knowledge is valuable enough to persist across sessions by invoking explicit tools to `ADD`, `UPDATE`, or `DELETE` records in an external store.
*   **Short-Term Memory (STM):** Actively manage active context using tools to `RETRIEVE` relevant facts, `FILTER` out distracting information, and `SUMMARY` past conversation turns to avoid context window bloat and noise.

## 2. Advanced Orchestration and Execution Graphs
Use optimized execution graphs to improve speed and reduce costs:
*   **ReWOO (Reasoning WithOut Observations):** Generate a complete plan upfront and use variable assignments (e.g., passing the output of Step 1 directly into Step 2) so that worker nodes can execute tasks without repeatedly calling the LLM for new instructions.
*   **LLMCompiler:** Stream a DAG of tasks and run them in parallel via a task-fetching unit as soon as their dependencies are met.

## 3. Stateful and Physically Grounded Constraints
For complex, rigorous domains, build on Finite State Machine (FSM) architectures:
*   **Strongly Typed Global State:** Maintain a persistent, strongly typed data model rather than letting the agent's progress live implicitly in unstructured chat history.
*   **Enforceable Physical Admissibility:** Strictly type tool interfaces to enforce valid constraints at the boundary, ensuring no syntactically valid but physically/conceptually impossible parameters are generated.

## 4. Multi-Agent Collaboration Patterns
Compose specialized sub-agents to synthesize complex outputs:
*   **Routing and Dispatch:** A primary router agent classifies tasks and delegates them to specialized workers.
*   **Parallel Chains & Map-Reduce:** Multiple expert agents work concurrently on different data chunks, and a "joiner" or aggregator agent synthesizes their findings.
*   **Evaluator-Optimizer (Debate):** Pit a "Generator" agent and a "Critic" agent against one another in a reflect-and-refine loop to continuously critique and correct work before returning a final answer.

## 5. Durable Execution for Reliability
Back long-running or multi-step agent workflows with Durable Execution Engines:
*   Journal every executed step, tool call, and state change.
*   Upon recovery from a crash, replay history and resume from the exact point of failure to prevent "retry storms" or duplicate tool execution.

## 6. Mandatory Function Calling for Factuality
To prevent hallucinations in conversational or Live API contexts, strictly enforce that the agent cannot advance to the next conversational step or answer the user until it has successfully executed required external API calls to fetch real-time, verified data.

## 7. Proactive System-Level Optimization
At the infrastructure layer, treat agent prompts as query plans, analyzing the DAG of the multi-agent workflow to pre-compute and proactively cache KV states for shared templates and context.

---

# Styling Rules

## 1. No Tailwind CSS
This project does NOT have Tailwind CSS installed or configured. 
*   **Always use inline styles** (`style={{...}}`) or custom CSS within `<style>` blocks.
*   **Do NOT reach for `className`** with Tailwind utility classes (e.g. `flex-1`, `md:hidden`, `overflow-x-auto`) because they will not render and will cause styling regressions.
