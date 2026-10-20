# Project Aware Demonstration MCP Server

## About this project

This repository contains the source code of a MCP server that demonstrates how the open source or InnerSource[^innersource] use case of driving contributions of missing features to the project can be incorporated in the user experience of the server.

It is primarily designed to run over streamable HTTP, simulating a remote server.

The "business" use case it simulates is that of a catalog of InnerSource projects.
It comes with a predefined and fictious list of projects.

The server can be run in an _opaque_ mode (default), where only business features are exposed, and a _project aware_ mode, where the server exposes project information that should lead to the contribution of missing features.

**Example**:

The server does not expose the number of _stars_ of the listed projects, thus, it is not possible to sort by stars.

On _opaque_ mode, when a user asks "list the innersource projects sorted by stars", the agentic client simply says it is not possible.

On _project aware_ mode, the agentic client notices the feature is missing, but is made aware that the project behind the MCP server is open for contributions. It offers to the user the possibility of contributing, and, given pre-requisites are met (e.g., the agentic client can access the project repository), implements the missing feature and proposes it through a Pull Request.

Refer to [demo-scenarios.md](docs/demo-scenarios.md) for other examples.

[^innersource]: InnerSource is the practice of applying Open Source methodologies, culture and best practices to in-house software development. You can learn more about it at <https://innersourcecommons.org>.

## Requirements and Setup

This project requires:

- Node.js 22.5 or newer, for the built-in `node:sqlite` module
- An agentic MCP client (e.g., Joule Work Desktop, Open Code, Claude Code, etc.)

To use project-aware mode and have the client contribute missing features, the client also needs access to the source code repository of this project.

### Fork the repository

Demo scenarios in project-aware mode can lead to the creation of pull requests.
To avoid pull requests being sent to the upstream repository, **fork this repository** before running demo scenarios.

Set the `FORK_URL` environment variable to your fork's URL so the server points the agentic client to your fork.

Alternatively, create a `.env` file in the project root (it is git-ignored):

```sh
FORK_URL=https://github.com/your-org/your-fork
```

When `FORK_URL` is set, the server replaces the upstream repository URL with your fork's URL in the contribution guidelines it serves to the agentic client.

### Run

```sh
npm install
npm run dev
```

Set a different port when needed, e.g.:

```sh
PORT=8080 npm run dev
```

The MCP endpoint is available at `http://127.0.0.1:3000/mcp`, with a health check at `http://127.0.0.1:3000/health`.

Configure your web-capable MCP client with the server information.

The server binds to loopback and validates local Host and Origin headers.
This makes it suitable for simulating a remote MCP endpoint on the local machine without exposing the unauthenticated demo catalog to the network.

For the compiled server, use `npm run build` followed by `npm start`.

To run the server in project-aware mode, pass the `--project-aware` option through npm:

```sh
npm run dev -- --project-aware
```

To run the server for a forked repository, run:

```sh
FORK_URL=https://github.com/your-org/your-fork npm run dev -- --project-aware
```

The same flag works with the compiled server:

```sh
npm start -- --project-aware
```

The `list-innersource-projects` tool returns every project with its repository and contribution guidelines URLs in both modes.

For a description of demonstration scenarios, check [`docs/demo-scenarios.md`](docs/demo-scenarios.md).

## Maintain the catalog

Projects are persisted in a SQLite database at `data/projects.db`, which is generated and not tracked in git.
On first start the database is created and seeded from `data/projects.yaml`;
afterwards the database is the source of truth and the YAML file is only used as seed content.

To change the seed content, edit `data/projects.yaml`.
Each entry requires these fields:

```yaml
- name: Project name
  description: A short description of the project.
  repository: https://github.com/example-org/project
  contributionGuidelines: https://github.com/example-org/project/blob/main/CONTRIBUTING.md
  forks: 12
  stars: 120
  supportChannels: https://example.org/support/project
```

Delete `data/projects.db` to reseed from the YAML file on the next start.

Invalid or missing fields are reported as an MCP tool error.
The `stars` value is deliberately retained as internal catalog metadata and is not returned by the MCP server.
This is done to easily enable a demonstration where a contribution implements the feature supporting number of stars, and the server can already serve that data after the implementation is incorporated.

## Inspect the server

```sh
npx @modelcontextprotocol/inspector
```

In the Inspector, select Streamable HTTP and connect to `http://127.0.0.1:3000/mcp`.

## Further Documentation

Refer to the files under the [`docs`](docs) folder.

Here is a description of the existing files:

- [`docs/specification.md`](docs/specification.md) — context, value proposition, objectives, and a full description of the opaque and project-aware modes.
- [`docs/capability-gap-layers.md`](docs/capability-gap-layers.md) — explains the four layers that turn a missing capability into a contribution opportunity.
- [`docs/demo-scenarios.md`](docs/demo-scenarios.md) — step-by-step scenarios for demonstrating the server in both modes.
- [`docs/notes-by-humans.md`](docs/notes-by-humans.md) — background history and observations written by the project authors.

## Agentic engineering tools usage

This project was created with the assistance of the following tools:

- GitHub Copilot
- Claude Code

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/SAP-samples/project-aware-mcp-server). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, the project structure, as well as additional contribution information, see our [Contribution Guidelines](CONTRIBUTING.md).

## Security / Disclosure

If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/SAP-samples/project-aware-mcp-server/security/policy) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP-samples/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2026 SAP SE or an SAP affiliate company and project-aware-mcp-server contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/SAP-samples/project-aware-mcp-server).
