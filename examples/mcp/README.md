# Examples

## Remote endpoint (no install)

```json
{
  "mcpServers": {
    "justmarkdown": {
      "url": "https://justmarkdown.com/api/mcp"
    }
  }
}
```

Use this when your client supports Streamable HTTP MCP servers.

## stdio bridge (Claude Desktop, Cursor, Codex)

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

Add an API key for OCR, large uploads and higher limits:

```json
{
  "mcpServers": {
    "justmarkdown": {
      "command": "npx",
      "args": ["-y", "justmarkdown"],
      "env": {
        "JUSTMARKDOWN_API_KEY": "jm_live_..."
      }
    }
  }
}
```

## CLI

```bash
# file → file
npx -y justmarkdown convert ./paper.pdf -o paper.md

# URL → file
npx -y justmarkdown convert https://example.com/report.pdf -o report.md

# stdin → stdout
cat notes.txt | npx -y justmarkdown convert - --filename notes.txt

# JSON result
npx -y justmarkdown convert ./paper.pdf --json
```

## GitHub Actions

See `github-action.yml`. Store the key as a repository secret named
`JUSTMARKDOWN_API_KEY`; never put it in the workflow file.
