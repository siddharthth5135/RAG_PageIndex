import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil

# Import existing backend modules
from src.document_parser.page_index_md import md_to_tree
from src.document_parser.parser_utils import ConfigLoader
from src.database.db_utils import AsyncLiteLLMClient
from src.agent.retriever import TracingNeo4jRetriever

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
    model: str = "ollama/qwen2.5-coder:7b"

@app.post("/upload")
def upload_document(file: UploadFile = File(...), model: str = Form("ollama/qwen2.5-coder:7b")):
    try:
        file_loc = f"./uploads/{file.filename}"
        with open(file_loc, "wb+") as f:
            shutil.copyfileobj(file.file, f)
            
        doc_id = os.path.splitext(file.filename)[0]
        output_file = f"./results/{doc_id}_structure.json"
        
        # 1. Parse Document to Tree based on extension
        is_pdf = file_loc.lower().endswith('.pdf')
        toc = {}
        
        if is_pdf:
            from src.document_parser.page_index import page_index_main, config
            pdf_opt = config(
                model=model,
                toc_check_page_num=20,
                max_page_num_each_node=10,
                max_token_num_each_node=20000,
                if_add_node_id='yes',
                if_add_node_summary='yes',
                if_add_doc_description='no',
                if_add_node_text='no'
            )
            toc = page_index_main(file_loc, pdf_opt)
        else:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            toc = loop.run_until_complete(md_to_tree(
                md_path=file_loc,
                if_thinning=False,
                min_token_threshold=5000,
                if_add_node_summary="yes",
                summary_token_threshold=200,
                model=model,
                if_add_doc_description="no",
                if_add_node_text="no",
                if_add_node_id="yes"
            ))
        
        if not toc or not isinstance(toc, dict):
            raise Exception("Parsing complete but the LLM failed to generate a valid structural tree.")

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(toc, f, indent=2, ensure_ascii=False)
            
        # 2. Ingest to Neo4j (Optional - Standalone mode uses JSON directly)
        # ingest_json(output_file)
        
        # Extract the flat nodes list for frontend render
        nodes = []
        edges = []
        
        def traverse(node_data, parent_idx=None):
            my_idx = len(nodes)
            cur_id = node_data.get('node_id') or node_data.get('id') or str(my_idx)
            nodes.append({
                "id": my_idx,
                "real_id": cur_id,
                "label": node_data.get('title', 'Untitled'),
                "level": node_data.get('page_number', 0) if isinstance(node_data.get('page_number'), int) else 0,
                "summary": node_data.get('summary', '')
            })
            if parent_idx is not None:
                edges.append({"source": parent_idx, "target": my_idx})
                
            # Fallback for both naming conventions
            children = node_data.get('nodes') or node_data.get('sub_sections') or []
            for child in children:
                traverse(child, my_idx)
                
        if toc.get('structure'):
            traverse({"title": f"{doc_id}.pdf", "node_id": "0000", "nodes": toc['structure']})
        else:
            # Check if toc itself is the list (older parser behavior)
            if isinstance(toc, list):
                for item in toc:
                    traverse(item)
            else:
                traverse({"title": "Root Document (Structure Empty)", "id": "0000"})
        
        return {
            "status": "success",
            "doc_name": doc_id,
            "graph": {"nodes": nodes, "edges": edges}
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Tree Generation Error: {str(e)}",
            "graph": None
        }




@app.post("/query")
async def execute_query(req: QueryRequest):
    retriever = TracingNeo4jRetriever(doc_name=req.doc_name, model_name=req.model)
    try:
        result = await retriever.retrieve_with_trace(req.query)
        return {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        await retriever.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
