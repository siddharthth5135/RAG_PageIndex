import json
import os
import re
from src.agent.llm_provider import smart_completion

async def execute_tree_query(query: str, doc_name: str, model_name: str):
    # Load Tree
    tree_path = f"./results/tree_indices/{doc_name}.json"
    if not os.path.exists(tree_path):
        raise ValueError(f"Tree index for {doc_name} not found.")

    with open(tree_path, "r", encoding="utf-8") as f:
        tree_json = json.load(f)

    # 1. Ask LLM to determine nodes
    selection_prompt = f"""You are navigating a document tree.
USER QUERY: "{query}"

TREE INDEX:
{json.dumps(tree_json, indent=2)}

Return ONLY a JSON array of the most relevant `node_id` strings to answer the query. For example: ["0001", "0005"]
Do not add any explanation or backticks.
"""

    response_sel = await smart_completion(
        model=model_name,
        messages=[{"role": "user", "content": selection_prompt}],
        temperature=0.1
    )
    
    sel_content = response_sel.choices[0].message.content.strip()
    # clean json
    sel_content = sel_content.replace('```json', '').replace('```', '').strip()
    
    try:
        node_ids = json.loads(sel_content)
    except Exception as e:
        node_ids = []

    # 2. Extract specific pages using the selected node IDs
    raw_pages_path = f"./results/raw_pages/{doc_name}.json"
    selected_pages_text = ""

    if os.path.exists(raw_pages_path) and node_ids:
        with open(raw_pages_path, "r", encoding="utf-8") as f:
            raw_pages = json.load(f)
        
        pages_to_fetch = set()
        def find_nodes(node_list):
            for n in node_list:
                if isinstance(n, dict):
                    if n.get("node_id") in node_ids:
                        start = n.get("start_page", n.get("start_index", 1))
                        end = n.get("end_page", n.get("end_index", start))
                        for p in range(int(start), int(end) + 1):
                            pages_to_fetch.add(str(p))
                    if "sub_nodes" in n:
                        find_nodes(n["sub_nodes"])

        if isinstance(tree_json, dict) and "sub_nodes" in tree_json:
            find_nodes([tree_json])
        elif isinstance(tree_json, list):
            find_nodes(tree_json)

        for p in pages_to_fetch:
            if str(p) in raw_pages:
               selected_pages_text += f"\n--- Page {p} ---\n{raw_pages[str(p)]}\n"
    
    # 3. Generate answer
    if not selected_pages_text:
        return "I couldn't find relevant sections to answer your query."

    answer_prompt = f"""You are a helpful assistant. Use ONLY the following text passages from the document to answer the user's question. 
Always cite the page numbers in your answer (e.g. "On page X...").

PASSAGES:
{selected_pages_text}

USER QUESTION: {query}
"""

    response_ans = await smart_completion(
        model=model_name,
        messages=[{"role": "user", "content": answer_prompt}],
        temperature=0.3
    )

    return {
        "answer": response_ans.choices[0].message.content,
        "node_ids": node_ids
    }
