# Vectorless RAG (PageIndex Architecture)

## 📌 The Core Concept

A revolutionary approach to Retrieval-Augmented Generation that **completely eliminates chunking pipelines and Vector Databases** (no Pinecone, no Chroma, no FAISS). Instead of arbitrarily breaking documents into chunks based on token limits and relying on blind mathematical similarity for retrieval, it parses the document to understand its semantic layout and preserves it as a **Hierarchical JSON Tree Index**.

---

## 🛠️ The "Tank-Proof" Architecture

This project implements a highly resilient, enterprise-grade LLM orchestration layer designed for absolute reliability.

### 🛡️ Smart Failover & Recovery
- **Multi-Cloud Orchestration**: Automatically failover between **Groq (Llama 3.3/3.1)** and **Google Gemini (2.5/2.0 Flash)**.
- **Intelligent Backoff**: Built-in 5x retry logic with incremental wait times (2s, 4s, 6s) to handle API Rate Limits (429) and Service Demand Spikes (503) without crashing.
- **Dynamic Model Discovery**: The system automatically scans your `.env` and only activates models you have keys for, prioritizing the fastest and most cost-effective "Free Tier" models first.

---

## 🏗️ How It Works (PageIndex Implementation)

### Phase 1: Neural Ingest
1. **Extraction**: Uses **PyMuPDF** for ultra-fast, page-aware text extraction.
2. **LLM Indexing**: The engine builds a structured JSON tree containing `node_id`, `title`, concise `summary`, and `page_mapping` for every logical section.
3. **Zero-Embedding Storage**: The index is stored as a tiny JSON file (~2-5 KB). **No Vector embeddings are needed.**

### Phase 2: Agentic Query
1. **Semantic Navigation**: The LLM scans the section summaries (the "Table of Contents") to identify intent.
2. **Precision Retrieval**: Only the exact pages needed are pulled into context.
3. **Contextual Answer**: Generates responses with **exact page citations** (e.g., "See page 42, section 3.2").

---

## 🔥 Key Advantages Over Traditional RAG

| Feature | Traditional RAG (Vector) | Vectorless RAG (PageIndex) |
| :--- | :--- | :--- |
| **Logic** | Keyword/Mathematical Similarity | Semantic Intent Reasoning |
| **Accuracy** | Blind "Top-K" chunks | Surgical Page Retrieval |
| **Infrastructure** | Complex Vector DBs | Simple JSON Mapping |
| **Traceability** | Confetti-like fragments | Explicit Page & Section Citations |
| **Cost** | Expensive Embedding APIs | Token-Light Indexing (~$0.01/100 pgs) |

---

## 🚀 Setup & Execution

### 1. Requirements
- Python 3.10+
- Node.js 18+

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# AI Providers
GROQ_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

# Optional: Persistence
NEO4J_URI=...
NEO4J_USER=...
NEO4J_PASSWORD=...
```

### 3. Installation & Start
**Backend:**
```bash
# Install dependencies
pip install fastapi uvicorn litellm pypdf python-dotenv google-generativeai

# Run server
python fastapi_server.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Access
- **Dashboard**: [http://localhost:5173](http://localhost:5173)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚡ Supported Models (Free-Tier Optimized)
- **Primary**: `groq/llama-3.3-70b-versatile`
- **High-Speed**: `groq/llama-3.1-8b-instant`
- **Fallback**: `gemini/gemini-2.5-flash`, `gemini/gemini-2.0-flash`

---

## 👤 Credits
Created as a professional-grade demonstration of **Vectorless Retrieval Architectures**.
Developed by **Siddharth** & Antigravity (Advanced AI Coding Assistant).
