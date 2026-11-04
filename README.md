# JustMarkdown MCP server & CLI

> Convert PDF, Office, EPUB and web pages to clean Markdown over MCP.
>
> Client source for the JustMarkdown MCP server and `justmarkdown` CLI.

This repository contains the **client** that connects Claude Desktop, Cursor,
Claude Code, Codex, other MCP clients, and shell scripts to the hosted
JustMarkdown conversion engine:

- **MCP stdio bridge** — `npx -y justmarkdown`
- **Remote MCP endpoint** — `https://justmarkdown.com/api/mcp`
- **CLI** — `npx -y justmarkdown convert ./paper.pdf -o paper.md`
- **Examples** — client configs and a GitHub Actions workflow

The hosted engine, account system, and billing code are **not** in this
repository. The client is thin on purpose: it forwards to one endpoint, so the
tool contract and the billing path cannot drift between surfaces.

## Quick start

### Remote MCP (nothing to install)

```json
{
  "mcpServers": {
    "justmarkdown": {
      "url": "https://justmarkdown.com/api/mcp"
    }
  }
}
```

### stdio bridge

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

```bash
# Claude Code
claude mcp add justmarkdown -- npx -y justmarkdown

# Codex
codex mcp add justmarkdown -- npx -y justmarkdown
```

Running the package with no arguments starts the MCP stdio server.

### CLI

```bash
npx -y justmarkdown convert ./paper.pdf -o paper.md
npx -y justmarkdown convert https://example.com/report.pdf -o report.md
cat notes.txt | npx -y justmarkdown convert - --filename notes.txt
npx -y justmarkdown --help
npx -y justmarkdown --version
```

## Tools

| Tool | What it does |
|------|--------------|
| `convert_url` | Fetch a public URL and convert it to Markdown |
| `convert_base64` | Convert base64 file bytes to Markdown |
| `request_upload_url` | Get a short-lived URL for a large upload (API key) |
| `convert_upload` | Convert an uploaded file (API key) |
| `list_supported_formats` | List formats and per-tier limits |
| `usage_status` | Check tier, daily anonymous quota, and credits |

## Limits and billing boundary

- **Anonymous:** a few text conversions per day. No account or key.
- **Account API key:** 1 credit per MCP/CLI conversion, including a scanned PDF
  in that call. OCR, large uploads, and higher limits require a key.
- **Web app:** text-layer PDFs and on-device scanned pages are free; server-side
  Structured OCR is 1 credit per page and uploads the file.

The MCP/CLI surface and the web app share one account and one credit balance,
but they are priced differently on purpose. “Text-layer PDF is free” is a web
promise; “1 credit per conversion” is an MCP/CLI promise.

Create a key at <https://justmarkdown.com/settings?section=apiKeys>.

## Repository layout

```
mcp-server/   npm package `justmarkdown` (MCP bridge + CLI)
cli/          pointer to the CLI that ships in the same package
examples/     client configs and a GitHub Actions workflow
```

## Corrections

This project is maintained by JustMarkdown. If a free quota, limit, endpoint, or
output shape is wrong, open an issue with the package version, the exact command
or MCP call, the observed result, the expected result, and the date/region.

Corrections from other MCP providers are welcome. Please state your affiliation.

- Security: see `SECURITY.md`; email **hi@justmarkdown.com**, do not open a public issue.
- Contributing: see `CONTRIBUTING.md`.
- Setup guide: <https://justmarkdown.com/mcp>
- Server card: <https://justmarkdown.com/.well-known/mcp/server-card.json>

## License

MIT
