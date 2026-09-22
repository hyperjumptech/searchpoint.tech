import { it, expect } from "vitest";

import catalog from "@/contracts/mcp/catalog.json";
import toolsListFixture from "@/contracts/mcp/fixtures/tools_list.shared.json";
import initializeFixture from "@/contracts/mcp/fixtures/initialize.json";
import protocol from "@/contracts/mcp/protocol.json";
import { handleMcpRequest } from "@/lib/mcp-protocol";
import { toolsList } from "@/lib/mcp-tools";

it("web tools/list names match shared catalog", () => {
  const names = toolsList()
    .map((t) => t.name)
    .sort();
  expect(names).toEqual([...toolsListFixture.toolNames].sort());
  const fromCatalog = catalog.tools
    .filter((t) => t.visibility === "shared")
    .map((t) => t.name)
    .sort();
  expect(names).toEqual(fromCatalog);
});

it("web advertised inputSchema matches catalog for every shared tool", () => {
  for (const cat of catalog.tools.filter((t) => t.visibility === "shared")) {
    const web = toolsList().find((t) => t.name === cat.name);
    expect(web, cat.name).toBeDefined();
    expect(web!.description).toBe(cat.description);
    expect(web!.inputSchema).toEqual(cat.inputSchema);
  }
});

it("initialize matches contract fixture", async () => {
  const res = await handleMcpRequest(
    JSON.stringify(initializeFixture.request),
    "scse-9",
  );
  expect(res.httpStatus).toBe(200);
  expect(res.body).toEqual({
    jsonrpc: "2.0",
    id: initializeFixture.request.id,
    result: initializeFixture.result,
  });
});

it("protocol error codes in initialize/serverInfo come from protocol.json", () => {
  expect(protocol.serverInfo).toEqual({
    name: "searchpoint-mcp",
    version: "0.1.0",
  });
  expect(protocol.errors.unknownTool).toBe(-32601);
  expect(protocol.errors.invalidParams).toBe(-32602);
});
