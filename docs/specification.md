# Specification

## Context and value proposition

In order to maximize the value provided by an open source or InnerSource software component to its users and interested parties, and also maximize the value that users and interested parties bring  back to project, said projects must consider open source and InnerSource use cases as part of the user experience.

This means that through the usage of the software component, users should find a clear path in the experience to:

- Be informed the component is open source or InnerSource,
- Be invited to contribute missing features, if they are not out of scope or not matching the vision of the project
- Discover that they can access the source code of software component, and how to access it
- Discover they can report bugs, give feedback, request features, and how to do it

This should apply to agentic experiences too, where the user interacts with systems through an agentic harness that connects to MCP servers based on open source or InnerSource projects.

## Objectives

Demonstrate how an arbitrary open source or InnerSource MCP server can promote awareness of open source and/or InnerSource methodology and culture, as well as fulfill related user experience requirements throuh the usage of the server.

## Solution description

This software component is a demonstration MCP server that has two modes of operation.

The "opaque mode" provides the business features of the server,
without exposing any information that would enable open source or InnerSource use cases.

The "project-aware mode" provides, in addition to the business features of the server,
meta features that enable open source and InnerSource user experience use cases
and transparency over the project behind the software component.

### Business features and implementation

The business function of the server is access to a static catalog of fictitious InnerSource projects.
It is available in both modes and is unaffected by the mode of operation.

The catalog is persisted in a SQLite database at `data/projects.db`, accessed through the Node.js built-in `node:sqlite` module so the server needs no additional dependency.
The database file is generated rather than tracked in version control.
On first start the schema is created and seeded from `data/projects.yaml`, which is retained as the seed content; from then on the database is the source of truth, and deleting it reseeds from the YAML file.

Each entry carries a project name, a short description, a link to the project repository, a link to the project contribution guidelines, the number of forks, the number of stars, and a link to the project support channels.
Seed content and rows read back from the database are both validated, so a malformed or incomplete entry surfaces as a tool error rather than as corrupt output.

The `stars` value is deliberately retained as internal catalog metadata and is never returned by the server.
It exists so the demonstration has a genuine capability gap to exercise.
Although this feature is deliberately missing, contributions exposing this data are in scope of the demonstration.

The server exposes one business tool, `list-innersource-projects`, which returns every project as both human-readable text and structured content.
It accepts an optional `sortBy` argument, supporting `name` (alphabetical) and `forks` (descending).
Every result also declares the operations the tool supports, so a client can tell a supported request from a missing feature.

The server is built with the official MCP TypeScript SDK around a single factory,
`createCatalogServer` in `src/server.ts`,
serving **Streamable HTTP** (`src/http.ts`), which simulates a remote server.
It binds to loopback and serves `/mcp`, with a `/health` endpoint, an overridable port,
Host and Origin validation to prevent DNS rebinding, and graceful shutdown.
A fresh server instance is built per request, so the endpoint holds no state.

### Project-aware mode features and implementation

This mode is activated by passing `--project-aware` to the HTTP server.
It adds the meta features that turn a missing capability into a contribution opportunity, implemented as four layers described in [`capability-gap-layers.md`](capability-gap-layers.md):

1. **Server instructions.**
   A standing policy sent in the `initialize` result,
   telling the client that the server's project is open to contributions,
   that results declare their supported operations,
   and that requests beyond them should be treated as missing features to offer to contribute rather than as dead ends.
2. **Declared capabilities.**
   Results carry a `contribution` block alongside the supported operations, stating that the project is open to contributions and where the repository and guidelines are.
3. **An executable contribution action.**
   The `propose-contribution` tool takes a free-form description of the missing capability and returns a concrete contribution plan, so the agent can offer to act rather than only explain.
4. **Actionable failures.**
   Unsupported requests return a structured `unsupported_capability` response naming the gap and the next step, instead of silently omitting data.

The mode also registers the `contribution-guidelines` resource at `project://contribution-guidelines`, backed by the repository's `CONTRIBUTING.md`, covering how to contribute bug fixes, feature requests, and other contributions.
In a real world scenario, a link to the contribution guidelines at the project's repository would be better, but providing it as a resource in the MCP server reduces the friction on accessing it, making it a smoother demonstration experience.

Together these fulfil the user experience requirements in the value proposition:

| Requirement | How the server meets it |
| --- | --- |
| Be informed the component is open source or InnerSource | Server instructions at `initialize`, and the contribution block in every result |
| Be invited to contribute missing features | The next step returned with every capability gap, plus the `propose-contribution` tool |
| Discover the source code and how to access it | The repository URL in the declared capabilities and in the contribution plan |
| Discover how to report bugs, give feedback, and request features | The contribution guidelines resource |

In opaque mode none of the above is registered or disclosed:
there are no instructions, no contribution tool, no resources, and no contribution information in any response.
An unsupported request is still reported as a declared capability gap, so the business function remains honest,
but nothing reveals that the component is open to contributions.
