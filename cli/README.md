# CLI

There is no second package here. The CLI ships in the same npm package as the
MCP server:

```bash
npx -y justmarkdown convert ./paper.pdf -o paper.md
npx -y justmarkdown convert https://example.com/report.pdf -o report.md
cat notes.txt | npx -y justmarkdown convert - --filename notes.txt
npx -y justmarkdown --help
npx -y justmarkdown --version
```

See [`../mcp-server/README.md`](../mcp-server/README.md) for options, the billing
boundary, and the upload flow. Running `npx -y justmarkdown` with no arguments
still starts the MCP stdio server, so existing client configs keep working.
