import { readFile } from "fs/promises";

import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { readProjects } from "./catalog.js";

interface CatalogServerOptions {
  projectAware?: boolean;
  forkUrl?: string;
}

const CONTRIBUTION_REPOSITORY =
  "https://github.com/SAP-samples/project-aware-mcp-server";
const CONTRIBUTION_GUIDELINES_URI = "project://contribution-guidelines";

/** Operations the catalog tool implements; anything else is a capability gap. */
const SORTABLE_FIELDS = ["name", "forks"] as const;

type SortableField = (typeof SORTABLE_FIELDS)[number];

const INSTRUCTIONS = `This server exposes a project catalog. The server itself is open to contributions.

Every result from this server declares the operations it supports. Treat any
request that is not covered by those declared capabilities as a missing feature
rather than a dead end.

When the user asks for something this server cannot do:
1. Read the contributions guidelines from the resource ${CONTRIBUTION_GUIDELINES_URI}.
2. If the capability can be added to the project:
  a. Briefly state which capability is missing.
  b. Tell the user that this server is a project that is open to contributions.
  c. Offer to analyse the server's source code and prepare a contribution that adds the missing capability.

If the user accepts, proceed with the contribution.
Do not start a contribution before the user agrees.`;

function describeCapabilities(projectAware: boolean, forkUrl?: string) {
  return {
    supported: { sortBy: [...SORTABLE_FIELDS] },
    ...(projectAware
      ? {
          contribution: {
            status: "open",
            repository: forkUrl ?? CONTRIBUTION_REPOSITORY,
            guidelines: CONTRIBUTION_GUIDELINES_URI,
            note: "Capabilities not listed above may be missing features. This project accepts contributions that follow the contribution guidelines.",
          },
        }
      : {}),
  };
}

/** Turns any unsupported request into a declared, actionable capability gap. */
function capabilityGap(capability: string, projectAware: boolean, forkUrl?: string) {
  const payload = {
    error: "unsupported_capability",
    capability,
    capabilities: describeCapabilities(projectAware, forkUrl),
    ...(projectAware
      ? {
          nextStep:
            "Tell the user this capability is missing, that this server's project is open to contributions, and offer to add it with the propose-contribution tool.",
        }
      : {}),
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    isError: true,
  };
}

export function createCatalogServer(options: CatalogServerOptions = {}): McpServer {
  const projectAware = options.projectAware ?? false;
  const forkUrl = options.forkUrl;
  const server = new McpServer(
    {
      name: "innersource-projects-catalog",
      version: "1.0.0",
    },
    projectAware ? { instructions: INSTRUCTIONS } : {},
  );

  server.registerTool(
    "list-innersource-projects",
    {
      description: [
        "List InnerSource projects, their popularity, and contribution and support links.",
        `Sorting is supported only for: ${SORTABLE_FIELDS.join(", ")}.`,
        "Every result declares the operations this tool supports in its `capabilities` field.",
        ...(projectAware
          ? [
              "Any request outside those capabilities is a missing feature that this project may accept contributions for.",
            ]
          : []),
      ].join(" "),
      inputSchema: z.object({
        sortBy: z
          .string()
          .optional()
          .describe(`Field to sort projects by. Supported: ${SORTABLE_FIELDS.join(", ")}.`),
      }),
    },
    async ({ sortBy }) => {
      try {
        if (sortBy !== undefined && !SORTABLE_FIELDS.includes(sortBy as SortableField)) {
          return capabilityGap(`sort projects by "${sortBy}"`, projectAware, forkUrl);
        }

        const catalog = await readProjects();
        const projects = catalog.map(({ stars: _stars, ...project }) => project);

        if (sortBy === "name") {
          projects.sort((left, right) => left.name.localeCompare(right.name));
        } else if (sortBy === "forks") {
          projects.sort((left, right) => right.forks - left.forks);
        }

        const result = { projects, capabilities: describeCapabilities(projectAware) };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Could not read catalog: ${message}` }],
          isError: true,
        };
      }
    },
  );

  if (projectAware) {
    server.registerTool(
      "propose-contribution",
      {
        description:
          `Start a contribution that adds a missing capability to or fixes issues with this MCP server. 
          Before calling this tool, read the contribution guidelines at ${CONTRIBUTION_GUIDELINES_URI} and check if the proposed contribution aligns with the guidelines. 
          Call this once the user has agreed to contribute the missing feature.`,
        inputSchema: z.object({
          capability: z
            .string()
            .min(1)
            .describe("The missing capability to add, described in the user's terms."),
          rationale: z.string().optional().describe("Why the user needs this capability."),
        }),
      },
      async ({ capability, rationale }) => {
        const plan = {
          capability,
          ...(rationale ? { rationale } : {}),
          repository: forkUrl ?? CONTRIBUTION_REPOSITORY,
          guidelines: CONTRIBUTION_GUIDELINES_URI,
          steps: [
            `Read the contribution guidelines at ${CONTRIBUTION_GUIDELINES_URI}.`,
            `Contribute following the contribution guidelines.`,
          ],
        };

        return {
          content: [{ type: "text", text: JSON.stringify(plan, null, 2) }],
          structuredContent: plan,
        };
      },
    );

    server.registerResource(
      "contribution-guidelines",
      CONTRIBUTION_GUIDELINES_URI,
      {
        title: "Contribution Guidelines",
        description:
          "Contributions are welcome, use this resource to find out how to contribute bug fixes, feature request or any other type of contribution.",
        mimeType: "text/markdown",
      },
      async (uri) => {
        let text = await readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8");
        if (forkUrl) {
          text = text.replaceAll(CONTRIBUTION_REPOSITORY, forkUrl);
        }
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text,
            },
          ],
        };
      },
    );
  }

  return server;
}