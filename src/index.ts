#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { loadDotEnv } from "./env.js";
import { createServer } from "./server.js";

loadDotEnv();

const server = createServer(loadConfig());
const transport = new StdioServerTransport();

await server.connect(transport);
