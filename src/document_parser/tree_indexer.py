import pypdf
import json
import os
from src.agent.llm_provider import smart_completion

async def build_tree_index(pdf_path: str, model_name: str, doc_name: str, logger=None):
    # Step 1: Extract pages
    reader = pypdf.PdfReader(pdf_path)
    pages_dict = {}
    pages_text = ""
    for i in range(len(reader.pages)):
        page = reader.pages[i]
        text = page.extract_text()
        text = text if text else ""
        pages_dict[str(i + 1)] = text
        pages_text += f"\n=== Page {i + 1} ===\n{text}\n"

    # Store raw pages
    os.makedirs("./results/raw_pages", exist_ok=True)
    with open(f"./results/raw_pages/{doc_name}.json", "w", encoding="utf-8") as f:
        json.dump(pages_dict, f, ensure_ascii=False, indent=2)
    
    if logger:
        logger.info(f"Extracted {len(reader.pages)} pages from {pdf_path}")

    # Step 2: Build tree index
    prompt = f"""You are a document indexer. Given the text of each page below,
build a hierarchical JSON tree index (Table of Contents).

RULES:
- Group related consecutive pages into logical sections
- Each node must have: node_id, title, summary (1 sentence), start_page, end_page, sub_nodes[]
- node_ids must be zero-padded strings: "0001", "0002", etc.
- Summaries must be specific — describe WHAT information is there, not just the topic.
- Nest sub_nodes when a section has distinct sub-topics
- Maximum 3 levels of nesting
- Return ONLY valid JSON format. No markdown, no explanation.

PAGES:
{pages_text}
"""

    if logger:
        logger.info("Sending command to LLM to build tree index. This might take a bit...")

    response = await smart_completion(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )
    
    response_content = response.choices[0].message.content
    # Clean up markdown formatting if present
    if response_content.startswith("```json"):
        response_content = response_content[7:]
    if response_content.endswith("```"):
        response_content = response_content[:-3]
    response_content = response_content.strip()

    try:
        tree_json = json.loads(response_content)
    except Exception as e:
        if logger:
            logger.error(f"Failed to parse LLM JSON response: {response_content}")
        raise ValueError("LLM returned invalid JSON structure.")

    # Save the Tree Index
    os.makedirs("./results/tree_indices", exist_ok=True)
    with open(f"./results/tree_indices/{doc_name}.json", "w", encoding="utf-8") as f:
        json.dump(tree_json, f, ensure_ascii=False, indent=2)

    return tree_json
