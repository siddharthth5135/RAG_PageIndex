# Vectorless RAG (PageIndex Architecture)

## 📌 The Core Concept

A revolutionary approach to Retrieval-Augmented Generation that **completely eliminates chunking pipelines and Vector Databases** (no Pinecone, no Chroma, no FAISS). Instead of arbitrarily breaking documents into chunks based on token limits and relying on blind mathematical similarity for retrieval, it parses the document to understand its semantic layout and preserves it as a **Hierarchical JSON Tree Index**.

---

## 🛠️ How It Was Implemented

We completely stripped down the legacy backend. The old chunking scripts, complex graph retrievers, and deep dependencies have been eliminated and replaced with a highly efficient, two-phase PageIndex architecture.

### Phase 1: Ingest (Run once per document)
Handled by `src/document_parser/tree_indexer.py`.
1. **Extraction**: We use **PyMuPDF** to accurately and quickly extract raw text from PDFs on a strict page-by-page basis.
2. **LLM Tree Generation**: The extracted text is injected into a single prompt. The LLM reads all the pages and returns a structured JSON tree containing `node_id`, `title`, concise `summary`, `start_page`, and `end_page` for every logical section and subsection.
3. **Storage**: The tiny JSON Tree (~2-5 KB) and the raw, un-chunked pages are cleanly stored as basic JSON logs. **No Vector embeddings are generated.**

### Phase 2: Query (Runs on every user question)
Handled by `src/agent/tree_agent.py`.
1. **Tree Scanning**: When a user asks a question, the LLM is given the entire JSON Tree (the Table of Contents mapping). It contextually reasons about which sections are relevant—like a human scanning a textbook's index.
2. **Surgical Selection**: The LLM outputs an array of exact `node_id`s that target the specific information intent.
3. **Raw Page Injection**: The engine fetches the explicit raw pages mapped to those `node_id`s (usually just 2-4 pages).
4. **Answer & Cite**: The LLM constructs a final response using *only* those retrieved pages, providing explicit tracking of what section and page the answer came from.

### The REST Interface
- **FastAPI Integration** (`fastapi_server.py`): Delivers the capabilities over clean `/upload` and `/query` endpoints, and streams the tree parsing generation in real-time so the frontend can visualize it beautifully using Three.js logic.

---

## 🔥 Why This Is Vastly Superior to Traditional RAG

### 1. Intent vs. Similarity (Accuracy)
Traditional Vector RAG relies squarely on keyword/vector mathematical overlap. If a user asks a nuanced question structured completely differently than the document text, vector search fails. 
**Vectorless RAG** uses an LLM to browse the *summaries* of sections. The LLM understands query intent and can surgically isolate where the answer lives even if vocabulary differs.

### 2. Traceability and True Citations
When Vector RAG pulls arbitrary chunks, reconstructing the true context is like piecing together confetti. 
**Vectorless RAG** retrieves whole logical pages mapped to a specific subnode. Every generated answer cites the exact semantic section and page range. Zero black-box magic, full audit trail.

### 3. Contextual Cross-Referencing
Vector RAG cannot follow internal document logic. If a text chunk says *"Refer to Appendix G for deferred asset metrics,"* vector search hits a dead-end. 
**Vectorless RAG** behaves agentically: the LLM identifies the reference, navigates the tree to find Appendix G, fetches those pages, and completes the logical jump.

### 4. Zero Vector Infrastructure 
Forget setting up complex, expensive ingestion pipelines to a hosted vector database. No tuning chunk sizes, no chunk overlap hacks. The "database" is entirely just a localized JSON string and a file map.

### 5. Massive Cost Reduction
Vector pipelines run up crazy embedding API costs and burn massive amounts of context stuffed with top-K chunks that might not even contain the answer. 
With Vectorless RAG, the tree is incredibly token-light (~1-3k tokens). The indexing prompt runs once (~$0.01 for 100 pages). It guarantees surgical context payloads on every query.

---

## 🚀 Tech Stack

*   **Backend**: Python, FastAPI, PyMuPDF, LiteLLM (Supporting completely local LLMs like Qwen2.5-Coder via Ollama).
*   **Frontend**: React, Vite, Three.js (For real-time 3D rendering of the hierarchical tree visualization), GSAP.
