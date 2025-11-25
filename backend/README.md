# MCP server (Model Context Protocol) - quick start

This folder contains a small MCP (Model Context Protocol) server module to store and broadcast model context data. The code is intentionally minimal and not production hardened — see Security and Persistence sections below.

How to run (dev):

1. Create a Python virtualenv and install dependencies
```
python -m venv .venv
venv\Scripts\Activate.ps1; python -m pip install -r requirements.txt
```

2. Start the server
```
venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
```

3. Test endpoints
 - GET: http://localhost:8000/mcp/contexts
 - POST: http://localhost:8000/mcp/contexts  (body: JSON ContextItem)
 - WebSocket: ws://localhost:8000/mcp/ws

Security and production notes
 - Add authentication (API keys/JWT) to protect endpoints.
 - Replace the file-based store with a DB (Redis, Postgres) if you need to support many contexts.
 - Add proper schema validation and size limits for content.
