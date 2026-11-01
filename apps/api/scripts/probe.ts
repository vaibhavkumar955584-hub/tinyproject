import { config } from 'dotenv';
import { resolve } from 'node:path';
import { cpppListGoal } from '../src/agent/goals/cppp.goal';
import { gemListGoal } from '../src/agent/goals/gem.goal';

// Load .env
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../.env') });

const apiKey = process.env.TINYFISH_API_KEY;
if (!apiKey) {
  console.error('Error: TINYFISH_API_KEY is not defined in .env');
  process.exit(1);
}

const portal = (process.argv[2] || 'cppp').toLowerCase();
const url = portal === 'gem' ? 'https://gem.gov.in' : 'https://eprocure.gov.in/eprocure/app';
const goal = portal === 'gem'
  ? gemListGoal({ category: 'IT services', state: 'Delhi', maxTenders: 3 })
  : cpppListGoal({ category: 'IT services', state: 'Delhi', maxTenders: 3 });

console.log(`\n======================================================`);
console.log(`TenderGuard AI — TinyFish Live Probe`);
console.log(`Portal: ${portal.toUpperCase()}`);
console.log(`URL:    ${url}`);
console.log(`======================================================\n`);

async function runProbe() {
  console.log('Dispatching live SSE request to TinyFish agent...');
  const res = await fetch('https://agent.tinyfish.ai/v1/automation/run-sse', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      goal,
      browser_profile: 'lite',
      agent_config: {
        max_duration_seconds: 120,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`HTTP ${res.status} from TinyFish: ${errorText}`);
    process.exit(1);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    console.error('No response body stream.');
    process.exit(1);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;
      try {
        const ev = JSON.parse(jsonStr);
        if (ev.type === 'STARTED') {
          console.log(`[STARTED] Run ID: ${ev.run_id}`);
        } else if (ev.type === 'STREAMING_URL') {
          console.log(`[LIVE STREAM] Streaming URL: ${ev.streaming_url}`);
        } else if (ev.type === 'PROGRESS') {
          console.log(`[PROGRESS] ${ev.purpose}`);
        } else if (ev.type === 'COMPLETE') {
          console.log(`\n[COMPLETE] Status: ${ev.status}`);
          console.log('Extracted result:\n', JSON.stringify(ev.result, null, 2));
        }
      } catch (err) {
        // ignore incomplete json
      }
    }
  }
}

runProbe().catch((err) => {
  console.error('Probe failed:', err);
  process.exit(1);
});

