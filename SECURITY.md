# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Email **hi@justmarkdown.com** with:

- a short description of the issue;
- the affected package/version (`justmarkdown@…`) or endpoint;
- reproduction steps or a proof of concept, if you have one;
- whether the issue involves credentials, file contents, or billing.

We aim to acknowledge reports within 3 business days and will tell you when a
fix is released. Please give us a reasonable window to patch before publishing
details.

## Scope

This repository contains the **client** (MCP stdio bridge and CLI). The hosted
conversion engine and account system run at `https://justmarkdown.com` and are
not part of this source tree.

In scope:

- the npm package `justmarkdown` (stdio bridge / CLI);
- credential handling in the client (API keys must never be logged);
- the client's request handling and upload flow.

Out of scope here:

- the hosted API's server-side implementation;
- third-party MCP clients, npm, or model providers.

## Supported versions

Only the latest published npm version is supported. Update with:

```bash
npx -y justmarkdown@latest --version
```
