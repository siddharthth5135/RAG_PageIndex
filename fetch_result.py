import requests
import json

payload = {
    "query": "What was the total net income, and what drove it?",
    "doc_name": "dummy_report",
    "model": "gemini/gemini-2.5-flash"
}

resp_query = requests.post("http://localhost:8000/query", json=payload).json()

with open("clean_result.txt", "w", encoding="utf-8") as f:
    f.write(json.dumps(resp_query, indent=2))
