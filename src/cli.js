import { parseArgs } from 'node:util';
import { withJobicy } from './client.js';
import { exploreCareer, researchCompany, searchJobs } from './scenarios.js';

try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
try {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    query: { type: 'string' }, geo: { type: 'string' }, limit: { type: 'string', default: '10' },
    details: { type: 'boolean', default: false }, help: { type: 'boolean', default: false }
  } });
  if (values.help) {
    console.log('npm start -- tools | jobs --query "backend" --geo uk [--details] | company "Company Name" | career role-slug');
  } else {
    const command = positionals[0] || 'tools';
    const result = await withJobicy(async (session) => {
      if (command === 'tools') return session.tools;
      if (command === 'jobs') return searchJobs(session, { query: values.query, geo: values.geo, limit: Number(values.limit), details: values.details });
      if (command === 'company') return researchCompany(session, positionals[1]);
      if (command === 'career') return exploreCareer(session, positionals[1]);
      throw new Error('Choose tools, jobs, company or career. Use --help for examples.');
    }, { endpoint: process.env.JOBICY_MCP_URL || 'https://jobicy.com/mcp' });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error.message); process.exitCode = 1;
}
