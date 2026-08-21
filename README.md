# JustMarkdown

> Document-to-Markdown API for RAG, agents, and humans.

[![Website](https://img.shields.io/badge/website-justmarkdown.com-blue)](https://justmarkdown.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Languages](https://img.shields.io/badge/i18n-4%20languages-green)](https://justmarkdown.com)

## What is JustMarkdown?

JustMarkdown is developer infrastructure for converting any document to clean Markdown — with a Web workspace that makes the same engine accessible to everyone.

**One product, two faces:**

- **For developers:** Send PDF, Word, Excel, HTML, EPUB, or image files to our REST API and get structured Markdown back — ready for RAG pipelines, AI agents, and CI workflows. Includes an MCP server for Claude and Cursor integration.
- **For non-developers:** The same engine powers a Web workspace with AI chat, 20+ format conversions, and beautiful image exports. No code required.

## Features

### Developer API
- **REST API** — `POST /api/v1/pdf-to-markdown` with multipart upload and JSON response
- **MCP Server** — `@justmarkdown/mcp` for Claude Desktop, Cursor, and Windsurf
- **API Key Management** — Self-serve keys with `jm_` prefix, naming, rotation, and revocation
- **Pay-per-page Pricing** — $29/month for 2,500 pages; cached files don't consume quota
- **High-accuracy Engine** — PP-StructureV3 + PaddleOCR VL for text and scanned PDFs
- **AI Cleaning** — `useLlm` option for AI-enhanced Markdown output (2x page quota)
- **Developer Docs** — Agent-first documentation with curl/Python/JS/TS examples and copy-as-markdown

### Web Workspace
- **BlockSuite WYSIWYG Editor** — Real-time preview with syntax highlighting
- **AI Chat** — Document Q&A, summarization, and content transformation
- **AI Skills** — 51 specialized AI prompt templates for Markdown workflows
- **20+ Format Conversions** — PDF, Word, Excel, HTML, EPUB, JSON, CSV, YAML → Markdown and back
- **Image Export** — Twitter long-form images, LinkedIn carousel PDFs
- **Content Capture** — Export ChatGPT, Claude, and Gemini conversations to Markdown

## Pricing

### API (for developers)

| Plan | Price | Pages/month |
|------|-------|-------------|
| Free | $0 | 10 API pages + 50 Web pages (separate quotas) |
| Pro API | $29/mo | 2,500 pages (includes useLlm, priority queue, webhooks) |

### Web (for non-developers)

| Plan | Price | Credits |
|------|-------|---------|
| Free | $0 | 50 credits on signup + daily check-in (CN) |
| Pro | $8.9/mo | 3,000 credits per purchase |

See [justmarkdown.com/pricing](https://justmarkdown.com/pricing) for details.

## Tech Stack

- **Framework:** Next.js
- **Auth:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Editor:** BlockSuite (AFFiNE) + CodeMirror
- **OCR Engine:** PaddleOCR (PP-StructureV3 + PaddleOCR VL)
- **Hosting:** Cloudflare (OpenNext)
- **Payments:** Waffo / Creem / Zpay
- **i18n:** English, 中文, Deutsch, 日本語

## Links

- **Website:** [justmarkdown.com](https://justmarkdown.com)
- **Developer Docs:** [justmarkdown.com/developers](https://justmarkdown.com/developers)
- **Pricing:** [justmarkdown.com/pricing](https://justmarkdown.com/pricing)
- **Contact:** hi@justmarkdown.com
- **Full source (private):** [newer027/justmarkdown-src](https://github.com/newer027/justmarkdown-src)

## License

[MIT](https://opensource.org/licenses/MIT)
