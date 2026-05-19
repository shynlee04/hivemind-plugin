Như tiêu đề đã ghi thì phần session-manipulation-related-tools là các nhóm tools như (có thể tôi ghi không đủ, và vì tools còn kết nối với các chức năng engines và libs của nó nữa nên bạn hãy tìm hiểu bằng cách đọc các manifestations của nó tại .hivemind/** ; các code nằm rải rác trong tools, features, shared, coordination, delegation, session, task etc để truy vết đầy đủ các tools phân loại chúng và nhắm đến đúng mục tiêu - tham khảo tại skill `hivemind-power-on` skill  hiểu được cách từng tool phục vụ mục đích gì chúng có actions ra sao, arguments và paremeters thế nào được agents gọi ra vì mục đích gì và rồi đối chiếu với tình hình thực tại đề tìm ra bugs, flaws, gaps cũng như tính integration của chúng khi được dùng với nhau  ) dưới đây là list tham khảo nhưng tôi chú trọng về các mục có chứa "session", "context", "hierarchy", "delegation", "task", "coordination" làm trọng tâm (ngoài ra có một số tools trở nên vô nghĩa quá và không gắn kết gì thì cũng đưa vào list xem xét để tinh gọn consolidate hoặc defer thiết kế sau)


| Tool Name | What It Does | When To Use |
|-----------|-------------|-------------|
| `delegate-task` | Create a child session via SDK dispatch, tracked by DelegationManager | You need harness-tracked delegation with dual-signal completion, recovery, and notification routing |
| `delegation-status` | Poll delegation state: status, progress, abort, cancel, restart, resume, chain, adjust-prompt, change-agent | You need to check on or control a running delegation |
| `run-background-command` | Execute a shell command in a background/PTY session | You need a long-running shell command that shouldn't block the agent |
| `prompt-skim` | Fast skim of a prompt for structure and intent | You need a quick overview before deep analysis |
| `prompt-analyze` | Deep analysis of a prompt for contradictions, gaps, risks | You need to audit a prompt before sending it |
| `session-patch` | Modify session properties or metadata | You need to update session state |
| `execute-slash-command` | Run a registered OpenCode slash command | You need to invoke a command programmatically |
| `session-journal-export` | Export session journal to file | You need to persist session history for audit |
| `hivemind-doc` | Query Hivemind documentation | You need docs about harness features |
| `hivemind-trajectory` | Query execution trajectory / decision lineage | You need to trace what decisions led to current state |
| `hivemind-pressure` | Query runtime pressure / budget status | You need to check circuit-breaker or tool budget status |
| `hivemind-sdk-supervisor` | Inspect SDK client state and connection health | You need to debug SDK integration issues |
| `hivemind-command-engine` | Execute the Hivemind command engine | You need to run engine-level commands |
| `session-tracker` | List, search, and inspect session records | You need to find or resume a session |
| `session-hierarchy` | Get delegation depth and parent/child tree | You need to understand session lineage |
| `session-context` | Get session context from continuity | You need to recover context for a session |
| `hivemind-agent-work-create` | Create an agent work contract | You need to define a formal work agreement |
| `hivemind-agent-work-export` | Export agent work contract to file | You need to persist a work agreement |
| `configure-primitive` | Configure OpenCode primitives (agents, commands, skills) | You need to update config via tool |
| `validate-restart` | Validate restart safety before reconnecting | You need to check it's safe to restart |
| `bootstrap-init` | Initialize harness bootstrap state | First-time setup of a Hivemind project |
| `bootstrap-recover` | Recover from bootstrap failure | You need to recover a broken bootstrap |



---
Mục tiêu ở đây là 
1. Khi session-tracker đã được toàn diện hoá nhưng những tools phục vụ cho nó không hề khai thác được một chút gì thông tin mà nó đem lại (xem thêm bên dưới bạn hãy expand tất cả folder này đọc sample thật kỹ các file theo meta data, tính liên kết của nó, xem hierachy)

```

/Users/apple/hivemind-plugin-private/.hivemind/session-tracker
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/quarantine
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be4b9809ffe1SHVk2WphOQU44
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be5a8990ffeqZjxeUq54MIjWc
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be5b3dbdffeJSfSy2BBcdecT3
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1be3597adffeTot1p4mwdclikw
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bedf3484ffeWDnPqam61338uF
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee5bccaffekz53yNdwB0pXn1
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee7d5b4ffek8KOH9N1XrSgfc
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bee909c9ffeiulJsRbBZ5DeJ3
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1beea3200ffeYUaF25xDQSKKn8
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bf614136ffegsvg5lGfnax4Ja
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bfc57e69ffe3qE7PJhelSEOic
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1bfe36dcaffe911nREAuCfZ4jU
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c4c89803ffe1DexVzrLjkPjV0
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8e2b89fffed4QjLzznXTil6x
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8f865e7fferZ0iHrq3owlIfT
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c51f9d38ffeni0hdp3q5JUHWN
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c58bdf3fffe6H3sk7KOvAR95e
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c442ab90ffeFWOHJJ63R4oKMR
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c508e657ffeFlBGok0RYRKOcE
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c571efb0ffeIloZPzsnqS0P0y
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c857a177ffeYERktxuHRawNcX
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3554a4cffeTvtJqgrnVT7yTL
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c5914b90ffeUIjdGIkNOPuAFZ
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c8006e12ffeHA8IL88uvKj5jX
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c80134adffecVUCm5kMVHIqsV
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c317120affef8b53lWWFbDU67
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3333393ffe1zkj3M6dE0oSdB
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1c3416960ffefhUcHEXnz0uG3S
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1cd993f13ffeo1KE7DR7XeDDd1
/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json
```

>>>> từ đây ta có thể thấy là khi cần thiết agent dùng tools để phục vụ các mục đích sau đều fail

- xem lại context của  các session con (nay đều có meta `lastMessage` và `content` để search nhanh truy vết nhưng không hê tồn tại chức năng đó)

- xem theo phả hệ các query nhanh dạng hierarchy context - để agents biết cùng một session đã delegated những phiên nào rồi context ra sao để không phải delegate lại

- các query theo meta các post mortem chức năng đều không có trong khi context và session đều được ghi lại  mà agent toàn phải đọc toàn bộ hoặc lần mò trong sự thiếu hiểu biết nó không biết kết cấu các đối tượng liên quan ra sao không thể tận dụng các native tools như offset reading, hoặc ngay cả sử dụng doc-intelligence tools, hay grep, glob, regex search ngay cả LSP những thứ sẵn có của OpenCode cũng giúp cho việc truy xuất context này được thông minh và hiệu quả hơn miễn là có tools và tools có actions để agents làm việc đó 

- thêm nữa thông tin thời gian thực hoàn toàn mù tịt ví dụ khi người dùng bị rớt mạng mà phía trước đó có vài sub session đã được delegated và đã hình thành khá nhiều context trong đó agents đều mù tịt không thể nào dùng tools hay bất cứ thứ gì để biết context thực sự ra sao ở thời điểm bị rớt mạng - Và đơn giản hơn nó không hiểu được cơ chế là cho dù session trước đó có báo là aborted hay cancelled đi nữa thì OpenCode architecture mà qua bộ SDK thì các session này đã được preserve đơn giản chỉ cần có được session-id của các session bị rớt mạng đó và tên agent thì không cần lặp lại prompt hay tạo session mới mà chỉ cần dùng task tool để tạo một prompt resume cùng với task id chính xác là đã có thể resume lại

- ngoài ra các chức năng nghe có vẻ cao cấp như thay đổi agent, lấy context cũ và delegate tiếp tục cũng hoàn toàn và đơn giản thực hiện được chỉ với task tool, truy đúng được sub session id và context của nó thì dù hoàn thành hay chưa hay lưng chừng thì tạo cùng task session id sẽ giúp cho new task có được context cũ vì context một khi đã xác nhận delegated đều được preserve một cách tự động bởi OPENCODE SDK

>>>>>>>>> để mở rộng hơn thì `delegate-task`và `delegation-status` là thuộc nhóm custom delegation task nó không thay thế task tool nhưng đây là một dạng async task deleagtion mà nó cũng sử dụng các interfaces và bộ OpenCode SDK và plugins SDK hooks y như trên và vì thế nó cũng được ghi vào `session-tracker` bằng cách đưa nó vào chung một ecosytem và có những hướng dẫn, các functions và actions hỗ trợ trong tools phù hợp thì các agents được cấp phép sử dụng tools này sẽ có được context intelligence một cách chặt chẽ hơn ví dụ như dưới đây

- đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
- chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm



## Các tài liệu cần xem qua
1. Quy chuẩn thiết kế tools @/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md

2. các nguồn nghiên cứu thêm
```
**IMPORTANT HEAD-UP!**: 

- For any “other frameworks/projects synthesis” - such as gsd-* https://github.com/gsd-build/get-shit-done or OMO https://github.com/code-yeongyu/oh-my-openagent → DO NOT SIMPLY INGEST everything and throw-in without deeply synthesize towards the HIVEMIND philosophies, concepts and visions
- And as above all those editions of primitives - config, naming, prefixes, suffixes, designs as for workflows and harness features must completely be transformed, adapt, and integrate coherently toward `the Hivemind`  under OpenCode (with specs compliance, harness lifecycles validation, ecosystem validation) - also, the gsd-* (or any keyword as prefixes or suffixes in skills, agents, commands, workflows, custom tools, etc are not expected to ship with the project and they are there just because I am using GSD framework to develop this - and if any “synthesis” that the units are expected to ship-with → they must follow the above rules and mindsets
- other  repos of OpenCode projects and plugins utilizing OpenCode SDK, plugins , client-server API - can be found here with these note-worthy repos vs. harness features categories
    1. Context-managements categories:
        1. https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
    2. Harness features addressing  OpenCode innate shortcomings - the task, command and delegation feature class
        1. https://github.com/shekohex/opencode-ptyhttps://github.com/shekohex/opencode-pty#features  → resolve non-interactive commands, background runnings and multiple sessions - with OMO synthesis of background tasks, background agent, polling system to address this repo’s known limitations https://github.com/shekohex/opencode-pty#permissions
        2. related to the above is the background-agent repo https://github.com/kdcokenny/opencode-background-agents 
    3. A  **HUGE LIST OF CURATED OPENCODE ECOSYSTEM PROJECTS and PLUGINS -**  https://github.com/awesome-opencode/awesome-opencode - check this directory very often as you need to synthesize for feature-development, learn patterns, ideating and knowledge ingestion - I have also made a local copy of this under this path `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.planning/research/OPENCODE-ECOSYSTEM-REPO-DIRECTORIES.md`
    ```
