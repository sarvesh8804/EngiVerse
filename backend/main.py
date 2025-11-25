import os
import shutil
import subprocess
import tempfile
import json
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
# ---------------- CONFIG ---------------- #
GIT_PATH = r"C:\Program Files\Git\cmd\git.exe"
# PYLINT_CMD = [r"C:\Users\Ishaan M Kulkarni\AppData\Roaming\Python\Scripts\pylint.exe"]
# BANDIT_CMD = [r"C:\Users\Ishaan M Kulkarni\AppData\Roaming\Python\Scripts\bandit.exe"]
# SEMgrep_CMD = [r"C:\Users\Ishaan M Kulkarni\AppData\Roaming\Python\Scripts\semgrep.exe"]# PYLINT_CMD = [r"C:\Users\Shreya\AppData\Roaming\Python\Python312\Scripts\pylint.exe"]
PYLINT_CMD = [r"D:\engiverse\EngiVerse\.venv\Scripts\pylint.exe"]
# BANDIT_CMD = [r"C:\Users\Shreya\AppData\Roaming\Python\Python312\Scripts\bandit.exe"]
BANDIT_CMD = [r"D:\engiverse\EngiVerse\.venv\Scripts\bandit.exe"]
# SEMgrep_CMD = [r":\Users\Shreya\AppData\Roaming\Python\Python312\Scripts\semgrep.exe"]
SEMgrep_CMD = [r"D:\engiverse\EngiVerse\.venv\Scripts\semgrep.exe"]
ESLINT_CMD = ["eslint"]
TSC_CMD = ["tsc", "--noEmit", "--allowJs"]

# Gemini API key
API_KEY = "AIzaSyC73xoP-OPOVlI2ojjlhxYt_sLV-Ohp3ys"
genai.configure(api_key=API_KEY)

# ---------------------------------------- #

app = FastAPI()

# Allow Cross-Origin requests from common local dev hosts (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*" ],
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Allows all headers
)

# Mount MCP server (Model Context Protocol) router
try:
    from .mcp_server import router as mcp_router
    app.include_router(mcp_router, prefix="/mcp")
except Exception:
    try:
        # Fallback in case running as a top-level script
        from mcp_server import router as mcp_router
        app.include_router(mcp_router, prefix="/mcp")
    except Exception:
        pass


class RepoRequest(BaseModel):
    github_url: str

def run_command(cmd, cwd=None):
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True
        )
        return result.stdout.strip()
    except Exception as e:
        return str(e)

def generate_gemini_summary(log_content: str):
    """Call Gemini API to summarize error logs."""
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
Analyze the following error log. For each tool mentioned (e.g., pylint, eslint, tsc), classify the errors by risk level into three categories: 'High Risk', 'Medium Risk', and 'Low Risk'. 
    
    For each category, provide a heading and then list the relevant files with a brief, actionable summary of the issues.

Error log content:
{log_content}

---
Summary of errors:
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini API error: {e}"

@app.post("/analyze")
def analyze_repo(req: RepoRequest):
    repo_url = req.github_url
    tmp_dir = tempfile.mkdtemp()
    repo_name = os.path.basename(repo_url).replace(".git", "")
    repo_path = os.path.join(tmp_dir, repo_name)

    response_data = {
        "clone_output": "",
        "pylint": "",
        "bandit": "",
        "semgrep": "",
        "eslint": "",
        "tsc": ""
    }

    # ---------------- Clone ---------------- #
    clone_cmd = [GIT_PATH, "clone", repo_url]
    response_data["clone_output"] = run_command(clone_cmd, cwd=tmp_dir)

    if not os.path.exists(repo_path):
        response_data["clone_output"] += "\nError: Repo folder not found."
        return response_data

    # ---------------- Detect files ---------------- #
    python_files = []
    js_ts_files = []
    for root, dirs, files in os.walk(repo_path):
        for f in files:
            if f.endswith(".py"):
                python_files.append(os.path.join(root, f))
            elif f.endswith(".js") or f.endswith(".ts") or f.endswith(".tsx"):
                js_ts_files.append(os.path.join(root, f))

    # ---------------- Python Analysis ---------------- #
    if python_files:
        response_data["pylint"] = run_command(PYLINT_CMD + python_files)
        response_data["bandit"] = run_command(BANDIT_CMD + ["-r", repo_path])
        response_data["semgrep"] = run_command(SEMgrep_CMD + ["--config", "auto", repo_path, "--json"])
    else:
        response_data["pylint"] = "No Python files"
        response_data["bandit"] = "No Python files"
        response_data["semgrep"] = "No Python files"

    # ---------------- JS/TS Analysis ---------------- #
    if js_ts_files:
        run_command(["npm", "install"], cwd=repo_path)
        eslint_config_path = os.path.join(repo_path, "eslint.config.js")
        if not os.path.exists(eslint_config_path):
            with open(eslint_config_path, "w") as f:
                f.write("module.exports = {};")
        # response_data["eslint"] = run_command(ESLINT_CMD + js_ts_files, cwd=repo_path)
        # response_data["tsc"] = run_command(TSC_CMD + js_ts_files, cwd=repo_path)
        response_data["eslint"] = run_command(ESLINT_CMD + ["."], cwd=repo_path)
        response_data["tsc"] = run_command(TSC_CMD, cwd=repo_path)
    else:
        response_data["eslint"] = "No JS/TS files"
        response_data["tsc"] = "No TS files"

    # ---------------- Save raw analysis ---------------- #
    temp_file = "temp.txt"
    with open(temp_file, "w", encoding="utf-8") as f:
        # f.truncate(0)
        f.write(json.dumps(response_data, indent=4, ensure_ascii=False))

    # ---------------- Generate Gemini summary ---------------- #
    gemini_summary = generate_gemini_summary(json.dumps(response_data, indent=4))
    error_file = "errors.txt"
    with open(error_file, "w", encoding="utf-8") as f:
        # f.truncate(0)
        f.write(gemini_summary)

    # ---------------- Cleanup ---------------- #
    shutil.rmtree(tmp_dir, ignore_errors=True)

    return {
        "response": response_data,
        "temp_file": temp_file,
        "errors_file": error_file,
        "gemini_summary": gemini_summary
    }