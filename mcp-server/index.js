#!/usr/bin/env node
/**
 * justmarkdown — one package, two entry points.
 *
 * Default (no arguments, or `mcp` / `serve`): start the MCP stdio bridge.
 * MCP clients that only speak stdio (Claude Desktop, some IDE agents) can run
 * this package to reach the same tools as the hosted Streamable HTTP endpoint
 * at https://justmarkdown.com/api/mcp:
 *
 *   convert_url, convert_base64, request_upload_url, convert_upload,
 *   list_supported_formats, usage_status
 *
 * `justmarkdown convert <file|url|->`: turn a document, a public URL, or stdin
 * into Markdown from a terminal or CI job.
 *
 * The package does no conversion and no local rendering of its own: both entry
 * points call the hosted endpoint. One tool surface, one billing path, one
 * place to fix bugs. Network access is required.
 *
 * Configuration:
 *   JUSTMARKDOWN_API_KEY  optional `jm_live_…` key (anonymous free tier otherwise)
 *   JUSTMARKDOWN_MCP_URL  optional endpoint override (default the hosted /api/mcp)
 *   API_BASE              legacy alias for JUSTMARKDOWN_MCP_URL
 */
import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, resolve } from 'node:path'
import process from 'node:process'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

const VERSION = pkg.version
const DEFAULT_ENDPOINT = 'https://justmarkdown.com'
const CLIENT_HEADER = 'x-jm-mcp-client'
const CLIENT_VERSION_HEADER = 'x-jm-mcp-client-version'

/** Mirrors lib/mcp/limits.ts; keep in sync if the server limits change. */
const MAX_BASE64_BYTES = {
  anonymous: 4 * 1024 * 1024,
  account: 6 * 1024 * 1024,
}
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

const INSTRUCTIONS =
  'Convert documents and web pages to Markdown through JustMarkdown. ' +
  'Use convert_url for anything reachable by a public http(s) URL; convert_base64 for file bytes held by the client. ' +
  'Anonymous callers get a small number of text conversions per day; an API key (JUSTMARKDOWN_API_KEY) bills 1 credit per conversion, unlocks OCR, and enables large uploads.'

function resolveEndpoint(explicit) {
  const raw = (
    explicit ||
    process.env.JUSTMARKDOWN_MCP_URL ||
    process.env.MCP_URL ||
    process.env.API_BASE ||
    DEFAULT_ENDPOINT
  )
    .trim()
    .replace(/\/+$/, '')
  return raw.endsWith('/api/mcp') ? raw : `${raw}/api/mcp`
}

function resolveApiKey(explicit) {
  return (
    explicit ||
    process.env.JUSTMARKDOWN_API_KEY ||
    process.env.JM_API_KEY ||
    process.env.JUSTMD_API_KEY ||
    ''
  ).trim()
}

function printHelp() {
  process.stdout.write(`justmarkdown ${VERSION}

Convert documents and web pages to Markdown through the hosted JustMarkdown engine.

Usage:
  justmarkdown                       Start the MCP stdio server (default)
  justmarkdown mcp                   Start the MCP stdio server
  justmarkdown convert <input>       Convert a file, URL, or - for stdin
  justmarkdown --version             Print the version
  justmarkdown --help                Print this help

convert options:
  -o, --output <path>                Write Markdown to a file (default: stdout)
      --json                         Print the raw result JSON instead
      --filename <name>              File name to use for stdin (default: stdin.txt)
      --api-key <key>                API key (or JUSTMARKDOWN_API_KEY)
      --endpoint <url>               Endpoint override (or JUSTMARKDOWN_MCP_URL)

Examples:
  justmarkdown convert ./paper.pdf -o paper.md
  justmarkdown convert https://example.com/report.pdf -o report.md
  justmarkdown convert ./scan.pdf --api-key "$JUSTMARKDOWN_API_KEY"
  cat notes.txt | justmarkdown convert - --filename notes.txt

Notes:
  - The CLI is a thin client for the hosted endpoint; it needs network access.
  - Anonymous use is limited to a few text conversions per day. Scanned-PDF
    OCR and files over the base64 limit need an API key.
  - create a key: https://justmarkdown.com/settings?section=apiKeys
`)
}

function printVersion() {
  process.stdout.write(`${VERSION}\n`)
}

/* -------------------------------------------------------------------------- */
/* MCP stdio bridge                                                           */
/* -------------------------------------------------------------------------- */

async function runMcp() {
  const { Server } = await import('@modelcontextprotocol/sdk/server/index.js')
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
  const { StreamableHTTPClientTransport } = await import(
    '@modelcontextprotocol/sdk/client/streamableHttp.js'
  )
  const { CallToolRequestSchema, ListToolsRequestSchema } = await import(
    '@modelcontextprotocol/sdk/types.js'
  )

  const ENDPOINT = resolveEndpoint()
  const API_KEY = resolveApiKey()

  const server = new Server(
    { name: 'justmarkdown', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  )

  let remote = null
  let connecting = null

  async function connectRemote() {
    const headers = {
      [CLIENT_HEADER]: 'mcp-stdio',
      [CLIENT_VERSION_HEADER]: VERSION,
    }
    if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`

    const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
      requestInit: { headers },
    })
    const client = new Client(
      { name: 'justmarkdown-stdio-bridge', version: VERSION },
      { capabilities: {} },
    )
    await client.connect(transport)
    return client
  }

  function getRemote() {
    if (remote) return Promise.resolve(remote)
    if (!connecting) {
      connecting = connectRemote()
        .then((client) => {
          remote = client
          return client
        })
        .finally(() => {
          connecting = null
        })
        .catch((error) => {
          remote = null
          throw new Error(
            `Cannot reach the JustMarkdown MCP endpoint at ${ENDPOINT}: ${error?.message ?? error}. ` +
              'Check your network connection, or set JUSTMARKDOWN_MCP_URL to a reachable deployment.',
          )
        })
    }
    return connecting
  }

  function dropRemote() {
    if (!remote) return
    const stale = remote
    remote = null
    Promise.resolve(stale.close()).catch(() => {})
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const client = await getRemote()
    const { tools, nextCursor } = await client.listTools()
    return nextCursor ? { tools, nextCursor } : { tools }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const client = await getRemote()
      return await client.callTool(request.params)
    } catch (error) {
      // A thrown error means the remote session is unusable (network drop, 401,
      // …), whereas a tool-level failure comes back as a normal `isError` result.
      // Drop the connection so the next call re-initializes.
      dropRemote()
      return {
        content: [
          {
            type: 'text',
            text: `JustMarkdown MCP bridge error: ${error?.message ?? error}`,
          },
        ],
        isError: true,
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value)
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function createCliClient(apiKey, endpoint) {
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
  const { StreamableHTTPClientTransport } = await import(
    '@modelcontextprotocol/sdk/client/streamableHttp.js'
  )

  const headers = {
    [CLIENT_HEADER]: 'cli',
    [CLIENT_VERSION_HEADER]: VERSION,
  }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit: { headers },
  })
  const client = new Client(
    { name: 'justmarkdown-cli', version: VERSION },
    { capabilities: {} },
  )
  await client.connect(transport)
  return client
}

function parseToolResult(result) {
  const text = result?.content?.[0]?.text
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (result?.isError) {
    const error = new Error(payload?.error || text || 'Conversion failed.')
    error.payload = payload
    throw error
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('The endpoint returned an unexpected response.')
  }
  return payload
}

async function callTool(client, name, args) {
  const result = await client.callTool({ name, arguments: args })
  return parseToolResult(result)
}

function expectMarkdown(payload) {
  if (typeof payload.markdown !== 'string') {
    throw new Error('The endpoint returned no Markdown.')
  }
  return payload
}

async function convertBuffer(client, buffer, filename, apiKey) {
  const tier = apiKey ? 'account' : 'anonymous'
  const limit = MAX_BASE64_BYTES[tier]

  if (buffer.byteLength <= limit) {
    const payload = await callTool(client, 'convert_base64', {
      filename,
      content_base64: buffer.toString('base64'),
    })
    return expectMarkdown(payload)
  }

  if (!apiKey) {
    throw new Error(
      `File is ${formatMb(buffer.byteLength)}, over the anonymous ${formatMb(limit)} base64 limit. ` +
        'Add --api-key, convert it with the web app, or pass a public URL.',
    )
  }
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is ${formatMb(buffer.byteLength)}, over the ${formatMb(MAX_UPLOAD_BYTES)} upload limit.`,
    )
  }

  const transfer = await callTool(client, 'request_upload_url', {
    filename,
    size_bytes: buffer.byteLength,
  })
  if (!transfer.upload_url || !transfer.file_key) {
    throw new Error('The endpoint did not return an upload URL.')
  }

  const upload = await fetch(transfer.upload_url, { method: 'PUT', body: buffer })
  if (!upload.ok) {
    throw new Error(`Upload failed with HTTP ${upload.status}. Try again before the URL expires.`)
  }

  const payload = await callTool(client, 'convert_upload', {
    file_key: transfer.file_key,
    filename,
  })
  return expectMarkdown(payload)
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks)
}

function defaultStdinFilename(buffer) {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-' ? 'stdin.pdf' : 'stdin.txt'
}

function parseConvertArgs(args) {
  const options = {
    input: null,
    output: null,
    json: false,
    apiKey: resolveApiKey(),
    endpoint: resolveEndpoint(),
    filename: null,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '-o' || arg === '--output') {
      options.output = args[++index]
      if (!options.output) throw new Error(`${arg} needs a path.`)
    } else if (arg === '--json') {
      options.json = true
    } else if (arg === '--api-key') {
      options.apiKey = resolveApiKey(args[++index])
      if (!options.apiKey) throw new Error('--api-key needs a value.')
    } else if (arg === '--endpoint') {
      options.endpoint = resolveEndpoint(args[++index])
    } else if (arg === '--filename') {
      options.filename = args[++index]
      if (!options.filename) throw new Error('--filename needs a value.')
    } else if (arg === '-h' || arg === '--help') {
      printHelp()
      process.exit(0)
    } else if (arg === '-') {
      options.input = '-'
    } else if (!arg.startsWith('-') && options.input === null) {
      options.input = arg
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  if (options.input === null) {
    throw new Error('Missing input. Pass a file, a public URL, or - for stdin.')
  }
  return options
}

async function writeResult(payload, options) {
  const text = options.json ? JSON.stringify(payload, null, 2) : expectMarkdown(payload).markdown
  const withNewline = text.endsWith('\n') ? text : `${text}\n`

  if (options.output && options.output !== '-') {
    await writeFile(resolve(options.output), withNewline, 'utf8')
  } else {
    process.stdout.write(withNewline)
  }

  if (!options.json && payload.truncated) {
    process.stderr.write(
      'Warning: the result was truncated by the endpoint. Use the web app for the full document.\n',
    )
  }
}

async function runCli(args) {
  const options = parseConvertArgs(args)
  const client = await createCliClient(options.apiKey, options.endpoint)

  let payload
  if (options.input === '-') {
    const buffer = await readStdin()
    if (buffer.length === 0) throw new Error('No data received on stdin.')
    payload = await convertBuffer(
      client,
      buffer,
      options.filename || defaultStdinFilename(buffer),
      options.apiKey,
    )
  } else if (isHttpUrl(options.input)) {
    payload = expectMarkdown(
      await callTool(client, 'convert_url', { url: options.input }),
    )
  } else {
    const buffer = await readFile(resolve(options.input))
    payload = await convertBuffer(client, buffer, basename(options.input), options.apiKey)
  }

  await writeResult(payload, options)
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

async function main() {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === 'mcp' || command === 'serve' || command === '--stdio') {
    await runMcp()
    return
  }
  if (command === '-h' || command === '--help' || command === 'help') {
    printHelp()
    return
  }
  if (command === '-v' || command === '--version' || command === 'version') {
    printVersion()
    return
  }
  if (command === 'convert') {
    await runCli(rest)
    return
  }

  process.stderr.write(`Unknown command: ${command}\n\n`)
  printHelp()
  process.exitCode = 1
}

main().catch((error) => {
  const message = error?.message ?? String(error)
  if (error?.payload?.code) {
    process.stderr.write(`justmarkdown: ${message} (${error.payload.code})\n`)
  } else {
    process.stderr.write(`justmarkdown: ${message}\n`)
  }
  process.exitCode = 1
})
