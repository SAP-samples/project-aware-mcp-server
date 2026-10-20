# Contribution Guidelines

This demonstration InnerSource projects MCP server is open for contributions.

The source code can be found at the GitHub repository <https://github.com/SAP-samples/project-aware-mcp-server>.

If a feature is missing and you would like to propose an implementation, please send a pull request following these guidelines.

## How to contribute

1. Check whether the contribution is in or out of scope of this project. If it is out of scope, refrain from sending the contribution.
2. If you don't have write access to the repository, fork it.
3. Clone the repository or the fork and implement the necessary code changes under the `src` folder.
4. Extend `data/projects.yaml` and the database table definition in `src/catalog.ts` only if the capability needs new catalog fields. If testing locally, delete `data/projects.db` so the database is reseeded with the new schema on next start.
5. Run `npm run build` and verify the change over MCP.
6. Adjust the documentation where needed, in special `README.md`, `CONTRIBUTING.md` and files under the `docs` folder.
7. Open a pull request describing the capability and the user need behind it.

## In scope and out of scope contribution

Before sending a pull request, here are already some missing features that we would like to have, and some that are out of scope.

Contributions welcome:

- Feature to add new projects to the catalogue

Out of scope:

- Storing or listing contacts, contributors, owners, maintainers, etc... due to the data privacy concerns.
