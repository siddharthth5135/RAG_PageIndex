import json
import os
import re
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from src.database.db_utils import AsyncLiteLLMClient

SYSTEM_PROMPT = """You are an intelligent knowledge agent designed to reason over a document's hierarchical structure.
Given a user query and a list of sections, determine which sections MIGHT contain the answer.
Respond ONLY with a JSON list of node IDs. Keep it precise.
If none are relevant, return []."""

class StandaloneRetriever:
    def __init__(self, doc_name: str, model_name: str = "ollama/qwen2.5-coder:7b", logger=None):
        self.doc_name = doc_name
        self.model_name = model_name
        self.llm_client = AsyncLiteLLMClient(model_name=model_name)
        self.logger = logger
        self.structure = self._load_structure()

    def _load_structure(self):
        base = os.path.splitext(self.doc_name)[0]
        paths = [f"./results/{base}_structure.json", f"./results/{self.doc_name}_structure.json"]
        for p in paths:
            if os.path.exists(p):
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('structure', data)
        return []

    async def ask_llm_for_relevant_nodes(self, query: str, sections: List[Dict]) -> List[str]:
        if not sections: return []
        text = "\n".join([f"- ID: {s.get('node_id', s.get('id'))} | Title: {s.get('title')}" for s in sections])
        user_msg = f"Query: {query}\n\nSections:\n{text}\n\nReturn JSON list of IDs:"
        
        try:
            resp = await self.llm_client.generate_response(SYSTEM_PROMPT, user_msg)
            match = re.search(r'\[.*\]', resp, re.DOTALL)
            return json.loads(match.group()) if match else []
        except: return []

    async def retrieve_with_trace(self, query: str):
        """Unified retrieval method that returns both results and a UI-compatible trace."""
        trace = []
        current_layer = self.structure if isinstance(self.structure, list) else [self.structure]
        
        if not current_layer:
            return {"relevant_nodes": [], "trace": trace}

        relevant_leaf_nodes = []
        queue = [current_layer]
        visited = set()

        while queue:
            batch = queue.pop(0)
            trace.append({
                "action": "evaluating",
                "nodes": [s.get('title', 'Unknown') for s in batch],
                "node_ids": [s.get('node_id', s.get('id')) for s in batch]
            })
            
            relevant_ids = await self.ask_llm_for_relevant_nodes(query, batch)
            trace.append({
                "action": "llm_decision",
                "chosen_ids": relevant_ids
            })
            
            for rid in relevant_ids:
                if rid in visited: continue
                visited.add(rid)
                
                node = next((s for s in batch if (s.get('node_id')==rid or s.get('id')==rid)), None)
                if not node: continue
                
                children = node.get('nodes', [])
                if children:
                    trace.append({"action": "drill_down", "title": node.get('title'), "id": rid})
                    queue.append(children)
                else:
                    trace.append({"action": "found_leaf", "title": node.get('title'), "id": rid})
                    relevant_leaf_nodes.append(node)
                    
        results = {"relevant_nodes": relevant_leaf_nodes, "trace": trace}
        
        # Synthesis step
        if relevant_leaf_nodes:
            context_text = "\n---\n".join([f"Source: {n.get('title')}\nContent: {n.get('summary')}" for n in relevant_leaf_nodes])
            synth_prompt = f"Answer the user query based ONLY on the provided context.\nQuery: {query}\n\nContext:\n{context_text}"
            results["answer"] = await self.llm_client.generate_response("You are a helpful assistant.", synth_prompt)
        else:
            results["answer"] = "I'm sorry, I couldn't find any relevant information in the document to answer your query."
            
        return results

    async def close(self):
        pass

class TracingNeo4jRetriever(StandaloneRetriever):
    """Compatibility name for server scripts."""
    pass
