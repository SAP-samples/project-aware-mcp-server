import { createServer } from "http";

import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";

import { createCatalogServer } from "./server.js";

try {
  process.loadEnvFile();
} catch {
  // .env file is optional
}

const host = "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const projectAware = process.argv.includes("--project-aware");
const forkUrl = process.env.FORK_URL;
const mcpHandler = createMcpHandler(() =>
  createCatalogServer({ projectAware, forkUrl }),
);
const nodeHandler = toNodeHandler(mcpHandler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

const httpServer = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;

  if (pathname === "/health" && request.method === "GET") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (pathname !== "/mcp") {
    response.writeHead(404).end();
    return;
  }

  if (!validateHost(request, response) || !validateOrigin(request, response)) {
    return;
  }

  void nodeHandler(request, response);
});

httpServer.listen(port, host, () => {
  console.error(`InnerSource catalog MCP server listening on http://${host}:${port}/mcp`);
});

async function shutdown(): Promise<void> {
  await mcpHandler.close();
  httpServer.close(() => process.exit(0));
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());