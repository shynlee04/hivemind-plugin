
## Base OpenCode SDK - Server API methods + Custom tools build 

- references - https://opencode.ai/docs/server/ ; https://opencode.ai/docs/sdk/ ; https://opencode.ai/docs/custom-tools/ 


- by default the OpenCode platform does not allow agents opereate the "slash commands" on TUI (https://opencode.ai/docs/commands/)  meaning agents can not deterministically append clients' stored "slash commands" but requiring user to manually append it 

- the same also for the non-interactive shell commands approach by default is not very "harness-friendly

->>> Why slash commands deterministically run by agent? because commands parse, chain, and stack other primitives such as workflows, references through $ARGUMENTS and can utilize to switch agents, routing the delegations of task tools through subtask schema fields for delegation more programatically (read more carefully here https://opencode.ai/docs/commands/)

-- For actively run bash sheel commands also beneficial but let's test the slash commands first

## My interpretation toward the above short-commings

- By utilizing mainly this POST method to below to make a custom tool (I don't know if plugins and event subscription hooks are needed if it is check it under OpenCode Plugins SDK) - that allow agent (through skills load, or other injection, workflow router faeture later) or simply for testing by verbally prompt the agent to use which tool to run (a command  that is at .opencode/command(s) - for the real stuff these are dynami fetch but as for spike testing you can test with a few hard-coded of those that I have in stored) 

### The utilized method:
the current session, ()
POST	/session/:id/command	Execute a slash command	body: { messageID?, agent?, model?, command, arguments }, returns { info: Message, parts: Part[]}

---
to really make this work there also be the build toward session paths, sessions id  messages by letting the agents detect the current active project, session, the message id, or something to do with TUI and files methods and interfaces  ---- I am not so sure please research and advice - and let's draft a spike toward this for testing the theory 