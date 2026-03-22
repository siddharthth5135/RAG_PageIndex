# 🌌 NEURAL NEXUS: PREMIER VECTORLESS RAG ARCHITECTURE

## 1. Project Overview
**Neural Nexus** is a world-class **Vectorless RAG** system that redefines how LLMs interact with long, complex documents. Unlike traditional RAG systems that "flatten" a PDF into thousands of random chunks, Neural Nexus builds a **Hierarchical Intelligence Graph**.

### The Innovation:
Instead of "searching" for words, the agent **Explores** your document. It starts at the top (The Table of Contents), reasons about which chapter is relevant, and "drills down" into the exact section needed to answer a query. 

---

## 2. Dynamic Logic (Backend Side)

### 📂 File-by-File Explanation:
1.  **`fastapi_server.py`**:
    *   **The Hub**: This is your server entry point. It manages the communication between your "Neural" Frontend and the RAG logic. 
    *   **Task Management**: When you upload a file, it delegates the work to the Parser and stores the final "Document Graph" in your local `/results` folder.
2.  **`src/document_parser/page_index.py`**:
    *   **The Architect**: This is arguably the most complex part of the project. It uses the LLM to analyze the structure of the PDF.
    *   **TOC Mapping**: It identifies chapters and maps them to physical page numbers using a proprietary "Index Extractor" technique.
    *   **Verification**: It performs a cross-check to make sure the "Tree" it built matches the actual PDF content (Accuracy Verification).
3.  **`src/agent/retriever.py`**:
    *   **The Explorer (Agent)**: This is where the "RAG Magic" happens. It uses a **Recursive Traversal Algorithm**.
    *   **The Reasoning Loop**: For every query, it asks the LLM: *"Which branch of this knowledge tree should we walk down next?"*
    *   **UI Tracing**: It emits real-time "Steps" (Eval, Chosen, Found) that my Frontend uses to animate the graph.
4.  **`src/database/db_utils.py`**:
    *   **The Unified API**: It abstracts away the Ollama Complexity. It’s tuned for **Qwen 2.5 Coding 7B**, ensuring fast, reliable JSON generation.

---

## 3. How to Run the Project (Commands)

### Step 1: Initialize the Brain (Ollama)
Pull the high-performance model for reasoning:
```bash
ollama pull qwen2.5-coder:7b
```

### Step 2: Fire up the Backend
```bash
uv run python fastapi_server.py
```
*Port: 8000*

### Step 3: Launch the Neural Dashboard
```bash
cd frontend
npm install
npm run dev
```
*Port: 5173* (Visual result will appear here)

---

## 4. Why this is the #1 RAG System?
*   **Contextual Integrity**: By using the document's own structure, we never lose context of which chapter a "chunk" belongs to.
*   **Speed**: No heavy Neo4j database. Pure, local JSON file traversal.
*   **Visual Reasoning**: You see exactly what the AI is thinking. 

**Welcome to the New Era of Document Intelligence.**
