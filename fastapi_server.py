import os
import json
import asyncio
import threading
import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

# Load Environment
load_dotenv()

# Import Project Modules
from src.document_parser.tree_indexer import build_tree_index
from src.agent.tree_agent import execute_tree_query
from src.agent.llm_provider import DEFAULT_FALLBACKS

# ABSOLUTE DEFAULT: Use Groq if available, otherwise Gemini Flash
SYSTEM_DEFAULT_MODEL = DEFAULT_FALLBACKS[0] if DEFAULT_FALLBACKS else "groq/llama-3.3-70b-versatile"

app = FastAPI(title="Vectorless RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("./results", exist_ok=True)
os.makedirs("./uploads", exist_ok=True)

class QueryRequest(BaseModel):
    query: str
    doc_name: str
    model: str = SYSTEM_DEFAULT_MODEL

class StreamLogger:
    def __init__(self, callback):
        self.callback = callback
    def info(self, msg):
        if isinstance(msg, dict): msg = json.dumps(msg)
        self.callback(f"LOG:{msg}")
    def error(self, msg):
        self.callback(f"ERR:{msg}")

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    model: str = Form(SYSTEM_DEFAULT_MODEL)
):
    file_loc = f"./uploads/{file.filename}"
    with open(file_loc, "wb+") as f:
        shutil.copyfileobj(file.file, f)
    
    doc_id = os.path.splitext(file.filename)[0]
    
    async def stream_generator():
        q = asyncio.Queue()
        loop = asyncio.get_event_loop()
        def log_callback(msg): loop.call_soon_threadsafe(q.put_nowait, msg)

        def run_parser():
            try:
                s_logger = StreamLogger(log_callback)
                s_logger.info("CORE_ENGINE_START: Initializing Neural Parser Phase 1...")
                
                async def build():
                    # The smart_completion internally overrides 'model' to prioritize Groq
                    return await build_tree_index(file_loc, model, doc_id, logger=s_logger)
                
                tree_json = asyncio.run(build())
                
                nodes = []
                edges = []
                def traverse(node_list, parent_idx=None):
                    for node_data in node_list:
                        if not isinstance(node_data, dict): continue
                        my_idx = len(nodes)
                        cur_id = node_data.get('node_id', str(my_idx))
                        nodes.append({
                            "id": my_idx, 
                            "real_id": cur_id, 
                            "label": node_data.get('title', 'Untitled'), 
                            "level": node_data.get('start_page', 0), 
                            "summary": node_data.get('summary', '')
                        })
                        if parent_idx is not None: edges.append({"source": parent_idx, "target": my_idx})
                        if "sub_nodes" in node_data: traverse(node_data["sub_nodes"], my_idx)

                if isinstance(tree_json, dict):
                    if "sub_nodes" in tree_json: traverse([tree_json])
                    else: traverse([{"title": f"{doc_id}.pdf", "node_id": "0000", "sub_nodes": tree_json}])
                elif isinstance(tree_json, list): traverse(tree_json)

                final_data = {"status": "success", "doc_name": doc_id, "graph": {"nodes": nodes, "edges": edges}}
                log_callback(f"FINAL:{json.dumps(final_data)}")
                log_callback("DONE:SUCCESS")
            except Exception as e:
                log_callback(f"ERR:CORE_EXCEPTION: {str(e)}")
                log_callback("DONE:ERROR")

        threading.Thread(target=run_parser).start()
        while True:
            msg = await q.get()
            yield f"data: {msg}\n\n"
            if msg.startswith("DONE:"): break

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@app.post("/query")
async def execute_query(req: QueryRequest):
    try:
        # The smart_completion internally overrides 'model' to prioritize Groq
        result = await execute_tree_query(req.query, req.doc_name, req.model)
        return {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
