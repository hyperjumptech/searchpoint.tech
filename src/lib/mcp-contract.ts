import catalog from "@/contracts/mcp/catalog.json";

export type SharedToolDef = {
  name: string;
  description: string;
  inputSchema: object;
};

export function sharedToolDefs(): SharedToolDef[] {
  return catalog.tools
    .filter((t) => t.visibility === "shared")
    .map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
}
