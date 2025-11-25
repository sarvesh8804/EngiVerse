# Server (Node) README

This server provides helper endpoints used by the frontend and contains existing analysis functionality.

Important: The project includes an optional server-side GitHub proxy so the client never needs a GitHub token. To enable, set `GITHUB_TOKEN` in your environment or `.env` file (see `.env.example`).

Start server:

```powershell
cd server
nodemon index.js
```

Development notes:
- When `GITHUB_TOKEN` is provided, the server will use it to make GitHub API calls on behalf of the client at endpoints under `/api/github/*`.
- The backend currently runs on port 5000 by default.
- Ensure CORS is set to allow frontend host (already `app.use(cors())` is configured; adapt as necessary).
