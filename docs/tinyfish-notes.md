# TinyFish API Technical Reference & Notes

This document provides exact method names, request fields, event shapes, rate limits, pricing, and beta flags for TinyFish services based directly on upstream documentation (`https://docs.tinyfish.ai/llms.txt`).

---

## 1. Authentication

- **Header**: `X-API-Key: <TINYFISH_API_KEY>`
- Applied to all endpoints: Agent, Search, Fetch, Runs, and Monitors.

---

## 2. Agent API (`https://agent.tinyfish.ai/v1`)

### Endpoints
1. `POST https://agent.tinyfish.ai/v1/automation/run` (Synchronous, returns final JSON result, no cancellation).
2. `POST https://agent.tinyfish.ai/v1/automation/run-async` (Asynchronous, returns `run_id` immediately, supports cancel).
3. `POST https://agent.tinyfish.ai/v1/automation/run-sse` (Streaming SSE, returns live event stream, supports cancel).

### Common Request Payload
```json
{
  "url": "https://eprocure.gov.in/...",
  "goal": "Natural language instructions",
  "output_schema": {
    "type": "object",
    "properties": { ... },
    "required": [ ... ]
  },
  "browser_profile": "lite",
  "proxy_config": {
    "enabled": true,
    "type": "tinyfish",
    "country_code": "IN"
  },
  "agent_config": {
    "mode": "default",
    "max_steps": 50,
    "max_duration_seconds": 240
  },
  "webhook_url": "https://example.com/webhooks/tinyfish",
  "capture_config": {
    "screenshots": true
  }
}
```

### Beta & Gated Flags
- `agent_config.mode`: `"default" | "strict"`. **Beta-gated**: `strict` requires beta access, else ignored or may return 403 if unsupported.
- `agent_config.max_steps`: Optional integer (1–500). **Beta-gated**: Non-beta requests with this field return `403 FORBIDDEN` unless account has beta access. TenderGuard guards this by catching or omitting when unverified.
- `capture_config`: Account-gated (`screenshots`, `recording`, `html`, `snapshots`, `elements`). Returns `403` if account is not enabled. TenderGuard gracefully falls back if capture returns 403.

### Screenshot Retrieval & Artifact Mechanism
- **Endpoint**: `GET https://agent.tinyfish.ai/v1/runs/{id}/steps/{stepId}/screenshot`
- **Authentication**: Requires `X-API-Key` header.
- **Content-Type**: `image/jpeg` binary data.
- **Run Steps with URLs**: `GET /v1/runs/{id}?screenshots=url` provides step screenshot references.
- **Security & Storage Rule**:
  Because upstream screenshot endpoints require the private `X-API-Key`, screenshot bytes must be downloaded server-side by TenderGuard, sanitized/redacted (checked for login or CAPTCHAs), processed into 480px WebP thumbnails + full-size captures, and stored in our local/object storage. The client browser only receives public URLs from TenderGuard's API (`/api/images/...`), never raw TinyFish URLs or API keys.

### SSE Stream Event Shapes (`/run-sse`)
Format: `data: <json>\n\n`
- `STARTED`:
  ```json
  { "type": "STARTED", "run_id": "run_xxx", "timestamp": "2026-01-01T00:00:00Z" }
  ```
- `STREAMING_URL`:
  ```json
  { "type": "STREAMING_URL", "run_id": "run_xxx", "streaming_url": "https://...", "timestamp": "..." }
  ```
- `PROGRESS`:
  ```json
  { "type": "PROGRESS", "run_id": "run_xxx", "purpose": "Opening CPPP tender listing", "timestamp": "..." }
  ```
- `HEARTBEAT`:
  ```json
  { "type": "HEARTBEAT", "timestamp": "..." }
  ```
- `COMPLETE`:
  ```json
  { "type": "COMPLETE", "run_id": "run_xxx", "status": "COMPLETED", "result": { ... }, "timestamp": "..." }
  ```
  *(On failure: `status`: "FAILED", `error`: { "code": "...", "message": "...", "help_url": "..." })*

### Runs Lifecycle & Cancellation
- **Get Run**: `GET https://agent.tinyfish.ai/v1/runs/{id}`
  - Returns `run_id`, `status` (`PENDING | RUNNING | COMPLETED | FAILED | CANCELLED`), `streaming_url`, `result`, `error`, `num_of_steps`.
- **Cancel Run**: `POST https://agent.tinyfish.ai/v1/runs/{id}/cancel`
  - Returns `{ "run_id": "...", "status": "CANCELLED", "cancelled_at": "..." }`.

---

## 3. Search API (`https://api.search.tinyfish.ai`)

- **Method**: `GET https://api.search.tinyfish.ai`
- **Query Parameters**:
  - `query` (string, required): Search query.
  - `purpose` (string, optional): Search intent (e.g. `Discover public active government tenders for IT services`).
  - `include_domains` (string, optional): e.g. `eprocure.gov.in,gem.gov.in`.
  - `exclude_domains` (string, optional).
  - `location` (string, optional): ISO code (e.g. `IN`).
  - `language` (string, optional): `en`.
  - `recency_minutes` (number, optional).
  - `after_date` (YYYY-MM-DD, optional).
- **Response**:
  ```json
  {
    "query": "...",
    "results": [
      {
        "position": 1,
        "site_name": "eprocure.gov.in",
        "title": "Tender Notice - IT Endpoint Support",
        "snippet": "...",
        "url": "https://eprocure.gov.in/..."
      }
    ],
    "total_results": 10,
    "page": 0
  }
  ```
- **Rate Limit**: 30 req/min personal; free allowance up to 12,000 req/day.

---

## 4. Fetch API (`https://api.fetch.tinyfish.ai`)

- **Method**: `POST https://api.fetch.tinyfish.ai`
- **Headers**: `X-API-Key`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "urls": ["https://eprocure.gov.in/notice.html"],
    "format": "markdown",
    "links": false,
    "image_links": false,
    "ttl": 21600,
    "per_url_timeout_ms": 45000
  }
  ```
- **Supported Formats**: `markdown` (clean markdown for LLM extraction), `html`, `json`.
- **Supported Types**: HTML, PDF (text extracted automatically), JSON, plain text.
- **Response**:
  ```json
  {
    "results": [
      {
        "url": "https://eprocure.gov.in/...",
        "final_url": "https://...",
        "title": "Notice Inviting Tender",
        "text": "# Tender Notice\n\nTurnover: Rs. 50 Lakh...",
        "status": "completed"
      }
    ],
    "errors": []
  }
  ```
- **Rate Limit**: 150 URLs / minute; free allowance up to 1,000 URLs / day.

---

## 5. Webhooks

- Webhook notification sent to `webhook_url` upon run status transition (`COMPLETED`, `FAILED`, `CANCELLED`).
- HTTPS required. TenderGuard exposes `/webhooks/tinyfish` for async monitoring runs.

---

## 6. Tiered Fallback Architecture in TenderGuard
1. **Tier 1 (Search)**: Uses `api.search.tinyfish.ai` with `include_domains: eprocure.gov.in,gem.gov.in` and `location: IN`.
2. **Tier 2 (Fetch)**: Uses `api.fetch.tinyfish.ai` with `format: markdown` and caching `ttl`. Direct URL read for notices and PDFs without browser overhead.
3. **Tier 3 (Agent)**: Uses `agent.tinyfish.ai/v1/automation/run-sse` when interactive navigation, search forms, or live browser streaming is requested.
4. **Fixture / Demo Mode**: Guaranteed fallback using `FixtureWebAgent` when portals are unreachable or `DEMO_MODE=true`.

