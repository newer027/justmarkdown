# justmarkdown

MCP server and CLI for **JustMarkdown** — convert documents, files, and web
pages into clean Markdown, from an agent or a terminal.

This package is a thin client for the hosted JustMarkdown engine. It runs
locally, but the conversion happens on `https://justmarkdown.com`, so it
**requires network access**. It exposes the same six MCP tools as the remote
endpoint:

| Tool | What it does |
|------|--------------|
| `convert_url` | Fetch a public URL (web page, PDF, Office document, …) and convert it to Markdown |
| `convert_base64` | Convert base64-encoded file bytes to Markdown (`filename` drives format detection) |
| `request_upload_url` | Get a short-lived URL to upload a large file straight to storage (API key required) |
| `convert_upload` | Convert a file uploaded with `request_upload_url` (API key required) |
| `list_supported_formats` | List supported input formats and per-tier limits (never consumes quota) |
| `usage_status` | Check your tier, remaining anonymous conversions today, and remaining credits (never consumes quota) |

> Prefer not to install anything? Point your client straight at the hosted
> Streamable HTTP endpoint `https://justmarkdown.com/api/mcp` — it exposes the
> same six tools. The stdio package is for clients that can only launch a local
> process.

## Requirements

- Node.js 20.9 or newer
- Network access to `https://justmarkdown.com`

## MCP usage

Add to your MCP config:

```json
{
  "mcpServers": {
    "justmarkdown": {
      "command": "npx",
      "args": ["-y", "justmarkdown"]
    }
  }
}
```

Or register it with a client CLI:

```bash
# Claude Code
claude mcp add justmarkdown -- npx -y justmarkdown

# Codex
codex mcp add justmarkdown -- npx -y justmarkdown
```

Running the package with no arguments starts the MCP stdio server. Existing
client configs do not need to change.

## CLI usage

The same package is also a CLI:

```bash
# local file → Markdown file
npx -y justmarkdown convert ./paper.pdf -o paper.md

# public URL → Markdown file
npx -y justmarkdown convert https://example.com/report.pdf -o report.md

# stdin → stdout
cat notes.txt | npx -y justmarkdown convert - --filename notes.txt

# raw result JSON
npx -y justmarkdown convert ./paper.pdf --json

# help / version
npx -y justmarkdown --help
npx -y justmarkdown --version
```

Large files (over the base64 request limit) use the two-step upload flow
automatically when an API key is present. Without a key, only the smaller
anonymous base64 limit is available.

### CLI options

| Option | Purpose |
|--------|---------|
| `-o, --output <path>` | Write Markdown to a file instead of stdout |
| `--json` | Print the raw `{ markdown, format_detected, word_count, truncated }` JSON |
| `--filename <name>` | File name used for stdin (default `stdin.txt`, or `stdin.pdf` when it starts with `%PDF-`) |
| `--api-key <key>` | API key (falls back to `JUSTMARKDOWN_API_KEY`) |
| `--endpoint <url>` | Endpoint override (falls back to `JUSTMARKDOWN_MCP_URL`) |

## Authentication

The anonymous free tier needs no configuration. It is limited to a small number
of text conversions per day; scanned-PDF OCR, audio transcription, and large
uploads need an API key.

Create a `jm_live_…` key at
<https://justmarkdown.com/settings?section=apiKeys> and pass it through the
environment:

```json
{
  "mcpServers": {
    "justmarkdown": {
      "command": "npx",
      "args": ["-y", "justmarkdown"],
      "env": { "JUSTMARKDOWN_API_KEY": "jm_live_..." }
    }
  }
}
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `JUSTMARKDOWN_API_KEY` | Optional `jm_live_…` key. Falls back to `JM_API_KEY` / `JUSTMD_API_KEY`. |
| `JUSTMARKDOWN_MCP_URL` | Optional endpoint override. `API_BASE` is a legacy alias. Defaults to `https://justmarkdown.com`. |

## Billing boundary

The MCP/CLI surface and the web app share one account and one credit balance,
but they are **priced differently on purpose**:

- **MCP / CLI:** 1 credit per conversion for account keys, including a scanned
  PDF in that call. Anonymous callers use the daily text-conversion quota.
- **Web app:** text-layer PDFs and on-device scanned pages are free; server-side
  Structured OCR is 1 credit per page and uploads the file.

Do not read “text-layer PDF is free” as an MCP promise, or “1 credit per
conversion” as a web-app promise. The two surfaces have different cost shapes.

## Attribution

Clients may send these optional headers so the hosted endpoint can tell where a
call came from:

| Header | Values |
|--------|--------|
| `x-jm-mcp-client` | `mcp-stdio`, `cli`, `directory`, `action` |
| `x-jm-mcp-client-version` | Client package version |

The bundled stdio bridge and CLI send them automatically. Directory listings can
add `headers: { "x-jm-mcp-client": "directory" }` to their remote config.

## See also

- Hosted endpoint (same tools, no install): `https://justmarkdown.com/api/mcp`
- Discovery document: `https://justmarkdown.com/.well-known/mcp.json`
- Server card: `https://justmarkdown.com/.well-known/mcp/server-card.json`
- Setup guide: `https://justmarkdown.com/mcp`
- Issues and corrections: `https://github.com/newer027/justmarkdown/issues`

## License

MIT
