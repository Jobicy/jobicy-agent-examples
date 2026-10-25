import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export async function withJobicy(callback, { endpoint = 'https://jobicy.com/mcp', timeoutMs = 20000 } = {}) {
  const url = new URL(endpoint);
  const official = url.protocol === 'https:' && url.hostname === 'jobicy.com';
  const local = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
  if ((!official && !local) || url.username || url.password || url.hash) throw new Error('Use the official Jobicy HTTPS endpoint or a local HTTP test server');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  const transport = new StreamableHTTPClientTransport(url, {
    fetch: (target, init = {}) => {
      const timeout = AbortSignal.timeout(timeoutMs);
      return fetch(target, { ...init, signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
    }
  });
  const client = new Client({ name: 'jobicy-agent-examples', version: '0.1.0' });
  try {
    await client.connect(transport);
    const discovery = await client.listTools();
    const tools = discovery.tools;
    return await callback({
      tools,
      call: async (name, args) => {
        if (!tools.some((tool) => tool.name === name)) throw new Error(`The server did not advertise ${name}`);
        const result = await client.callTool({ name, arguments: args });
        if (result.isError) throw new Error(`Jobicy MCP tool ${name} failed`);
        if (result.structuredContent) return result.structuredContent;
        const text = result.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n');
        try { return JSON.parse(text); } catch { throw new Error(`Tool ${name} returned no structured JSON`); }
      }
    });
  } finally {
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }
}
