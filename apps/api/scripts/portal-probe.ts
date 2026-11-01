import { PORTAL_REGISTRY, getPortalById } from '../src/agent/portals/registry';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  const portalId = (process.argv[2] || 'CPPP').toUpperCase();
  const query = process.argv[3] || 'it services';

  const portal = getPortalById(portalId);
  if (!portal) {
    console.error(`\n❌ Unknown portal ID "${portalId}". Available portals:`);
    console.log(PORTAL_REGISTRY.map((p) => `  - ${p.id.padEnd(12)} (${p.name})`).join('\n'));
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`  TenderGuard Portal Probe: ${portal.name} [${portal.id}]`);
  console.log(`======================================================`);
  console.log(`  Kind:            ${portal.kind}`);
  console.log(`  Base URL:        ${portal.baseUrl}`);
  console.log(`  Domains:         ${portal.domains.join(', ')}`);
  console.log(`  States:          ${portal.states.join(', ')}`);
  console.log(`  Priority:        ${portal.priority}/5`);
  console.log(`  Enabled:         ${portal.enabled}`);
  console.log(`  Capabilities:    Search=${portal.capabilities.tinyfishSearch}, Fetch=${portal.capabilities.fetch}, Agent=${portal.capabilities.agentNav}`);
  console.log(`  Probe Query:     "${query}"\n`);

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    console.log(`⚠️  TINYFISH_API_KEY not configured; checking HTTP availability of public list URL...`);
    const start = Date.now();
    try {
      const res = await fetch(portal.publicListUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(10000),
      });
      const latency = Date.now() - start;
      console.log(`  HTTP Status:     ${res.status} ${res.statusText}`);
      console.log(`  Latency:         ${latency}ms`);
      console.log(`  Content-Type:    ${res.headers.get('content-type')}`);
      console.log(`\n✅ Portal public list URL is reachable.`);
    } catch (err) {
      console.error(`\n❌ Failed to connect to ${portal.publicListUrl}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
    return;
  }

  console.log(`🔍 Probing TinyFish Search API for domain [${portal.domains[0]}]...`);
  const searchStart = Date.now();
  try {
    const endpoint = new URL(process.env.TINYFISH_SEARCH_URL || 'https://api.search.tinyfish.ai');
    endpoint.searchParams.set('query', `${query} tender notice ${portal.domains[0]}`);
    endpoint.searchParams.set('include_domains', portal.domains.join(','));
    endpoint.searchParams.set('location', 'India');

    const res = await fetch(endpoint.toString(), {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(15000),
    });

    const latency = Date.now() - searchStart;
    console.log(`  TinyFish Status: ${res.status}`);
    console.log(`  Search Latency:  ${latency}ms`);

    if (res.ok) {
      const data = await res.json() as { results?: Array<{ title?: string; url?: string; snippet?: string }> };
      const results = data.results ?? [];
      console.log(`  Tenders Found:   ${results.length}\n`);

      results.slice(0, 3).forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.title || 'Untitled'}`);
        console.log(`      URL:     ${item.url}`);
        console.log(`      Snippet: ${item.snippet?.slice(0, 100)}...`);
      });
      console.log(`\n✅ Portal probe completed successfully.`);
    } else {
      const errText = await res.text();
      console.error(`\n❌ TinyFish Search returned error: ${errText}`);
    }
  } catch (err) {
    console.error(`\n❌ Search probe error: ${err instanceof Error ? err.message : 'timeout'}`);
  }
}

void main();

