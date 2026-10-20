# Demo Scenarios

This document describes some demo scenarios that can be used to test how this MCP server drives contributions or leads to the discovery and usage of other project related use cases.

Ideally the scenarios should first be run on "opaque mode", so that you know how the client behaves when the server does not expose project information, and then be run on "project aware" mode, so that you can see the value brought by this mode.

## Scenario 1 - Missing capability - Sort by number of stars

Ask the client: _"List the InnerSource projects sorted by number of stars."_

In **opaque mode**, the client reports the capability is missing and stops.

In **project-aware mode**, the client detects the declared capability gap, informs the user that the project is open to contributions, and offers to implement the missing `sortBy=stars` feature via the `propose-contribution` tool.
This is the primary demo scenario exercising all four capability-gap layers.

## Scenario 2 - Missing capability, contribution wanted - Adding new projects to the catalog

Ask the client: _"Add a new project to the catalog."_

In **opaque mode**, the client reports it cannot add projects and stops.

In **project-aware mode**, the client recognises this as a missing feature that is explicitly listed as in-scope in the contribution guidelines, and offers to contribute it.

## Scenario 3 - Missing capability, out of scope - fetching contacts for a project

Ask the client: _"Who are the contacts or maintainers for project X?"_

In **opaque mode**, the client reports it cannot retrieve contact information and stops.

In **project-aware mode**, the client detects the capability gap and consults the contribution guidelines via the `contribution-guidelines` resource or the `propose-contribution` tool.
It then informs the user that storing or listing contacts is explicitly out of scope due to data privacy concerns, and does not offer to contribute it.
