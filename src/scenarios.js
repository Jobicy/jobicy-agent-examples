export async function searchJobs(session, { query = '', geo = '', limit = 10, details = false } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('limit must be from 1 to 20');
  const results = await session.call('search_jobs', { ...(query ? { query } : {}), ...(geo ? { geo } : {}), limit });
  if (!Array.isArray(results.jobs)) throw new Error('search_jobs returned no jobs array');
  if (details && results.jobs.length) {
    return { results, firstJob: await session.call('get_job', { id: results.jobs[0].id }) };
  }
  return results;
}

export async function researchCompany(session, query) {
  if (typeof query !== 'string' || !query.trim()) throw new Error('Provide a company name');
  const results = await session.call('search_companies', { query: query.trim(), limit: 1 });
  if (!Array.isArray(results.companies)) throw new Error('search_companies returned no companies array');
  const company = results.companies[0];
  if (!company) return { search: results, message: 'No public company matched this search.' };
  if (company.id == null) throw new Error('The company result has no stable ID');
  const profile = await session.call('get_company', { id: String(company.id) });
  const jobs = await session.call('get_company_jobs', { companyId: company.id, limit: 10 });
  return { profile, jobs };
}

export async function exploreCareer(session, role) {
  if (typeof role !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(role)) throw new Error('Provide a career role slug from a Jobicy /careers/ URL');
  const guide = await session.call('get_role', { role });
  const related = await session.call('get_related_roles', { role, limit: 5 });
  return { guide, related };
}
