import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { withJobicy } from '../src/client.js';
import { searchJobs, researchCompany, exploreCareer } from '../src/scenarios.js';

test('official MCP client runs job, company and career workflows over real HTTP', async (t) => {
  const calls = [];
  const names = ['search_jobs', 'get_job', 'search_companies', 'get_company', 'get_company_jobs', 'get_role', 'get_related_roles'];
  const server = createServer(async (req, res) => {
    try {
      const service = new Server({ name: 'contract-fixture', version: '1.0.0' }, { capabilities: { tools: {} } });
      service.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: names.map((name) => ({ name, inputSchema: { type: 'object', additionalProperties: true } })) }));
      service.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
        calls.push(params);
        let body = { ok: true };
        if (params.name === 'search_jobs') body = { jobs: [{ id: 123, url: 'https://jobicy.com/jobs/123' }], nextCursor: null, hasMore: false };
        if (params.name === 'search_companies') body = { companies: [{ id: 456, companyName: 'Example' }] };
        return { structuredContent: body, content: [{ type: 'text', text: JSON.stringify(body) }] };
      });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      await service.connect(transport);
      let body = ''; for await (const chunk of req) body += chunk;
      res.on('close', () => { transport.close().catch(() => {}); service.close().catch(() => {}); });
      await transport.handleRequest(req, res, body ? JSON.parse(body) : undefined);
    } catch (error) { if (!res.headersSent) res.writeHead(500); res.end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const endpoint = `http://127.0.0.1:${server.address().port}/mcp`;
  await withJobicy(async (session) => {
    const jobs = await searchJobs(session, { query: 'engineer', geo: 'uk', details: true });
    assert.equal(jobs.results.jobs[0].id, 123);
    await researchCompany(session, 'Example');
    await exploreCareer(session, 'software-engineer');
    await assert.rejects(session.call('unadvertised_tool', {}), /did not advertise/);
  }, { endpoint });
  assert.deepEqual(calls.map((call) => call.name), names);
  assert.equal(calls[1].arguments.id, 123);
  assert.equal(calls[3].arguments.id, '456');
  assert.equal(calls[4].arguments.companyId, 456);
});

test('company searches and career slugs are validated before tool calls', async () => {
  const session = { call: async () => { throw new Error('must not call'); } };
  await assert.rejects(researchCompany(session, ''), /company name/);
  await assert.rejects(exploreCareer(session, '../bad'), /role slug/);
  await assert.rejects(searchJobs(session, { limit: 1000 }), /limit/);
});
