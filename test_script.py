import os
import requests
import json
import asyncio
from fpdf import FPDF
import sseclient

# 1. Create a dummy PDF
print("Creating dummy PDF...")
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=15)
pdf.cell(200, 10, txt="Global Corp Annual Report 2023", ln=True, align='C')
pdf.cell(200, 10, txt="Section 1: Executive Summary", ln=True)
pdf.cell(200, 10, txt="2023 was a fantastic year. Revenue grew by 45% YoY.", ln=True)

pdf.add_page()
pdf.cell(200, 10, txt="Section 2: Financials", ln=True)
pdf.cell(200, 10, txt="Net income reached $5.2 billion. Cloud services contributed to 60% of total revenue.", ln=True)

pdf.add_page()
pdf.cell(200, 10, txt="Section 3: Future Outlook", ln=True)
pdf.cell(200, 10, txt="We plan to expand our cloud infrastructure in Europe and Asia by 2025.", ln=True)

test_pdf_path = "./dummy_report.pdf"
pdf.output(test_pdf_path)
print(f"Created {test_pdf_path}")

# 2. Upload it to the FastAPI backend
print("Uploading PDF to Vectorless RAG Engine...")
url_upload = "http://localhost:8000/upload"
with open(test_pdf_path, 'rb') as f:
    files = {'file': ('dummy_report.pdf', f, 'application/pdf')}
    response = requests.post(url_upload, files=files, stream=True)
    
    for line in response.iter_lines():
        if line:
            print("STREAM:", line.decode("utf-8"))

# 3. Query the tree index
print("\nExecuting Vectorless Query...")
url_query = "http://localhost:8000/query"
payload = {
    "query": "What was the total net income, and what drove it?",
    "doc_name": "dummy_report",
    "model": "gemini/gemini-2.5-flash"
}

resp_query = requests.post(url_query, json=payload)
print("\n--- QUERY RESULT ---")
try:
    print(json.dumps(resp_query.json(), indent=2))
except:
    print(resp_query.text)
