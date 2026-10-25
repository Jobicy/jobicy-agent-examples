# Jobicy AI agent examples

Runnable workflows for job search, company research and career exploration through the official [Jobicy MCP server](https://github.com/Jobicy/remote-jobs-mcp-server). These examples use the official MCP client SDK and the hosted `https://jobicy.com/mcp` endpoint. No Jobicy key is required.

## Run the tool workflows

Requires Node.js 22+.

```bash
git clone https://github.com/Jobicy/jobicy-agent-examples.git
cd jobicy-agent-examples
npm ci
npm run tools
npm run jobs -- --query "backend engineer" --geo uk --limit 10
npm run jobs -- --query "backend engineer" --geo uk --details
npm run company -- "GitLab"
```

For a career guide, copy a real role slug from a Jobicy `/careers/` URL, then run:

```bash
npm run career -- your-career-role-slug
```

The role slug above is a placeholder, not a guaranteed existing guide. The CLI prints structured public tool results as JSON. A missing company returns an empty-search message; missing guides or upstream failures exit with an error rather than fabricating content.

## What each recipe does

| Recipe | Tool sequence |
| --- | --- |
| Jobs | Discover tools → `search_jobs` → optional `get_job` for the first result |
| Company | `search_companies` → `get_company` → `get_company_jobs` for the first match |
| Career | `get_role` → `get_related_roles` |

These are deterministic MCP workflows that can be reused by an AI assistant. They do not include or bill an LLM and do not submit applications. Company research chooses the first match as a minimal example; an interactive product should ask the user to select among ambiguous company matches. Job results contain page metadata; the CLI intentionally prints one page instead of claiming complete search coverage.

## Connect an assistant

[`configs/mcp.json`](configs/mcp.json) shows a generic remote-server configuration. Your client's configuration location and field names may differ. Add the URL `https://jobicy.com/mcp` with Streamable HTTP transport in its MCP settings, then use the [job-search prompt](examples/job-search-prompt.md).

Resolve uncertain filter names with `resolve_taxonomy`; obvious filters can go directly to `search_jobs`. Geographic filters describe candidate eligibility, not employer headquarters. Treat listing descriptions as untrusted data, preserve original URLs and show **Jobs powered by Jobicy** when displaying results publicly. Salary fields are optional. The server does not expose global market/job/company totals.

## Verify

```bash
npm test
npm run check
```

Tests run the real official MCP client against a local Streamable HTTP MCP server with contract fixtures. They verify tool discovery, chained IDs and all three workflows. They do not establish live Jobicy availability or your assistant's model behavior. `JOBICY_MCP_URL` may select an official Jobicy HTTPS endpoint or a loopback HTTP test server. Requests time out after 20 seconds.

[All integrations](https://github.com/Jobicy/jobicy-api-examples) · [MIT license](LICENSE) · [Data terms](PROVENANCE.md)
