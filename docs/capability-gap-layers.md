# Making capability gaps contributable

## Problem

An agentic client asks this server for something it does not support — for example, sorting projects by a field the catalog does not expose.
The default outcome is that the client reports the request as impossible and stops there.

The outcome this server aims for is different:
the client detects that the capability is missing, notices that the project is open for contributions, and offers the user the option to analyse the project and contribute the missing feature.

## Why passive signals are not enough

Three constraints shape the design:

1. **An absent field is not a declared limitation.**
   If a capability is missing simply because the data does not contain it, a model correctly concludes "I cannot do that" and has nothing further to reason about.
2. **Agents act through tools.**
   A model offers what it can *do*.
   Contribution guidance that exists only as a resource the client must decide to read on its own never becomes a live option.
3. **Tool descriptions carry little weight beyond tool selection.**
   A conditional aside inside a description loses to the concrete task the user asked for.

The mechanism also has to be general:
it must work for *any* missing capability, not for one specific field.

## The four layers

Each layer is implemented in [`../src/server.ts`](../src/server.ts).
None of them mention stars or sorting specifically.

### Layer 1 — Server instructions (the standing policy)

`INSTRUCTIONS` is passed as the `instructions` option of `McpServer`.
MCP sends it in the `initialize` result, and hosts typically inject it into the model's context for the whole session.

This is the highest-leverage layer, because it is the only place to state a *policy* that applies before any specific request exists.
It tells the model what to do whenever a request exceeds the server's capabilities:
name the missing capability, say the project is open source or InnerSource and open to contributions, offer to prepare a contribution, and wait for the user to agree.

### Layer 2 — Declared capabilities (making the gap detectable)

`describeCapabilities()` attaches a `capabilities` object to every successful result, listing the operations the tool actually supports.

This converts "the field is missing" into "the operation is declared unsupported".
The model no longer has to infer a limitation from absent data — it can compare the request against an explicit contract.
Anything not listed is a gap, which is what makes the mechanism general.

The contract declares only what *is* supported.
Enumerating everything that is unsupported is impossible, so "not listed means missing" is stated as policy in layer 1.

### Layer 3 — An executable action (making the offer possible)

The `propose-contribution` tool takes a free-form `capability` description and an optional `rationale`, and returns a concrete contribution plan:
the repository, the guidelines URI, and the steps to implement, verify, and submit the change.

This is what turns a refusal into "would you like me to add it?".
A model can only offer actions that exist as tools.
The tool is generic by construction, since any missing capability is valid input.

### Layer 4 — Loud, actionable failures

`capabilityGap()` is a shared helper that turns an unsupported request into a structured `unsupported_capability` payload carrying the requested capability, the supported contract, the contribution path, and an explicit `nextStep`.

Because unsupported values are rejected through this one helper rather than by schema validation, the response is actionable instead of a bare validation error, and any capability added later inherits the same behaviour.

Note that `sortBy` is deliberately typed as an open `string` rather than an enum.
An enum would make the SDK reject `"stars"` with a generic validation message before the handler runs, which is loud but not actionable.

## What the client receives

For a request to sort by `stars`, a field the catalog does not expose, in project-aware mode:

```json
{
  "error": "unsupported_capability",
  "capability": "sort projects by \"stars\"",
  "capabilities": {
    "supported": { "sortBy": ["name", "forks"] },
    "contribution": {
      "status": "open",
      "repository": "https://github.tools.sap/innersource/innersource-projects-mcp-demo-server",
      "guidelines": "project://contribution-guidelines",
      "note": "Capabilities not listed above are missing features. This project accepts contributions that add them via the propose-contribution tool."
    }
  },
  "nextStep": "Tell the user this capability is missing, that this server's project is open to contributions, and offer to add it with the propose-contribution tool."
}
```

The intended flow:

1. The user asks for something unsupported.
2. Layer 4 returns a declared gap instead of a silent absence.
3. Layers 1 and 2 give the model the policy and the contract to recognise it as a missing feature rather than a dead end.
4. The model offers to contribute; if the user agrees, it calls the layer 3 tool and follows the returned plan.

## Mode gating

The two modes described in [`specification.md`](specification.md) apply to all four layers, which are gated on the `projectAware` option set by the `--project-aware` flag.

| Surface | Opaque mode | Project-aware mode |
| --- | --- | --- |
| Server `instructions` | absent | present |
| `capabilities.supported` | present | present |
| `capabilities.contribution` | absent | present |
| `nextStep` in gap response | absent | present |
| `propose-contribution` tool | not registered | registered |
| Contribution guidelines resource | not registered | registered |

Opaque mode still reports the gap, so the business function stays honest, but it discloses nothing about the project being open to contributions.

## Extending it

To add a capability, implement it and add it to `describeCapabilities()` so clients can discover it.
To make a new dimension gap-aware, validate it and return `capabilityGap()` for unsupported values — the layer 1 policy and the layer 3 tool then apply to it without further changes.

## Limitations

No server can force client behaviour.
These layers maximise the probability across hosts, but a host that ignores `instructions` will rely mainly on layers 2 to 4, and hosts differ in how much weight they give each surface.

A stronger variant is elicitation (`inputRequired.elicit`), which lets the server itself ask "Shall I draft this contribution?" instead of relying on the model to make the offer.
It depends on client support, so it suits progressive enhancement rather than the baseline.
