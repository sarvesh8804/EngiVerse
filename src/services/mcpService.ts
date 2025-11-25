export type ContextItem = {
  id: string;
  type?: string;
  source?: string;
  content: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function listContexts(type?: string): Promise<ContextItem[]> {
  const url = new URL('/mcp/contexts', BASE);
  if (type) url.searchParams.set('type', type);
  const r = await fetch(url.toString());
  return await r.json();
}

export async function getContext(id: string): Promise<ContextItem | null> {
  const r = await fetch(`${BASE}/mcp/contexts/${encodeURIComponent(id)}`);
  if (r.status === 404) return null;
  return await r.json();
}

export async function putContext(item: ContextItem): Promise<ContextItem> {
  const r = await fetch(`${BASE}/mcp/contexts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return await r.json();
}

export function createMCPWebSocket(onMessage: (data: any) => void) {
  const protocol = BASE.startsWith('https') ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${new URL(BASE).host}/mcp/ws`;
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => console.log('MCP WebSocket: connected');
  ws.onmessage = (evt) => {
    try { onMessage(JSON.parse(evt.data)); }
    catch (e) { onMessage(evt.data); }
  };
  ws.onerror = (err) => console.error('MCP WS error', err);
  ws.onclose = () => console.log('MCP WebSocket: closed');
  return ws;
}
