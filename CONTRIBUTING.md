# Contributing

Thanks for helping improve the JustMarkdown MCP server and CLI.

## What lives here

- `index.js` — the published `justmarkdown` package: MCP stdio bridge + CLI.
- `README.md` — install, usage, billing boundary and attribution notes.
- `examples/` — client configs and command examples.

The hosted conversion engine is not in this repository. Client changes should
not require server changes unless a tool contract is changing.

## Before opening a PR

1. Use Node.js 20.9 or newer.
2. Run the CLI smoke checks:

   ```bash
   node index.js --version
   node index.js --help
   node index.js convert --help
   ```

3. Check that the MCP server still starts with no arguments:

   ```bash
   timeout 3 node index.js </dev/null
   ```

4. If you change a tool's shape, update `README.md`, the setup page at
   `https://justmarkdown.com/mcp`, and `.well-known/mcp/server-card.json` in the
   hosted app repository.

## Reporting wrong data

If a free quota, limit, endpoint, or output shape is wrong, open an issue with:

- the package/endpoint version;
- the exact command or MCP call;
- the observed result and the expected result;
- the date and your network region.

Corrections from other MCP providers are welcome. Please state your affiliation
so the discussion stays honest.

## Code style

- Keep the client thin: it forwards to the hosted endpoint and does not add a
  second conversion engine.
- Never log API keys, file contents, or presigned URLs.
- Prefer stable error codes over prose-only failures.

## License

By contributing, you agree that your contribution is licensed under the MIT
license in this repository.
