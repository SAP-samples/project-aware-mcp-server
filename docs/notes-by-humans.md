# Notes by Humans

This file is for notes by humans only, so that the reader knows it was not written by a large language model.

## History and notes of v1.0.0

In my first attempt to get an MCP server that could drive contributions of missing features, I used GitHub Copilot to implement an MCP server that could fetch a list of InnerSource projects. The implementation left the number of stars of the project out of the API response on purpose, as this was the missing capability I wanted to use for testing. The idea was that, when run on "project aware" mode, the client would offer the possibility of contributing the feature, when the user asked it to sort the projects by number of stars.

In this first implementation, the server did only two things:

1. In the description of the tool `list-innersource-projects`, it had `If features in this tool are missing, check the contribution-guidelines resource.`
2. It exposed the CONTRIBUTING.md file as a _resource_

Tests with this setup did not provide the expected results, either in Joule Work Desktop or Claude Code. The client would not offer the possibility to contribute when I asked it to sort the projects by number of stars. It would only start a contribution flow when I as the user explicitly told it to that.

With those results at hand, I explained Co-Pilot what I was trying to achieve, and it implemented the additional features to drive contributions that are described under [specification.md](./specification.md) and [capability-gap-layers.md](capability-gap-layers.md), which were both created after the fact.

With this new implementation, the tests started to work as expected, and I further tweaked the implementation to support other scenarios, in special, to have out of scope features in the contribution guidelines.

The implementation proposed by GitHub Copilot was always funneling the flow of contributing new features into calling the tool `propose-contribution`, which had a very verbose response and dupplicated content from the contribution guidelines. I toned that funneling downs, steering into an intent of contributing missing features and refering to the contribution guidelines, and also updated the response of `propose-contribution` to simply instruct the agent to read the contribution guidelines. This tool is mostly a fallback strategy to give the agent an actionable route.

After some tests, some clients could do very well without `propose-contribution`, where others would be more likely provide the experience I wanted with it. The drawback is that clients that steered the user into contributing without needed `propose-contribution`, would end up calling it if it was present, even when that was not needed, so this is a tradeoff.
