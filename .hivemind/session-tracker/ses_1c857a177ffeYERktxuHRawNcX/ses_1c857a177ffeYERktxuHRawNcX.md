---
sessionID: ses_1c857a177ffeYERktxuHRawNcX
created: 2026-05-17T20:37:21.953Z
updated: 2026-05-18T10:53:46.289Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: idle
---

## USER (turn 1)

**source:** real-human

vậy cho rằng nó có thể stuck trong một khoảng thời gian cho phép đi nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn  >>>> ví dụ ở phía trên (trước message này) mang labels  là system_reminder được thiết kế sai và không hợp lý logics >>>> VẬY KẾT LUẬN LẠI PHASE TIẾP THEO LÀ GOM LẠI TẤT CẢ NHỮNG GÌ LIÊN QUAN TỚI  delegate-task (tất cả chứ không chỉ tools, tất cả những thứ liên quan và cấu thành nên nó từ tất cả các runtime và mục đích sử dụng của agents gọi nó, quản lý nó, ứng dụgn nó, các hỗ trợ engines dành cho nó)  - tạo một phase để toàn diện refactore và revamp nó phase này sẽ bao gồm 4 tài liệu cực kỳ quan trọng là SPEC.md, CONTEXT.md, RESEARCH.md, và PATTERN.md - tất cả các quá trình sau được sử dụng execute-slash-command để tự động route command của gsd với sử dụng các gsd agents để tạo đúng theo mục đích của phase này update dependencies, state, roadmap, requirements và architecture liên quan 

## USER (turn 2)

**source:** real-human

vậy cho rằng nó có thể stuck trong một khoảng thời gian cho phép đi nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn  >>>> ví dụ ở phía trên (trước message này) mang labels  là system_reminder được thiết kế sai và không hợp lý logics >>>> VẬY KẾT LUẬN LẠI PHASE TIẾP THEO LÀ GOM LẠI TẤT CẢ NHỮNG GÌ LIÊN QUAN TỚI  delegate-task (tất cả chứ không chỉ tools, tất cả những thứ liên quan và cấu thành nên nó từ tất cả các runtime và mục đích sử dụng của agents gọi nó, quản lý nó, ứng dụgn nó, các hỗ trợ engines dành cho nó)  - tạo một phase để toàn diện refactore và revamp nó phase này sẽ bao gồm 4 tài liệu cực kỳ quan trọng là SPEC.md, CONTEXT.md, RESEARCH.md, và PATTERN.md - tất cả các quá trình sau được sử dụng execute-slash-command để tự động route command của gsd với sử dụng các gsd agents để tạo đúng theo mục đích của phase này update dependencies, state, roadmap, requirements và architecture liên quan 

## USER (turn 27)

**source:** real-human

vậy cho rằng nó có thể stuck trong một khoảng thời gian cho phép đi nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn  >>>> ví dụ ở phía trên (trước message này) mang labels  là system_reminder được thiết kế sai và không hợp lý logics >>>> VẬY KẾT LUẬN LẠI PHASE TIẾP THEO LÀ GOM LẠI TẤT CẢ NHỮNG GÌ LIÊN QUAN TỚI  delegate-task (tất cả chứ không chỉ tools, tất cả những thứ liên quan và cấu thành nên nó từ tất cả các runtime và mục đích sử dụng của agents gọi nó, quản lý nó, ứng dụgn nó, các hỗ trợ engines dành cho nó)  - tạo một phase để toàn diện refactore và revamp nó phase này sẽ bao gồm 4 tài liệu cực kỳ quan trọng là SPEC.md, CONTEXT.md, RESEARCH.md, và PATTERN.md - tất cả các quá trình sau được sử dụng execute-slash-command để tự động route command của gsd với sử dụng các gsd agents để tạo đúng theo mục đích của phase này update dependencies, state, roadmap, requirements và architecture liên quan 

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_44d6d5d42ff44da9a103cc46"
}
```


## USER (turn 28)

**source:** real-human

<objective>
Insert a decimal phase for urgent work discovered mid-milestone that must be completed between existing integer phases.

Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions.

Purpose: Handle urgent work discovered during execution without renumbering entire roadmap.
</objective>

<execution_context>
@~/.Codex/get-shit-done/workflows/insert-phase.md
</execution_context>

<context>
Arguments: CP-DT-01 "Delegate-Task Ecosystem Revamp" --after CP-ST-06 --description "Toàn diện refactor và revamp delegate-task ecosystem: tools, engines, tracking, completion detection, TUI injection, resume/chaining, agent discovery, permissions inheritance, compact survival. Bao gồm 4 tài liệu: SPEC.md (yêu cầu hệ thống), CONTEXT.md (bối cảnh hiện tại), RESEARCH.md (nghiên cứu OpenCode SDK/API), PATTERN.md (patterns thiết kế). Nghiên cứu sâu OpenCode SDK sessions/messages/hooks/permissions/agent discovery + source-code platform architecture." (format: <after-phase-number> <description>)

Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls.
</context>

<process>
Execute the insert-phase workflow from @~/.Codex/get-shit-done/workflows/insert-phase.md end-to-end.
Preserve all validation gates (argument parsing, phase verification, decimal calculation, roadmap updates).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/.Codex/get-shit-done/workflows/insert-phase.md"}
<path>/Users/apple/.Codex/get-shit-done/workflows/insert-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: integer phase number to insert after
14: - Remaining arguments: phase description
15: 
16: Example: `$gsd-insert-phase 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: $gsd-insert-phase <after> <description>
25: Example: $gsd-insert-phase 72 Fix critical auth bug
26: ```
27: 
28: Exit.
29: 
30: Validate first argument is an integer.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${after_phase}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: ```
45: Exit.
46: </step>
47: 
48: <step name="insert_phase">
49: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
50: 
51: ```bash
52: RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
53: ```
54: 
55: The CLI handles:
56: - Verifying target phase exists in ROADMAP.md
57: - Calculating next decimal phase number (checking existing decimals on disk)
58: - Generating slug from description
59: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
60: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
61: 
62: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
63: </step>
64: 
65: <step name="update_project_state">
66: Update STATE.md to reflect the inserted phase:
67: 
68: 1. Read `.planning/STATE.md`
69: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
70:    ```
71:    - Phase {decimal_phase} inserted after Phase {after_phase}: {description} (URGENT)
72:    ```
73: 
74: If "Roadmap Evolution" section doesn't exist, create it.
75: </step>
76: 
77: <step name="completion">
78: Present completion summary:
79: 
80: ```
81: Phase {decimal_phase} inserted after Phase {after_phase}:
82: - Description: {description}
83: - Directory: .planning/phases/{decimal-phase}-{slug}/
84: - Status: Not planned yet
85: - Marker: (INSERTED) - indicates urgent work
86: 
87: Roadmap updated: .planning/ROADMAP.md
88: Project state updated: .planning/STATE.md
89: 
90: ---
91: 
92: ## Next Up
93: 
94: **Phase {decimal_phase}: {description}** -- urgent insertion
95: 
96: `$gsd-plan-phase {decimal_phase}`
97: 
98: ---
99: 
100: **Also available:**
101: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
102: - Review roadmap
103: 
104: ---
105: ```
106: </step>
107: 
108: </process>
109: 
110: <anti_patterns>
111: 
112: - Don't use this for planned work at end of milestone (use $gsd-add-phase)
113: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
114: - Don't renumber existing phases
115: - Don't modify the target phase content
116: - Don't create plans yet (that's $gsd-plan-phase)
117: - Don't commit changes (user decides when to commit)
118: </anti_patterns>
119: 
120: <success_criteria>
121: Phase insertion is complete when:
122: 
123: - [ ] `gsd-sdk query phase.insert` executed successfully
124: - [ ] Phase directory created
125: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
126: - [ ] STATE.md updated with roadmap evolution note
127: - [ ] User informed of next steps and dependency implications
128: </success_criteria>

(End of file - total 128 lines)
</content>

## COMPACTED (2026-05-17T20:42:48.449Z)

**raw_event:**

```json
{
  "id": "evt_e37ad5afb001gUD7Y91FX3FdQF",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_8cd637edb6444f8eb4fc95d5"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6b6b75f78fbf45feb484b643"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_c2f4dacdb3e64d6688dc00ad"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_63cb324d0da64457a0fccf96"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_f2908b1a4c0446b3974ef3ed"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_e0a2157175fc4caf95e40b4f"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_4fbca8f4607847d5a2e794b9"
}
```


## COMPACTED (2026-05-17T20:45:20.425Z)

**raw_event:**

```json
{
  "id": "evt_e37afaca3001UroEttpd16eBWR",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: bash

**Input:**
```json
{
  "callID": "call_d2d6eb16691b4e74a0ecd60e"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_a61280e116fb45a59a00e6f5"
}
```


## USER (turn 29)

**source:** real-human

<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
</runtime_note>

<context>
Phase number: CP-DT-01 (required)

**Flags:**
- `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)

Context files are resolved in-workflow using `init phase-op`.
</context>

<process>
Execute end-to-end.

**MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
</process>

<success_criteria>
- Codebase scouted for current state before questioning begins
- All 4 ambiguity dimensions scored after each interview round
- Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
- SPEC.md committed atomically
- User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
</success_criteria>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Clarify WHAT a phase delivers through a Socratic interview loop with quantitative ambiguity scoring.
3: Produces a SPEC.md with falsifiable requirements that discuss-phase treats as locked decisions.
4: 
5: This workflow handles "what" and "why" — discuss-phase handles "how".
6: </purpose>
7: 
8: <ambiguity_model>
9: Score each dimension 0.0 (completely unclear) to 1.0 (crystal clear):
10: 
11: | Dimension         | Weight | Minimum | What it measures                                  |
12: |-------------------|--------|---------|---------------------------------------------------|
13: | Goal Clarity      | 35%    | 0.75    | Is the outcome specific and measurable?           |
14: | Boundary Clarity  | 25%    | 0.70    | What's in scope vs out of scope?                  |
15: | Constraint Clarity| 20%    | 0.65    | Performance, compatibility, data requirements?    |
16: | Acceptance Criteria| 20%   | 0.70    | How do we know it's done?                         |
17: 
18: **Ambiguity score** = 1.0 − (0.35×goal + 0.25×boundary + 0.20×constraint + 0.20×acceptance)
19: 
20: **Gate:** ambiguity ≤ 0.20 AND all dimensions ≥ their minimums → ready to write SPEC.md.
21: 
22: A score of 0.20 means 80% weighted clarity — enough precision that the planner won't silently make wrong assumptions.
23: </ambiguity_model>
24: 
25: <interview_perspectives>
26: Rotate through these perspectives — each naturally surfaces different blindspots:
27: 
28: **Researcher (rounds 1–2):** Ground the discussion in current reality.
29: - "What exists in the codebase today related to this phase?"
30: - "What's the delta between today and the target state?"
31: - "What triggers this work — what's broken or missing?"
32: 
33: **Simplifier (round 2):** Surface minimum viable scope.
34: - "What's the simplest version that solves the core problem?"
35: - "If you had to cut 50%, what's the irreducible core?"
36: - "What would make this phase a success even without the nice-to-haves?"
37: 
38: **Boundary Keeper (round 3):** Lock the perimeter.
39: - "What explicitly will NOT be done in this phase?"
40: - "What adjacent problems is it tempting to solve but shouldn't?"
41: - "What does 'done' look like — what's the final deliverable?"
42: 
43: **Failure Analyst (round 4):** Find the edge cases that invalidate requirements.
44: - "What's the worst thing that could go wrong if we get the requirements wrong?"
45: - "What does a broken version of this look like?"
46: - "What would cause a verifier to reject the output?"
47: 
48: **Seed Closer (rounds 5–6):** Lock remaining undecided territory.
49: - "We have [dimension] at [score] — what would make it completely clear?"
50: - "The remaining ambiguity is in [area] — can we make a decision now?"
51: - "Is there anything you'd regret not specifying before planning starts?"
52: </interview_perspectives>
53: 
54: <process>
55: 
56: ## Step 1: Initialize
57: 
58: ```bash
59: INIT=$(node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
60: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
61: ```
62: 
63: Parse JSON for: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `state_path`, `requirements_path`, `roadmap_path`, `planning_path`, `response_language`, `commit_docs`.
64: 
65: **If `response_language` is set:** All user-facing text in this workflow MUST be in `{response_language}`. Technical terms, code, and file paths stay in English.
66: 
67: **If `phase_found` is false:**
68: ```
69: Phase [X] not found in roadmap.
70: Use /gsd-progress to see available phases.
71: ```
72: Exit.
73: 
74: **Check for existing SPEC.md:**
75: ```bash
76: ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
77: ```
78: 
79: If SPEC.md already exists:
80: 
81: **If `--auto`:** Auto-select "Update it". Log: `[auto] SPEC.md exists — updating.`
82: 
83: **Otherwise:** Use question:
84: - header: "Spec"
85: - question: "Phase [X] already has a SPEC.md. What do you want to do?"
86: - options:
87:   - "Update it" — Revise and re-score
88:   - "View it" — Show current spec
89:   - "Skip" — Exit (use existing spec as-is)
90: 
91: If "View": Display SPEC.md, then offer Update/Skip.
92: If "Skip": Exit with message: "Existing SPEC.md unchanged. Run /gsd-discuss-phase [X] to continue."
93: If "Update": Load existing SPEC.md, continue to Step 3.
94: 
95: ## Step 2: Scout Codebase
96: 
97: **Read these files before any questions:**
98: - `{requirements_path}` — Project requirements
99: - `{state_path}` — Decisions already made, current phase, blockers
100: - ROADMAP.md phase entry — Phase description, goals, canonical refs
101: 
102: **Grep the codebase** for code/files relevant to this phase goal. Look for:
103: - Existing implementations of similar functionality
104: - Integration points where new code will connect
105: - Test coverage gaps relevant to the phase
106: - Prior phase artifacts (SUMMARY.md, VERIFICATION.md) that inform current state
107: 
108: **Synthesize current state** — the grounded baseline for the interview:
109: - What exists today related to this phase
110: - The gap between current state and the phase goal
111: - The primary deliverable: what file/behavior/capability does NOT exist yet?
112: 
113: Confirm your current state synthesis internally. Do not present it to the user yet — you'll use it to ask precise, grounded questions.
114: 
115: ## Step 3: First Ambiguity Assessment
116: 
117: Before questioning begins, score the phase's current ambiguity based only on what ROADMAP.md and REQUIREMENTS.md say:
118: 
119: ```
120: Goal Clarity:       [score 0.0–1.0]
121: Boundary Clarity:   [score 0.0–1.0]
122: Constraint Clarity: [score 0.0–1.0]
123: Acceptance Criteria:[score 0.0–1.0]
124: 
125: Ambiguity: [score] ([calculate])
126: ```
127: 
128: **If `--auto` and initial ambiguity already ≤ 0.20 with all minimums met:** Skip interview — derive SPEC.md directly from roadmap + requirements. Log: `[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.` Jump to Step 6.
129: 
130: **Otherwise:** Continue to Step 4.
131: 
132: ## Step 4: Socratic Interview Loop
133: 
134: **Max 6 rounds.** Each round: 2–3 questions max. End round after user responds.
135: 
136: **Round selection by perspective:**
137: - Round 1: Researcher
138: - Round 2: Researcher + Simplifier
139: - Round 3: Boundary Keeper
140: - Round 4: Failure Analyst
141: - Rounds 5–6: Seed Closer (focus on lowest-scoring dimensions)
142: 
143: **After each round:**
144: 1. Update all 4 dimension scores from the user's answers
145: 2. Calculate new ambiguity score
146: 3. Display the updated scoring:
147: 
148: ```
149: After round [N]:
150:   Goal Clarity:       [score] (min 0.75) [✓ or ↑ needed]
151:   Boundary Clarity:   [score] (min 0.70) [✓ or ↑ needed]
152:   Constraint Clarity: [score] (min 0.65) [✓ or ↑ needed]
153:   Acceptance Criteria:[score] (min 0.70) [✓ or ↑ needed]
154:   Ambiguity: [score] (gate: ≤ 0.20)
155: ```
156: 
157: **Gate check after each round:**
158: 
159: If gate passes (ambiguity ≤ 0.20 AND all minimums met):
160: 
161: **If `--auto`:** Jump to Step 6.
162: 
163: **Otherwise:** question:
164: - header: "Spec Gate Passed"
165: - question: "Ambiguity is [score] — requirements are clear enough to write SPEC.md. Proceed?"
166: - options:
167:   - "Yes — write SPEC.md" → Jump to Step 6
168:   - "One more round" → Continue interview
169:   - "Done talking — write it" → Jump to Step 6
170: 
171: **If max rounds reached (6) and gate not passed:**
172: 
173: **If `--auto`:** Write SPEC.md anyway — flag unresolved dimensions. Log: `[auto] Max rounds reached. Writing SPEC.md with [N] dimensions below minimum. Planner will need to treat these as assumptions.`
174: 
175: **Otherwise:** question:
176: - header: "Max Rounds"
177: - question: "After 6 rounds, ambiguity is [score]. [List dimensions still below minimum.] What would you like to do?"
178: - options:
179:   - "Write SPEC.md anyway — flag gaps" → Write SPEC.md, mark unresolved dimensions in Ambiguity Report
180:   - "Keep talking" → Continue (no round limit from here)
181:   - "Abandon" → Exit without writing
182: 
183: **If `--auto` mode throughout:** Replace all question calls above with the agent's recommended choice. Log decisions inline. Apply the same logic as `--auto` in discuss-phase.
184: 
185: **Text mode (`workflow.text_mode: true` or `--text` flag):** Use plain-text numbered lists instead of question TUI menus.
186: 
187: ## Step 5: (covered inline — ambiguity scoring is per-round)
188: 
189: ## Step 6: Generate SPEC.md
190: 
191: Use the SPEC.md template from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md.
192: 
193: **Requirements for every requirement entry:**
194: - One specific, testable statement
195: - Current state (what exists now)
196: - Target state (what it should become)
197: - Acceptance criterion (how to verify it was met)
198: 
199: **Vague requirements are rejected:**
200: - ✗ "The system should be fast"
201: - ✗ "Improve user experience"
202: - ✓ "API endpoint responds in < 200ms at p95 under 100 concurrent requests"
203: - ✓ "CLI command exits with code 1 and prints to stderr on invalid input"
204: 
205: **Count requirements.** The display in discuss-phase reads: "Found SPEC.md — {N} requirements locked."
206: 
207: **Boundaries must be explicit lists:**
208: - "In scope" — what this phase produces
209: - "Out of scope" — what it explicitly does NOT do (with brief reasoning)
210: 
211: **Acceptance criteria must be pass/fail checkboxes** — no "should feel good" or "looks reasonable."
212: 
213: **If any dimensions are below minimum**, mark them in the Ambiguity Report with: `⚠ Below minimum — planner must treat as assumption`.
214: 
215: Write to: `{phase_dir}/{padded_phase}-SPEC.md`
216: 
217: ## Step 7: Commit
218: 
219: ```bash
220: git add "${phase_dir}/${padded_phase}-SPEC.md"
221: git commit -m "spec(phase-${phase_number}): add SPEC.md for ${phase_name} — ${requirement_count} requirements (#2213)"
222: ```
223: 
224: If `commit_docs` is false: Skip commit. Note that SPEC.md was written but not committed.
225: 
226: ## Step 8: Wrap Up
227: 
228: Display:
229: 
230: ```
231: SPEC.md written — {N} requirements locked.
232: 
233:   Phase {X}: {name}
234:   Ambiguity: {final_score} (gate: ≤ 0.20)
235: 
236: Next: /gsd-discuss-phase {X}
237:   discuss-phase will detect SPEC.md and focus on implementation decisions only.
238: ```
239: 
240: </process>
241: 
242: <critical_rules>
243: - Every requirement MUST have current state, target state, and acceptance criterion
244: - Boundaries section is MANDATORY — cannot be empty
245: - "In scope" and "Out of scope" must be explicit lists, not narrative prose
246: - Acceptance criteria must be pass/fail — no subjective criteria
247: - SPEC.md is NEVER written if the user selects "Abandon"
248: - Do NOT ask about HOW to implement — that is discuss-phase territory
249: - Scout the codebase BEFORE the first question — grounded questions only
250: - Max 2–3 questions per round — do not frontload all questions at once
251: </critical_rules>
252: 
253: <success_criteria>
254: - Codebase scouted and current state understood before questioning
255: - All 4 dimensions scored after every round
256: - Gate passed OR user explicitly chose to write despite gaps
257: - SPEC.md contains only falsifiable requirements
258: - Boundaries are explicit (in scope / out of scope with reasoning)
259: - Acceptance criteria are pass/fail checkboxes
260: - SPEC.md committed atomically (when commit_docs is true)
261: - User directed to /gsd-discuss-phase as next step
262: </success_criteria>

(End of file - total 262 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md</path>
<type>file</type>
<content>
1: # Phase Spec Template
2: 
3: Template for `.planning/phases/XX-name/{phase_num}-SPEC.md` — locks requirements before discuss-phase.
4: 
5: **Purpose:** Capture WHAT a phase delivers and WHY, with enough precision that requirements are falsifiable. discuss-phase reads this file and focuses on HOW to implement (skipping "what/why" questions already answered here).
6: 
7: **Key principle:** Every requirement must be falsifiable — you can write a test or check that proves it was met or not. Vague requirements like "improve performance" are not allowed.
8: 
9: **Downstream consumers:**
10: - `discuss-phase` — reads SPEC.md at startup; treats Requirements, Boundaries, and Acceptance Criteria as locked; skips "what/why" questions
11: - `gsd-planner` — reads locked requirements to constrain plan scope
12: - `gsd-verifier` — uses acceptance criteria as explicit pass/fail checks
13: 
14: ---
15: 
16: ## File Template
17: 
18: ```markdown
19: # Phase [X]: [Name] — Specification
20: 
21: **Created:** [date]
22: **Ambiguity score:** [score] (gate: ≤ 0.20)
23: **Requirements:** [N] locked
24: 
25: ## Goal
26: 
27: [One precise sentence — specific and measurable. NOT "improve X" — instead "X changes from A to B".]
28: 
29: ## Background
30: 
31: [Current state from codebase — what exists today, what's broken or missing, what triggers this work. Grounded in code reality, not abstract description.]
32: 
33: ## Requirements
34: 
35: 1. **[Short label]**: [Specific, testable statement.]
36:    - Current: [what exists or does NOT exist today]
37:    - Target: [what it should become after this phase]
38:    - Acceptance: [concrete pass/fail check — how a verifier confirms this was met]
39: 
40: 2. **[Short label]**: [Specific, testable statement.]
41:    - Current: [what exists or does NOT exist today]
42:    - Target: [what it should become after this phase]
43:    - Acceptance: [concrete pass/fail check]
44: 
45: [Continue for all requirements. Each must have Current/Target/Acceptance.]
46: 
47: ## Boundaries
48: 
49: **In scope:**
50: - [Explicit list of what this phase produces]
51: - [Each item is a concrete deliverable or behavior]
52: 
53: **Out of scope:**
54: - [Explicit list of what this phase does NOT do] — [brief reason why it's excluded]
55: - [Adjacent problems excluded from this phase] — [brief reason]
56: 
57: ## Constraints
58: 
59: [Performance, compatibility, data volume, dependency, or platform constraints.
60: If none: "No additional constraints beyond standard project conventions."]
61: 
62: ## Acceptance Criteria
63: 
64: - [ ] [Pass/fail criterion — unambiguous, verifiable]
65: - [ ] [Pass/fail criterion]
66: - [ ] [Pass/fail criterion]
67: 
68: [Every acceptance criterion must be a checkbox that resolves to PASS or FAIL.
69: No "should feel good", "looks reasonable", or "generally works" — those are not checkboxes.]
70: 
71: ## Ambiguity Report
72: 
73: | Dimension          | Score | Min  | Status | Notes                              |
74: |--------------------|-------|------|--------|------------------------------------|
75: | Goal Clarity       |       | 0.75 |        |                                    |
76: | Boundary Clarity   |       | 0.70 |        |                                    |
77: | Constraint Clarity |       | 0.65 |        |                                    |
78: | Acceptance Criteria|       | 0.70 |        |                                    |
79: | **Ambiguity**      |       | ≤0.20|        |                                    |
80: 
81: Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)
82: 
83: ## Interview Log
84: 
85: [Key decisions made during the Socratic interview. Format: round → question → answer → decision locked.]
86: 
87: | Round | Perspective    | Question summary         | Decision locked                    |
88: |-------|----------------|-------------------------|------------------------------------|
89: | 1     | Researcher     | [what was asked]        | [what was decided]                 |
90: | 2     | Simplifier     | [what was asked]        | [what was decided]                 |
91: | 3     | Boundary Keeper| [what was asked]        | [what was decided]                 |
92: 
93: [If --auto mode: note "auto-selected" decisions with the reasoning the agent used.]
94: 
95: ---
96: 
97: *Phase: [XX-name]*
98: *Spec created: [date]*
99: *Next step: /gsd-discuss-phase [X] — implementation decisions (how to build what's specified above)*
100: ```
101: 
102: <good_examples>
103: 
104: **Example 1: Feature addition (Post Feed)**
105: 
106: ```markdown
107: # Phase 3: Post Feed — Specification
108: 
109: **Created:** 2025-01-20
110: **Ambiguity score:** 0.12
111: **Requirements:** 4 locked
112: 
113: ## Goal
114: 
115: Users can scroll through posts from accounts they follow, with new posts available after pull-to-refresh.
116: 
117: ## Background
118: 
119: The database has a `posts` table and `follows` table. No feed query or feed UI exists today. The home screen shows a placeholder "Your feed will appear here." This phase builds the feed query, API endpoint, and the feed list component.
120: 
121: ## Requirements
122: 
123: 1. **Feed query**: Returns posts from followed accounts ordered by creation time, descending.
124:    - Current: No feed query exists — `posts` table is queried directly only from profile pages
125:    - Target: `GET /api/feed` returns paginated posts from followed accounts, newest first, max 20 per page
126:    - Acceptance: Query returns correct posts for a user who follows 3 accounts with known post counts; cursor-based pagination advances correctly
127: 
128: 2. **Feed display**: Posts display in a scrollable card list.
129:    - Current: Home screen shows static placeholder text
130:    - Target: Home screen renders feed cards with author, timestamp, post content, and reaction count
131:    - Acceptance: Feed renders without error for 0 posts (empty state shown), 1 post, and 20+ posts
132: 
133: 3. **Pull-to-refresh**: User can refresh the feed manually.
134:    - Current: No refresh mechanism exists
135:    - Target: Pull-down gesture triggers refetch; new posts appear at top of list
136:    - Acceptance: After a new post is created in test, pull-to-refresh shows the new post without full app restart
137: 
138: 4. **New posts indicator**: When new posts arrive, a banner appears instead of auto-scrolling.
139:    - Current: No such mechanism
140:    - Target: "3 new posts" banner appears when refetch returns posts newer than the oldest visible post; tapping banner scrolls to top and shows new posts
141:    - Acceptance: Banner appears for ≥1 new post, does not appear when no new posts, tap navigates to top
142: 
143: ## Boundaries
144: 
145: **In scope:**
146: - Feed query (backend) — posts from followed accounts, paginated
147: - Feed list UI (frontend) — post cards with author, timestamp, content, reaction counts
148: - Pull-to-refresh gesture
149: - New posts indicator banner
150: - Empty state when user follows no one or no posts exist
151: 
152: **Out of scope:**
153: - Creating posts — that is Phase 4
154: - Reacting to posts — that is Phase 5
155: - Following/unfollowing accounts — that is Phase 2 (already done)
156: - Push notifications for new posts — separate backlog item
157: 
158: ## Constraints
159: 
160: - Feed query must use cursor-based pagination (not offset) — the database has 500K+ posts and offset pagination is unacceptably slow beyond page 3
161: - The feed card component must reuse the existing `<AvatarImage>` component from Phase 2
162: 
163: ## Acceptance Criteria
164: 
165: - [ ] `GET /api/feed` returns posts only from followed accounts (not all posts)
166: - [ ] `GET /api/feed` supports `cursor` parameter for pagination
167: - [ ] Feed renders correctly at 0, 1, and 20+ posts
168: - [ ] Pull-to-refresh triggers refetch
169: - [ ] New posts indicator appears when posts newer than current view exist
170: - [ ] Empty state renders when user follows no one
171: 
172: ## Ambiguity Report
173: 
174: | Dimension          | Score | Min  | Status | Notes                            |
175: |--------------------|-------|------|--------|----------------------------------|
176: | Goal Clarity       | 0.92  | 0.75 | ✓      |                                  |
177: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list       |
178: | Constraint Clarity | 0.80  | 0.65 | ✓      | Cursor pagination required       |
179: | Acceptance Criteria| 0.85  | 0.70 | ✓      | 6 pass/fail criteria             |
180: | **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                  |
181: 
182: ## Interview Log
183: 
184: | Round | Perspective     | Question summary              | Decision locked                         |
185: |-------|-----------------|------------------------------|-----------------------------------------|
186: | 1     | Researcher      | What exists in posts today?  | posts + follows tables exist, no feed  |
187: | 2     | Simplifier      | Minimum viable feed?         | Cards + pull-refresh, no auto-scroll   |
188: | 3     | Boundary Keeper | What's NOT this phase?       | Creating posts, reactions out of scope |
189: | 3     | Boundary Keeper | What does done look like?    | Scrollable feed with 4 card fields     |
190: 
191: ---
192: 
193: *Phase: 03-post-feed*
194: *Spec created: 2025-01-20*
195: *Next step: /gsd-discuss-phase 3 — implementation decisions (card layout, loading skeleton, etc.)*
196: ```
197: 
198: **Example 2: CLI tool (Database backup)**
199: 
200: ```markdown
201: # Phase 2: Backup Command — Specification
202: 
203: **Created:** 2025-01-20
204: **Ambiguity score:** 0.15
205: **Requirements:** 3 locked
206: 
207: ## Goal
208: 
209: A `gsd backup` CLI command creates a reproducible database snapshot that can be restored by `gsd restore` (a separate phase).
210: 
211: ## Background
212: 
213: No backup tooling exists. The project uses PostgreSQL. Developers currently use `pg_dump` manually — there is no standardized process, no output naming convention, and no CI integration. Three incidents in the last quarter involved restoring from wrong or corrupt dumps.
214: 
215: ## Requirements
216: 
217: 1. **Backup creation**: CLI command executes a full database backup.
218:    - Current: No `backup` subcommand exists in the CLI
219:    - Target: `gsd backup` connects to the database (via `DATABASE_URL` env or `--db` flag), runs pg_dump, writes output to `./backups/YYYY-MM-DD_HH-MM-SS.dump`
220:    - Acceptance: Running `gsd backup` on a test database creates a `.dump` file; running `pg_restore` on that file recreates the database without error
221: 
222: 2. **Network retry**: Transient network failures are retried automatically.
223:    - Current: pg_dump fails immediately on network error
224:    - Target: Backup retries up to 3 times with 5-second delay; 4th failure exits with code 1 and a message to stderr
225:    - Acceptance: Simulating 2 sequential network failures causes 2 retries then success; simulating 4 failures causes exit code 1 and stderr message
226: 
227: 3. **Partial cleanup**: Failed backups do not leave corrupt files.
228:    - Current: Manual pg_dump leaves partial files on failure
229:    - Target: If backup fails after starting, the partial `.dump` file is deleted before exit
230:    - Acceptance: After a simulated failure mid-dump, no `.dump` file exists in `./backups/`
231: 
232: ## Boundaries
233: 
234: **In scope:**
235: - `gsd backup` subcommand (full dump only)
236: - Output to `./backups/` directory (created if missing)
237: - Network retry (3 attempts)
238: - Partial file cleanup on failure
239: 
240: **Out of scope:**
241: - `gsd restore` — that is Phase 3
242: - Incremental backups — separate backlog item (full dump only for now)
243: - S3 or remote storage — separate backlog item
244: - Encryption — separate backlog item
245: - Scheduled/cron backups — separate backlog item
246: 
247: ## Constraints
248: 
249: - Must use `pg_dump` (not a custom query) — ensures compatibility with standard `pg_restore`
250: - `--no-retry` flag must be available for CI use (fail fast, no retries)
251: 
252: ## Acceptance Criteria
253: 
254: - [ ] `gsd backup` creates a `.dump` file in `./backups/YYYY-MM-DD_HH-MM-SS.dump` format
255: - [ ] `gsd backup` uses `DATABASE_URL` env var or `--db` flag for connection
256: - [ ] 3 retries on network failure, then exit code 1 with stderr message
257: - [ ] `--no-retry` flag skips retries and fails immediately on first error
258: - [ ] No partial `.dump` file left after a failed backup
259: 
260: ## Ambiguity Report
261: 
262: | Dimension          | Score | Min  | Status | Notes                          |
263: |--------------------|-------|------|--------|--------------------------------|
264: | Goal Clarity       | 0.90  | 0.75 | ✓      |                                |
265: | Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit out-of-scope list     |
266: | Constraint Clarity | 0.75  | 0.65 | ✓      | pg_dump required               |
267: | Acceptance Criteria| 0.80  | 0.70 | ✓      | 5 pass/fail criteria           |
268: | **Ambiguity**      | 0.15  | ≤0.20| ✓      |                                |
269: 
270: ## Interview Log
271: 
272: | Round | Perspective     | Question summary              | Decision locked                         |
273: |-------|-----------------|------------------------------|-----------------------------------------|
274: | 1     | Researcher      | What backup tooling exists?  | None — pg_dump manual only             |
275: | 2     | Simplifier      | Minimum viable backup?       | Full dump only, local only             |
276: | 3     | Boundary Keeper | What's NOT this phase?       | Restore, S3, encryption excluded       |
277: | 4     | Failure Analyst | What goes wrong on failure?  | Partial files, CI fail-fast needed     |
278: 
279: ---
280: 
281: *Phase: 02-backup-command*
282: *Spec created: 2025-01-20*
283: *Next step: /gsd-discuss-phase 2 — implementation decisions (progress reporting, flag design, etc.)*
284: ```
285: 
286: </good_examples>
287: 
288: <guidelines>
289: **Every requirement needs all three fields:**
290: - Current: grounds the requirement in reality — what exists today?
291: - Target: the concrete change — not "improve X" but "X becomes Y"
292: - Acceptance: the falsifiable check — how does a verifier confirm this?
293: 
294: **Ambiguity Report must reflect the actual interview.** If a dimension is below minimum, mark it ⚠ — the planner knows to treat it as an assumption rather than a locked requirement.
295: 
296: **Interview Log is evidence of rigor.** Don't skip it. It shows that requirements came from discovery, not assumption.
297: 
298: **Boundaries protect the phase from scope creep.** The out-of-scope list with reasoning is as important as the in-scope list. Future phases that touch adjacent areas can point to this SPEC.md to understand what was intentionally excluded.
299: 
300: **SPEC.md is a one-way door for requirements.** discuss-phase will treat these as locked. If requirements change after SPEC.md is written, the user should update SPEC.md first, then re-run discuss-phase.
301: 
302: **SPEC.md does NOT replace CONTEXT.md.** They serve different purposes:
303: - SPEC.md: what the phase delivers (requirements, boundaries, acceptance criteria)
304: - CONTEXT.md: how the phase will be implemented (decisions, patterns, tradeoffs)
305: 
306: discuss-phase generates CONTEXT.md after reading SPEC.md.
307: </guidelines>

(End of file - total 307 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/CONTEXT.md
# Phase Context Template

Template for `.planning/phases/XX-name/{phase_num}-CONTEXT.md` - captures implementation decisions for a phase.

**Purpose:** Document decisions that downstream agents need. Researcher uses this to know WHAT to investigate. Planner uses this to know WHAT choices are locked vs flexible.

**Key principle:** Categories are NOT predefined. They emerge from what was actually discussed for THIS phase. A CLI phase has CLI-relevant sections, a UI phase has UI-relevant sections.

**Downstream consumers:**
- `gsd-phase-researcher` — Reads decisions to focus research (e.g., "card layout" → research card component patterns)
- `gsd-planner` — Reads decisions to create specific tasks (e.g., "infinite scroll" → task includes virtualization)

---

## File Template

```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor. This comes from ROADMAP.md and is fixed. Discussion clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- **D-01:** [Specific decision made]
- **D-02:** [Another decision if applicable]

### [Area 2 that was discussed]
- **D-03:** [Specific decision made]

### [Area 3 that was discussed]
- **D-04:** [Specific decision made]

### the agent's Discretion
[Areas where user explicitly said "you decide" — the agent has flexibility here during planning/implementation]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion. Product references, specific behaviors, interaction patterns.]

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

[List every spec, ADR, feature doc, or design doc that defines requirements or constraints for this phase. Use full relative paths so agents can read them directly. Group by topic area when the phase has multiple concerns.]

### [Topic area 1]
- `path/to/spec-or-adr.md` — [What this doc decides/defines that's relevant]
- `path/to/doc.md` §N — [Specific section and what it covers]

### [Topic area 2]
- `path/to/feature-doc.md` — [What capability this defines]

[If the project has no external specs: "No external specs — requirements are fully captured in decisions above"]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it could be used in this phase]

### Established Patterns
- [Pattern]: [How it constrains/enables this phase]

### Integration Points
- [Where new code connects to existing system]

</code_context>

<deferred>
## Deferred Ideas

[Ideas that came up during discussion but belong in other phases. Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

<good_examples>

**Example 1: Visual feature (Post Feed)**

```markdown
# Phase 3: Post Feed - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Display posts from followed users in a scrollable feed. Users can view posts and see engagement counts. Creating posts and interactions are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout style
- Card-based layout, not timeline or list
- Each card shows: author avatar, name, timestamp, full post content, reaction counts
- Cards have subtle shadows, rounded corners — modern feel

### Loading behavior
- Infinite scroll, not pagination
- Pull-to-refresh on mobile
- New posts indicator at top ("3 new posts") rather than auto-inserting

### Empty state
- Friendly illustration + "Follow people to see posts here"
- Suggest 3-5 accounts to follow based on interests

### the agent's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling

</decisions>

<canonical_refs>
## Canonical References

### Feed display
- `docs/features/social-feed.md` — Feed requirements, post card fields, engagement display rules
- `docs/decisions/adr-012-infinite-scroll.md` — Scroll strategy decision, virtualization requirements

### Empty states
- `docs/design/empty-states.md` — Empty state patterns, illustration guidelines

</canonical_refs>

<specifics>
## Specific Ideas

- "I like how Twitter shows the new posts indicator without disrupting your scroll position"
- Cards should feel like Linear's issue cards — clean, not cluttered

</specifics>

<deferred>
## Deferred Ideas

- Commenting on posts — Phase 5
- Bookmarking posts — add to backlog

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**Example 2: CLI tool (Database backup)**

```markdown
# Phase 2: Backup Command - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI command to backup database to local file or S3. Supports full and incremental backups. Restore command is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Output format
- JSON for programmatic use, table format for humans
- Default to table, --json flag for JSON
- Verbose mode (-v) shows progress, silent by default

### Flag design
- Short flags for common options: -o (output), -v (verbose), -f (force)
- Long flags for clarity: --incremental, --compress, --encrypt
- Required: database connection string (positional or --db)

### Error recovery
- Retry 3 times on network failure, then fail with clear message
- --no-retry flag to fail fast
- Partial backups are deleted on failure (no corrupt files)

### the agent's Discretion
- Exact progress bar implementation
- Compression algorithm choice
- Temp file handling

</decisions>

<canonical_refs>
## Canonical References

### Backup CLI
- `docs/features/backup-restore.md` — Backup requirements, supported backends, encryption spec
- `docs/decisions/adr-007-cli-conventions.md` — Flag naming, exit codes, output format standards

</canonical_refs>

<specifics>
## Specific Ideas

- "I want it to feel like pg_dump — familiar to database people"
- Should work in CI pipelines (exit codes, no interactive prompts)

</specifics>

<deferred>
## Deferred Ideas

- Scheduled backups — separate phase
- Backup rotation/retention — add to backlog

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**Example 3: Organization task (Photo library)**

```markdown
# Phase 1: Photo Organization - Context

**Gathered:** 2025-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize existing photo library into structured folders. Handle duplicates and apply consistent naming. Tagging and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Grouping criteria
- Primary grouping by year, then by month
- Events detected by time clustering (photos within 2 hours = same event)
- Event folders named by date + location if available

### Duplicate handling
- Keep highest resolution version
- Move duplicates to _duplicates folder (don't delete)
- Log all duplicate decisions for review

### Naming convention
- Format: YYYY-MM-DD_HH-MM-SS_originalname.ext
- Preserve original filename as suffix for searchability
- Handle name collisions with incrementing suffix

### the agent's Discretion
- Exact clustering algorithm
- How to handle photos with no EXIF data
- Folder emoji usage

</decisions>

<canonical_refs>
## Canonical References

### Organization rules
- `docs/features/photo-organization.md` — Grouping rules, duplicate policy, naming spec
- `docs/decisions/adr-003-exif-handling.md` — EXIF extraction strategy, fallback for missing metadata

</canonical_refs>

<specifics>
## Specific Ideas

- "I want to be able to find photos by roughly when they were taken"
- Don't delete anything — worst case, move to a review folder

</specifics>

<deferred>
## Deferred Ideas

- Face detection grouping — future phase
- Cloud sync — out of scope for now

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

</good_examples>

<guidelines>
**This template captures DECISIONS for downstream agents.**

The output should answer: "What does the researcher need to investigate? What choices are locked for the planner?"

**Good content (concrete decisions):**
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

**Bad content (too vague):**
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"
- "Easy to use"

**After creation:**
- File lives in phase directory: `.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` uses decisions to focus investigation AND reads canonical_refs to know WHAT docs to study
- `gsd-planner` uses decisions + research to create executable tasks AND reads canonical_refs to verify alignment
- Downstream agents should NOT need to ask the user again about captured decisions

**CRITICAL — Canonical references:**
- The `<canonical_refs>` section is MANDATORY. Every CONTEXT.md must have one.
- If your project has external specs, ADRs, or design docs, list them with full relative paths grouped by topic
- If ROADMAP.md lists `Canonical refs:` per phase, extract and expand those
- Inline mentions like "see ADR-019" scattered in decisions are useless to downstream agents — they need full paths and section references in a dedicated section they can find
- If no external specs exist, say so explicitly — don't silently omit the section
</guidelines>

</system-reminder>

### Tool: bash

**Input:**
```json
{
  "callID": "call_8801959391114351947d0514"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_328010e96801477bbab6e191"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_31f2c45742844ac492bf5a65"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_60c917f2494b423f99a0589e"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_39df5097fda94ec182cb88c2"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_12ee5835a7c245b99d0a31aa"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_89554be2e3904b9d972840e4"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```


## COMPACTED (2026-05-17T20:48:02.238Z)

**raw_event:**

```json
{
  "id": "evt_e37b224b80012fUiqLTpzXpdV3",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_06b4abf19ae5448b81828496"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-spec-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-spec-phase
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_66e1a85860ce4f11a877e503"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/REQUIREMENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_3819e10ea90241169e54e17d"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_9860a25d2a1f4717b23b6183"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_c45077f84829469dbd8a4d9e"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_3d2efee5130246669f5534fc"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_0ab40cd7ef254d6989958b9a"
}
```


## COMPACTED (2026-05-17T20:51:25.684Z)

**raw_event:**

```json
{
  "id": "evt_e37b53f6e001YiHBYuyKJk13ad",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_8c65a5e308a94471a193a5ce"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_ab585fdf34634eb2aa81ae08"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_7002771b775a4449b15195c5"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_f328727c53b44b0786cb67fe"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Write CONTEXT.md for CP-DT-01",
  "subagent_type": "gsd-doc-writer",
  "task_id": "ses_1c8487354ffeUOsrTU3ThjChi8"
}
```

**Output:** (pruned)
```
task_id: ses_1c8487354ffeUOsrTU3ThjChi8
```


### Tool: task

**Input:**
```json
{
  "description": "Research OpenCode SDK for RESEARCH.md",
  "subagent_type": "gsd-phase-researcher",
  "task_id": "ses_1c8487341ffev04MQUJUkXRzam"
}
```

**Output:** (pruned)
```
task_id: ses_1c8487341ffev04MQUJUkXRzam
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_66b297ae8755420d950e776f"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_72f2ecd5ad424afea96857e2"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_4400ff85264c4de58b706167"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Write PATTERN.md for CP-DT-01",
  "subagent_type": "gsd-doc-writer",
  "task_id": "ses_1c840cceeffePw3f2EAvX3aMcv"
}
```

**Output:** (pruned)
```
task_id: ses_1c840cceeffePw3f2EAvX3aMcv
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_7d71ea8c56934295aa45121a"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_890bdd5e555c4d71adef82a6"
}
```


## USER (turn 30)

**source:** real-human

hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này 

## USER (turn 31)

**source:** real-human

hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd

### Tool: task

**Input:**
```json
{
  "description": "Write SPEC.md for CP-DT-01",
  "subagent_type": "gsd-doc-writer",
  "task_id": "ses_1c83c3863ffemnoml2QiCn6ma3"
}
```

**Output:** (pruned)
```
task_id: ses_1c83c3863ffemnoml2QiCn6ma3
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_55cf17b2b6aa4bffb6649d9c"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_37ef4450a4b340ff9445fd19"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_3ffbd9828662441694712441"
}
```


## COMPACTED (2026-05-17T21:12:10.622Z)

**raw_event:**

```json
{
  "id": "evt_e37c83e78001u6ERlqaYnGZ0uZ",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_2508f92aeaec4eeaa4654c13"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_742de877cdc34135b2e5893f"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_240ee0ae91ab4776b2bfe2d2"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_6322cdb435c9465fa0d72565"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_452593604a5b4f6486a3ff38"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_bd7cbe68b38f416f802f2ec1"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6c3d1a6e34e141379626579a"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_dfef39e8f9044ac7998437cc"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_61e065d23c664fc7969bbee8"
}
```


## USER (turn 32)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: CP-DT-01 (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: 
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
10: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
11: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
12: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
13: </required_reading>
14: 
15: <available_agent_types>
16: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
17: - gsd-phase-researcher — Researches technical approaches for a phase
18: - gsd-pattern-mapper — Analyzes codebase for existing patterns, produces PATTERNS.md
19: - gsd-planner — Creates detailed plans from phase scope
20: - gsd-plan-checker — Reviews plan quality before execution
21: </available_agent_types>
22: 
23: <process>
24: 
25: ## 0. Git Branch Invariant
26: 
27: **Do not create, rename, or switch git branches during plan-phase.** Branch identity is established at discuss-phase and is owned by the user's git workflow. A phase rename in ROADMAP.md is a plan-level change only — it does not mutate git branch names. If `phase_slug` in the init JSON differs from the current branch name, that is expected and correct; leave the branch unchanged.
28: 
29: ## 1. Initialize
30: 
31: Load all context in one call (paths only to minimize orchestrator context):
32: 
33: ```bash
34: INIT=$(gsd-sdk query init.plan-phase "$PHASE")
35: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
36: AGENT_SKILLS_RESEARCHER=$(gsd-sdk query agent-skills gsd-phase-researcher)
37: AGENT_SKILLS_PLANNER=$(gsd-sdk query agent-skills gsd-planner)
38: AGENT_SKILLS_CHECKER=$(gsd-sdk query agent-skills gsd-plan-checker)
39: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
40: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
41: MVP_MODE_CFG=$(gsd-sdk query config-get workflow.mvp_mode 2>/dev/null || echo "false")
42: ```
43: 
44: When `TDD_MODE` is `true`, the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The planner's `<required_reading>` is extended to include `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` so gate enforcement rules are available during planning.
45: 
46: When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardless of recency (e.g., Phase 7 declaring `Depends on: Phase 2` always sees Phase 2's context). Bounded recency keeps the planner's context budget focused on recent work.
47: 
48: Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
49: 
50: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
51: 
52: **File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.
53: 
54: **If `planning_exists` is false:** Error — run `/gsd-new-project` first.
55: 
56: ## 2. Parse and Normalize Arguments
57: 
58: Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--reviews`, `--text`, `--bounce`, `--skip-bounce`, `--chunked`, `--mvp`).
59: 
60: **`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only — the planner spawn (step 8), plan-checker, verification, gaps, bounce, and post-planning-gaps blocks all skip on `RESEARCH_ONLY`. Use this for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `/gsd-research-phase` command.
61: 
62: In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:
63: 
64: - **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
65: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.
66: 
67: ```bash
68: RESEARCH_ONLY=false
69: VIEW_ONLY=false
70: if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
71:   RESEARCH_ONLY=true
72:   PHASE="${BASH_REMATCH[1]}"
73: fi
74: if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
75:   VIEW_ONLY=true
76: fi
77: ```
78: 
79: Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for Claude Code remote sessions (`/rc` mode) where TUI menus don't work through the the agent App.
80: 
81: **MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-implement the chain.
82: 
83: ```bash
84: MVP_FLAG_ARG=""
85: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
86: ```
87: 
88: Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation).
89: The verb returns `true|false`. Full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostics. The mode is **all-or-nothing per phase** (PRD decision Q1) — never selective per task.
90: 
91: **Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:
92: 
93: ```bash
94: WALKING_SKELETON=false
95: if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
96:   PRIOR_SUMMARIES=$(gsd-sdk query phases.list --pick summaries_total 2>/dev/null || echo "0")
97:   if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
98: fi
99: ```
100: 
101: When `WALKING_SKELETON=true`:
102: - Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md`.
103: - The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.
104: 
105: **Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are active on Phase 1 of a new project, the planner receives `WALKING_SKELETON=true` and PRD-derived context simultaneously — the PRD informs *what the skeleton should prove*. No precedence is needed; the two signals are orthogonal. See [`references/mvp-concepts.md`](../references/mvp-concepts.md) for the broader interaction map.
106: 
107: Extract `--prd <filepath>` from $ARGUMENTS. If present, set PRD_FILE to the filepath.
108: 
109: **If no phase number:** Detect next unplanned phase from roadmap.
110: 
111: **If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `phase_slug` and `padded_phase` from init:
112: ```bash
113: mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
114: ```
115: 
116: **Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.
117: 
118: Set `CHUNKED_MODE` from flag or config:
119: ```bash
120: CHUNKED_CFG=$(gsd-sdk query config-get workflow.plan_chunked 2>/dev/null || echo "false")
121: CHUNKED_MODE=false
122: if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
123:   CHUNKED_MODE=true
124: fi
125: ```
126: 
127: ## 2.5. Validate `--reviews` Prerequisite
128: 
129: **Skip if:** No `--reviews` flag.
130: 
131: **If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.
132: 
133: **If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**
134: 
135: Error:
136: ```
137: No REVIEWS.md found for Phase {N}. Run reviews first:
138: 
139: /gsd-review --phase {N}
140: 
141: Then re-run /gsd-plan-phase {N} --reviews
142: ```
143: Exit workflow.
144: 
145: ## 3. Validate Phase
146: 
147: ```bash
148: PHASE_INFO=$(gsd-sdk query roadmap.get-phase "${PHASE}")
149: ```
150: 
151: **If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.
152: 
153: Now that `PHASE` is finalized, resolve MVP mode:
154: ```bash
155: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)
156: ```
157: 
158: ## 3.5. Handle PRD Express Path
159: 
160: **Skip if:** No `--prd` flag in arguments.
161: 
162: **If `--prd <filepath>` provided:**
163: 
164: 1. Read the PRD file:
165: ```bash
166: PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
167: if [ -z "$PRD_CONTENT" ]; then
168:   echo "Error: PRD file not found: $PRD_FILE"
169:   exit 1
170: fi
171: ```
172: 
173: 2. Display banner:
174: ```
175: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
176:  GSD ► PRD EXPRESS PATH
177: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
178: 
179: Using PRD: {PRD_FILE}
180: Generating CONTEXT.md from requirements...
181: ```
182: 
183: 3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
184:    - Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
185:    - Map each to a locked decision (everything in the PRD is treated as a locked decision)
186:    - Identify any areas the PRD doesn't cover and mark as "the agent's Discretion"
187:    - **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
188:    - Create CONTEXT.md in the phase directory
189: 
190: 4. Write CONTEXT.md:
191: ```markdown
192: # Phase [X]: [Name] - Context
193: 
194: **Gathered:** [date]
195: **Status:** Ready for planning
196: **Source:** PRD Express Path ({PRD_FILE})
197: 
198: <domain>
199: ## Phase Boundary
200: 
201: [Extracted from PRD — what this phase delivers]
202: 
203: </domain>
204: 
205: <decisions>
206: ## Implementation Decisions
207: 
208: {For each requirement/story/criterion in the PRD:}
209: ### [Category derived from content]
210: - [Requirement as locked decision]
211: 
212: ### the agent's Discretion
213: [Areas not covered by PRD — implementation details, technical choices]
214: 
215: </decisions>
216: 
217: <canonical_refs>
218: ## Canonical References
219: 
220: **Downstream agents MUST read these before planning or implementing.**
221: 
222: [MANDATORY. Extract from ROADMAP.md and any docs referenced in the PRD.
223: Use full relative paths. Group by topic area.]
224: 
225: ### [Topic area]
226: - `path/to/spec-or-adr.md` — [What it decides/defines]
227: 
228: [If no external specs: "No external specs — requirements fully captured in decisions above"]
229: 
230: </canonical_refs>
231: 
232: <specifics>
233: ## Specific Ideas
234: 
235: [Any specific references, examples, or concrete requirements from PRD]
236: 
237: </specifics>
238: 
239: <deferred>
240: ## Deferred Ideas
241: 
242: [Items in PRD explicitly marked as future/v2/out-of-scope]
243: [If none: "None — PRD covers phase scope"]
244: 
245: </deferred>
246: 
247: ---
248: 
249: *Phase: XX-name*
250: *Context gathered: [date] via PRD Express Path*
251: ```
252: 
253: 5. Commit:
254: ```bash
255: gsd-sdk query commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
256: ```
257: 
258: 6. Set `context_content` to the generated CONTEXT.md content and continue to step 5 (Handle Research).
259: 
260: **Effect:** This completely bypasses step 4 (Load CONTEXT.md) since we just created it. The rest of the workflow (research, planning, verification) proceeds normally with the PRD-derived context.
261: 
262: ## 4. Load CONTEXT.md
263: 
264: **Skip if:** PRD express path was used (CONTEXT.md already created in step 3.5).
265: 
266: Check `context_path` from init JSON.
267: 
268: If `context_path` is not null, display: `Using phase context from: ${context_path}`
269: 
270: **If `context_path` is null (no CONTEXT.md exists):**
271: 
272: Read discuss mode for context gate label:
273: ```bash
274: DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
275: ```
276: 
277: If `TEXT_MODE` is true, present as a plain-text numbered list:
278: ```
279: No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included.
280: 
281: 1. Continue without context — Plan using research + requirements only
282: [If DISCUSS_MODE is "assumptions":]
283: 2. Gather context (assumptions mode) — Analyze codebase and surface assumptions before planning
284: [If DISCUSS_MODE is "discuss" or unset:]
285: 2. Run discuss-phase first — Capture design decisions before planning
286: 
287: Enter number:
288: ```
289: 
290: Otherwise use question:
291: - header: "No context"
292: - question: "No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
293: - options:
294:   - "Continue without context" — Plan using research + requirements only
295:   If `DISCUSS_MODE` is `"assumptions"`:
296:   - "Gather context (assumptions mode)" — Analyze codebase and surface assumptions before planning
297:   If `DISCUSS_MODE` is `"discuss"` (or unset):
298:   - "Run discuss-phase first" — Capture design decisions before planning
299: 
300: If "Continue without context": Proceed to step 5.
301: If "Run discuss-phase first":
302:   **IMPORTANT:** Do NOT invoke discuss-phase as a nested Skill/Task call — question
303:   does not work correctly in nested subcontexts (#1009). Instead, display the command
304:   and exit so the user runs it as a top-level command:
305:   ```
306:   Run this command first, then re-run /gsd-plan-phase {X} ${GSD_WS}:
307: 
308:   /gsd-discuss-phase {X} ${GSD_WS}
309:   ```
310:   **Exit the plan-phase workflow. Do not continue.**
311: 
312: ## 4.5. Check AI-SPEC
313: 
314: **Skip if:** `ai_integration_phase_enabled` from config is false, or `--skip-ai-spec` flag provided.
315: 
316: ```bash
317: AI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-AI-SPEC.md 2>/dev/null | head -1)
318: AI_PHASE_CFG=$(gsd-sdk query config-get workflow.ai_integration_phase 2>/dev/null || echo "true")
319: ```
320: 
321: **Skip if `AI_PHASE_CFG` is `false`.**
322: 
323: **If `AI_SPEC_FILE` is empty:** Check phase goal for AI keywords:
324: ```bash
325: echo "${phase_goal}" | grep -qi "agent\|llm\|rag\|chatbot\|embedding\|langchain\|llamaindex\|crewai\|langgraph\|openai\|anthropic\|vector\|eval\|ai system"
326: ```
327: 
328: **If AI keywords detected AND no AI-SPEC.md:**
329: ```
330: ◆ Note: This phase appears to involve AI system development.
331:   Consider running /gsd-ai-integration-phase {N} before planning to:
332:   - Select the right framework for your use case
333:   - Research its docs and best practices
334:   - Design an evaluation strategy
335: 
336:   Continue planning without AI-SPEC? (non-blocking — /gsd-ai-integration-phase can be run after)
337: ```
338: 
339: Use question with options:
340: - "Continue — plan without AI-SPEC"
341: - "Stop — I'll run /gsd-ai-integration-phase {N} first"
342: 
343: If "Stop": Exit with `/gsd-ai-integration-phase {N}` reminder.
344: If "Continue": Proceed. (Non-blocking — planner will note AI-SPEC is absent.)
345: 
346: **If `AI_SPEC_FILE` is non-empty:** Extract framework for planner context:
347: ```bash
348: FRAMEWORK_LINE=$(grep "Selected Framework:" "${AI_SPEC_FILE}" | head -1)
349: ```
350: Pass `ai_spec_path` and `framework_line` to planner in step 7 so it can reference the AI design contract.
351: 
352: ## 5. Handle Research
353: 
354: **Skip if:** `--gaps` flag or `--skip-research` flag or `--reviews` flag.
355: 
356: ### 5.0. Research-Only Modifiers (`--view`, `--research`, prompt)
357: 
358: **Skip if:** `RESEARCH_ONLY` is `false`.
359: 
360: Three branches in research-only mode (`--research-phase <N>`):
361: 
362: 1. **`--view`** (or user picks "View" in the prompt below): print `RESEARCH.md` to stdout, no spawn, exit. If `RESEARCH.md` is missing, error with: `--view requires an existing RESEARCH.md; drop --view to spawn the researcher.`
363: 2. **`--research`** (force-refresh): re-spawn researcher unconditionally — fall through to "Spawn gsd-phase-researcher" below.
364: 3. **Neither flag AND `has_research=true`:** emit `RESEARCH.md already exists for Phase ${PHASE}.` and prompt the user with three choices: `1. Update — re-spawn researcher and refresh RESEARCH.md`, `2. View — print existing RESEARCH.md and exit (no spawn)`, `3. Skip — exit without spawning or printing`. Map "Update" → fall through to spawn, "View" → set `VIEW_ONLY=true` and emit RESEARCH.md as in (1), "Skip" → exit cleanly. Mirrors the deleted `/gsd-research-phase` standalone's existing-artifact menu (#3042 parity).
365: 
366: ```bash
367: if [[ "$VIEW_ONLY" == "true" ]]; then
368:   [[ -f "$research_path" ]] || { echo "Error: --view requires an existing RESEARCH.md (Phase ${PHASE}). Drop --view to spawn the researcher."; exit 1; }
369:   cat "$research_path"; exit 0
370: fi
371: ```
372: 
373: ### 5.1. Standard Research Decision
374: 
375: **Skip if** `RESEARCH_ONLY=true` (the research-only mode in 5.0 already determined the path: spawn or exit). Without this guard, an LLM following the workflow could fall through into "use existing, skip to step 6" → planner spawn, violating the research-only contract. **CR #3045 finding: this gate makes the early-exit unreachable from any non-research-only branch.**
376: 
377: **If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.
378: 
379: **If RESEARCH.md missing OR `--research` flag:**
380: 
381: **If no explicit flag (`--research` or `--skip-research`) and not `--auto`:**
382: Ask the user whether to research, with a contextual recommendation based on the phase:
383: 
384: If `TEXT_MODE` is true, present as a plain-text numbered list:
385: ```
386: Research before planning Phase {X}: {phase_name}?
387: 
388: 1. Research first (Recommended) — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
389: 2. Skip research — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.
390: 
391: Enter number:
392: ```
393: 
394: Otherwise use question:
395: ```
396: question([
397:   {
398:     question: "Research before planning Phase {X}: {phase_name}?",
399:     header: "Research",
400:     multiSelect: false,
401:     options: [
402:       { label: "Research first (Recommended)", description: "Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes." },
403:       { label: "Skip research", description: "Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks." }
404:     ]
405:   }
406: ])
407: ```
408: 
409: If user selects "Skip research": skip to step 6.
410: 
411: **If `--auto` and `research_enabled` is false:** Skip research silently (preserves automated behavior).
412: 
413: Display banner:
414: ```
415: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
416:  GSD ► RESEARCHING PHASE {X}
417: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
418: 
419: ◆ Spawning researcher...
420: ```
421: 
422: ### Spawn gsd-phase-researcher
423: 
424: ```bash
425: PHASE_DESC=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section)
426: ```
427: 
428: Research prompt:
429: 
430: ```markdown
431: <objective>
432: Research how to implement Phase {phase_number}: {phase_name}
433: Answer: "What do I need to know to PLAN this phase well?"
434: </objective>
435: 
436: <files_to_read>
437: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
438: - {requirements_path} (Project requirements)
439: - {state_path} (Project decisions and history)
440: </files_to_read>
441: 
442: ${AGENT_SKILLS_RESEARCHER}
443: 
444: <additional_context>
445: **Phase description:** {phase_description}
446: **Phase requirement IDs (MUST address):** {phase_req_ids}
447: 
448: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
449: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns
450: </additional_context>
451: 
452: <output>
453: Write to: {phase_dir}/{phase_num}-RESEARCH.md
454: </output>
455: ```
456: 
457: ```
458: Agent(
459:   prompt=research_prompt,
460:   subagent_type="gsd-phase-researcher",
461:   model="{researcher_model}",
462:   description="Research Phase {phase}"
463: )
464: ```
465: 
466: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
467: 
468: ### Handle Researcher Return
469: 
470: - **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 6
471: - **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort
472: 
473: ### Research-Only Early Exit (`--research-phase`)
474: 
475: **Skip if:** `RESEARCH_ONLY` is `false` (the default).
476: 
477: **If `RESEARCH_ONLY=true`:** the user invoked `/gsd-plan-phase --research-phase <N>` for research-only mode. Do **not** continue to Section 5.5+ (validation strategy, planner, plan-checker, verification, gaps, bounce, post-planning-gaps). Print the research-complete summary and exit cleanly:
478: 
479: ```text
480: ✓ Research-only mode complete (#3042)
481: 
482:   Phase:       ${PHASE}
483:   RESEARCH.md: ${research_path}
484: 
485: Re-run /gsd-plan-phase ${PHASE} to plan the phase using this research,
486: or /gsd-plan-phase ${PHASE} --research to refresh research and plan.
487: ```
488: 
489: This exits the workflow. The planner / plan-checker / verifier blocks below are skipped.
490: 
491: ## 5.5. Create Validation Strategy
492: 
493: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
494: 
495: If `research_enabled` is false and `nyquist_validation_enabled` is true: warn "Nyquist validation enabled but research disabled — VALIDATION.md cannot be created without RESEARCH.md. Plans will lack validation requirements (Dimension 8)." Continue to step 6.
496: 
497: **But Nyquist is not applicable for this run** when all of the following are true:
498: - `research_enabled` is false
499: - `has_research` is false
500: - no `--research` flag was provided
501: 
502: In that case: **skip validation-strategy creation entirely**. Do **not** expect `RESEARCH.md` or `VALIDATION.md` for this run, and continue to Step 6.
503: 
504: ```bash
505: grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null || true
506: ```
507: 
508: **If found:**
509: 1. Read template: `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
510: 2. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md` (use Write tool)
511: 3. Fill frontmatter: `{N}` → phase number, `{phase-slug}` → slug, `{date}` → current date
512: 4. Verify:
513: ```bash
514: test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
515: ```
516: 5. If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6
517: 6. If `commit_docs`: `commit "docs(phase-${PHASE}): add validation strategy"`
518: 
519: **If not found:** Warn and continue — plans may fail Dimension 8.
520: 
521: ## 5.55. Security Threat Model Gate
522: 
523: > Skip if `workflow.security_enforcement` is explicitly `false`. Absent = enabled.
524: 
525: ```bash
526: SECURITY_CFG=$(gsd-sdk query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
527: SECURITY_ASVS=$(gsd-sdk query config-get workflow.security_asvs_level --raw 2>/dev/null || echo "1")
528: SECURITY_BLOCK=$(gsd-sdk query config-get workflow.security_block_on --raw 2>/dev/null || echo "high")
529: ```
530: 
531: **If `SECURITY_CFG` is `false`:** Skip to step 5.6.
532: 
533: **If `SECURITY_CFG` is `true`:** Display banner:
534: 
535: ```
536: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
537:  GSD ► SECURITY THREAT MODEL REQUIRED (ASVS L{SECURITY_ASVS})
538: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
539: 
540: Each PLAN.md must include a <threat_model> block.
541: Block on: {SECURITY_BLOCK} severity threats.
542: Opt out: set security_enforcement: false in .planning/config.json
543: ```
544: 
545: Continue to step 5.6. Security config is passed to the planner in step 8.
546: 
547: ## 5.6. UI Design Contract Gate
548: 
549: > Skip if `workflow.ui_phase` is explicitly `false` AND `workflow.ui_safety_gate` is explicitly `false` in `.planning/config.json`. If keys are absent, treat as enabled.
550: 
551: ```bash
552: UI_PHASE_CFG=$(gsd-sdk query config-get workflow.ui_phase 2>/dev/null || echo "true")
553: UI_GATE_CFG=$(gsd-sdk query config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
554: ```
555: 
556: **If both are `false`:** Skip to step 6.
557: 
558: Check if phase has frontend indicators:
559: 
560: ```bash
561: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" 2>/dev/null)
562: echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
563: HAS_UI=$?
564: ```
565: 
566: **If `HAS_UI` is 0 (frontend indicators found):**
567: 
568: Check for existing UI-SPEC:
569: ```bash
570: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
571: ```
572: 
573: **If UI-SPEC.md found:** Set `UI_SPEC_PATH=$UI_SPEC_FILE`. Display: `Using UI design contract: ${UI_SPEC_PATH}`
574: 
575: **If UI-SPEC.md missing AND `--skip-ui` flag is present in $ARGUMENTS:** Skip silently to step 6.
576: 
577: **If UI-SPEC.md missing AND `UI_GATE_CFG` is `true`:**
578: 
579: Read ephemeral chain flag (same field as `check.auto-mode` → `auto_chain_active`):
580: ```bash
581: AUTO_CHAIN=$(gsd-sdk query check auto-mode --pick auto_chain_active 2>/dev/null || echo "false")
582: ```
583: 
584: **If `AUTO_CHAIN` is `true` (running inside a `--chain` or `--auto` pipeline):**
585: 
586: Auto-generate UI-SPEC without prompting:
587: ```
588: Skill(skill="gsd-ui-phase", args="${PHASE} --auto ${GSD_WS}")
589: ```
590: After `gsd-ui-phase` returns, re-read:
591: ```bash
592: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
593: UI_SPEC_PATH="${UI_SPEC_FILE}"
594: ```
595: Continue to step 6.
596: 
597: **If `AUTO_CHAIN` is `false` (manual invocation):**
598: 
599: Output this markdown directly (not as a code block):
600: 
601: ```
602: ## ⚠ UI-SPEC.md missing for Phase {N}
603: ▶ Recommended next step:
604: `/gsd-ui-phase {N} ${GSD_WS}` — generate UI design contract before planning
605: ───────────────────────────────────────────────
606: Also available:
607: - `/gsd-plan-phase {N} --skip-ui ${GSD_WS}` — plan without UI-SPEC (not recommended for frontend phases)
608: ```
609: 
610: **Exit the plan-phase workflow. Do not continue.**
611: 
612: **If `HAS_UI` is 1 (no frontend indicators):** Skip silently to step 5.7.
613: 
614: ## 5.7. Schema Push Detection Gate
615: 
616: > Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.
617: 
618: Check if any files in the phase scope match schema patterns:
619: 
620: ```bash
621: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
622: ```
623: 
624: Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:
625: 
626: | ORM | File Patterns |
627: |-----|--------------|
628: | Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
629: | Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
630: | Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
631: | Supabase | `supabase/migrations/*.sql` |
632: | TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |
633: 
634: Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.
635: 
636: **If schema-relevant files detected:**
637: 
638: Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.
639: 
640: Determine the push command for the detected ORM:
641: 
642: | ORM | Push Command | Non-TTY Workaround |
643: |-----|-------------|-------------------|
644: | Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
645: | Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
646: | Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
647: | Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
648: | TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |
649: 
650: Inject the following into the planner prompt (step 8) as an additional constraint:
651: 
652: ```markdown
653: <schema_push_requirement>
654: **[BLOCKING] Schema Push Required**
655: 
656: This phase modifies schema-relevant files ({detected_files}). The planner MUST include
657: a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
658: modifications are complete but BEFORE verification.
659: 
660: - ORM detected: {SCHEMA_ORM}
661: - Push command: {push_command}
662: - Non-TTY workaround: {env_hint}
663: - If push requires interactive prompts that cannot be suppressed, flag the task for
664:   manual intervention with `autonomous: false`
665: 
666: This task is mandatory — the phase CANNOT pass verification without it. Build and
667: type checks will pass without the push (types come from config, not the live database),
668: creating a false-positive verification state.
669: </schema_push_requirement>
670: ```
671: 
672: Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`
673: 
674: **If no schema-relevant files detected:** Skip silently to step 6.
675: 
676: ## 6. Check Existing Plans
677: 
678: ```bash
679: ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
680: ```
681: 
682: **If exists AND `--reviews` flag:** Skip prompt — go straight to replanning (the purpose of `--reviews` is to replan with review feedback).
683: 
684: **If exists AND no `--reviews` flag:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.
685: 
686: ## 7. Use Context Paths from INIT
687: 
688: Extract from INIT JSON:
689: 
690: ```bash
691: _gsd_field() { node -e "const o=JSON.parse(process.argv[1]); const v=o[process.argv[2]]; process.stdout.write(v==null?'':String(v))" "$1" "$2"; }
692: STATE_PATH=$(_gsd_field "$INIT" state_path)
693: ROADMAP_PATH=$(_gsd_field "$INIT" roadmap_path)
694: REQUIREMENTS_PATH=$(_gsd_field "$INIT" requirements_path)
695: RESEARCH_PATH=$(_gsd_field "$INIT" research_path)
696: VERIFICATION_PATH=$(_gsd_field "$INIT" verification_path)
697: UAT_PATH=$(_gsd_field "$INIT" uat_path)
698: CONTEXT_PATH=$(_gsd_field "$INIT" context_path)
699: REVIEWS_PATH=$(_gsd_field "$INIT" reviews_path)
700: PATTERNS_PATH=$(_gsd_field "$INIT" patterns_path)
701: 
702: # Detect spike/sketch findings skills (project-local)
703: SPIKE_FINDINGS_PATH=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
704: SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
705: ```
706: 
707: ## 7.5. Verify Nyquist Artifacts
708: 
709: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
710: 
711: Also skip if all of the following are true:
712: - `research_enabled` is false
713: - `has_research` is false
714: - no `--research` flag was provided
715: 
716: In that no-research path, Nyquist artifacts are **not required** for this run.
717: 
718: ```bash
719: VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
720: ```
721: 
722: If missing and Nyquist is still enabled/applicable — ask user:
723: 1. Re-run: `/gsd-plan-phase {PHASE} --research ${GSD_WS}`
724: 2. Disable Nyquist with the exact command:
725:    `gsd-sdk query config-set workflow.nyquist_validation false`
726: 3. Continue anyway (plans fail Dimension 8)
727: 
728: Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled) only if user selects 2 or 3.
729: 
730: ## 7.8. Spawn gsd-pattern-mapper Agent (Optional)
731: 
732: **Skip if** `workflow.pattern_mapper` is explicitly set to `false` in config.json (absent key = enabled). Also skip if no CONTEXT.md and no RESEARCH.md exist for this phase (nothing to extract file lists from).
733: 
734: Check config:
735: ```bash
736: PATTERN_MAPPER_CFG=$(gsd-sdk query config-get workflow.pattern_mapper 2>/dev/null || echo "true")
737: ```
738: 
739: **If `PATTERN_MAPPER_CFG` is `false`:** Skip to step 8.
740: 
741: **If PATTERNS.md already exists** (`PATTERNS_PATH` is non-empty from step 7): Skip to step 8 (use existing).
742: 
743: Display banner:
744: ```
745: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
746:  GSD ► PATTERN MAPPING PHASE {X}
747: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
748: 
749: ◆ Spawning pattern mapper...
750: ```
751: 
752: Pattern mapper prompt:
753: 
754: ```markdown
755: <pattern_mapping_context>
756: **Phase:** {phase_number} - {phase_name}
757: **Phase directory:** {phase_dir}
758: **Padded phase:** {padded_phase}
759: 
760: <files_to_read>
761: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
762: - {research_path} (Technical Research)
763: </files_to_read>
764: 
765: **Output file:** {phase_dir}/{padded_phase}-PATTERNS.md
766: 
767: Extract the list of files to be created/modified from CONTEXT.md and RESEARCH.md. For each file, classify by role and data flow, find the closest existing analog in the codebase, extract concrete code excerpts, and produce PATTERNS.md.
768: </pattern_mapping_context>
769: ```
770: 
771: Spawn with:
772: ```
773: Agent(
774:   prompt="{above}",
775:   subagent_type="gsd-pattern-mapper",
776:   model="{researcher_model}",
777: )
778: ```
779: 
780: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
781: 
782: **Handle return:**
783: - **`## PATTERN MAPPING COMPLETE`:** Update `PATTERNS_PATH` to the created file path, continue to step 8.
784: - **Any error or empty return:** Log warning, continue to step 8 without patterns (non-blocking).
785: 
786: After pattern mapper completes, update the path variable:
787: ```bash
788: PATTERNS_PATH="${PHASE_DIR}/${PADDED_PHASE}-PATTERNS.md"
789: ```
790: 
791: ## 8. Spawn gsd-planner Agent
792: 
793: Display banner:
794: ```
795: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
796:  GSD ► PLANNING PHASE {X}
797: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
798: 
799: ◆ Spawning planner...
800: ```
801: 
802: Planner prompt:
803: 
804: ```markdown
805: <planning_context>
806: **Phase:** {phase_number}
807: **Mode:** {standard | gap_closure | reviews}
808: 
809: <files_to_read>
810: - {state_path} (Project State)
811: - {roadmap_path} (Roadmap)
812: - {requirements_path} (Requirements)
813: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
814: - {research_path} (Technical Research)
815: - {PATTERNS_PATH} (Pattern Map — analog files and code excerpts, if exists)
816: - {verification_path} (Verification Gaps - if --gaps)
817: - {uat_path} (UAT Gaps - if --gaps)
818: - {reviews_path} (Cross-AI Review Feedback - if --reviews)
819: - {UI_SPEC_PATH} (UI Design Contract — visual/interaction specs, if exists)
820: - {SPIKE_FINDINGS_PATH} (Spike Findings — validated patterns, constraints, landmines from experiments, if exists)
821: - {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction, if exists)
822: ${CONTEXT_WINDOW >= 500000 ? `
823: **Cross-phase context (1M model enrichment):**
824: - CONTEXT.md files from the 3 most recent completed phases (locked decisions — maintain consistency)
825: - SUMMARY.md files from the 3 most recent completed phases (what was built — reuse patterns, avoid duplication)
826: - LEARNINGS.md files from the 3 most recent completed phases (structured decisions, patterns, lessons, surprises — skip silently if a phase has no LEARNINGS.md; prefix each block with \`[from Phase N LEARNINGS]\` for source attribution; if total size exceeds 15% of context budget, drop oldest first)
827: - CONTEXT.md, SUMMARY.md, and LEARNINGS.md from any phases listed in the current phase's "Depends on:" field in ROADMAP.md (regardless of recency — explicit dependencies always load, deduplicated against the 3 most recent)
828: - Skip all other prior phases to stay within context budget
829: ` : ''}
830: </files_to_read>
831: 
832: ${AGENT_SKILLS_PLANNER}
833: 
834: **Phase requirement IDs (every ID MUST appear in a plan's `requirements` field):** {phase_req_ids}
835: 
836: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
837: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
838: 
839: ${TDD_MODE === 'true' ? `
840: <tdd_mode_active>
841: **TDD Mode is ENABLED.** Apply TDD heuristics from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md to all eligible tasks:
842: - Business logic with defined I/O → type: tdd
843: - API endpoints with request/response contracts → type: tdd
844: - Data transformations, validation, algorithms → type: tdd
845: - UI, config, glue code, CRUD → standard plan (type: execute)
846: Each TDD plan gets one feature with RED/GREEN/REFACTOR gate sequence.
847: </tdd_mode_active>
848: ` : ''}
849: 
850: **MVP_MODE:** ${MVP_MODE} (when true, follow vertical-slice rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md`; when false, ignore MVP guidance entirely.)
851: **WALKING_SKELETON:** ${WALKING_SKELETON} (when true, the first deliverable must be a Walking Skeleton — produce SKELETON.md alongside PLAN.md.)
852: 
853: ${MVP_MODE === 'true' ? `
854: <mvp_mode_active>
855: **MVP Mode is ENABLED.** Follow vertical-slice planning rules from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md. Each plan must deliver a complete vertical slice — thin end-to-end functionality rather than horizontal layers.
856: </mvp_mode_active>
857: ` : ''}
858: </planning_context>
859: 
860: <downstream_consumer>
861: Output consumed by /gsd-execute-phase. Plans need:
862: - Frontmatter (wave, depends_on, files_modified, autonomous)
863: - Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY on every task)
864: - Verification criteria
865: - must_haves for goal-backward verification
866: </downstream_consumer>
867: 
868: <deep_work_rules>
869: ## Anti-Shallow Execution Rules (MANDATORY)
870: 
871: Every task MUST include these fields — they are NOT optional:
872: 
873: 1. **`<read_first>`** — Files the executor MUST read before touching anything. Always include:
874:    - The file being modified (so executor sees current state, not assumptions)
875:    - Any "source of truth" file referenced in CONTEXT.md (reference implementations, existing patterns, config files, schemas)
876:    - Any file whose patterns, signatures, types, or conventions must be replicated or respected
877: 
878: 2. **`<acceptance_criteria>`** — Verifiable conditions that prove the task was done correctly. Rules:
879:    - Every criterion must be checkable with grep, file read, test command, or CLI output
880:    - NEVER use subjective language ("looks correct", "properly configured", "consistent with")
881:    - ALWAYS include exact strings, patterns, values, or command outputs that must be present
882:    - Examples:
883:      - Code: `auth.py contains def verify_token(` / `test_auth.py exits 0`
884:      - Config: `.env.example contains DATABASE_URL=` / `Dockerfile contains HEALTHCHECK`
885:      - Docs: `README.md contains '## Installation'` / `API.md lists all endpoints`
886:      - Infra: `deploy.yml has rollback step` / `docker-compose.yml has healthcheck for db`
887: 
888: 3. **`<action>`** — Must include CONCRETE values, not references. Rules:
889:    - NEVER say "align X with Y", "match X to Y", "update to be consistent" without specifying the exact target state
890:    - ALWAYS include the actual values: config keys, function signatures, SQL statements, class names, import paths, env vars, etc.
891:    - If CONTEXT.md has a comparison table or expected values, copy them into the action verbatim
892:    - The executor should be able to complete the task from the action text alone, without needing to read CONTEXT.md or reference files (read_first is for verification, not discovery)
893: 
894: **Why this matters:** Executor agents work from the plan text. Vague instructions like "update the config to match production" produce shallow one-line changes. Concrete instructions like "add DATABASE_URL=postgresql://... , set POOL_SIZE=20, add REDIS_URL=redis://..." produce complete work. The cost of verbose plans is far less than the cost of re-doing shallow execution.
895: </deep_work_rules>
896: 
897: <quality_gate>
898: - [ ] PLAN.md files created in phase directory
899: - [ ] Each plan has valid frontmatter
900: - [ ] Tasks are specific and actionable
901: - [ ] Every task has `<read_first>` with at least the file being modified
902: - [ ] Every task has `<acceptance_criteria>` with grep-verifiable conditions
903: - [ ] Every `<action>` contains concrete values (no "align X with Y" without specifying what)
904: - [ ] Dependencies correctly identified
905: - [ ] Waves assigned for parallel execution
906: - [ ] must_haves derived from phase goal
907: </quality_gate>
908: ```
909: 
910: **If `CHUNKED_MODE` is `false` (default):** Spawn the planner as a single long-lived Agent:
911: 
912: ```text
913: Agent(
914:   prompt=filled_prompt,
915:   subagent_type="gsd-planner",
916:   model="{planner_model}",
917:   description="Plan Phase {phase}"
918: )
919: ```
920: 
921: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
922: 
923: **If `CHUNKED_MODE` is `true`:** Skip the Agent() call above — proceed to step 8.5 instead.
924: 
925: ## 8.5. Chunked Planning Mode
926: 
927: **Skip if `CHUNKED_MODE` is `false`.**
928: 
929: Chunked mode splits the single long-lived planner Agent run into a short outline Agent run followed by
930: N short per-plan Agent runs. Each run is bounded to ~3–5 min; each plan is committed individually
931: for crash resilience. If any run hangs and the terminal is force-killed, rerunning
932: `/gsd-plan-phase {N} --chunked` resumes from the last successfully committed plan.
933: 
934: **Intended for new or in-progress chunked runs.** To recover plans already written by a prior
935: *non-chunked* run, use step 6's "Add more plans" or proceed directly to `/gsd-execute-phase`
936: — don't start a fresh chunked run over existing non-chunked plans.
937: 
938: ### 8.5.1 Outline Phase (outline-only mode, ~2 min)
939: 
940: **Resume detection:** If `${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md` already exists **and
941: is valid** (contains the `## OUTLINE COMPLETE` marker), skip this sub-step — the outline
942: already exists from a previous run. Proceed directly to 8.5.2.
943: 
944: ```bash
945: OUTLINE_FILE="${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md"
946: if [[ -f "$OUTLINE_FILE" ]] && grep -q "^## OUTLINE COMPLETE" "$OUTLINE_FILE"; then
947:   # reuse existing outline — skip to 8.5.2
948: fi
949: ```
950: 
951: Display:
952: ```text
953: ◆ Chunked mode: spawning outline planner...
954: ```
955: 
956: Spawn the planner in **outline-only** mode — it must write only the outline manifest, not any
957: PLAN.md files:
958: 
959: ```javascript
960: Agent(
961:   prompt="{same planning_context as step 8, plus:}
962: 
963:   **Chunked mode: outline-only.**
964:   Do NOT write any PLAN.md files in this Task.
965:   Write only: {PHASE_DIR}/{PADDED_PHASE}-PLAN-OUTLINE.md
966: 
967:   The outline must be a markdown table with columns:
968:   Plan ID | Objective | Wave | Depends On | Requirements
969: 
970:   Return: ## OUTLINE COMPLETE with plan count.",
971:   subagent_type="gsd-planner",
972:   model="{planner_model}",
973:   description="Outline Phase {phase} (chunked)"
974: )
975: ```
976: 
977: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
978: 
979: Handle return:
980: - **`## OUTLINE COMPLETE`:** Read `PLAN-OUTLINE.md`, extract plan list. Continue to 8.5.2.
981: - **Any other return or empty:** Display error. Offer: 1) Retry outline, 2) Stop.
982: 
983: ### 8.5.2 Per-Plan Tasks (single-plan mode, ~3-5 min each)
984: 
985: For each plan entry extracted from `PLAN-OUTLINE.md`:
986: 
987: 1. **Resume check:** If `${PHASE_DIR}/{plan_id}-PLAN.md` already exists on disk **and has
988:    valid YAML frontmatter** (opening `---` delimiter present), skip this plan (do not
989:    overwrite completed work — resume safety).
990: 
991:    ```bash
992:    PLAN_FILE="${PHASE_DIR}/${plan_id}-PLAN.md"
993:    if [[ -f "$PLAN_FILE" ]] && head -1 "$PLAN_FILE" | grep -q '^---'; then
994:      continue  # plan already written, skip
995:    fi
996:    ```
997: 
998: 2. Display:
999:    ```text
1000:    ◆ Chunked mode: planning {plan_id} ({k}/{N})...
1001:    ```
1002: 
1003: 3. Spawn the planner in **single-plan** mode — it must write exactly one PLAN.md file:
1004:    ```javascript
1005:    Agent(
1006:      prompt="{same planning_context as step 8, plus:}
1007: 
1008:      **Chunked mode: single-plan.**
1009:      Write exactly ONE plan file: {PHASE_DIR}/{plan_id}-PLAN.md
1010:      Plan to write: {plan_id} — {objective}
1011:      Wave: {wave} | Depends on: {depends_on}
1012:      Phase requirement IDs to cover in this plan: {plan_requirements}
1013: 
1014:      Return: ## PLAN COMPLETE with the plan ID.",
1015:      subagent_type="gsd-planner",
1016:      model="{planner_model}",
1017:      description="Plan {plan_id} (chunked {k}/{N})"
1018:    )
1019:    ```
1020: 
1021:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1022: 
1023: 4. **Verify disk:** Check `${PHASE_DIR}/{plan_id}-PLAN.md` exists. If missing: offer 1) Retry, 2) Stop.
1024: 
1025: 5. **Commit per-plan:**
1026:    ```bash
1027:    gsd-sdk query commit "docs(${PADDED_PHASE}): plan ${plan_id} (chunked)" --files "${PHASE_DIR}/${plan_id}-PLAN.md"
1028:    ```
1029: 
1030: After all N plans are written and committed, treat this as `## PLANNING COMPLETE` and continue
1031: to step 9.
1032: 
1033: ## 9. Handle Planner Return
1034: 
1035: - **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false (from init): skip to step 13. Otherwise: step 10.
1036: - **`## PHASE SPLIT RECOMMENDED`:** The planner determined the phase exceeds the context budget for full-fidelity implementation of all source items. Handle in step 9b.
1037: - **`## ⚠ Source Audit: Unplanned Items Found`:** The planner's multi-source coverage audit found items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions that are not covered by any plan. Handle in step 9c.
1038: - **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
1039: - **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual
1040: - **Empty / truncated / no recognized marker:** → Filesystem fallback (step 9a).
1041: 
1042: ## 9a. Filesystem Fallback (Planner)
1043: 
1044: **Triggered when:** Agent() returns but the return contains no recognized marker (`## PLANNING COMPLETE`, `## PHASE SPLIT RECOMMENDED`, `## ⚠ Source Audit`, `## CHECKPOINT REACHED`, `## PLANNING INCONCLUSIVE`).
1045: 
1046: ```bash
1047: DISK_PLANS=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
1048: ```
1049: 
1050: **If `DISK_PLANS` > 0:** The planner wrote plans to disk but the Agent() return was empty or
1051: truncated (the Windows stdio hang pattern — the subagent finished but the return never
1052: arrived). Display:
1053: 
1054: ```text
1055: ◆ Planner wrote {DISK_PLANS} plan(s) to disk but did not emit a PLANNING COMPLETE marker.
1056:   This is a known Windows stdio hang pattern — work is likely recoverable.
1057: 
1058:   Plans found on disk:
1059:   {ls output of *-PLAN.md}
1060: ```
1061: 
1062: Offer 3 options:
1063: 1. **Accept plans** — treat as `## PLANNING COMPLETE` and continue through step 9 `## PLANNING COMPLETE` handling (so `--skip-verify` / `plan_checker_enabled=false` are honored — may skip to step 13 rather than step 10)
1064: 2. **Retry planner** — re-spawn the planner with the same prompt (return to step 8)
1065: 3. **Stop** — exit; user can re-run `/gsd-plan-phase {N}` to resume
1066: 
1067: **If `DISK_PLANS` is 0 and no marker:** The planner produced no output. Treat as
1068: `## PLANNING INCONCLUSIVE` and handle accordingly.
1069: 
1070: ## 9b. Handle Phase Split Recommendation
1071: 
1072: When the planner returns `## PHASE SPLIT RECOMMENDED`, it means the phase's source items exceed the context budget for full-fidelity implementation. The planner proposes groupings.
1073: 
1074: **Extract from planner return:**
1075: - Proposed sub-phases (e.g., "17a: processing core (D-01 to D-19)", "17b: billing + config UX (D-20 to D-27)")
1076: - Which source items (REQ-IDs, D-XX decisions, RESEARCH items) go in each sub-phase
1077: - Why the split is necessary (context cost estimate, file count)
1078: 
1079: **Present to user:**
1080: ```
1081: ## Phase {X} exceeds context budget for full-fidelity implementation
1082: 
1083: The planner found {N} source items that exceed the context budget when
1084: planned at full fidelity. Instead of reducing scope, we recommend splitting:
1085: 
1086: **Option 1: Split into sub-phases**
1087: - Phase {X}a: {name} — {items} ({N} source items, ~{P}% context)
1088: - Phase {X}b: {name} — {items} ({M} source items, ~{Q}% context)
1089: 
1090: **Option 2: Proceed anyway** (planner will attempt all, quality may degrade past 50% context)
1091: 
1092: **Option 3: Prioritize** — you choose which items to implement now,
1093: rest become a follow-up phase
1094: ```
1095: 
1096: Use question with these 3 options.
1097: 
1098: **If "Split":** Use `/gsd-phase --insert` to create the sub-phases, then replan each.
1099: **If "Proceed":** Return to planner with instruction to attempt all items at full fidelity, accepting more plans/tasks.
1100: **If "Prioritize":** Use question (multiSelect) to let user pick which items are "now" vs "later". Create CONTEXT.md for each sub-phase with the selected items.
1101: 
1102: ## 9c. Handle Source Audit Gaps
1103: 
1104: When the planner returns `## ⚠ Source Audit: Unplanned Items Found`, it means items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions have no corresponding plan.
1105: 
1106: **Extract from planner return:**
1107: - Each unplanned item with its source artifact and section
1108: - The planner's suggested options (A: add plan, B: split phase, C: defer with confirmation)
1109: 
1110: **Present each gap to user.** For each unplanned item:
1111: 
1112: ```
1113: ## ⚠ Unplanned: {item description}
1114: 
1115: Source: {RESEARCH.md / REQUIREMENTS.md / ROADMAP goal / CONTEXT.md}
1116: Details: {why the planner flagged this}
1117: 
1118: Options:
1119: 1. Add a plan to cover this item (recommended)

(Output capped at 50 KB. Showing lines 1-1119. Use offset=1120 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

## USER (turn 33)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ```

## USER (turn 34)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ```

### Tool: task

**Input:**
```json
{
  "description": "Plan CP-DT-01 delegation",
  "subagent_type": "gsd-planner",
  "task_id": "ses_1c8350683ffedKXOfJpQu0Lqn5"
}
```

**Output:** (pruned)
```
task_id: ses_1c8350683ffedKXOfJpQu0Lqn5
```


## USER (turn 35)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ``` 

## COMPACTED (2026-05-17T21:26:55.976Z)

**raw_event:**

```json
{
  "id": "evt_e37d5c0e1001lIOxt7efXKZZnc",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6bc9573ce95c43939d250ca3"
}
```


## USER (turn 36)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ``` 

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_M1p5JHvLURCmcAu90j1yvJPD"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_JEZ7ASkzbLP4SyOT1SZEotQj"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_xH251mdaiLFaXUw8wOlQ01gg"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_EdR3wz5ufl36OI8VkRulxyN4"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_ogejZgF1WGbXK3ZM0jKG3Afu"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_XDlIMWlhZLR6RnZpThqETVGW"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_jbPW12pTPm6vjwXAQlw7CHj6"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_GMbvbZ0XeEUtv3qd7C7wDCLB"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/AGENTS.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_8C1XkKkq63rhPTf0R35K1hha"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_4R0rbvlfL470glK1hdzOAReY"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_i352JFcuyRSYSo7ibCSGOIkU"
}
```


## USER (turn 37)

**source:** real-human

@gsd-executor /gsd-execute-phase CP-DT-01

## USER (turn 14)

**source:** real-human

hãy tự động route gsd append trực tiếp không sử dụng `@agent` các delegation đó là hệ quả của task tool sẽ được quyết định sau khi append slash command trực tiếp tại đây

## USER (turn 38)

**source:** real-human

hãy tự động route gsd append trực tiếp không sử dụng `@agent` các delegation đó là hệ quả của task tool sẽ được quyết định sau khi append slash command trực tiếp tại đây append execute phase /gsd-execute-phase CP-DT-01

### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_sSsayL35YyUQQK6hSD1FG2aP"
}
```


## USER (turn 39)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `CP-DT-01`
- If a documented flag is absent from `CP-DT-01`, treat it as inactive

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase: CP-DT-01

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `CP-DT-01`:**
- `--wave N` is active only if the literal `--wave` token is present in `CP-DT-01`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `CP-DT-01`
- `--interactive` is active only if the literal `--interactive` token is present in `CP-DT-01`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to subagents.
3: </purpose>
4: 
5: <core_principle>
6: Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
7: </core_principle>
8: 
9: <runtime_compatibility>
10: **Subagent spawning is runtime-specific:**
11: - **Claude Code:** Uses `Agent(subagent_type="gsd-executor", ...)` — blocks until complete, returns result
12: - **Copilot:** Subagent spawning does not reliably return completion signals. **Default to
13:   sequential inline execution**: read and follow execute-plan.md directly for each plan
14:   instead of spawning parallel agents. Only attempt parallel spawning if the user
15:   explicitly requests it — and in that case, rely on the spot-check fallback in step 3
16:   to detect completion.
17: - **Other runtimes:** If `Agent`/`agent` tool is unavailable, use sequential inline execution as the
18:   fallback. Check for tool availability at runtime rather than assuming based on runtime name.
19: 
20: **Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
21: the orchestrator never receives the completion signal, treat it as successful based on spot-checks
22: and continue to the next wave/plan. Never block indefinitely waiting for a signal — always verify
23: via filesystem and git state.
24: </runtime_compatibility>
25: 
26: <required_reading>
27: Read STATE.md before any operation to load project context.
28: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
29: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
31: </required_reading>
32: 
33: <available_agent_types>
34: These are the valid GSD subagent types registered in .claude/agents/ (or equivalent for your runtime).
35: Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:
36: 
37: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
38: - gsd-verifier — Verifies phase completion, checks quality gates
39: - gsd-planner — Creates detailed plans from phase scope
40: - gsd-phase-researcher — Researches technical approaches for a phase
41: - gsd-plan-checker — Reviews plan quality before execution
42: - gsd-debugger — Diagnoses and fixes issues
43: - gsd-codebase-mapper — Maps project structure and dependencies
44: - gsd-integration-checker — Checks cross-phase integration
45: - gsd-nyquist-auditor — Validates verification coverage
46: - gsd-ui-researcher — Researches UI/UX approaches
47: - gsd-ui-checker — Reviews UI implementation quality
48: - gsd-ui-auditor — Audits UI against design requirements
49: </available_agent_types>
50: 
51: <process>
52: 
53: <step name="parse_args" priority="first">
54: Parse `$ARGUMENTS` before loading any context:
55: 
56: - First positional token → `PHASE_ARG`
57: - Optional `--wave N` → `WAVE_FILTER`
58: - Optional `--gaps-only` keeps its current meaning
59: - Optional `--cross-ai` → `CROSS_AI_FORCE=true` (force all plans through cross-AI execution)
60: - Optional `--no-cross-ai` → `CROSS_AI_DISABLED=true` (disable cross-AI for this run, overrides config and frontmatter)
61: 
62: If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
63: </step>
64: 
65: <step name="initialize" priority="first">
66: Load all context in one call:
67: 
68: ```bash
69: INIT=$(gsd-sdk query init.execute-phase "${PHASE_ARG}")
70: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
71: AGENT_SKILLS=$(gsd-sdk query agent-skills gsd-executor)
72: ```
73: 
74: Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
75: 
76: **Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls — do NOT pass `model="inherit"` to Agent. Omitting the `model=` parameter causes Claude Code to inherit the current orchestrator model automatically. Only set `model=` when `executor_model` is an explicit model name (e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-7"`).
77: 
78: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
79: 
80: Read worktree config:
81: 
82: ```bash
83: USE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")
84: ```
85: 
86: If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every plan in a submodule project even when the plan was nowhere near a submodule. Compute submodule paths once and intersect them per-plan with the plan's declared `files_modified` frontmatter.
87: 
88: ```bash
89: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
90: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
91: if [ -f .gitmodules ]; then
92:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
93: else
94:   SUBMODULE_PATHS=""
95: fi
96: ```
97: 
98: `SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different files — only plans whose paths intersect a submodule must drop worktree isolation; plans nowhere near a submodule keep parallel isolation.
99: 
100: When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are project-disabled.
101: 
102: Read context window size for adaptive prompt enrichment:
103: 
104: ```bash
105: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
106: ```
107: 
108: When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
109: - Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
110: - Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
111: - This enables cross-phase awareness and history-aware verification
112: 
113: When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
114: - Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
115: - Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
116: - Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
117: - This reduces executor static overhead by ~40% while preserving behavioral correctness
118: 
119: **If `phase_found` is false:** Error — phase directory not found.
120: **If `plan_count` is 0:** Error — no plans found in phase.
121: **If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.
122: 
123: When `parallelization` is false, plans within a wave execute sequentially.
124: 
125: **Runtime detection for Copilot:**
126: Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
127: or absence of the `Agent()` subagent API. If running under Copilot, force sequential inline
128: execution regardless of the `parallelization` setting — Copilot's subagent completion
129: signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
130: internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
131: inline path for each plan.
132: 
133: **REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference). You MUST execute this bash block before any config reads:
134: ```bash
135: # REQUIRED: prevents stale auto-chain from previous --auto runs
136: if [[ ! "$ARGUMENTS" =~ --auto ]]; then
137:   gsd-sdk query config-set workflow._auto_chain_active false || true
138: fi
139: ```
140: 
141: Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
142: ```bash
143: MVP_FLAG_ARG=""
144: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
145: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
146: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
147: ```
148: 
149: **MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
150: ```bash
151: if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
152:   IS_BEHAVIOR_ADDING=$(gsd-sdk query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)
153:   if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
154:     RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
155:     if [ -z "$RED_COMMIT" ]; then
156:       gsd-sdk query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true
157:       echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
158:       exit 1
159:     fi
160:   fi
161: fi
162: ```
163: Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. See `execute-mvp-tdd.md` for the halt report format.
164: </step>
165: 
166: <step name="check_blocking_antipatterns" priority="first">
167: **MANDATORY — Check for blocking anti-patterns before any other work.**
168: 
169: Look for a `.continue-here.md` in the current phase directory:
170: 
171: ```bash
172: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
173: ```
174: 
175: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
176: 
177: **If one or more `blocking` anti-patterns are found:**
178: 
179: This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:
180: 
181: 1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
182: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
183: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.
184: 
185: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
186: 
187: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
188: </step>
189: 
190: <step name="check_interactive_mode">
191: **Parse `--interactive` flag from $ARGUMENTS.**
192: 
193: **If `--interactive` flag present:** Switch to interactive execution mode.
194: 
195: Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
196: checkpoints between tasks. The user can review, modify, or redirect work at any point.
197: 
198: **Interactive execution flow:**
199: 
200: 1. Load plan inventory as normal (discover_and_group_plans)
201: 2. For each plan (sequentially, ignoring wave grouping):
202: 
203:    a. **Present the plan to the user:**
204:       ```
205:       ## Plan {plan_id}: {plan_name}
206: 
207:       Objective: {from plan file}
208:       Tasks: {task_count}
209: 
210:       Options:
211:       - Execute (proceed with all tasks)
212:       - Review first (show task breakdown before starting)
213:       - Skip (move to next plan)
214:       - Stop (end execution, save progress)
215:       ```
216: 
217:    b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.
218: 
219:    c. **If "Execute":** Read and follow `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md` **inline**
220:       (do NOT spawn a subagent). Execute tasks one at a time.
221: 
222:    d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
223:       their feedback before continuing. Otherwise proceed to next task.
224: 
225:    e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.
226: 
227: 3. After all plans: proceed to verification (same as normal mode).
228: 
229: **Benefits of interactive mode:**
230: - No subagent overhead — dramatically lower token usage
231: - User catches mistakes early — saves costly verification cycles
232: - Maintains GSD's planning/tracking structure
233: - Best for: small phases, bug fixes, verification gaps, learning GSD
234: 
235: **Skip to handle_branching step** (interactive plans execute inline after grouping).
236: </step>
237: 
238: <step name="handle_branching">
239: Check `branching_strategy` from init:
240: 
241: **"none":** Skip, continue on current branch.
242: 
243: **"phase" or "milestone":** Use pre-computed `branch_name` from init.
244: 
245: Fork the new phase branch off `origin/HEAD` (the project's default branch), not the current HEAD — otherwise consecutive phases compound and stay unpushed (#2916). If `$BRANCH_NAME` already exists locally, reuse it as-is.
246: 
247: ```bash
248: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
249: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
250: 
251: if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
252:   git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to existing branch '$BRANCH_NAME'." >&2; exit 1; }
253: else
254:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then  # #2916
255:     git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" \
256:       || { echo "ERROR: fetch origin/$DEFAULT_BRANCH failed and no local copy exists. Refusing to create '$BRANCH_NAME' off current HEAD (#2916)." >&2; exit 1; }
257:     echo "WARNING: fetch origin/$DEFAULT_BRANCH failed; using local copy as base." >&2
258:   fi
259:   if [ -n "$(git status --porcelain)" ]; then
260:     echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
261:   else
262:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
263:   fi
264:   # Pinned base + fail-fast: on success HEAD is exactly at origin/$DEFAULT_BRANCH,
265:   # so a post-creation merge-base or "ahead-of" guard would be unreachable. The
266:   # explicit base argument here is the single source of correctness for #2916.
267:   git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" \
268:     || { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
269: fi
270: ```
271: 
272: All subsequent commits go to this branch. User handles merging.
273: </step>
274: 
275: <step name="validate_phase">
276: From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.
277: 
278: Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
279: 
280: **Update STATE.md for phase start:**
281: ```bash
282: gsd-sdk query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
283: ```
284: This updates Status, Last Activity, Current focus, Current Position, and plan counts in STATE.md so frontmatter and body text reflect the active phase immediately.
285: </step>
286: 
287: <step name="discover_and_group_plans">
288: Load plan inventory with wave grouping in one call:
289: 
290: ```bash
291: PLAN_INDEX=$(gsd-sdk query phase-plan-index "${PHASE_NUMBER}")
292: ```
293: 
294: Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.
295: 
296: **Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If `WAVE_FILTER` is set: also skip plans whose `wave` does not equal `WAVE_FILTER`.
297: 
298: **Wave safety check:** If `WAVE_FILTER` is set and there are still incomplete plans in any lower wave that match the current execution mode, STOP and tell the user to finish earlier waves first. Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete.
299: 
300: If all filtered: "No matching incomplete plans" → exit.
301: 
302: Report:
303: ```
304: ## Execution Plan
305: 
306: **Phase {X}: {Name}** — {total_plans} matching plans across {wave_count} wave(s)
307: 
308: {If WAVE_FILTER is set: `Wave filter active: executing only Wave {WAVE_FILTER}`.}
309: 
310: | Wave | Plans | What it builds |
311: |------|-------|----------------|
312: | 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
313: | 2 | 01-03 | ... |
314: ```
315: </step>
316: 
317: <step name="cross_ai_delegation">
318: **Optional step 2.5 — Delegate plans to an external AI runtime.**
319: 
320: This step runs after plan discovery and before normal wave execution. It identifies plans
321: that should be delegated to an external AI command and executes them via stdin-based prompt
322: delivery. Plans handled here are removed from the execute_waves plan list so the normal
323: executor skips them.
324: 
325: **Activation logic:**
326: 
327: 1. If `CROSS_AI_DISABLED` is true (`--no-cross-ai` flag): skip this step entirely.
328: 2. If `CROSS_AI_FORCE` is true (`--cross-ai` flag): mark ALL incomplete plans for cross-AI execution.
329: 3. Otherwise: check each plan's frontmatter for `cross_ai: true` AND verify config
330:    `workflow.cross_ai_execution` is `true`. Plans matching both conditions are marked for cross-AI.
331: 
332: ```bash
333: CROSS_AI_ENABLED=$(gsd-sdk query config-get workflow.cross_ai_execution 2>/dev/null || echo "false")
334: CROSS_AI_CMD=$(gsd-sdk query config-get workflow.cross_ai_command 2>/dev/null || echo "")
335: CROSS_AI_TIMEOUT=$(gsd-sdk query config-get workflow.cross_ai_timeout 2>/dev/null || echo "300")
336: ```
337: 
338: **If no plans are marked for cross-AI:** Skip to execute_waves.
339: 
340: **If plans are marked but `cross_ai_command` is empty:** Error — tell user to set
341: `workflow.cross_ai_command` via `gsd-sdk query config-set workflow.cross_ai_command "<command>"`.
342: 
343: **For each cross-AI plan (sequentially):**
344: 
345: 1. **Construct the task prompt** from the plan file:
346:    - Extract `<objective>` and `<tasks>` sections from the PLAN.md
347:    - Append PROJECT.md context (project name, description, tech stack)
348:    - Format as a self-contained execution prompt
349: 
350: 2. **Check for dirty working tree before execution:**
351:    ```bash
352:    if ! git diff --quiet HEAD 2>/dev/null; then
353:      echo "WARNING: dirty working tree detected — the external AI command may produce uncommitted changes that conflict with existing modifications"
354:    fi
355:    ```
356: 
357: 3. **Run the external command** from the project root, writing the prompt to stdin.
358:    Never shell-interpolate the prompt — always pipe via stdin to prevent injection:
359:    ```bash
360:    echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
361:    EXIT_CODE=$?
362:    ```
363: 
364: 4. **Evaluate the result:**
365: 
366:    **Success (exit 0 + valid summary):**
367:    - Read `$CANDIDATE_SUMMARY` and validate it contains meaningful content
368:      (not empty, has at least a heading and description — a valid SUMMARY.md structure)
369:    - Write it as the plan's SUMMARY.md file
370:    - Update STATE.md plan status to complete
371:    - Update ROADMAP.md progress
372:    - Mark plan as handled — skip it in execute_waves
373: 
374:    **Failure (non-zero exit or invalid summary):**
375:    - Display the error output and exit code
376:    - Warn: "The external command may have left uncommitted changes or partial edits
377:      in the working tree. Review `git status` and `git diff` before proceeding."
378:    - Offer three choices:
379:      - **retry** — run the same plan through cross-AI again
380:      - **skip** — fall back to normal executor for this plan (re-add to execute_waves list)
381:      - **abort** — stop execution entirely, preserve state for resume
382: 
383: 5. **After all cross-AI plans processed:** Remove successfully handled plans from the
384:    incomplete plan list so execute_waves skips them. Any skipped-to-fallback plans remain
385:    in the list for normal executor processing.
386: </step>
387: 
388: <step name="execute_waves">
389: Execute each selected wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.
390: 
391: **Stream-idle-timeout prevention — checkpoint heartbeats (#2410):**
392: 
393: Multi-plan phases can accumulate enough subagent context that the the agent API
394: SSE layer terminates with `Stream idle timeout - partial response received`
395: between a large tool_result and the next assistant turn (seen on Claude Code
396: + Opus 4.7 at ~200K+ cache_read). To keep the stream warm, emit short
397: assistant-text heartbeats — **no tool call, just a literal line** — at every
398: wave and plan boundary. Each heartbeat MUST start with `[checkpoint]` so
399: tooling and `/gsd-manager`'s background-completion handler can grep partial
400: transcripts. `{P}/{Q}` is the phase-wide completed/total plans counter and
401: increases monotonically across waves. `{status}` is `complete` (success),
402: `failed` (executor error), or `checkpoint` (human-gate returned).
403: 
404: ```
405: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
406: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
407: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} {status} ({P}/{Q} plans done)
408: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
409: ```
410: 
411: **For each wave:**
412: 
413: 1. **Intra-wave files_modified overlap check (BEFORE spawning):**
414: 
415:    Before spawning any agents for this wave, inspect the `files_modified` list of all plans
416:    in the wave. Check every pair of plans in the wave — if any two plans share even one file
417:    in their `files_modified` lists, those plans have an implicit dependency and MUST NOT run
418:    in parallel.
419: 
420:    **Detection algorithm (pseudocode):**
421:    ```
422:    seen_files = {}
423:    overlapping_plans = []
424:    for each plan in wave_plans:
425:      for each file in plan.files_modified:
426:        if file in seen_files:
427:          overlapping_plans.add(plan, seen_files[file])  # both plans overlap on this file
428:        else:
429:          seen_files[file] = plan
430:    ```
431: 
432:    **If overlap is detected:**
433:    - Warn the user:
434:      ```
435:      ⚠ Intra-wave files_modified overlap detected in Wave {N}:
436:        Plan {A} and Plan {B} both modify {file}
437:        Running these plans sequentially to avoid parallel worktree conflicts.
438:      ```
439:    - Override `PARALLELIZATION` to `false` for this wave only — run all plans in the wave
440:      sequentially regardless of the global parallelization setting.
441:    - This is a safety net for plans that were incorrectly assigned to the same wave.
442:      The planner should have caught this; flag it as a planning defect so the user can
443:      replan the phase if desired.
444: 
445:    **If no overlap:** proceed normally (parallel if `PARALLELIZATION=true`).
446: 
447: 2. **Describe what's being built (BEFORE spawning):**
448: 
449:    **First, emit the wave-start checkpoint heartbeat as a literal assistant-text
450:    line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
451:    is required before any further reasoning or spawning:**
452: 
453:    ```
454:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
455:    ```
456: 
457:    Then read each plan's `<objective>`. Extract what's being built and why.
458: 
459:    ```
460:    ---
461:    ## Wave {N}
462: 
463:    **{Plan ID}: {Plan Name}**
464:    {2-3 sentences: what this builds, technical approach, why it matters}
465: 
466:    Spawning {count} agent(s)...
467:    ---
468:    ```
469: 
470:    - Bad: "Executing terrain generation plan"
471:    - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."
472: 
473: 2.5. **Per-plan worktree decision (run for each plan in this wave BEFORE its dispatch):**
474: 
475:    Read and execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. It extracts `PLAN_FILES` from the plan's JSON, intersects against `SUBMODULE_PATHS` (with normalization, bidirectional matching, and glob-prefix handling), and sets `USE_WORKTREES_FOR_PLAN` to `false` when the plan touches a submodule path. Append `plan_id` to a `WAVE_WORKTREE_PLANS` accumulator when `USE_WORKTREES_FOR_PLAN != false`.
476: 
477:    The dispatch branches in step 3 below MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.
478: 
479: 3. **Spawn executor agents:**
480: 
481:    **Emit a plan-start heartbeat (literal line, no tool call) immediately before
482:    each `Agent()` dispatch (#2410):**
483: 
484:    ```
485:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
486:    ```
487: 
488:    Pass paths only — executors read files themselves with their fresh context window.
489:    For 200k models, this keeps orchestrator context lean (~10-15%).
490:    For 1M+ models (Opus 4.6, Sonnet 4.6), richer context can be passed directly.
491: 
492:    **Worktree mode** (`USE_WORKTREES_FOR_PLAN` is not `false` — evaluated per-plan in step 2.5):
493: 
494:    Before spawning, capture the current HEAD:
495:    ```bash
496:    EXPECTED_BASE=$(git rev-parse HEAD)
497:    ```
498: 
499:    **Sequential dispatch for parallel execution (waves with 2+ agents):**
500:    When spawning multiple agents in a wave, dispatch each `Agent()` call **one at a time
501:    with `run_in_background: true`** — do NOT send all Agent calls in a single message.
502:    `git worktree add` acquires an exclusive lock on `.git/config.lock`, so simultaneous
503:    calls race for this lock and fail. Sequential dispatch ensures each worktree finishes
504:    creation before the next begins (the round-trip latency of each tool call provides
505:    natural spacing), while all agents still **run in parallel** once created.
506: 
507:    ```text
508:    # CORRECT: dispatch one Agent() per message, each with run_in_background: true
509:    # → worktrees created sequentially, agents execute in parallel
510:    #
511:    # WRONG: multiple Agent() calls in a single message
512:    # → simultaneous git worktree add → .git/config.lock contention → failures
513:    ```
514: 
515:    ```text
516:    Agent(
517:      subagent_type="gsd-executor",
518:      description="Execute plan {plan_number} of phase {phase_number}",
519:      # Only include model= when executor_model is an explicit model name.
520:      # When executor_model is "inherit", omit this parameter entirely so
521:      # Claude Code inherits the orchestrator model automatically.
522:      model="{executor_model}",  # omit this line when executor_model == "inherit"
523:      isolation="worktree",
524:      prompt="
525:        <objective>
526:        Execute plan {plan_number} of phase {phase_number}-{phase_name}.
527:        Commit each task atomically. Create SUMMARY.md.
528:        Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes after all worktree agents in the wave complete.
529:        </objective>
530: 
531:        <worktree_branch_check>
532:        FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
533:        spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
534:        namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
535:        or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
536:        that destroys concurrent commits in multi-active scenarios (#2924). Only after
537:        Step 1 passes is `git reset --hard` safe (#2015 — affects all platforms).
538:        ```bash
539:        HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
540:        ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
541:        if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
542:          echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
543:          exit 1
544:        fi
545:        if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
546:          echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
547:          exit 1
548:        fi
549:        ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
550:        if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
551:          git reset --hard {EXPECTED_BASE}
552:          [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
553:        fi
554:        ```
555:        Per-commit HEAD/cwd-drift/path-guard: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md` (in <execution_context>).
556:        </worktree_branch_check>
557: 
558:        <parallel_execution>
559:        You are running as a PARALLEL executor agent in a git worktree. Worktree path safety (cwd-drift, absolute-path guards) is in `worktree-path-safety.md` (loaded below).
560:        Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify`
561:        unless the orchestrator surfaces `workflow.worktree_skip_hooks=true` in this
562:        prompt; silent bypass violates project AGENTS.md guidance (#2924).
563: 
564:        IMPORTANT: Do NOT modify STATE.md or ROADMAP.md. execute-plan.md
565:        auto-detects worktree mode (`.git` is a file, not a directory) and skips
566:        shared file updates automatically. The orchestrator updates them centrally
567:        after merge.
568: 
569:        REQUIRED: SUMMARY.md MUST be committed before you return. In worktree mode the
570:        git_commit_metadata step in execute-plan.md commits SUMMARY.md and REQUIREMENTS.md
571:        only (STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer
572:        this commit — the orchestrator force-removes the worktree after you return, and
573:        any uncommitted SUMMARY.md will be permanently lost (#2070).
574:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
575:        </parallel_execution>
576: 
577:        <execution_context>
578:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
579:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
580:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
581:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
582:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
583:        ${CONTEXT_WINDOW < 200000 ? '' : '@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md'}
584:        </execution_context>
585: 
586:        <files_to_read>
587:        Read these files at execution start using the Read tool:
588:        - {phase_dir}/{plan_file} (Plan)
589:        - .planning/PROJECT.md (Project context — core value, requirements, evolution rules)
590:        - .planning/STATE.md (State)
591:        - .planning/config.json (Config, if exists)
592:        ${CONTEXT_WINDOW >= 500000 ? `
593:        - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
594:        - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
595:        - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
596:        ` : ''}
597:        - ./AGENTS.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
598:        - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
599:        </files_to_read>
600: 
601:        ${AGENT_SKILLS}
602: 
603:        <mcp_tools>
604:        If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch, context7,
605:        or other MCP servers), prefer those tools over Grep/Glob for code navigation when available.
606:        MCP tools often save significant tokens by providing structured code indexes.
607:        Check tool availability first — if MCP tools are not accessible, fall back to Grep/Glob.
608:        </mcp_tools>
609: 
610:        <success_criteria>
611:        - [ ] All tasks executed
612:        - [ ] Each task committed individually
613:        - [ ] SUMMARY.md created in plan directory
614:        - [ ] No modifications to shared orchestrator artifacts (the orchestrator handles all post-wave shared-file writes)
615:        </success_criteria>
616:      "
617:    )
618:    ```
619: 
620:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
621: 
622:    **Sequential mode** (`USE_WORKTREES_FOR_PLAN` is `false` — either project-level `USE_WORKTREES=false`, or per-plan submodule intersection forced it false in step 2.5):
623: 
624:    Omit `isolation="worktree"` from the Agent call. Replace the `<parallel_execution>` block with:
625: 
626:    ```
627:        <sequential_execution>
628:        You are running as a SEQUENTIAL executor agent on the main working tree.
629:        Use normal git commits (with hooks). Do NOT use --no-verify.
630:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
631:        </sequential_execution>
632:    ```
633: 
634:    The sequential mode Agent prompt uses the same structure as worktree mode but with these differences in success_criteria — since there is only one agent writing at a time, there are no shared-file conflicts:
635: 
636:    ```
637:        <success_criteria>
638:        - [ ] All tasks executed
639:        - [ ] Each task committed individually
640:        - [ ] SUMMARY.md created in plan directory
641:        - [ ] STATE.md updated with position and decisions
642:        - [ ] ROADMAP.md updated with plan progress (via `roadmap update-plan-progress`)
643:        </success_criteria>
644:    ```
645: 
646:    When worktrees are disabled for a plan (per-plan or project-level), that plan's executor runs on the main working tree. If **any** plan in the current wave dropped to sequential mode, execute the affected plan(s) **one at a time** to avoid concurrent writes to the main working tree — plans in the same wave that retained worktree isolation can still run in parallel alongside the sequential ones, but two non-worktree plans in the same wave must serialize. When the project-level `USE_WORKTREES=false`, all plans in the wave serialize regardless of the `PARALLELIZATION` setting.
647: 
648: 4. **Wait for all agents in wave to complete.**
649: 
650:    **Plan-complete heartbeat (#2410):** as each executor returns (or is verified
651:    via spot-check below), emit one line — `complete` advances `{P}`, `failed`
652:    and `checkpoint` do not but still warm the stream:
653: 
654:    ```
655:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
656:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
657:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
658:    ```
659: 
660:    **Completion signal fallback (Copilot and runtimes where Agent() may not return):**
661: 
662:    If a spawned agent does not return a completion signal but appears to have finished
663:    its work, do NOT block indefinitely. Instead, verify completion via spot-checks:
664: 
665:    ```bash
666:    # For each plan in this wave, check if the executor finished:
667:    SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
668:    COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
669:    ```
670: 
671:    **If SUMMARY.md exists AND commits are found:** The agent completed successfully —
672:    treat as done and proceed to step 5. Log: `"✓ {Plan ID} completed (verified via spot-check — completion signal not received)"`
673: 
674:    **If SUMMARY.md does NOT exist after a reasonable wait:** The agent may still be
675:    running or may have failed silently. Check `git log --oneline -5` for recent
676:    activity. If commits are still appearing, wait longer. If no activity, report
677:    the plan as failed and route to the failure handler in step 6.
678: 
679:    **This fallback applies automatically to all runtimes.** Claude Code's Agent() normally
680:    returns synchronously, but the fallback ensures resilience if it doesn't.
681: 
682: 5. **Post-wave hook validation (parallel mode only):** Hooks run on every executor commit by default (#2924); this post-wave run only fires when `workflow.worktree_skip_hooks=true` opted out of per-commit hooks:
683:    ```bash
684:    SKIP_HOOKS=$(gsd-sdk query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
685:    if [ "$SKIP_HOOKS" = "true" ]; then
686:      # Stash uncommitted changes under a named ref so we always pop (bare `git stash` strands them on hook/script failure).
687:      STASHED=false
688:      if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
689:      git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review before continuing"
690:      [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop gsd-post-wave-hook stash — recover manually")
691:    fi
692:    ```
693:    If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"
694: 
695: 5.5. **Worktree cleanup (when `isolation="worktree"` was used):**
696: 
697:    **Standard wave contract:** Each wave's worktrees merge to main via the templated path below before the next wave's worktrees fork. The cleanup loop runs once per wave at the end of the wave lifecycle. Worktrees created in wave N must be fully removed before wave N+1 forks new ones.
698: 
699:    **Cross-wave dependency deviation (supported execution mode):** When the orchestrator legitimately deviates from the standard wave model — for example, a phase with cross-wave plan dependencies that requires custom inter-worktree base-update merges (e.g., `merge: bring 09-01 + 09-02 into 09-03 base`) — the cleanup loop below is NOT automatically re-entered for those custom merges. The deviation path produces correct final history but bypasses this loop, leaving `worktree-agent-*` directories in place. Use the **cleanup-tail snippet** below to remove any residual worktrees after such a deviation.
700: 
701:    When executor agents ran in worktree isolation, their commits land on temporary branches in separate working trees. After the wave completes, merge these changes back and clean up:
702: 
703:    ```bash
704:    # List worktrees created by this wave's agents.
705:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
706:    # `.claude/worktrees/agent-` (the namespace Claude Code's `isolation="worktree"`
707:    # uses). The previous exclusion filter (`grep -v "$(pwd)$"`) destroyed the parent
708:    # workspace's `.git` whenever the workspace itself was a worktree (multi-workspace
709:    # setups, and the cross-drive Windows case where `git worktree list` reports the
710:    # registry path on a different drive than `$(pwd)`).
711:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
712:    while IFS= read -r WT; do
713:      [ -z "$WT" ] && continue
714:      # Get the branch name for this worktree
715:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
716:      if [ -n "$WT_BRANCH" ] && [ "$WT_BRANCH" != "HEAD" ]; then
717:        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
718: 
719:        # --- Orchestrator file protection (#1756) ---
720:        # Snapshot orchestrator-owned files BEFORE merge. If the worktree
721:        # branch outlived a milestone transition, its versions of STATE.md
722:        # and ROADMAP.md are stale. Main always wins for these files.
723:        STATE_BACKUP=$(mktemp)
724:        ROADMAP_BACKUP=$(mktemp)
725:        [ -f .planning/STATE.md ] && cp .planning/STATE.md "$STATE_BACKUP" || true
726:        [ -f .planning/ROADMAP.md ] && cp .planning/ROADMAP.md "$ROADMAP_BACKUP" || true
727: 
728:        # Snapshot list of files on main BEFORE merge to detect resurrections
729:        PRE_MERGE_FILES=$(git ls-files .planning/)
730: 
731:        # Pre-merge deletion check: warn if the worktree branch deletes tracked files
732:        DELETIONS=$(git diff --diff-filter=D --name-only HEAD..."$WT_BRANCH" 2>/dev/null || true)
733:        if [ -n "$DELETIONS" ]; then
734:          echo "BLOCKED: Worktree branch $WT_BRANCH contains file deletions: $DELETIONS"
735:          echo "Review these deletions before merging. If intentional, remove this guard and re-run."
736:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
737:          continue
738:        fi
739: 
740:        # Merge the worktree branch into the current branch (--no-ff ensures a merge commit so HEAD~1 is reliable)
741:        git merge "$WT_BRANCH" --no-ff --no-edit -m "chore: merge executor worktree ($WT_BRANCH)" 2>&1 || {
742:          echo "⚠ Merge conflict from worktree $WT_BRANCH — resolve manually"
743:          echo "  STATE.md backup:   $STATE_BACKUP"
744:          echo "  ROADMAP.md backup: $ROADMAP_BACKUP"
745:          echo "  Restore with: cp \$STATE_BACKUP .planning/STATE.md && cp \$ROADMAP_BACKUP .planning/ROADMAP.md"
746:          break
747:        }
748: 
749:        # Post-merge deletion audit: detect bulk file deletions in merge commit (#2384)
750:        # --diff-filter=D HEAD~1 HEAD shows files deleted by the merge commit itself.
751:        # Exclude .planning/ — orchestrator-owned deletions there are expected (resurrections
752:        # are handled below). Require ALLOW_BULK_DELETE=1 to bypass for intentional large refactors.
753:        MERGE_DEL_COUNT=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -vc '^\.planning/' || true)
754:        if [ "$MERGE_DEL_COUNT" -gt 5 ] && [ "${ALLOW_BULK_DELETE:-0}" != "1" ]; then
755:          MERGE_DELETIONS=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -v '^\.planning/' || true)
756:          echo "⚠ BLOCKED: Merge of $WT_BRANCH deleted $MERGE_DEL_COUNT files outside .planning/ — reverting to protect repository integrity (#2384)"
757:          echo "$MERGE_DELETIONS"
758:          echo "  If these deletions are intentional, re-run with ALLOW_BULK_DELETE=1"
759:          git reset --hard HEAD~1 2>/dev/null || true
760:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
761:          continue
762:        fi
763: 
764:        # Restore orchestrator-owned files (main always wins)
765:        if [ -s "$STATE_BACKUP" ]; then
766:          cp "$STATE_BACKUP" .planning/STATE.md
767:        fi
768:        if [ -s "$ROADMAP_BACKUP" ]; then
769:          cp "$ROADMAP_BACKUP" .planning/ROADMAP.md
770:        fi
771:        rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
772: 
773:        # Detect files deleted on main but re-added by worktree merge
774:        # (e.g., archived phase directories that were intentionally removed)
775:        # A "resurrected" file must have a deletion event in main's ancestry —
776:        # brand-new files (e.g. SUMMARY.md just created by the executor) have no
777:        # such history and must NOT be removed (#2501).
778:        DELETED_FILES=$(git diff --diff-filter=A --name-only HEAD~1 -- .planning/ 2>/dev/null || true)
779:        for RESURRECTED in $DELETED_FILES; do
780:          # Only delete if this file was previously tracked on main and then
781:          # deliberately removed (has a deletion event in git history).
782:          WAS_DELETED=$(git log --follow --diff-filter=D --name-only --format="" HEAD~1 -- "$RESURRECTED" 2>/dev/null | grep -c . || true)
783:          if [ "${WAS_DELETED:-0}" -gt 0 ]; then
784:            git rm -f "$RESURRECTED" 2>/dev/null || true
785:          fi
786:        done
787: 
788:        # Amend merge commit with restored files if any changed
789:        if ! git diff --quiet .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || \
790:           [ -n "$DELETED_FILES" ]; then
791:          # Only amend the commit with .planning/ files if commit_docs is enabled (#1783)
792:          COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
793:          if [ "$COMMIT_DOCS" != "false" ]; then
794:            git add .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || true
795:            git commit --amend --no-edit 2>/dev/null || true
796:          fi
797:        fi
798: 
799:        # Safety net: rescue uncommitted SUMMARY.md before worktree removal (#2070, #2838).
800:        # Filesystem-level (find + cp) bypasses git's --exclude-standard filter, which silently
801:        # drops .planning/SUMMARY.md when projects gitignore .planning/ — the rescue's prior
802:        # `git ls-files --exclude-standard` form returned empty in that case and the SUMMARY
803:        # was lost on `git worktree remove --force`.
804:        while IFS= read -r SUMMARY; do
805:          [ -z "$SUMMARY" ] && continue
806:          REL_PATH="${SUMMARY#$WT/}"
807:          if [ ! -f "$REL_PATH" ] || ! cmp -s "$SUMMARY" "$REL_PATH"; then
808:            mkdir -p "$(dirname "$REL_PATH")"
809:            cp "$SUMMARY" "$REL_PATH"
810:            echo "⚠ Rescued $REL_PATH from worktree before removal"
811:          fi
812:        done < <(find "$WT/.planning" -name "*SUMMARY.md" 2>/dev/null)
813: 
814:        # Remove the worktree
815:        if ! git worktree remove "$WT" --force; then
816:          WT_NAME=$(basename "$WT")
817:          if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
818:            echo "⚠ Worktree $WT is locked — attempting to unlock and retry"
819:            git worktree unlock "$WT" 2>/dev/null || true
820:            if ! git worktree remove "$WT" --force; then
821:              echo "⚠ Residual worktree at $WT — manual cleanup required after session exits:"
822:              echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
823:            fi
824:          else
825:            echo "⚠ Residual worktree at $WT (remove failed) — investigate manually"
826:          fi
827:        fi
828: 
829:        # Delete the temporary branch
830:        git branch -D "$WT_BRANCH" 2>/dev/null || true
831:      fi
832:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
833:    ```
834: 
835:    **Cleanup-tail snippet (use after any wave whose merges did not flow through the templated path above):**
836: 
837:    If the orchestrator deviated from the standard wave merge path (e.g., custom inter-worktree base-update merges with `merge: bring …` style messages), run this snippet after the custom merges are complete. It discovers and removes any residual `worktree-agent-*` worktrees. Safe to run when no residuals exist — it is a no-op in that case.
838: 
839:    ```bash
840:    # Cleanup-tail: remove residual agent worktrees after a cross-wave-dependency deviation.
841:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
842:    # `.claude/worktrees/agent-`. Do NOT use exclusion filters (grep -v "$(pwd)$") —
843:    # they destroy the parent workspace's .git in multi-workspace or cross-drive setups.
844:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
845:    while IFS= read -r WT; do
846:      [ -z "$WT" ] && continue
847:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
848:      [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
849:      echo "Cleaning up residual worktree: $WT (branch: $WT_BRANCH)"
850:      git worktree unlock "$WT" 2>/dev/null || true
851:      if ! git worktree remove "$WT" --force; then
852:        WT_NAME=$(basename "$WT")
853:        if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
854:          echo "⚠ Worktree $WT is locked — unlock failed; manual cleanup required:"
855:          echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
856:        else
857:          echo "⚠ Residual worktree at $WT — remove failed; manual cleanup required"
858:        fi
859:      else
860:        git branch -D "$WT_BRANCH" 2>/dev/null || true
861:      fi
862:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
863:    git worktree prune
864:    ```
865: 
866:    **When to skip step 5.5:**
867: 
868:    **If no plan in this wave used worktree isolation** (project-level `USE_WORKTREES=false` OR every plan in the wave had `USE_WORKTREES_FOR_PLAN=false` — i.e. `WAVE_WORKTREE_PLANS` from step 2.5 is empty): all agents ran on the main working tree — skip this step entirely.
869: 
870:    **If the orchestrator merged via custom messages (cross-wave-dependency deviation):** the templated cleanup loop above was not triggered for those merges. Run the cleanup-tail snippet above instead. After the snippet completes, proceed to step 5.6.
871: 
872:    **If at least one plan used worktrees but others did not:** still run this cleanup — it iterates over actual `git worktree list` output and only merges back the worktrees that were created, leaving sequential plans' commits on the main tree untouched.
873: 
874:    **If no worktrees found at runtime:** Skip silently — agents may have been spawned without worktree isolation, or the orchestrator already cleaned them up.
875: 
876: 5.6. **Post-merge build & test gate:**
877: 
878:    After merging all worktrees in a wave (parallel mode), or after the last plan completes
879:    (serial mode), run a build and then the project's test suite to catch cross-plan
880:    integration issues that individual worktree self-checks cannot detect (e.g., conflicting
881:    type definitions, removed exports, import changes, link errors).
882: 
883:    This addresses the Generator self-evaluation blind spot identified in Anthropic's
884:    harness engineering research: agents reliably report Self-Check: PASSED even when
885:    merging their work creates failures.
886: 
887:    Read and execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`.
888: 
889: 5.7. **Post-wave shared artifact update (when at least one plan used worktrees, skip if tests failed):**
890: 
891:    When **any** executor agent in this wave ran with `isolation="worktree"`, that agent skipped STATE.md and ROADMAP.md updates to avoid last-merge-wins overwrites. The orchestrator is the single writer for these files. After worktrees are merged back, update shared artifacts once for every completed plan in the wave (worktree-mode plans **and** sequential plans that ran on the main tree but deferred to the orchestrator for tracking writes).
892: 
893:    **Only update tracking when tests passed (TEST_EXIT=0).**
894:    If tests failed or timed out, skip the tracking update — plans should
895:    not be marked as complete when integration tests are failing or inconclusive.
896: 
897:    ```bash
898:    # Guard: only update tracking if post-merge tests passed
899:    # Timeout (124) is treated as inconclusive — do NOT mark plans complete
900:    if [ "${TEST_EXIT}" -eq 0 ]; then
901:      # Update ROADMAP plan progress for each completed plan in this wave
902:      for plan_id in {completed_plan_ids}; do
903:        gsd-sdk query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
904:      done
905: 
906:      # Only commit tracking files if they actually changed
907:      if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
908:        gsd-sdk query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
909:      fi
910:    elif [ "${TEST_EXIT}" -eq 124 ]; then

(Output capped at 50 KB. Showing lines 1-910. Use offset=911 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_UW9qru8PR5Y2Tzw9tqJqzREv"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_DRKAHnQwV1QV8Y0PIlrH6G29"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_cTjQSQ9B4XQAsZ5ZqZnh7G2o"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_BqUXoCpeBfRsjhK311e8zp2S"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_7e4daRWvlN4f79O2MsjtBuWg"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_EcMmSxl7EolxmGrY7YWb4v6U"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_yRB6gp8gcnf718zD4A3PDaYG"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute CP-DT-01 plan 01",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c82207e4ffeWJk1tvGElgw3Lu"
}
```

**Output:** (pruned)
```
task_id: ses_1c82207e4ffeWJk1tvGElgw3Lu
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_BBP9Y1PpmigVa5zVCI5w6buJ"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_U65gTCvgGKqhVOIeS9VqEfpz"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_u3x1kbfwnUiyZlPvKAKsap4H"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_edLopIjG9lMNfpRnxMTDOKJ7"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_qUdY0rAOWLHkgjC8dknyc5NO"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_rHYHyzXG1iEBgphQ0zFSEL6Z"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_WKqV5VoAZKmsSFWnjpBmAT8t"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute CP-DT-01 plan 02",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c813bae3ffetT4o061PVjvSit"
}
```

**Output:** (pruned)
```
task_id: ses_1c813bae3ffetT4o061PVjvSit
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_T16hhqOnccMFDKpw1L2AsZN9"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_hiKygN1ryDY6vm4qRTfR13D8"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_jqw4saml65QbnEfmQoNDxbcy"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_lqHGFgpJ5CFCjlAYoz6LrWxw"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute CP-DT-01 plan 03",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c80862b3ffejzcfzxxMs4Rhtu"
}
```

**Output:** (pruned)
```
task_id: ses_1c80862b3ffejzcfzxxMs4Rhtu
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_G0Uj0YjdMDYGamQRMycoltl7"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_JmFhGTuUnEo9Xq5fl11VCpEQ"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_utl4L0xPs5BPJXOFglD23x0e"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_NW2b6eXo2FYperae6UtsrdqZ"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute CP-DT-01 plan 04",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c7fca414ffeOpG2Rpz4YeijZt"
}
```

**Output:** (pruned)
```
task_id: ses_1c7fca414ffeOpG2Rpz4YeijZt
```


## USER (turn 17)

**source:** real-human

hãy thực hiện tiếp tục plan 4 execution phía trên tôi bị rớt mạng 

## USER (turn 18)

**source:** real-human

hãy thực hiện tiếp tục plan 4 execution phía trên tôi bị rớt mạng 

## USER (turn 19)

**source:** real-human

thiếu, pty, interactive bash commands, background commands, thôi dừng đi mày nquá ngu /Users/apple/hivemind-plugin-private/.planning/codebase/COMMAND-EXECUTION-ANALYSIS-2026-05-18.md
/Users/apple/hivemind-plugin-private/.planning/codebase/DELEGATION-QUEUE-ANALYSIS-2026-05-18.md
/Users/apple/hivemind-plugin-private/.planning/codebase/DELEGATE-TASK-DEEP-ARCHITECTURAL-AUDIT-2026-05-18.md
/Users/apple/hivemind-plugin-private/.planning/codebase/ECOSYSTEM-RATIONALE-2026-05-18.md
/Users/apple/hivemind-plugin-private/.planning/codebase/PTY-BACKGROUND-COMMAND-ANALYSIS-2026-05-18.md
/Users/apple/hivemind-plugin-private/.planning/codebase/TOOL-CLASSIFICATION-MATRIX-AND-TACKLE-ORDER-2026-05-18.md  từ đây sử gì\

## USER (turn 20)

**source:** real-human

khẳng định đám này hoàn toàn không hoạt động như mục đích "Từ 6 docs đó — cái gì thật, cái gì thừa
THẬT: delegate-task + coordination CORE hoạt động
Surface	Hoạt động?	Ai dùng?	Cần sửa?
delegate-task	Có	LLM gọi tool → SDK session	Không
delegation-status	Có	LLM poll kết quả	Không
State machine	Có	DelegationManager consume	Không
CompletionDetector	Có	DelegationManager consume	Không
Queue/Concurrency	Có	DelegationManager consume	Không
SDK handler (adaptive polling)	Có	DelegationManager consume	Không
Persistence	Có	DelegationManager consume	Không
run-background-command	Có	LLM gọi tool → PTY	Không
PtyManager	Có	background-command consume	Không
command-engine	Có	LLM gọi tool	Không "

## USER (turn 21)

**source:** real-human

hãy tạo một task thật sự phức tạp liên quan đến nghiên cứu nhiều nguồn sử dụng các tools research khác nhau mà sử dụng delegate-task cho agent là gsd-* research nào đó và tiếp tục công việc xem có được không ví dụ nghiên cứ như thế này ```## Các nghiên cứu research nguồn tham khảo mà tôi nói phía trên

```markdown
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
``` ```

## USER (turn 22)

**source:** real-human

rồi bây giờ sử dụng những nhóm công cụ trong đó để pull cho bằng được kết quả và kết quả phải ghi trên ổ cứng thêm nữa là tạo một task như vậy nhưng là phân tích sâu codebase đi chẳng hạn

## USER (turn 23)

**source:** real-human

<system_reminder>
Delegated task failed:
- Task: Delegation: gsd-project-researcher
- Agent: gsd-project-researcher
- Status: failed
- Error: [Harness] Delegation safety ceiling reached after 1800000ms
- Result: [Harness] Delegation safety ceiling reached after 1800000ms
- Summary: Delegated work finished with terminal state timeout after 29m 59s. Summary preview: [Harness] Delegation safety ceiling reached after 1800000ms
- View results: session://ses_1c89438f6ffedqo5Pg3TlddQRo
- Duration: 29m 59s
- Metadata: {"delegationId":"7ec7cc25-62ee-4e04-9fa3-d26b2b4e5572","terminalState":"timeout","recoveryGuarantee":"resumable","summaryPreview":"[Harness] Delegation safety ceiling reached after 1800000ms"}
</system_reminder>

## USER (turn 24)

**source:** real-human

<system_reminder>
Delegated task failed:
- Task: Delegation: gsd-codebase-mapper
- Agent: gsd-codebase-mapper
- Status: failed
- Error: [Harness] Delegation safety ceiling reached after 1800000ms
- Result: [Harness] Delegation safety ceiling reached after 1800000ms
- Summary: Delegated work finished with terminal state timeout after 29m 59s. Summary preview: [Harness] Delegation safety ceiling reached after 1800000ms
- View results: session://ses_1c8925814ffeOwXdAh4GCB66FB
- Duration: 29m 59s
- Metadata: {"delegationId":"b0ecdeda-7d04-4a50-85fa-c5f172519ee9","terminalState":"timeout","recoveryGuarantee":"resumable","summaryPreview":"[Harness] Delegation safety ceiling reached after 1800000ms"}
</system_reminder>

## USER (turn 25)

**source:** real-human

vậy cho rằng nó có thể stuck trong một khoảng thời gian cho phép đi nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn  >>>> ví dụ ở phía trên (trước message này) mang labels  là system_reminder được thiết kế sai và không hợp lý logics

## USER (turn 26)

**source:** real-human

vậy cho rằng nó có thể stuck trong một khoảng thời gian cho phép đi nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn  >>>> ví dụ ở phía trên (trước message này) mang labels  là system_reminder được thiết kế sai và không hợp lý logics >>>> VẬY KẾT LUẬN LẠI PHASE TIẾP THEO LÀ GOM LẠI TẤT CẢ NHỮNG GÌ LIÊN QUAN TỚI  delegate-task (tất cả chứ không chỉ tools, tất cả những thứ liên quan và cấu thành nên nó từ tất cả các runtime và mục đích sử dụng của agents gọi nó, quản lý nó, ứng dụgn nó, các hỗ trợ engines dành cho nó)  - tạo một phase để toàn diện refactore và revamp nó phase này sẽ bao gồm 4 tài liệu cực kỳ quan trọng là SPEC.md, CONTEXT.md, RESEARCH.md, và PATTERN.md - tất cả các quá trình sau được sử dụng execute-slash-command để tự động route command của gsd với sử dụng các gsd agents để tạo đúng theo mục đích của phase này update dependencies, state, roadmap, requirements và architecture liên quan 

## USER (turn 27)

**source:** real-human

<objective>
Insert a decimal phase for urgent work discovered mid-milestone that must be completed between existing integer phases.

Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions.

Purpose: Handle urgent work discovered during execution without renumbering entire roadmap.
</objective>

<execution_context>
@~/.Codex/get-shit-done/workflows/insert-phase.md
</execution_context>

<context>
Arguments: CP-DT-01 "Delegate-Task Ecosystem Revamp" --after CP-ST-06 --description "Toàn diện refactor và revamp delegate-task ecosystem: tools, engines, tracking, completion detection, TUI injection, resume/chaining, agent discovery, permissions inheritance, compact survival. Bao gồm 4 tài liệu: SPEC.md (yêu cầu hệ thống), CONTEXT.md (bối cảnh hiện tại), RESEARCH.md (nghiên cứu OpenCode SDK/API), PATTERN.md (patterns thiết kế). Nghiên cứu sâu OpenCode SDK sessions/messages/hooks/permissions/agent discovery + source-code platform architecture." (format: <after-phase-number> <description>)

Roadmap and state are resolved in-workflow via `init phase-op` and targeted tool calls.
</context>

<process>
Execute the insert-phase workflow from @~/.Codex/get-shit-done/workflows/insert-phase.md end-to-end.
Preserve all validation gates (argument parsing, phase verification, decimal calculation, roadmap updates).
</process>

## USER (turn 28)

**source:** real-human

<objective>
Clarify phase requirements through structured Socratic questioning with quantitative ambiguity scoring.

**Position in workflow:** `spec-phase → discuss-phase → plan-phase → execute-phase → verify`

**How it works:**
1. Load phase context (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md)
2. Scout the codebase — understand current state before asking questions
3. Run Socratic interview loop (up to 6 rounds, rotating perspectives)
4. Score ambiguity across 4 weighted dimensions after each round
5. Gate: ambiguity ≤ 0.20 AND all dimensions meet minimums → write SPEC.md
6. Commit SPEC.md — discuss-phase picks it up automatically on next run

**Output:** `{phase_dir}/{padded_phase}-SPEC.md` — falsifiable requirements that lock "what/why" before discuss-phase handles "how"
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/spec-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/spec.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent.
</runtime_note>

<context>
Phase number: CP-DT-01 (required)

**Flags:**
- `--auto` — Skip interactive questions; the agent selects recommended defaults and writes SPEC.md
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)

Context files are resolved in-workflow using `init phase-op`.
</context>

<process>
Execute end-to-end.

**MANDATORY:** Read the workflow file BEFORE taking any action. The workflow contains the complete step-by-step process including the Socratic interview loop, ambiguity scoring gate, and SPEC.md generation. Do not improvise from the objective summary above.
</process>

<success_criteria>
- Codebase scouted for current state before questioning begins
- All 4 ambiguity dimensions scored after each interview round
- Gate passed: ambiguity ≤ 0.20 AND all dimension minimums met
- SPEC.md written with falsifiable requirements, explicit boundaries, and acceptance criteria
- SPEC.md committed atomically
- User knows they can now run /gsd-discuss-phase which will load SPEC.md automatically
</success_criteria>

## USER (turn 29)

**source:** real-human

hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này 

## USER (turn 30)

**source:** real-human

hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd

## USER (turn 31)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: CP-DT-01 (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>

## USER (turn 32)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ```

## USER (turn 33)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ```

## USER (turn 34)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ``` 

## USER (turn 35)

**source:** real-human

từ những kết quả có ở trên hãy tiếp tục quy trình sau dựa trên những gì đã hoàn thành trên đó ```hãy tự động hoá các bước gsd tiếp theo bằng cách tự route qua execute command gsd và sử dụng gsd agents để hoàn thành từ planning - verify planning - excute theo strict TDD, check code review for quality gatekeeping, check integration đảm bảo non regression và e2e, check các smoke test qua live real case uses etc cho toàn bộ phase này - việc này thực hiện sau khi cập nhật state, roadmap và các core documents của gsd ``` 

## USER (turn 36)

**source:** real-human

hãy tự động route gsd append trực tiếp không sử dụng `@agent` các delegation đó là hệ quả của task tool sẽ được quyết định sau khi append slash command trực tiếp tại đây append execute phase /gsd-execute-phase CP-DT-01

## USER (turn 37)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `CP-DT-01`
- If a documented flag is absent from `CP-DT-01`, treat it as inactive

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase: CP-DT-01

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `CP-DT-01`:**
- `--wave N` is active only if the literal `--wave` token is present in `CP-DT-01`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `CP-DT-01`
- `--interactive` is active only if the literal `--interactive` token is present in `CP-DT-01`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>

## USER (turn 38)

**source:** real-human

hãy thực hiện tiếp tục plan 4 execution phía trên tôi bị rớt mạng 

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: task

**Input:**
```json
{
  "description": "Resume CP-DT plan 04",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c7fca414ffeOpG2Rpz4YeijZt"
}
```

**Output:** (pruned)
```
task_id: ses_1c7fca414ffeOpG2Rpz4YeijZt
```


### Tool: skill

**Input:**
```json
{
  "name": "verification-before-completion"
}
```

**Output:** (pruned)
```
# Skill: verification-before-completion
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_kjSEIupgDSWwcOAxcTouWwJ7"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_45Qbo09m1fnbPQCJ0NK37uHo"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_8sY220apR1wQ3pJZXIDloesk"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_Wfwk5huU8yBobZBUN3diwxJ6"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_EcLWpvkWwF9Hjm6JGNvhjN5a"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_OUzZdMDcIhPTkLK14bryvCl7"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_vOrecnbhNzAvEJ9fZNyJXqyp"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_qsr7ZTBww0sZ3gQLsBR1krwL"
}
```


## USER (turn 39)

**source:** real-human

hãy tiếp tục cho hết plan 5

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_KONFbQRkRmvDlrAzOTPeQ0UU"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Execute CP-DT-01 plan 05",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c7eaa15dffet6eVaBtbpDvY2e"
}
```

**Output:** (pruned)
```
task_id: ses_1c7eaa15dffet6eVaBtbpDvY2e
```


## USER (turn 40)

**source:** real-human

hãy tiếp tục phần trên tôi vừa  bị rớt mạng, hoàn thành và tiếp theo sau các quality gatekeeping, integration verfication tự động loops gsd routing để sửa lỗi nếu gặp phải

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_xgztouNql1aKDdYckAdi4785"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Resume CP-DT plan 05",
  "subagent_type": "gsd-executor",
  "task_id": "ses_1c7eaa15dffet6eVaBtbpDvY2e"
}
```

**Output:** (pruned)
```
task_id: ses_1c7eaa15dffet6eVaBtbpDvY2e
```


### Tool: skill

**Input:**
```json
{
  "name": "verification-before-completion"
}
```

**Output:** (pruned)
```
# Skill: verification-before-completion
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_0bYjxVuh7ed22KBp6rmqjJfv"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_9o2XTO9PCh6RTuGXU0oildOt"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_rUPnGosuHlGqCuXgNQr4tE4t"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_MaeCT4qGTEn21nqMbYenoA5S"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_FYLvPPI6mZDBC2ZzQNLYM9t7"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_2RGZBrGv3s59GnzPU7g7Iund"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_sShFV8NAVziPC1ZTBYTfQSdG"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_wB1fIsa2dfAMo6um1k8LkZT3"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-code-review"
}
```

**Output:** (pruned)
```
# Skill: gsd-code-review
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_MccfEagqKphiWVVS4mZQ3lbm"
}
```


## USER (turn 41)

**source:** real-human

<objective>
Review source files changed during a phase for bugs, security vulnerabilities, and code quality problems.

Spawns the gsd-code-reviewer agent to analyze code at the specified depth level. Produces REVIEW.md artifact in the phase directory with severity-classified findings.

Arguments:
- Phase number (required) — which phase's changes to review (e.g., "2" or "02")
- `--depth=quick|standard|deep` (optional) — review depth level, overrides workflow.code_review_depth config
  - quick: Pattern-matching only (~2 min)
  - standard: Per-file analysis with language-specific checks (~5-15 min, default)
  - deep: Cross-file analysis including import graphs and call chains (~15-30 min)
- `--files file1,file2,...` (optional) — explicit comma-separated file list, skips SUMMARY/git scoping (highest precedence for scoping)
- `--fix` (optional) — after review completes (or if REVIEW.md already exists), auto-apply fixes found. Spawns gsd-code-fixer agent. Accepts sub-flags:
  - `--all` — include Info findings in fix scope (default: Critical + Warning only)
  - `--auto` — enable fix + re-review iteration loop, capped at 3 iterations

Output: {padded_phase}-REVIEW.md in phase directory + inline summary of findings
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md
</execution_context>

<context>
Phase: CP-DT-01 --depth=standard (first positional argument is phase number)

Optional flags parsed from CP-DT-01 --depth=standard:
- `--depth=VALUE` — Depth override (quick|standard|deep). If provided, overrides workflow.code_review_depth config.
- `--files=file1,file2,...` — Explicit file list override. Has highest precedence for file scoping per D-08. When provided, workflow skips SUMMARY.md extraction and git diff fallback entirely.

Context files (AGENTS.md, SUMMARY.md, phase state) are resolved inside the workflow via `gsd-sdk query init.phase-op` and delegated to agent via `<files_to_read>` blocks.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute end-to-end.

The workflow (not this command) enforces these gates:
- Phase validation (before config gate)
- Config gate check (workflow.code_review)
- File scoping (--files override > SUMMARY.md > git diff fallback)
- Empty scope check (skip if no files)
- Agent spawning (gsd-code-reviewer)
- Result presentation (inline summary + next steps)
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/code-review.md</path>
<type>file</type>
<content>
1: <purpose>
2: Review source files changed during a phase for bugs, security issues, and code quality problems. Computes file scope (--files override > SUMMARY.md > git diff fallback), checks config gate, spawns gsd-code-reviewer agent, commits REVIEW.md, and presents results to user.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <available_agent_types>
10: - gsd-code-reviewer: Reviews source files for bugs and quality issues
11: </available_agent_types>
12: 
13: <process>
14: 
15: <step name="initialize">
16: Parse arguments and load project state:
17: 
18: ```bash
19: PHASE_ARG="${1}"
20: INIT=$(gsd-sdk query init.phase-op "${PHASE_ARG}")
21: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
22: ```
23: 
24: Parse from init JSON: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `commit_docs`.
25: 
26: **Input sanitization (defense-in-depth):**
27: ```bash
28: # Validate PADDED_PHASE contains only digits and optional dot (e.g., "02", "03.1")
29: if ! [[ "$PADDED_PHASE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
30:   echo "Error: Invalid phase number format: '${PADDED_PHASE}'. Expected digits (e.g., 02, 03.1)."
31:   # Exit workflow
32: fi
33: ```
34: 
35: **Phase validation (before config gate):**
36: If `phase_found` is false, report error and exit:
37: ```
38: Error: Phase ${PHASE_ARG} not found. Run /gsd-progress to see available phases.
39: ```
40: 
41: This runs BEFORE config gate check so user errors are surfaced immediately regardless of config state.
42: 
43: Parse optional flags from $ARGUMENTS:
44: 
45: **--depth flag:**
46: ```bash
47: DEPTH_OVERRIDE=""
48: for arg in "$@"; do
49:   if [[ "$arg" == --depth=* ]]; then
50:     DEPTH_OVERRIDE="${arg#--depth=}"
51:   fi
52: done
53: ```
54: 
55: **--files flag:**
56: ```bash
57: FILES_OVERRIDE=""
58: for arg in "$@"; do
59:   if [[ "$arg" == --files=* ]]; then
60:     FILES_OVERRIDE="${arg#--files=}"
61:   fi
62: done
63: ```
64: 
65: If FILES_OVERRIDE is set, split by comma into array:
66: ```bash
67: if [ -n "$FILES_OVERRIDE" ]; then
68:   IFS=',' read -ra FILES_ARRAY <<< "$FILES_OVERRIDE"
69: fi
70: ```
71: </step>
72: 
73: <step name="check_config_gate">
74: Check if code review is enabled via config:
75: 
76: ```bash
77: CODE_REVIEW_ENABLED=$(gsd-sdk query config-get workflow.code_review 2>/dev/null || echo "true")
78: ```
79: 
80: If CODE_REVIEW_ENABLED is "false":
81: ```
82: Code review skipped (workflow.code_review=false in config)
83: ```
84: Exit workflow.
85: 
86: Default is true — only skip on explicit false. This check runs AFTER phase validation so invalid phase errors are shown first.
87: </step>
88: 
89: <step name="resolve_depth">
90: Determine review depth with priority order:
91: 
92: 1. DEPTH_OVERRIDE from --depth flag (highest priority)
93: 2. Config value: `gsd-sdk query config-get workflow.code_review_depth 2>/dev/null`
94: 3. Default: "standard"
95: 
96: ```bash
97: if [ -n "$DEPTH_OVERRIDE" ]; then
98:   REVIEW_DEPTH="$DEPTH_OVERRIDE"
99: else
100:   CONFIG_DEPTH=$(gsd-sdk query config-get workflow.code_review_depth 2>/dev/null || echo "")
101:   REVIEW_DEPTH="${CONFIG_DEPTH:-standard}"
102: fi
103: ```
104: 
105: **Validate depth value:**
106: ```bash
107: case "$REVIEW_DEPTH" in
108:   quick|standard|deep)
109:     # Valid
110:     ;;
111:   *)
112:     echo "Warning: Invalid depth '${REVIEW_DEPTH}'. Valid values: quick, standard, deep. Using 'standard'."
113:     REVIEW_DEPTH="standard"
114:     ;;
115: esac
116: ```
117: </step>
118: 
119: <step name="compute_file_scope">
120: Three-tier scoping with explicit precedence:
121: 
122: **Tier 1 — --files override (highest precedence per D-08):**
123: 
124: If FILES_OVERRIDE is set (from --files flag):
125: ```bash
126: if [ -n "$FILES_OVERRIDE" ]; then
127:   REVIEW_FILES=()
128:   REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
129:   
130:   for file_path in "${FILES_ARRAY[@]}"; do
131:     # Security: validate path is within repository (prevent path traversal)
132:     ABS_PATH=$(realpath -m "${file_path}" 2>/dev/null || echo "${file_path}")
133:     if [[ "$ABS_PATH" != "$REPO_ROOT"* ]]; then
134:       echo "Error: File path outside repository, skipping: ${file_path}"
135:       continue
136:     fi
137:     
138:     # Validate path exists (relative to repo root)
139:     if [ -f "${REPO_ROOT}/${file_path}" ] || [ -f "${file_path}" ]; then
140:       REVIEW_FILES+=("$file_path")
141:     else
142:       echo "Warning: File not found, skipping: ${file_path}"
143:     fi
144:   done
145:   
146:   echo "File scope: ${#REVIEW_FILES[@]} files from --files override"
147: fi
148: ```
149: 
150: Skip SUMMARY/git scoping entirely when --files is provided.
151: 
152: **Tier 2 — SUMMARY.md extraction (primary per D-01):**
153: 
154: If --files NOT provided:
155: ```bash
156: if [ -z "$FILES_OVERRIDE" ]; then
157:   SUMMARIES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
158:   REVIEW_FILES=()
159:   
160:   if [ -n "$SUMMARIES" ]; then
161:     for summary in $SUMMARIES; do
162:       # Extract key_files.created and key_files.modified using node for reliable YAML parsing
163:       # This avoids fragile awk parsing that breaks on indentation differences
164:       EXTRACTED=$(node -e "
165:         const fs = require('fs');
166:         const content = fs.readFileSync('$summary', 'utf-8');
167:         const match = content.match(/^---\n([\s\S]*?)\n---/);
168:         if (!match) { process.exit(0); }
169:         const yaml = match[1];
170:         const files = [];
171:         let inSection = null;
172:         for (const line of yaml.split('\n')) {
173:           if (/^\s+created:/.test(line)) { inSection = 'created'; continue; }
174:           if (/^\s+modified:/.test(line)) { inSection = 'modified'; continue; }
175:           if (/^\s*[\w-]+:/.test(line) && !/^\s*-/.test(line)) { inSection = null; continue; }
176:           if (inSection && /^\s+-\s+(.+)/.test(line)) {
177:             let raw = line.match(/^\s+-\s+(.+)/)[1].trim();
178:             raw = raw.replace(/^['"]|['"]$/g, '');
179:             raw = raw.replace(/\s+\([^)]*\)\s*$/, '');
180:             raw = raw.split(/\s+—\s/)[0].trim();
181:             if (/\//.test(raw) && /\.[A-Za-z0-9]+$/.test(raw)) {
182:               files.push(raw);
183:             }
184:           }
185:         }
186:         if (files.length) console.log(files.join('\n'));
187:       " 2>/dev/null)
188:       
189:       # Add extracted files to REVIEW_FILES array
190:       if [ -n "$EXTRACTED" ]; then
191:         while IFS= read -r file; do
192:           if [ -n "$file" ]; then
193:             REVIEW_FILES+=("$file")
194:           fi
195:         done <<< "$EXTRACTED"
196:       fi
197:     done
198:     
199:     if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
200:       echo "Warning: SUMMARY artifacts found but contained no file paths. Falling back to git diff."
201:     fi
202:   fi
203: fi
204: ```
205: 
206: **Tier 3 — Git diff fallback (per D-02):**
207: 
208: If no SUMMARY.md files found OR no files extracted from them:
209: ```bash
210: if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
211:   # Compute diff base from phase commits — fail closed if no reliable base found
212:   PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)
213:   
214:   if [ -n "$PHASE_COMMITS" ]; then
215:     DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^
216:     
217:     # Verify the parent commit exists (first commit in repo has no parent)
218:     if ! git rev-parse "${DIFF_BASE}" >/dev/null 2>&1; then
219:       DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)
220:     fi
221:     
222:     # Run git diff with specific exclusions (per D-03)
223:     DIFF_FILES=$(git diff --name-only "${DIFF_BASE}..HEAD" -- . \
224:       ':!.planning/' ':!ROADMAP.md' ':!STATE.md' \
225:       ':!*-SUMMARY.md' ':!*-VERIFICATION.md' ':!*-PLAN.md' \
226:       ':!package-lock.json' ':!yarn.lock' ':!Gemfile.lock' ':!poetry.lock' 2>/dev/null)
227:     
228:     while IFS= read -r file; do
229:       [ -n "$file" ] && REVIEW_FILES+=("$file")
230:     done <<< "$DIFF_FILES"
231:     
232:     echo "File scope: ${#REVIEW_FILES[@]} files from git diff (base: ${DIFF_BASE})"
233:   else
234:     # Fail closed — no reliable diff base found. Do not use arbitrary HEAD~N.
235:     echo "Warning: No phase commits found for '${PADDED_PHASE}'. Cannot determine reliable diff scope."
236:     echo "Use --files flag to specify files explicitly: /gsd-code-review ${PHASE_ARG} --files=file1,file2,..."
237:   fi
238: fi
239: ```
240: 
241: **Post-processing (all tiers):**
242: 
243: 1. **Apply exclusions (per D-03):** Remove paths matching planning artifacts
244: ```bash
245: FILTERED_FILES=()
246: for file in "${REVIEW_FILES[@]}"; do
247:   # Skip planning directory and specific artifacts
248:   if [[ "$file" == .planning/* ]] || \
249:      [[ "$file" == ROADMAP.md ]] || \
250:      [[ "$file" == STATE.md ]] || \
251:      [[ "$file" == *-SUMMARY.md ]] || \
252:      [[ "$file" == *-VERIFICATION.md ]] || \
253:      [[ "$file" == *-PLAN.md ]]; then
254:     continue
255:   fi
256:   FILTERED_FILES+=("$file")
257: done
258: REVIEW_FILES=("${FILTERED_FILES[@]}")
259: ```
260: 
261: 2. **Filter deleted files:** Remove paths that don't exist on disk
262: ```bash
263: EXISTING_FILES=()
264: DELETED_COUNT=0
265: for file in "${REVIEW_FILES[@]}"; do
266:   if [ -f "$file" ]; then
267:     EXISTING_FILES+=("$file")
268:   else
269:     DELETED_COUNT=$((DELETED_COUNT + 1))
270:   fi
271: done
272: REVIEW_FILES=("${EXISTING_FILES[@]}")
273: 
274: if [ $DELETED_COUNT -gt 0 ]; then
275:   echo "Filtered $DELETED_COUNT deleted files from review scope"
276: fi
277: ```
278: 
279: 3. **Deduplicate:** Remove duplicate paths (portable — bash 3.2+ compatible, handles spaces in paths)
280: ```bash
281: DEDUPED=()
282: while IFS= read -r line; do
283:   [ -n "$line" ] && DEDUPED+=("$line")
284: done < <(printf '%s\n' "${REVIEW_FILES[@]}" | sort -u)
285: REVIEW_FILES=("${DEDUPED[@]}")
286: ```
287: 
288: 4. **Sort:** Alphabetical sort for reproducible agent input (already sorted by sort -u above)
289: 
290: **Log final scope and warn if large:**
291: ```bash
292: if [ -n "$FILES_OVERRIDE" ]; then
293:   TIER="--files override"
294: elif [ -n "$SUMMARIES" ] && [ ${#REVIEW_FILES[@]} -gt 0 ]; then
295:   TIER="SUMMARY.md"
296: else
297:   TIER="git diff"
298: fi
299: echo "File scope: ${#REVIEW_FILES[@]} files from ${TIER}"
300: 
301: # Warn if file count is very large — may exceed agent context or produce superficial review
302: if [ ${#REVIEW_FILES[@]} -gt 50 ]; then
303:   echo "Warning: ${#REVIEW_FILES[@]} files is a large review scope."
304:   echo "Consider using --files to narrow scope, or --depth=quick for a faster pass."
305:   if [ "$REVIEW_DEPTH" = "deep" ]; then
306:     echo "Switching from deep to standard depth for large file count."
307:     REVIEW_DEPTH="standard"
308:   fi
309: fi
310: ```
311: </step>
312: 
313: <step name="check_empty_scope">
314: If REVIEW_FILES is empty:
315: ```
316: No source files changed in phase ${PHASE_ARG}. Skipping review.
317: ```
318: Exit workflow. Do NOT spawn agent or create REVIEW.md.
319: </step>
320: 
321: <step name="spawn_reviewer">
322: Compute the review output path:
323: ```bash
324: REVIEW_PATH="${PHASE_DIR}/${PADDED_PHASE}-REVIEW.md"
325: ```
326: 
327: Compute DIFF_BASE for agent context (in case agent needs it):
328: ```bash
329: PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)
330: if [ -n "$PHASE_COMMITS" ]; then
331:   DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^
332: else
333:   DIFF_BASE=""
334: fi
335: ```
336: 
337: Build files_to_read block for agent:
338: ```bash
339: FILES_TO_READ=""
340: for file in "${REVIEW_FILES[@]}"; do
341:   FILES_TO_READ+="- ${file}\n"
342: done
343: ```
344: 
345: Build config block for agent:
346: ```bash
347: CONFIG_FILES=""
348: for file in "${REVIEW_FILES[@]}"; do
349:   CONFIG_FILES+="  - ${file}\n"
350: done
351: ```
352: 
353: Spawn the gsd-code-reviewer agent:
354: 
355: ```
356: Agent(subagent_type="gsd-code-reviewer", prompt="
357: <files_to_read>
358: ${FILES_TO_READ}
359: </files_to_read>
360: 
361: <config>
362: depth: ${REVIEW_DEPTH}
363: phase_dir: ${PHASE_DIR}
364: review_path: ${REVIEW_PATH}
365: ${DIFF_BASE:+diff_base: ${DIFF_BASE}}
366: files:
367: ${CONFIG_FILES}
368: </config>
369: 
370: Review the listed source files at ${REVIEW_DEPTH} depth. Write findings to ${REVIEW_PATH}.
371: Do NOT commit the output — the orchestrator handles that.
372: ")
373: ```
374: 
375: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
376: 
377: **Agent failure handling:**
378: 
379: If the Agent() call fails (agent error, timeout, or exception):
380: ```
381: Error: Code review agent failed: ${error_message}
382: 
383: No REVIEW.md created. You can retry with /gsd-code-review ${PHASE_ARG} or check agent logs.
384: ```
385: 
386: Do NOT proceed to commit_review step. Do NOT create a partial or empty REVIEW.md. Exit workflow.
387: </step>
388: 
389: <step name="commit_review">
390: After agent completes successfully, verify REVIEW.md was created and has valid structure:
391: 
392: ```bash
393: if [ -f "${REVIEW_PATH}" ]; then
394:   # Validate REVIEW.md has valid YAML frontmatter with status field
395:   HAS_STATUS=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
396:     const fs = require('fs');
397:     const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
398:     const match = content.match(/^---\n([\s\S]*?)\n---/);
399:     if (match && /status:/.test(match[1])) { console.log('valid'); } else { console.log('invalid'); }
400:   " 2>/dev/null)
401:   
402:   if [ "$HAS_STATUS" = "valid" ]; then
403:     echo "REVIEW.md created at ${REVIEW_PATH}"
404:     
405:     if [ "$COMMIT_DOCS" = "true" ]; then
406:       gsd-sdk query commit \
407:         "docs(${PADDED_PHASE}): add code review report" \
408:         --files "${REVIEW_PATH}"
409:     fi
410:   else
411:     echo "Warning: REVIEW.md exists but has invalid or missing frontmatter (no status field)."
412:     echo "Agent may have produced malformed output. Not committing. Review manually: ${REVIEW_PATH}"
413:   fi
414: else
415:   echo "Warning: Agent completed but REVIEW.md not found at ${REVIEW_PATH}. This may indicate an agent issue."
416:   echo "No REVIEW.md to commit. Please retry with /gsd-code-review ${PHASE_ARG}"
417: fi
418: ```
419: </step>
420: 
421: <step name="present_results">
422: Read the REVIEW.md YAML frontmatter to extract finding counts.
423: 
424: Extract frontmatter between `---` delimiters first to avoid matching values in the review body:
425: 
426: ```bash
427: # Extract only the YAML frontmatter block (between first two --- lines)
428: FRONTMATTER=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
429:   const fs = require('fs');
430:   const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
431:   const match = content.match(/^---\n([\s\S]*?)\n---/);
432:   if (match) process.stdout.write(match[1]);
433: " 2>/dev/null)
434: 
435: # Parse fields from frontmatter only (not full file)
436: STATUS=$(echo "$FRONTMATTER" | grep "^status:" | cut -d: -f2 | xargs)
437: FILES_REVIEWED=$(echo "$FRONTMATTER" | grep "^files_reviewed:" | cut -d: -f2 | xargs)
438: CRITICAL=$(echo "$FRONTMATTER" | grep -E "^[[:space:]]*(critical|blocker):" | head -1 | cut -d: -f2 | xargs)
439: WARNING=$(echo "$FRONTMATTER" | grep "warning:" | head -1 | cut -d: -f2 | xargs)
440: INFO=$(echo "$FRONTMATTER" | grep "info:" | head -1 | cut -d: -f2 | xargs)
441: TOTAL=$(echo "$FRONTMATTER" | grep "total:" | head -1 | cut -d: -f2 | xargs)
442: ```
443: 
444: Display inline summary to user:
445: 
446: ```
447: ═══════════════════════════════════════════════════════════════
448: 
449:   Code Review Complete: Phase ${PHASE_NUMBER} (${PHASE_NAME})
450: 
451: ───────────────────────────────────────────────────────────────
452: 
453:   Depth:           ${REVIEW_DEPTH}
454:   Files Reviewed:  ${FILES_REVIEWED}
455:   
456:   Findings:
457:     Critical:  ${CRITICAL}
458:     Warning:   ${WARNING}
459:     Info:      ${INFO}
460:     ──────────
461:     Total:     ${TOTAL}
462: 
463: ───────────────────────────────────────────────────────────────
464: ```
465: 
466: If status is "clean":
467: ```
468: ✓ No issues found. All ${FILES_REVIEWED} files pass review at ${REVIEW_DEPTH} depth.
469: 
470: Full report: ${REVIEW_PATH}
471: ```
472: 
473: If total findings > 0:
474: ```
475: ⚠ Issues found. Review the report for details.
476: 
477: Full report: ${REVIEW_PATH}
478: 
479: Next steps:
480:   /gsd-code-review ${PHASE_NUMBER} --fix  — Auto-fix issues
481:   cat ${REVIEW_PATH}                     — View full report
482: ```
483: 
484: If critical > 0 or warning > 0, list top 3 issues inline:
485: ```bash
486: echo "Top issues:"
487: grep -A 3 "^### CR-\|^### BL-\|^### WR-" "${REVIEW_PATH}" | head -n 12
488: ```
489: 
490: **Note on tests:** Automated tests for this command and workflow are planned for Phase 4 (Pipeline Integration & Testing, requirement INFR-03). Phase 2 focuses on correct implementation; Phase 4 adds regression coverage across platforms.
491: 
492: ═══════════════════════════════════════════════════════════════
493: </step>
494: 
495: </process>
496: 
497: <platform_notes>
498: **Windows:** This workflow uses bash features (arrays, process substitution). On Windows, it requires
499: Git Bash or WSL. Native PowerShell is not supported. The CI matrix (Ubuntu/macOS/Windows)
500: runs under Git Bash on Windows runners, which provides bash compatibility.
501: 
502: **macOS:** macOS ships with bash 3.2 (GPL licensing). This workflow does NOT use `mapfile` (bash 4+
503: only) — all array construction uses portable `while IFS= read -r` loops compatible with bash 3.2.
504: The `--files` path validation uses `realpath -m` which requires GNU coreutils (install via
505: `brew install coreutils`). Without coreutils, the path guard falls back to fail-closed behavior
506: (rejects paths it cannot verify), so security is maintained but valid relative paths may be rejected.
507: If `--files` validation fails unexpectedly on macOS, install coreutils or use absolute paths.
508: </platform_notes>
509: 
510: <success_criteria>
511: - [ ] Phase validated before config gate check
512: - [ ] Config gate checked (workflow.code_review)
513: - [ ] Depth resolved with validation (quick|standard|deep)
514: - [ ] File scope computed with 3 tiers: --files > SUMMARY.md > git diff
515: - [ ] Malformed/missing SUMMARY.md handled gracefully with fallback
516: - [ ] Deleted files filtered from scope
517: - [ ] Files deduplicated and sorted
518: - [ ] Empty scope results in skip (no agent spawn)
519: - [ ] Agent spawned with explicit file list, depth, review_path, diff_base
520: - [ ] Agent failure handled without partial commits
521: - [ ] REVIEW.md committed if created
522: - [ ] Results presented inline with next step suggestion
523: </success_criteria>

(End of file - total 523 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>

### Tool: glob

**Input:**
```json
{
  "callID": "call_Dt3JM9hN64UmM4zQIOHngfIk"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_cC3jOJjwzGKowKHRLoGqrdxF"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_biast6A4sOCkcyKoIrcU0N2t"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Review CP-DT-01 code",
  "subagent_type": "gsd-code-reviewer",
  "task_id": "ses_1c5e0746cffe5LUWFPPSdRJupa"
}
```

**Output:** (pruned)
```
task_id: ses_1c5e0746cffe5LUWFPPSdRJupa
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-code-review-fix"
}
```

**Output:** (pruned)
```
# Skill: gsd-code-review-fix
```


### Tool: task

**Input:**
```json
{
  "description": "Fix CP-DT review",
  "subagent_type": "gsd-code-fixer",
  "task_id": "ses_1c5da3873ffefIDnMO7EigMIo3"
}
```

**Output:** (pruned)
```
task_id: ses_1c5da3873ffefIDnMO7EigMIo3
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-FIX.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_9xZvkqHg2kYDY73Y38DCb84R"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ViibY7Ah3wZAjyA5d9W3XN5I"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_e9XHnbKxpzGWGMuuYrm6qDto"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_CfKeZ0CrsHwLdodVSVDTcuRe"
}
```


## COMPACTED (2026-05-18T08:36:45.658Z)

**raw_event:**

```json
{
  "id": "evt_e3a3affcd0011QRXgUT7E07IaN",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

## USER (turn 42)

**source:** real-human

hãy tiếp tục

### Tool: bash

**Input:**
```json
{
  "callID": "call_b0101f87848b4ea7a1169a95"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_8f4ad610922a4b919d5783ba"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_4329a26bcfcb4f3f83f0eb52"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_b70727895bc34740908274b6"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-code-review"
}
```

**Output:** (pruned)
```
# Skill: gsd-code-review
```


### Tool: task

**Input:**
```json
{
  "description": "Re-review CP-DT-01 after fix",
  "subagent_type": "gsd-code-reviewer",
  "task_id": "ses_1c5c2ef4cffemmbXyNhf7mYVDE"
}
```

**Output:** (pruned)
```
task_id: ses_1c5c2ef4cffemmbXyNhf7mYVDE
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_9778d8879cb24759a2c5c947"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_918c50c1047543e1b9740d01"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-validate-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-validate-phase
```


### Tool: task

**Input:**
```json
{
  "description": "Validate CP-DT-01 phase",
  "subagent_type": "gsd-verifier",
  "task_id": "ses_1c5b92285ffeoccVwHF4X6DusW"
}
```

**Output:** (pruned)
```
task_id: ses_1c5b92285ffeoccVwHF4X6DusW
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_a72f2c03453f41729675538a"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_61c760472a3842ba8e05ef1c"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_0b4e16c195b248aa84265287"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_6b5a7fc3065647219794d493"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_f8344f05582d443682b3f1b6"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_4bc8f5e5c61f4c0683903e16"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_3eb86b0824fa42f9afac19e8"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/AGENTS.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_953ee118a56847528f45a52c"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_54e03316d061437cb11fbcb7"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/AGENTS.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_bf73d0bac146459082a831f4"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_b5111e69a6224a16889eb1bd"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_1d0a81616712422eae46e991"
}
```


## USER (turn 43)

**source:** real-human

hãy tiếp tục phần trên tôi vừa  bị rớt mạng, hoàn thành và tiếp theo sau các quality gatekeeping, integration verfication tự động loops gsd routing để sửa lỗi nếu gặp phải

### Tool: bash

**Input:**
```json
{
  "callID": "call_ec881b31f6f14167a5bb4f18"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6f4ac69a6ca54a8487d639a7"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_3aef4ef236b24e71bfa09240"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_d1b0344b31dc4f50a9f18fbc"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_f8409175e0864e419da05b06"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_fff379f05ac34ea4aba62385"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_659530b488944aa797315487"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gate-l3-lifecycle-integration"
}
```

**Output:** (pruned)
```
# Skill: gate-l3-lifecycle-integration
```


### Tool: task

**Input:**
```json
{
  "description": "Gate 1: lifecycle integration",
  "subagent_type": "hm-l2-auditor",
  "task_id": "ses_1c5a14e36ffeIOr06SUYa2CTfA"
}
```

**Output:** (pruned)
```
task_id: ses_1c5a14e36ffeIOr06SUYa2CTfA
```


## COMPACTED (2026-05-18T09:29:12.485Z)

**raw_event:**

```json
{
  "id": "evt_e3a6b041c001wiuNCXzjGc3Vr5",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: skill

**Input:**
```json
{
  "name": "gate-l3-spec-compliance"
}
```

**Output:** (pruned)
```
# Skill: gate-l3-spec-compliance
```


### Tool: task

**Input:**
```json
{
  "description": "Gate 2: spec compliance audit",
  "subagent_type": "hm-l2-critic",
  "task_id": "ses_1c593fcbfffern5Iohq5XBSftm"
}
```

**Output:** (pruned)
```
task_id: ses_1c593fcbfffern5Iohq5XBSftm
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_e226017de953469799fda52a"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Investigate 3 spec warnings",
  "subagent_type": "hm-l2-investigator",
  "task_id": "ses_1c570f3f7ffeq2JjusKK9E8s4b"
}
```

**Output:** (pruned)
```
task_id: ses_1c570f3f7ffeq2JjusKK9E8s4b
```


## USER (turn 44)

**source:** real-human

rốt cuộc delegate-task tool sử dụng thế nào mới đúng mà lại có thông báo thế này # delegate-task [agent=hm-l2-build, prompt=You are a subagent (hm-l2-build). Count all .ts files in the src/ directory of /Users/apple/hivemind-plugin-private and return the exact count with file paths. Do NOT write any files. Just report results., category=test-delegation-basic, safetyCeilingMs=60000]
{
  "kind": "error",
  "message": "[Harness] delegate-task cannot start native Task: OpenCode native Task seam is unavailable."
}
Click to collapse 

### Tool: task

**Input:**
```json
{
  "description": "Fix 3 spec warning gaps",
  "subagent_type": "hm-l2-build",
  "task_id": "ses_1c56d4f2bffefWLhHIFG3Kz7Im"
}
```

**Output:** (pruned)
```
task_id: ses_1c56d4f2bffefWLhHIFG3Kz7Im
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_26626c929cc7489992ac78e1"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```


## USER (turn 45)

**source:** real-human

Sau cụm này "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-LIFECYCLE.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-FIX.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-ITER2.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md " cac tools nào expose cho agents sử dụng ra sao - đừng nói tới các môi trương khác tất cả các features này làm ra đều để hoạt động với OpenCode runtime

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_60ade2632d264e0c8765719a"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


## COMPACTED (2026-05-18T10:21:55.165Z)

**raw_event:**

```json
{
  "id": "evt_e3a9b46520013kvky1bj4TiW4q",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

## USER (turn 46)

**source:** real-human

tôi không cần biết cái chính ở đây là delegate-task là trục chính với các thứ khác là engines, hook ịnjections etc nó phải hoạt động đúng SPEC, RESEARCH đã miêu tả 

## USER (turn 47)

**source:** real-human

tôi không cần biết cái chính ở đây là delegate-task là trục chính với các thứ khác là engines, hook ịnjections etc nó phải hoạt động đúng SPEC, RESEARCH đã miêu tả 

## USER (turn 48)

**source:** real-human

tôi không cần biết cái chính ở đây là delegate-task là trục chính với các thứ khác là engines, hook ịnjections etc nó phải hoạt động đúng SPEC, RESEARCH đã miêu tả 

## USER (turn 49)

**source:** real-human

/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-LIFECYCLE.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-FIX.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-ITER2.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md 

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_0158095e1be74d1496de2065"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/monitor.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/resume-resolver.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/survival-kit.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/monitor.ts"
}
```


### Tool: task

**Input:**
```json
{
  "description": "Re-verify Gate 2 spec compliance",
  "subagent_type": "hm-l2-critic",
  "task_id": "ses_1c5630c46ffeXuWgjlU2rE95X8"
}
```

**Output:** (pruned)
```
task_id: ses_1c5630c46ffeXuWgjlU2rE95X8
```


## USER (turn 50)

**source:** real-human

Check	Kết quả
SDK v1.14.48 (installed) ToolContext	❌ KHÔNG có task
SDK v1.15.4 (latest) ToolContext	❌ KHÔNG có task
OpenCode binary v1.15.0 runtime	❌ KHÔNG inject task
delegate-task tool	❌ FAIL — lỗi nhất quán
Kết luận: delegate-task tool KHÔNG THỂ CHẠY trong môi trường OpenCode hiện tại vì nó phụ thuộc vào context.task — một field không tồn tại trong SDK ToolContext (cả phiên bản hiện tại lẫn latest). Đây là một undocumented seam mà harness code kỳ vọng nhưng OpenCode runtime không cung cấp.
Tool delegate-task cần được sửa để:
1. 
Hoặc dùng cơ chế khác để spawn child session (qua SDK client trực tiếp)
2. 
Hoặc OpenCode cần thêm task vào ToolContext trong tương lai 

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_cc581f52447a4ecbac73e9c0"
}
```


## USER (turn 51)

**source:** real-human

đừng làm gì khi mà cơ bản chức năng này đã không hoạt động được

## COMPACTED (2026-05-18T10:26:52.348Z)

**raw_event:**

```json
{
  "id": "evt_e3a9fcf2e001DtP2aEgDB7FgAU",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_60e5623dfdfd4108ad94a2e2"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_d0c2f6b647974056bdce8d55"
}
```


## USER (turn 52)

**source:** real-human

mày đang nói cái đéo gì vậy - tất cả cụm chức năng này là revamp trải qua việc tao đã từng đưa context và spec như thế này ```nhưng hệ thống đã có các cơ chế như xác định đã executed thành công ?

( qua việc agents được delegated trả về first tool calls bao gồm innate tools, bash, commands, skills etc , child sessions ID được ghi nhận  và trong vòng một giới hạn thời gian cho phép là 60s các  tín hiệu trên không ghi nhận được tức là session delegated đã fail và phải delegate lại) và các logics build theo sau nó qua tools dành cho agent sử dụng delegate-task bao gồm như

- khi xác nhận pha là delegate-task đã chạy thì bộ hẹn giờ và polling phải là theo pha và chủ động (30s - 45s -60s - 90s - 120s - 180s ) các bộ đếm này sẽ ghi lại một thin line session id và delegated agent  với status và bộ đếm tools, bash, skill, actions -nhằm đưa thông tin kịp thời một cách tinh gọn và minimal nhất có thể thông báo cho main agents biết là các sessions vẫn đang chạy → là các injection vào context của session đang diễn ra để nhắc delegator agent poll status và kiểm tra kết quả thật một cách deterministically  → từ đó delegator main agents vẫn có thể rảnh tay để làm các tác vụ khác mà không phải bận tập đưa ra hẹn giờ check lại. Điểm chính của delegate-task là thực hiện async delegation có kiểm soát trong khi vẫn điều phối được luồng hoạt động chính với users và dùng OpenCode innate task tool delegation khi muốn các delegation có hệ thống và kiểm soát trình tự hơn
    - thêm vào đó các kiến thức từ việc xây dựng session-tracker có thể đưa áp dụng  vào đây cho việc tracking chính xác
    - ở logic về thời gian ở mức 60s là mức fallback và ghi nhận failure nếu không có action nào xảy ra → tiếp tục ở mức 120s là mức failure thứ 2 nếu so với mức 1 không có action mới nào được ghi nhận → tương tự như vậy ở 180s là hard failure lần 3 nếu so với mức 2 không có action nào mới được ghi nhận → 300s là hard failure lần 4 và là lần cuối cùng (5 phút) sau lần này thì khôg tiếp tục ịnjection thông tin vào context của main session để thông báo cho main agent nữa - tức là nếu tools vẫn ghi nhận và vẫn chạy thì tiếp theo sẽ dựa vào hệ thống ghi nhận kết quả tự động bên dưới
    - Cơ chế thông báo và gi nhận kết quả delegation: đây cũng là một cơ chế chủ động với 3 logics
        - session sẽ ghi nhận hoàn thành chỉ khi đủ các điều kiện sau đây
            - có tools ghi nhận chạy ở phía trên và chạy được trên 1 phút
            - agents last message output (còn gọi là assistant last message) đây là tổng kết và report thông tin mà agent dùng tools và các công cụ sau phiên delegation được giao, nó tổng hợp lại các kết qả
            - cuối cùng là phần tuỳ thuộc - tức là đối với các task đòi hỏi tạo file, modify, hay move, mutate files, hay artifact documents gì đó thì phải ghi nhận file changes ra sao
        - khi thành công thì sẽ đưa một thông báo tóm tăt - ghi nhận là block thông báo kết quả của phiên delegation … task …. tóm tắt ….result… path…. được đọc tại… timestamp - file changes:…. - đây là một message sẽ append trực tiếp vào TUI message và tuỳ vào trạng thái của session lúc đó nếu main session còn live nó sẽ append trực tiếp không qua xếp hàng (nó phải có header thông báo đây là hệ thống nhắc của delegate-task tự động từ system) - còn nếu session đã end stream nó sẽ gởi message đi và resume session
        - session sẽ ghi nhận status failure với các trường hợp sau
            - các ngưỡng 4 lần phía trên fail
            - sau pass ngưỡng 4 tức 300s mà vẫn đang chay và chờ thêm 300s nữa (tức 10 phút) mà vẫn không có trả về kết quả cuối cùng tức ghi nhận assistant last message thì sẽ ghi nhận là fail nhưng với 2 cấp khác nhau
        - Session fail sẽ ghi nhận theo 2 cấp là đã executed - running và fail vs. fail từ ngưỡng một phần thông báo này sẽ là thông tin để mà agents lựa chọn sử dụng các tools phù hợp phía dưới
        - delegate-task có thể delegate cùng một lúc cho phép tới 10 phiên - 10 slots này quản lý theo từng main session và khi trả thông báo về nó cũng phải ghi nhận thông báo append TUI message vào đúng session đó để tránh trường hợp users đang vận hành một main session song song không liên quan mà các phiên này lại đi lạc vào
    - Cần phải nghĩ nhiều hơn nữa về tools các tools thuộc nhóm này phải bao gồm cả các tools hoặc arguments để có thể làm các việc sau
        - abort/cancel và restart và điều chỉnh prompt, thay đổi agents
        - đồng thời như trên đối với các session đã có tools ghi nhận chạy rồi và chạy đúng với OpenCode SDK thì không việc gì phải delegate lại một phiên hoàn toàn mới thay vào đó việc resume lại một phiên (miễn là có session id) là hoàn toàn khả thi và với một knowledge là một khi đã xác nhận mức 1 thành công tức session đã chạy → thì mặc định delegator có thể resume với prompt đơn giản và thâm chí thay đổi agent name nhưng các context phía trên nó đều được bảo tồn (điều này delegator agent không nhận biết được nhưng tool cần thiết kế ra cho mục đích như vậy nó ghi nhận session và hướng dẫn delegator agent resume với prompt đơn giản mà không phải lặp lại trừ khi muốn thay đổi điều hướng khác đi
        - chức năng phía trên cũng có thể mở rộng ra cho việc quản lý delegation tasks - cụ thể hơn là completed delegated tasks - orchestrator, coordinator (tức nhóm l0 và l1, cũng như agent mặc định build)  và delegator hoàn toàn có thể chủ động tạo một task mới nối tiếp các completed task b ằng cách sử dụng lại session id cũ → việc này giúp nhiệm vụ mới có được context của nhiệm vụ cũ mà main agents l0 và l1 không phải diễn dãi ra hoặc hallucinate đưa một thông tin không liên quan tới những gì mà task trước đó tìm kiếm

Để làm được điều trên nghiên cứu thật kỹ các methods, client-server architecture của OpenCode API và SDK (nhất là phần liên quan tới messages, sessions, paths, projects, tools, commands, instances, files etc) và các hooks ứng dụng của OpenCode Plugins SDK đồng thời là source-code cuả OpenCode platform để hiểu được architecture của nó vận hành ra sao cho các nhóm primitives, tools, custom tools, commands, agent skills, mcp server tools agents vs subagents mode: all, primary, subagent - đồng thời permissions khi regex cho granularity control và sự thừa hưởng permissions giữa main và sub agents và ; các functions để detect what agents that users have in store (vì agents được chứa ở rất nhiều nơi từ opencode.json, cho tới .opencode/agent(s) (ở đây lấy cả số ít và số nhiều và có thêm việc các primitives này ngoài tồn tại ở project còn tồn tại ở gloabal) - xử lý các edge casés như compacts survival khi mà delegation context windows bị tràn ```>>>> và mày đã đưa ra một đống thứ cho là đã qua nghiên cứu và verify với spec ```/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md ``` và đã implement /Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md  qua đống trásh này mà giờ mày đưa ra một lựa chọn là đợi opencode thêm task vào toolContext là cái đéo gì ? mày đang mơ gì? tại sao một chức năng phát triển mà đợi chờ vào lộ trình OpenCode thêm task vào toolcontext là thế nào mày lấy thông tin này ở đâu ra ở viễn cảnh nào cho thấy architecture của OpenCode platforms có task trong toolcontext

### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_a010543aa1f549a58b8b1a36"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_62468f31fd184665b2b7c0db"
}
```


### Tool: sequential-thinking_sequentialthinking

**Input:**
```json
{
  "callID": "call_6d631245f839486882c2f6ee"
}
```


## USER (turn 53)

**source:** real-human

vậy route gsd để chỉnh sửa lại các tài liệu này cho đúng và từ đó truy vết từ các summary và implement và sửa lại code và test theo trình tự 5 plan

## USER (turn 54)

**source:** real-human

vậy route gsd để chỉnh sửa lại các tài liệu này cho đúng và từ đó truy vết từ các summary và implement và sửa lại code và test theo trình tự 5 plan - sử dụng execute slash command để append các workflow và commands gsd trực tiếp tại đây, các hệ quả là delegation task tool tới agents nào sẽ được tự hướng dẫn qua các command đó tới gsd agent tương ứng

## USER (turn 55)

**source:** real-human

vậy route gsd để chỉnh sửa lại các tài liệu này cho đúng và từ đó truy vết từ các summary và implement và sửa lại code và test theo trình tự 5 plan - sử dụng execute slash command để append các workflow và commands gsd trực tiếp tại đây, các hệ quả là delegation task tool tới agents nào sẽ được tự hướng dẫn qua các command đó tới gsd agent tương ứng

### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: skill

**Input:**
```json
{
  "name": "verify-before-complete"
}
```

**Output:** (pruned)
```
# Skill: verify-before-complete
```


### Tool: hivemind-command-engine

**Input:**
```json
{
  "callID": "call_78CdZcOGfEUpBhiKgwb1DnlZ"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_prPmWbVqRHapgeyuxcI0fwXN"
}
```


## USER (turn 56)

**source:** real-human

<objective>
Investigate what went wrong during a GSD workflow execution. Analyzes git history, `.planning/` artifacts, and file system state to detect anomalies and generate a structured diagnostic report.

Purpose: Diagnose failed or stuck workflows so the user can understand root cause and take corrective action.
Output: Forensic report saved to `.planning/forensics/`, presented inline, with optional issue creation.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md
</execution_context>

<context>
**Data sources:**
- `git log` (recent commits, patterns, time gaps)
- `git status` / `git diff` (uncommitted work, conflicts)
- `.planning/STATE.md` (current position, session history)
- `.planning/ROADMAP.md` (phase scope and progress)
- `.planning/phases/*/` (PLAN.md, SUMMARY.md, VERIFICATION.md, CONTEXT.md)
- `.planning/reports/SESSION_REPORT.md` (last session outcomes)

**User input:**
- Problem description: CP-DT-01 delegate-task ecosystem revamp runtime failure. Re-open CP-DT-01 because delegate-task core runtime seam is false: SDK @opencode-ai/plugin v1.14.48 installed ToolContext has no task field; latest v1.15.4 ToolContext has no task field; OpenCode binary v1.15.0 runtime does not inject task; delegate-task fails consistently because implementation depends on context.task. Forensics scope: audit these artifacts and trace where false assumptions entered: .planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md, CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-01-SUMMARY.md through CP-DT-01-05-SUMMARY.md, REVIEW, REVIEW-FIX, REVIEW-ITER2, VALIDATION, GATE reports. Produce a filing-ready report that marks CP-DT-01 COMPLETE as invalid, identifies mock-vs-runtime verification gaps, lists affected code/tests, and recommends remediation sequencing through the original five-plan structure. Do not fix code yet. Do not assume OpenCode will add task to ToolContext. Required output: local forensics artifact in the CP-DT-01 phase directory, with exact file references and a remediation command sequence for GSD. (optional — will ask if not provided)
</context>

<process>
Execute end-to-end.
</process>

<success_criteria>
- Evidence gathered from all available data sources
- At least 4 anomaly types checked (stuck loop, missing artifacts, abandoned work, crash/interruption)
- Structured forensic report written to `.planning/forensics/report-{timestamp}.md`
- Report presented inline with findings, anomalies, and recommendations
- Interactive investigation offered for deeper analysis
- GitHub issue creation offered if actionable findings exist
</success_criteria>

<critical_rules>
- **Read-only investigation:** Do not modify project source files during forensics. Only write the forensic report and update STATE.md session tracking.
- **Redact sensitive data:** Strip absolute paths, API keys, tokens from reports and issues.
- **Ground findings in evidence:** Every anomaly must cite specific commits, files, or state data.
- **No speculation without evidence:** If data is insufficient, say so — do not fabricate root causes.
</critical_rules>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/forensics.md</path>
<type>file</type>
<content>
1: # Forensics Workflow
2: 
3: Post-mortem investigation for failed or stuck GSD workflows. Analyzes git history,
4: `.planning/` artifacts, and file system state to detect anomalies and generate a
5: structured diagnostic report.
6: 
7: **Principle:** This is a read-only investigation. Do not modify project files.
8: Only write the forensic report.
9: 
10: ---
11: 
12: ## Step 1: Get Problem Description
13: 
14: ```bash
15: PROBLEM="$ARGUMENTS"
16: ```
17: 
18: If `$ARGUMENTS` is empty, ask the user:
19: > "What went wrong? Describe the issue — e.g., 'autonomous mode got stuck on phase 3',
20: > 'execute-phase failed silently', 'costs seem unusually high'."
21: 
22: Record the problem description for the report.
23: 
24: ## Step 2: Gather Evidence
25: 
26: Collect data from all available sources. Missing sources are fine — adapt to what exists.
27: 
28: ### 2a. Git History
29: 
30: ```bash
31: # Recent commits (last 30)
32: git log --oneline -30
33: 
34: # Commits with timestamps for gap analysis
35: git log --format="%H %ai %s" -30
36: 
37: # Files changed in recent commits (detect repeated edits)
38: git log --name-only --format="" -20 | sort | uniq -c | sort -rn | head -20
39: 
40: # Uncommitted work
41: git status --short
42: git diff --stat
43: ```
44: 
45: Record:
46: - Commit timeline (dates, messages, frequency)
47: - Most-edited files (potential stuck-loop indicator)
48: - Uncommitted changes (potential crash/interruption indicator)
49: 
50: ### 2b. Planning State
51: 
52: Read these files if they exist:
53: - `.planning/STATE.md` — current milestone, phase, progress, blockers, last session
54: - `.planning/ROADMAP.md` — phase list with status
55: - `.planning/config.json` — workflow configuration
56: 
57: Extract:
58: - Current phase and its status
59: - Last recorded session stop point
60: - Any blockers or flags
61: 
62: ### 2c. Phase Artifacts
63: 
64: For each phase directory in `.planning/phases/*/`:
65: 
66: ```bash
67: ls .planning/phases/*/
68: ```
69: 
70: For each phase, check which artifacts exist:
71: - `{padded}-PLAN.md` or `{padded}-PLAN-*.md` (execution plans)
72: - `{padded}-SUMMARY.md` (completion summary)
73: - `{padded}-VERIFICATION.md` (quality verification)
74: - `{padded}-CONTEXT.md` (design decisions)
75: - `{padded}-RESEARCH.md` (pre-planning research)
76: 
77: Track: which phases have complete artifact sets vs gaps.
78: 
79: ### 2d. Session Reports
80: 
81: Read `.planning/reports/SESSION_REPORT.md` if it exists — extract last session outcomes,
82: work completed, token estimates.
83: 
84: ### 2e. Git Worktree State
85: 
86: ```bash
87: git worktree list
88: ```
89: 
90: Check for orphaned worktrees (from crashed agents).
91: 
92: ## Step 3: Detect Anomalies
93: 
94: Evaluate the gathered evidence against these anomaly patterns:
95: 
96: ### Stuck Loop Detection
97: 
98: **Signal:** Same file appears in 3+ consecutive commits within a short time window.
99: 
100: ```bash
101: # Look for files committed repeatedly in sequence
102: git log --name-only --format="---COMMIT---" -20
103: ```
104: 
105: Parse commit boundaries. If any file appears in 3+ consecutive commits, flag as:
106: - **Confidence HIGH** if the commit messages are similar (e.g., "fix:", "fix:", "fix:" on same file)
107: - **Confidence MEDIUM** if the file appears frequently but commit messages vary
108: 
109: ### Missing Artifact Detection
110: 
111: **Signal:** Phase appears complete (has commits, is past in roadmap) but lacks expected artifacts.
112: 
113: For each phase that should be complete:
114: - PLAN.md missing → planning step was skipped
115: - SUMMARY.md missing → phase was not properly closed
116: - VERIFICATION.md missing → quality check was skipped
117: 
118: ### Abandoned Work Detection
119: 
120: **Signal:** Large gap between last commit and current time, with STATE.md showing mid-execution.
121: 
122: ```bash
123: # Time since last commit
124: git log -1 --format="%ai"
125: ```
126: 
127: If STATE.md shows an active phase but the last commit is >2 hours old and there are
128: uncommitted changes, flag as potential abandonment or crash.
129: 
130: ### Crash/Interruption Detection
131: 
132: **Signal:** Uncommitted changes + STATE.md shows mid-execution + orphaned worktrees.
133: 
134: Combine:
135: - `git status` shows modified/staged files
136: - STATE.md has an active execution entry
137: - `git worktree list` shows worktrees beyond the main one
138: 
139: ### Scope Drift Detection
140: 
141: **Signal:** Recent commits touch files outside the current phase's expected scope.
142: 
143: Read the current phase PLAN.md to determine expected file paths. Compare against
144: files actually modified in recent commits. Flag any files that are clearly outside
145: the phase's domain.
146: 
147: ### Test Regression Detection
148: 
149: **Signal:** Commit messages containing "fix test", "revert", or re-commits of test files.
150: 
151: ```bash
152: git log --oneline -20 | grep -iE "fix test|revert|broken|regression|fail"
153: ```
154: 
155: ## Step 4: Generate Report
156: 
157: Create the forensics directory if needed:
158: ```bash
159: mkdir -p .planning/forensics
160: ```
161: 
162: Write to `.planning/forensics/report-$(date +%Y%m%d-%H%M%S).md`:
163: 
164: ```markdown
165: # Forensic Report
166: 
167: **Generated:** {ISO timestamp}
168: **Problem:** {user's description}
169: 
170: ---
171: 
172: ## Evidence Summary
173: 
174: ### Git Activity
175: - **Last commit:** {date} — "{message}"
176: - **Commits (last 30):** {count}
177: - **Time span:** {earliest} → {latest}
178: - **Uncommitted changes:** {yes/no — list if yes}
179: - **Active worktrees:** {count — list if >1}
180: 
181: ### Planning State
182: - **Current milestone:** {version or "none"}
183: - **Current phase:** {number — name — status}
184: - **Last session:** {stopped_at from STATE.md}
185: - **Blockers:** {any flags from STATE.md}
186: 
187: ### Artifact Completeness
188: | Phase | PLAN | CONTEXT | RESEARCH | SUMMARY | VERIFICATION |
189: |-------|------|---------|----------|---------|-------------|
190: {for each phase: name | ✅/❌ per artifact}
191: 
192: ## Anomalies Detected
193: 
194: ### {Anomaly Type} — {Confidence: HIGH/MEDIUM/LOW}
195: **Evidence:** {specific commits, files, or state data}
196: **Interpretation:** {what this likely means}
197: 
198: {repeat for each anomaly found}
199: 
200: ## Root Cause Hypothesis
201: 
202: Based on the evidence above, the most likely explanation is:
203: 
204: {1-3 sentence hypothesis grounded in the anomalies}
205: 
206: ## Recommended Actions
207: 
208: 1. {Specific, actionable remediation step}
209: 2. {Another step if applicable}
210: 3. {Recovery command if applicable — e.g., `/gsd-resume-work`, `/gsd-execute-phase N`}
211: 
212: ---
213: 
214: *Report generated by `/gsd-forensics`. All paths redacted for portability.*
215: ```
216: 
217: **Redaction rules:**
218: - Replace absolute paths with relative paths (strip `$HOME` prefix)
219: - Remove any API keys, tokens, or credentials found in git diff output
220: - Truncate large diffs to first 50 lines
221: 
222: ## Step 5: Present Report
223: 
224: Display the full forensic report inline.
225: 
226: ## Step 6: Offer Interactive Investigation
227: 
228: > "Report saved to `.planning/forensics/report-{timestamp}.md`.
229: >
230: > I can dig deeper into any finding. Want me to:
231: > - Trace a specific anomaly to its root cause?
232: > - Read specific files referenced in the evidence?
233: > - Check if a similar issue has been reported before?"
234: 
235: If the user asks follow-up questions, answer from the evidence already gathered.
236: Read additional files only if specifically needed.
237: 
238: ## Step 7: Offer Issue Creation
239: 
240: If actionable anomalies were found (HIGH or MEDIUM confidence):
241: 
242: > "Want me to create a GitHub issue for this? I'll format the findings and redact paths."
243: 
244: If confirmed:
245: ```bash
246: # Check if "bug" label exists before using it
247: BUG_LABEL=$(gh label list --repo gsd-build/get-shit-done --search "bug" --json name -q '.[0].name' 2>/dev/null)
248: LABEL_FLAG=""
249: if [ -n "$BUG_LABEL" ]; then
250:   LABEL_FLAG="--label bug"
251: fi
252: 
253: gh issue create \
254:   --repo gsd-build/get-shit-done \
255:   --title "bug: {concise description from anomaly}" \
256:   $LABEL_FLAG \
257:   --body "{formatted findings from report}"
258: ```
259: 
260: ## Step 8: Update STATE.md
261: 
262: ```bash
263: gsd-sdk query state.record-session "" \
264:   "Forensic investigation complete" \
265:   ".planning/forensics/report-{timestamp}.md"
266: ```

(End of file - total 266 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-forensics"
}
```

**Output:** (pruned)
```
# Skill: gsd-forensics
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_Y3tStXfMSfhN64WhqKejXKx9"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_uoEGmX067DAs3EWcGTheEAzd"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_6LGL4XaHitiBcaZPiAsXoxQ1"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_hIObfX28R56xI0VSrmr5bYdq"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_snPfHxdVk7dq92khaTIi3LrZ"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_EmAq3uj6r0abgNdh5mBEjw27"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ywR65U4Be5yjUV9FQal4tleN"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_MMGVYC6IOb4UB5mWsUTw63GA"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_SYUgT3p7C6i1gAgWbwHGaR0b"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_b6LCXRaJUu8GfYukwPkUt80h"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_ic8Yuuhi8orHuZrZjRaZ4Z9F"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_DeBRR3lRIJKQTEItW2r5ld0Y"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/plugin/dist/tool.d.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/node_modules/@opencode-ai/plugin/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_ADYm6hNFQf9Fy7dlvDxWREqD"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_hHm0BMS2Dw9BWwNm9H6eMXAA"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_D5l2tNGsivfWx2A6rKFrCOLC"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_GhjIspJEmQ1RbznO5XLLw0A5"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_qraxMf5zFRc8KcLMGQcHMjsS"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_roEBphEVLoFslqZb2UCxmiQo"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_Ygq1dsbX1ArGWPx56tOY5b2s"
}
```


## USER (turn 57)

**source:** real-human

<objective>
Generate and update up to 9 documentation files for the current project. Each doc type is written by a gsd-doc-writer subagent that explores the codebase directly — no hallucinated paths, phantom endpoints, or stale signatures.

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`
- If a documented flag is absent from `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`, treat it as inactive
- `--force`: skip preservation prompts, regenerate all docs regardless of existing content or GSD markers
- `--verify-only`: check existing docs for accuracy against codebase, no generation (full verification requires Phase 4 verifier)
- If `--force` and `--verify-only` both appear in `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`, `--force` takes precedence
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md
</execution_context>

<context>
Arguments: CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.

**Available optional flags (documentation only — not automatically active):**
- `--force` — Regenerate all docs. Overwrites hand-written and GSD docs alike. No preservation prompts.
- `--verify-only` — Check existing docs for accuracy against the codebase. No files are written. Reports VERIFY marker count. Full codebase fact-checking requires the gsd-doc-verifier agent (Phase 4).

**Active flags must be derived from `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`:**
- `--force` is active only if the literal `--force` token is present in `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`
- `--verify-only` is active only if the literal `--verify-only` token is present in `CP-DT-01 runtime-truth correction from .planning/forensics/report-20260518-105705.md. Update only planning artifacts first, no source code. Required corrections: mark CP-DT-01 as RE-OPENED / RUNTIME BLOCKED instead of COMPLETE in .planning/STATE.md and .planning/ROADMAP.md; update CP-DT-01-RESEARCH.md to mark Assumption A1 disproven by @opencode-ai/plugin ToolContext v1.15.4 and upstream sst/opencode evidence; update CP-DT-01-PATTERN.md to remove any pattern that assumes direct context.task/native Task invocation from custom tool context; update CP-DT-01-SPEC.md so execution architecture uses only verified OpenCode mechanisms and treats context.task as invalid; update CP-DT-01-VALIDATION.md to downgrade prior 18/18 completion and 91/91 tests to mock-seam evidence, not runtime proof; update CP-DT-01-GATE-SPEC.md to invalidate DC-01 PASS and AP-07 PASS. Do not fix src or tests yet. Preserve exact evidence references from report. Required output: docs update summary and next remediation plan command.`
- If neither token appears, run the standard full-phase generation flow
- Do not infer that a flag is active just because it is documented in this prompt
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (preservation_check, flag handling, wave execution, monorepo dispatch, commit, reporting).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/docs-update.md</path>
<type>file</type>
<content>
1: <purpose>
2: Generate, update, and verify all project documentation — both canonical doc types and existing hand-written docs. The orchestrator detects the project's doc structure, assembles a work manifest tracking every item, dispatches parallel doc-writer and doc-verifier agents across waves, reviews existing docs for accuracy, identifies documentation gaps, and fixes inaccuracies via a bounded fix loop. All state is persisted in a work manifest so no work item is lost between steps. Output: Complete, structure-aware documentation verified against the live codebase.
3: </purpose>
4: 
5: <available_agent_types>
6: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
7: - gsd-doc-writer — Writes and updates project documentation files
8: - gsd-doc-verifier — Verifies factual claims in docs against the live codebase
9: </available_agent_types>
10: 
11: <process>
12: 
13: <step name="init_context" priority="first">
14: Load docs-update context:
15: 
16: ```bash
17: INIT=$(gsd-sdk query docs-init)
18: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
19: AGENT_SKILLS=$(gsd-sdk query agent-skills gsd-doc-writer)
20: ```
21: 
22: Extract from init JSON:
23: - `doc_writer_model` — model string to pass to each spawned agent (never hardcode a model name)
24: - `commit_docs` — whether to commit generated files when done
25: - `existing_docs` — array of `{path, has_gsd_marker}` objects for existing Markdown files
26: - `project_type` — object with boolean signals: `has_package_json`, `has_api_routes`, `has_cli_bin`, `is_open_source`, `has_deploy_config`, `is_monorepo`, `has_tests`
27: - `doc_tooling` — object with booleans: `docusaurus`, `vitepress`, `mkdocs`, `storybook`
28: - `monorepo_workspaces` — array of workspace glob patterns (empty if not a monorepo)
29: - `project_root` — absolute path to the project root
30: </step>
31: 
32: <step name="classify_project">
33: Map the `project_type` boolean signals from the init JSON to a primary type label and collect conditional doc signals.
34: 
35: **Primary type classification (first match wins):**
36: 
37: | Condition | primary_type |
38: |-----------|-------------|
39: | `is_monorepo` is true | `"monorepo"` |
40: | `has_cli_bin` is true AND `has_api_routes` is false | `"cli-tool"` |
41: | `has_api_routes` is true AND `is_open_source` is false | `"saas"` |
42: | `is_open_source` is true AND `has_api_routes` is false | `"open-source-library"` |
43: | (none of the above) | `"generic"` |
44: 
45: **Conditional doc signals (D-02 union rule — check independently after primary classification):**
46: 
47: After determining primary_type, check each signal independently regardless of the primary type. A CLI tool that is also open source with API routes still gets all three conditional docs.
48: 
49: | Signal | Conditional Doc |
50: |--------|----------------|
51: | `has_api_routes` is true | Queue API.md |
52: | `is_open_source` is true | Queue CONTRIBUTING.md |
53: | `has_deploy_config` is true | Queue DEPLOYMENT.md |
54: 
55: Present the classification result:
56: ```
57: Project type: {primary_type}
58: Conditional docs queued: {list or "none"}
59: ```
60: </step>
61: 
62: <step name="build_doc_queue">
63: Assemble the complete doc queue from always-on docs plus conditional docs from classify_project.
64: 
65: **Always-on docs (queued for every project, no exceptions):**
66: 1. README
67: 2. ARCHITECTURE
68: 3. GETTING-STARTED
69: 4. DEVELOPMENT
70: 5. TESTING
71: 6. CONFIGURATION
72: 
73: **Conditional docs (add only if signal matched in classify_project):**
74: - API (if `has_api_routes`)
75: - CONTRIBUTING (if `is_open_source`)
76: - DEPLOYMENT (if `has_deploy_config`)
77: 
78: **IMPORTANT: CHANGELOG.md is NEVER queued. The doc queue is built exclusively from the 9 known doc types listed above. Do not derive the queue from `existing_docs` directly — existing_docs is only used in the next step to determine create vs update mode.**
79: 
80: **Doc queue limit:** Maximum 9 docs. Always-on (6) + up to 3 conditional = at most 9.
81: 
82: **CONTRIBUTING.md confirmation (new file only):**
83: 
84: If CONTRIBUTING.md is in the conditional queue AND does NOT appear in the `existing_docs` array from init JSON:
85: 
86: 1. If `--force` is present in `$ARGUMENTS`: skip this check, include CONTRIBUTING.md in the queue.
87: 
88: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
89: 2. Otherwise, use question to confirm:
90: 
91: ```
92: question([{
93:   question: "This project appears to be open source (LICENSE file detected). CONTRIBUTING.md does not exist yet. Would you like to create one?",
94:   header: "Contributing",
95:   multiSelect: false,
96:   options: [
97:     { label: "Yes, create it", description: "Generate CONTRIBUTING.md with project guidelines" },
98:     { label: "No, skip it", description: "This project does not need a CONTRIBUTING.md" }
99:   ]
100: }])
101: ```
102: 
103: If the user selects "No, skip it": remove CONTRIBUTING.md from the doc queue.
104: If CONTRIBUTING.md already exists in `existing_docs`: skip this prompt entirely, include it for update.
105: 
106: **Existing non-canonical docs (review queue):**
107: 
108: After assembling the canonical doc queue above, scan the `existing_docs` array from init JSON for files that do NOT match any canonical path in the queue (neither primary nor fallback path from the resolve_modes table). These are hand-written docs like `docs/api/endpoint-map.md` or `docs/frontend/pages/not-found.md`.
109: 
110: For each non-canonical existing doc found:
111: - Add to a separate `review_queue`
112: - These will be passed to gsd-doc-verifier in the verify_docs step for accuracy checking
113: - If inaccuracies are found, they will be dispatched to gsd-doc-writer in `fix` mode for surgical corrections
114: 
115: If non-canonical docs are found, display them in the queue presentation:
116: 
117: ```
118: Existing docs queued for accuracy review:
119:   - docs/api/endpoint-map.md (hand-written)
120:   - docs/api/README.md (hand-written)
121:   - docs/frontend/pages/not-found.md (hand-written)
122: ```
123: 
124: If none found, omit this section from the queue presentation.
125: 
126: **Documentation gap detection (missing non-canonical docs):**
127: 
128: After assembling the canonical and review queues, analyze the codebase to identify areas that should have documentation but don't. This ensures the command creates complete project documentation, not just the 9 canonical types.
129: 
130: 1. **Scan the codebase for undocumented areas:**
131:    - Use Glob/Grep to discover significant source directories (e.g., `src/components/`, `src/pages/`, `src/services/`, `src/api/`, `lib/`, `routes/`)
132:    - Compare against existing docs: for each major source directory, check if corresponding documentation exists in the docs tree
133:    - Look at the project's existing doc structure for patterns — if the project has `docs/frontend/components/`, `docs/services/`, etc., these indicate the project's documentation conventions
134: 
135: 2. **Identify gaps based on project conventions:**
136:    - If the project has a `docs/` directory with grouped subdirectories, each source module area that has a corresponding docs subdirectory but is missing documentation files represents a gap
137:    - If the project has frontend components/pages but no component docs, flag this
138:    - If the project has service modules but no service docs, flag this
139:    - Skip areas that are already covered by canonical docs (e.g., don't flag missing API docs if `docs/API.md` is already in the canonical queue)
140: 
141: 3. **Present discovered gaps to the user:**
142: 
143: ```
144: question([{
145:   question: "Found {N} documentation gaps in the codebase. Which should be created?",
146:   header: "Doc gaps",
147:   multiSelect: true,
148:   options: [
149:     { label: "{area}", description: "{why it needs docs — e.g., '5 components in src/components/ with no docs'}" },
150:     ...up to 4 options (group related gaps if more than 4)
151:   ]
152: }])
153: ```
154: 
155: 4. For each gap the user selects:
156:    - Add to the generation queue with mode = `"create"`
157:    - Set the output path to match the project's existing doc directory structure
158:    - The gsd-doc-writer will receive a `doc_assignment` with `type: "custom"` and a description of what to document, using the project's source files as content discovery targets
159: 
160: If no gaps are detected, omit this section entirely.
161: 
162: Present the assembled queue to the user before proceeding:
163: 
164: Present the mode resolution table from resolve_modes (shown above), followed by:
165: 
166: ```
167: {If non-canonical docs found, show as a table:}
168: 
169: Existing docs queued for accuracy review:
170: 
171: | Path | Type |
172: |------|------|
173: | {path} | hand-written |
174: | ... | ... |
175: 
176: CHANGELOG.md: excluded (out of scope)
177: ```
178: 
179: The mode resolution table IS the queue presentation — it shows every doc with its resolved path, mode, and source. Do not duplicate the list in a separate format.
180: 
181: Then confirm with question:
182: 
183: ```
184: question([{
185:   question: "Doc queue assembled ({N} docs). Proceed with generation?",
186:   header: "Doc queue",
187:   multiSelect: false,
188:   options: [
189:     { label: "Proceed", description: "Generate all {N} docs in the queue" },
190:     { label: "Abort", description: "Cancel doc generation" }
191:   ]
192: }])
193: ```
194: 
195: If the user selects "Abort": exit the workflow. Otherwise continue to resolve_modes.
196: </step>
197: 
198: <step name="resolve_modes">
199: For each doc in the assembled queue, determine whether to create (new file) or update (existing file).
200: 
201: **Doc type to canonical path mapping (defaults):**
202: 
203: | Type | Default Path | Fallback Path |
204: |------|-------------|---------------|
205: | `readme` | `README.md` | — |
206: | `architecture` | `docs/ARCHITECTURE.md` | `ARCHITECTURE.md` |
207: | `getting_started` | `docs/GETTING-STARTED.md` | `GETTING-STARTED.md` |
208: | `development` | `docs/DEVELOPMENT.md` | `DEVELOPMENT.md` |
209: | `testing` | `docs/TESTING.md` | `TESTING.md` |
210: | `api` | `docs/API.md` | `API.md` |
211: | `configuration` | `docs/CONFIGURATION.md` | `CONFIGURATION.md` |
212: | `deployment` | `docs/DEPLOYMENT.md` | `DEPLOYMENT.md` |
213: | `contributing` | `CONTRIBUTING.md` | — |
214: 
215: **Structure-aware path resolution:**
216: 
217: Before applying the default path table, inspect the project's existing docs directory structure to detect whether the project uses **grouped subdirectories** or **flat files**. This determines how ALL new docs are placed.
218: 
219: **Step 1: Detect the project's docs organization pattern.**
220: 
221: List subdirectories under `docs/` from the `existing_docs` paths. If the project has 2+ subdirectories (e.g., `docs/architecture/`, `docs/api/`, `docs/guides/`, `docs/frontend/`), the project uses a **grouped structure**. If docs are only flat files directly in `docs/` (e.g., `docs/ARCHITECTURE.md`), it uses a **flat structure**.
222: 
223: **Step 2: Resolve paths based on the detected pattern.**
224: 
225: **If GROUPED structure detected:**
226: 
227: Every doc type MUST be placed in an appropriate subdirectory — no doc should be left flat in `docs/` when the project organizes into groups. Use the following resolution logic:
228: 
229: | Type | Subdirectory resolution (in priority order) |
230: |------|----------------------------------------------|
231: | `architecture` | existing `docs/architecture/` → create `docs/architecture/` if not present |
232: | `getting_started` | existing `docs/guides/` → existing `docs/getting-started/` → create `docs/guides/` |
233: | `development` | existing `docs/guides/` → existing `docs/development/` → create `docs/guides/` |
234: | `testing` | existing `docs/testing/` → existing `docs/guides/` → create `docs/testing/` |
235: | `api` | existing `docs/api/` → create `docs/api/` if not present |
236: | `configuration` | existing `docs/configuration/` → existing `docs/guides/` → create `docs/configuration/` |
237: | `deployment` | existing `docs/deployment/` → existing `docs/guides/` → create `docs/deployment/` |
238: 
239: For each type, check the resolution chain left-to-right. Use the first existing subdirectory. If none exist, create the rightmost option.
240: 
241: The filename within the subdirectory should be contextual — e.g., `docs/guides/getting-started.md`, `docs/architecture/overview.md`, `docs/api/reference.md` — rather than `docs/architecture/ARCHITECTURE.md`. Match the naming style of existing files in that subdirectory (lowercase-kebab, UPPERCASE, etc.).
242: 
243: **If FLAT structure detected (or no docs/ directory):**
244: 
245: Use the default path table above as-is (e.g., `docs/ARCHITECTURE.md`, `docs/TESTING.md`).
246: 
247: **Step 3: Store each resolved path and create directories.**
248: 
249: For each doc type, store the resolved path as `resolved_path`. Then create all necessary directories:
250: ```bash
251: mkdir -p {each unique directory from resolved paths}
252: ```
253: 
254: **Mode resolution logic:**
255: 
256: For each doc type in the queue:
257: 1. Check if the `resolved_path` appears in the `existing_docs` array from the init JSON
258: 2. If not found at resolved path, check the default and fallback paths from the table
259: 3. If found at any path: mode = `"update"` — use the Read tool to load the current file content (will be passed as `existing_content` in the doc_assignment block). Use the found path as the output path (do not move existing docs).
260: 4. If not found: mode = `"create"` — no existing content to load. Use the `resolved_path`.
261: 
262: **Ensure docs/ directory exists:**
263: Before proceeding to the next step, create the `docs/` directory and any resolved subdirectories if they do not exist:
264: ```bash
265: mkdir -p docs/
266: ```
267: 
268: **Output a mode resolution table:**
269: 
270: Present a table showing the resolved path, mode, and source for every doc in the queue:
271: 
272: ```
273: Mode resolution:
274: 
275: | Doc | Resolved Path | Mode | Source |
276: |-----|---------------|------|--------|
277: | readme | README.md | update | found at README.md |
278: | architecture | docs/architecture/overview.md | create | new directory |
279: | getting_started | docs/guides/getting-started.md | update | found, hand-written |
280: | development | docs/guides/development.md | create | matched docs/guides/ |
281: | testing | docs/guides/testing.md | create | matched docs/guides/ |
282: | configuration | docs/guides/configuration.md | create | matched docs/guides/ |
283: | api | docs/api/reference.md | create | new directory |
284: | deployment | docs/guides/deployment.md | update | found, hand-written |
285: ```
286: 
287: This table MUST be shown to the user — it is the primary confirmation of where files will be written and whether existing files will be updated. It appears as part of the queue presentation BEFORE the question confirmation.
288: 
289: Track the resolved mode and file path for each queued doc. For update-mode docs, store the loaded file content — it will be passed to the agent in the next steps.
290: 
291: **CRITICAL: Persist the work manifest.**
292: 
293: After resolve_modes completes, write ALL work items to `.planning/tmp/docs-work-manifest.json`. This is the single source of truth for every subsequent step — the orchestrator MUST read this file at each step instead of relying on memory.
294: 
295: ```bash
296: mkdir -p .planning/tmp
297: ```
298: 
299: Write the manifest using the Write tool:
300: 
301: ```json
302: {
303:   "canonical_queue": [
304:     {
305:       "type": "readme",
306:       "resolved_path": "README.md",
307:       "mode": "create|update|supplement",
308:       "preservation_mode": null,
309:       "wave": 1,
310:       "status": "pending"
311:     }
312:   ],
313:   "review_queue": [
314:     {
315:       "path": "docs/frontend/components/button.md",
316:       "type": "hand-written",
317:       "status": "pending_review"
318:     }
319:   ],
320:   "gap_queue": [
321:     {
322:       "description": "Frontend components in src/components/",
323:       "output_path": "docs/frontend/components/overview.md",
324:       "status": "pending"
325:     }
326:   ],
327:   "created_at": "{ISO timestamp}"
328: }
329: ```
330: 
331: Every subsequent step (dispatch, collect, verify, fix_loop, report) MUST begin by reading `.planning/tmp/docs-work-manifest.json` and update the `status` field for items it processes. This prevents the orchestrator from "forgetting" any work item across the multi-step workflow.
332: </step>
333: 
334: <step name="preservation_check">
335: Check for hand-written docs in the queue and gather user decisions before dispatch.
336: 
337: **Skip conditions (check in order):**
338: 
339: 1. If `--force` is present in `$ARGUMENTS`: treat all docs as mode: regenerate, skip to detect_runtime_capabilities.
340: 2. If `--verify-only` is present in `$ARGUMENTS`: skip to verify_only_report (do not continue to detect_runtime_capabilities).
341: 3. If no docs in the queue have `has_gsd_marker: false` in the `existing_docs` array: skip to detect_runtime_capabilities.
342: 
343: **For each queued doc where `has_gsd_marker` is false (hand-written doc detected):**
344: 
345: Present the following choice using `question` if available, or inline prompt otherwise:
346: 
347: ```
348: {filename} appears to be hand-written (no GSD marker found).
349: 
350: How should this file be handled?
351:   [1] preserve    -- Skip entirely. Leave unchanged.
352:   [2] supplement  -- Append only missing sections. Existing content untouched.
353:   [3] regenerate  -- Overwrite with a fresh GSD-generated doc.
354: ```
355: 
356: Record each decision. Update the doc queue:
357: - `preserve` decisions: remove the doc from the queue entirely
358: - `supplement` decisions: set mode to `supplement` in the doc_assignment block; include `existing_content` (full file content)
359: - `regenerate` decisions: set mode to `create` (treat as a fresh write)
360: 
361: **Fallback when question is unavailable:** Default all hand-written docs to `preserve` (safest default). Display message:
362: 
363: ```
364: question unavailable — hand-written docs preserved by default.
365: Use --force to regenerate all docs, or re-run in Claude Code to get per-file prompts.
366: ```
367: 
368: After all decisions recorded, continue to detect_runtime_capabilities.
369: </step>
370: 
371: <!-- If Task tool is unavailable at runtime, skip dispatch/collect waves and use sequential_generation instead. -->
372: 
373: <step name="dispatch_wave_1" condition="Task tool is available">
374: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — use `canonical_queue` items with `wave: 1` for this step.
375: 
376: Spawn 3 parallel gsd-doc-writer agents for Wave 1 docs: README, ARCHITECTURE, CONFIGURATION.
377: 
378: These are foundational docs with no cross-references needed, making them ideal for parallel generation.
379: 
380: Use `run_in_background=true` for all three to enable parallel execution.
381: 
382: **Agent 1: README**
383: 
384: ```
385: Agent(
386:   subagent_type="gsd-doc-writer",
387:   model="{doc_writer_model}",
388:   run_in_background=true,
389:   description="Generate README.md for target project",
390:   prompt="<doc_assignment>
391: type: readme
392: mode: {create|update|supplement}
393: preservation_mode: {preserve|supplement|regenerate|null}
394: project_context: {INIT JSON}
395: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
396: </doc_assignment>
397: 
398: {AGENT_SKILLS}
399: 
400: Write the doc file directly. Return confirmation only — do not return doc content."
401: )
402: ```
403: 
404: **Agent 2: ARCHITECTURE**
405: 
406: ```
407: Agent(
408:   subagent_type="gsd-doc-writer",
409:   model="{doc_writer_model}",
410:   run_in_background=true,
411:   description="Generate ARCHITECTURE.md for target project",
412:   prompt="<doc_assignment>
413: type: architecture
414: mode: {create|update|supplement}
415: preservation_mode: {preserve|supplement|regenerate|null}
416: project_context: {INIT JSON}
417: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
418: </doc_assignment>
419: 
420: {AGENT_SKILLS}
421: 
422: Write the doc file directly. Return confirmation only — do not return doc content."
423: )
424: ```
425: 
426: **Agent 3: CONFIGURATION**
427: 
428: ```
429: Agent(
430:   subagent_type="gsd-doc-writer",
431:   model="{doc_writer_model}",
432:   run_in_background=true,
433:   description="Generate CONFIGURATION.md for target project",
434:   prompt="<doc_assignment>
435: type: configuration
436: mode: {create|update|supplement}
437: preservation_mode: {preserve|supplement|regenerate|null}
438: project_context: {INIT JSON}
439: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
440: note: Apply VERIFY markers to any infrastructure claim not discoverable from the repository.
441: </doc_assignment>
442: 
443: {AGENT_SKILLS}
444: 
445: Write the doc file directly. Return confirmation only — do not return doc content."
446: )
447: ```
448: 
449: **CRITICAL:** Agent prompts must contain ONLY the `<doc_assignment>` block, the `${AGENT_SKILLS}` variable, and the return instruction. Do not include project planning context, workflow prose, or any internal tooling references in agent prompts.
450: 
451: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all Wave 1 Agent() calls above with `run_in_background=true`, do NOT generate any documentation independently while the subagents are active. Wait for all Wave 1 agents to complete before proceeding. This prevents duplicate work and wasted context.
452: 
453: Continue to collect_wave_1.
454: </step>
455: 
456: <step name="collect_wave_1">
457: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — update `status` to `"completed"` or `"failed"` for each Wave 1 item after collection. Write the updated manifest back to disk.
458: 
459: Wait for all 3 Wave 1 agents to complete using the TaskOutput tool.
460: 
461: Call TaskOutput for all 3 agents in parallel (single message with 3 TaskOutput calls):
462: 
463: ```
464: TaskOutput tool:
465:   task_id: "{task_id from README agent result}"
466:   block: true
467:   timeout: 300000
468: 
469: TaskOutput tool:
470:   task_id: "{task_id from ARCHITECTURE agent result}"
471:   block: true
472:   timeout: 300000
473: 
474: TaskOutput tool:
475:   task_id: "{task_id from CONFIGURATION agent result}"
476:   block: true
477:   timeout: 300000
478: ```
479: 
480: **Expected confirmation format from each agent:**
481: ```
482: ## Doc Generation Complete
483: **Type:** {type}
484: **Mode:** {mode}
485: **File written:** `{path}` ({N} lines)
486: Ready for orchestrator summary.
487: ```
488: 
489: **After collection, verify the Wave 1 files exist on disk** using the `resolved_path` from each manifest entry:
490: ```bash
491: ls -la {resolved_path_1} {resolved_path_2} {resolved_path_3} 2>/dev/null
492: ```
493: 
494: If any agent failed or its file is missing:
495: - Note the failure
496: - Continue with the successful docs (do NOT halt Wave 2 for a single failure)
497: - The missing doc will be noted in the final report
498: 
499: Continue to dispatch_wave_2.
500: </step>
501: 
502: <step name="dispatch_wave_2" condition="Task tool is available">
503: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — use `canonical_queue` items with `wave: 2` for this step.
504: 
505: Spawn agents for all queued Wave 2 docs: GETTING-STARTED, DEVELOPMENT, TESTING, and any conditional docs (API, DEPLOYMENT, CONTRIBUTING) that were queued in build_doc_queue.
506: 
507: Wave 2 agents can reference Wave 1 outputs for cross-referencing — include the `wave_1_outputs` field in each doc_assignment block.
508: 
509: Use `run_in_background=true` for all Wave 2 agents to enable parallel execution within the wave.
510: 
511: **Agent: GETTING-STARTED**
512: 
513: ```
514: Agent(
515:   subagent_type="gsd-doc-writer",
516:   model="{doc_writer_model}",
517:   run_in_background=true,
518:   description="Generate GETTING-STARTED.md for target project",
519:   prompt="<doc_assignment>
520: type: getting_started
521: mode: {create|update|supplement}
522: preservation_mode: {preserve|supplement|regenerate|null}
523: project_context: {INIT JSON}
524: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
525: wave_1_outputs:
526:   - README.md
527:   - docs/ARCHITECTURE.md
528:   - docs/CONFIGURATION.md
529: </doc_assignment>
530: 
531: {AGENT_SKILLS}
532: 
533: Write the doc file directly. Return confirmation only — do not return doc content."
534: )
535: ```
536: 
537: **Agent: DEVELOPMENT**
538: 
539: ```
540: Agent(
541:   subagent_type="gsd-doc-writer",
542:   model="{doc_writer_model}",
543:   run_in_background=true,
544:   description="Generate DEVELOPMENT.md for target project",
545:   prompt="<doc_assignment>
546: type: development
547: mode: {create|update|supplement}
548: preservation_mode: {preserve|supplement|regenerate|null}
549: project_context: {INIT JSON}
550: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
551: wave_1_outputs:
552:   - README.md
553:   - docs/ARCHITECTURE.md
554:   - docs/CONFIGURATION.md
555: </doc_assignment>
556: 
557: {AGENT_SKILLS}
558: 
559: Write the doc file directly. Return confirmation only — do not return doc content."
560: )
561: ```
562: 
563: **Agent: TESTING**
564: 
565: ```
566: Agent(
567:   subagent_type="gsd-doc-writer",
568:   model="{doc_writer_model}",
569:   run_in_background=true,
570:   description="Generate TESTING.md for target project",
571:   prompt="<doc_assignment>
572: type: testing
573: mode: {create|update|supplement}
574: preservation_mode: {preserve|supplement|regenerate|null}
575: project_context: {INIT JSON}
576: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
577: wave_1_outputs:
578:   - README.md
579:   - docs/ARCHITECTURE.md
580:   - docs/CONFIGURATION.md
581: </doc_assignment>
582: 
583: {AGENT_SKILLS}
584: 
585: Write the doc file directly. Return confirmation only — do not return doc content."
586: )
587: ```
588: 
589: **Conditional Agent: API** (only if `has_api_routes` was true — spawn only if API.md was queued)
590: 
591: ```
592: Agent(
593:   subagent_type="gsd-doc-writer",
594:   model="{doc_writer_model}",
595:   run_in_background=true,
596:   description="Generate API.md for target project",
597:   prompt="<doc_assignment>
598: type: api
599: mode: {create|update|supplement}
600: preservation_mode: {preserve|supplement|regenerate|null}
601: project_context: {INIT JSON}
602: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
603: wave_1_outputs:
604:   - README.md
605:   - docs/ARCHITECTURE.md
606:   - docs/CONFIGURATION.md
607: </doc_assignment>
608: 
609: {AGENT_SKILLS}
610: 
611: Write the doc file directly. Return confirmation only — do not return doc content."
612: )
613: ```
614: 
615: **Conditional Agent: DEPLOYMENT** (only if `has_deploy_config` was true — spawn only if DEPLOYMENT.md was queued)
616: 
617: ```
618: Agent(
619:   subagent_type="gsd-doc-writer",
620:   model="{doc_writer_model}",
621:   run_in_background=true,
622:   description="Generate DEPLOYMENT.md for target project",
623:   prompt="<doc_assignment>
624: type: deployment
625: mode: {create|update|supplement}
626: preservation_mode: {preserve|supplement|regenerate|null}
627: project_context: {INIT JSON}
628: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
629: note: Apply VERIFY markers to any infrastructure claim not discoverable from the repository.
630: wave_1_outputs:
631:   - README.md
632:   - docs/ARCHITECTURE.md
633:   - docs/CONFIGURATION.md
634: </doc_assignment>
635: 
636: {AGENT_SKILLS}
637: 
638: Write the doc file directly. Return confirmation only — do not return doc content."
639: )
640: ```
641: 
642: **Conditional Agent: CONTRIBUTING** (only if `is_open_source` was true — spawn only if CONTRIBUTING.md was queued)
643: 
644: ```
645: Agent(
646:   subagent_type="gsd-doc-writer",
647:   model="{doc_writer_model}",
648:   run_in_background=true,
649:   description="Generate CONTRIBUTING.md for target project",
650:   prompt="<doc_assignment>
651: type: contributing
652: mode: {create|update|supplement}
653: preservation_mode: {preserve|supplement|regenerate|null}
654: project_context: {INIT JSON}
655: {existing_content: | (include full file content here if mode is update or supplement, else omit this line)}
656: wave_1_outputs:
657:   - README.md
658:   - docs/ARCHITECTURE.md
659:   - docs/CONFIGURATION.md
660: </doc_assignment>
661: 
662: {AGENT_SKILLS}
663: 
664: Write the doc file directly. Return confirmation only — do not return doc content."
665: )
666: ```
667: 
668: **CRITICAL:** Agent prompts must contain ONLY the `<doc_assignment>` block, the `${AGENT_SKILLS}` variable, and the return instruction. Do not include project planning context, workflow prose, or any internal tooling references in agent prompts.
669: 
670: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all Wave 2 Agent() calls above with `run_in_background=true`, do NOT generate any documentation independently while the subagents are active. Wait for all Wave 2 agents to complete before proceeding. This prevents duplicate work and wasted context.
671: 
672: Continue to collect_wave_2.
673: </step>
674: 
675: <step name="collect_wave_2">
676: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — update `status` to `"completed"` or `"failed"` for each Wave 2 item after collection. Write the updated manifest back to disk.
677: 
678: Wait for all Wave 2 agents to complete using the TaskOutput tool.
679: 
680: Call TaskOutput for all Wave 2 agents in parallel (single message with N TaskOutput calls — one per spawned Wave 2 agent):
681: 
682: ```
683: TaskOutput tool:
684:   task_id: "{task_id from GETTING-STARTED agent result}"
685:   block: true
686:   timeout: 300000
687: 
688: TaskOutput tool:
689:   task_id: "{task_id from DEVELOPMENT agent result}"
690:   block: true
691:   timeout: 300000
692: 
693: TaskOutput tool:
694:   task_id: "{task_id from TESTING agent result}"
695:   block: true
696:   timeout: 300000
697: 
698: # Add one TaskOutput call per conditional agent spawned (API, DEPLOYMENT, CONTRIBUTING)
699: ```
700: 
701: **After collection, verify all Wave 2 files exist on disk** using the `resolved_path` from each manifest entry:
702: ```bash
703: ls -la {resolved_path for each wave 2 item} 2>/dev/null
704: ```
705: 
706: If any agent failed or its file is missing, note the failure and continue. Missing docs will be reported in the final report.
707: 
708: Continue to dispatch_monorepo_packages (if monorepo_workspaces is non-empty) or commit_docs.
709: </step>
710: 
711: <step name="dispatch_monorepo_packages" condition="monorepo_workspaces is non-empty">
712: After Wave 2 collection, generate per-package READMEs for each monorepo workspace.
713: 
714: **Condition:** Only run this step if `monorepo_workspaces` from the init JSON is non-empty.
715: 
716: **Resolve workspace packages from glob patterns:**
717: 
718: ```bash
719: # Expand workspace globs to actual package directories
720: for pattern in {monorepo_workspaces}; do
721:   ls -d $pattern 2>/dev/null
722: done
723: ```
724: 
725: **For each resolved directory that contains a `package.json`:**
726: 
727: Determine mode:
728: - If `{package_dir}/README.md` exists: mode = `update`, read existing content
729: - Else: mode = `create`
730: 
731: Spawn a `gsd-doc-writer` agent with `run_in_background=true`:
732: 
733: ```
734: Agent(
735:   subagent_type="gsd-doc-writer",
736:   model="{doc_writer_model}",
737:   run_in_background=true,
738:   description="Generate per-package README for {package_dir}",
739:   prompt="<doc_assignment>
740: type: readme
741: mode: {create|update}
742: scope: per_package
743: package_dir: {absolute path to package directory}
744: project_context: {INIT JSON with project_root set to package directory}
745: {existing_content: | (include full README.md content here if mode is update, else omit)}
746: </doc_assignment>
747: 
748: {AGENT_SKILLS}
749: 
750: Write {package_dir}/README.md directly. Return confirmation only — do not return doc content."
751: )
752: ```
753: 
754: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all per-package Agent() calls above with `run_in_background=true`, do NOT generate any package READMEs independently while the subagents are active. Wait for all agents to complete via TaskOutput before proceeding. This prevents duplicate work and wasted context.
755: 
756: Collect confirmations via TaskOutput for all package agents. Note failures in the final report.
757: 
758: **Fallback when Task tool is unavailable:** Generate per-package READMEs sequentially inline after the `sequential_generation` step. For each package directory with a `package.json`, construct the equivalent `doc_assignment` block and generate the README following gsd-doc-writer instructions.
759: 
760: Continue to commit_docs.
761: </step>
762: 
763: <step name="sequential_generation" condition="Task tool is NOT available (e.g. Antigravity, Gemini CLI, Codex, Copilot)">
764: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — use `canonical_queue` items for generation order. Update `status` after each doc is generated. Write the updated manifest back to disk after all docs are complete.
765: 
766: When the `Task` tool is unavailable, generate docs sequentially in the current context. This step replaces dispatch_wave_1, collect_wave_1, dispatch_wave_2, and collect_wave_2.
767: 
768: **IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool. Use only file system tools (Read, Bash, Write, Grep, Glob, or equivalent tools available in your runtime).
769: 
770: Read `agents/gsd-doc-writer.md` instructions once before beginning. Follow the create_mode or update_mode instructions from that agent for each doc, using the same doc_assignment fields as the parallel path.
771: 
772: **Wave 1 (sequential — complete all three before starting Wave 2):**
773: 
774: For each Wave 1 doc, construct the equivalent doc_assignment block and generate the file inline:
775: 
776: 1. **README** — mode from resolve_modes; for update/supplement mode, include existing_content
777:    - Construct doc_assignment: `type: readme`, `mode: {create|update|supplement}`, `preservation_mode: {value|null}`, `project_context: {INIT JSON}`, `existing_content:` (if update/supplement)
778:    - Explore the codebase (Read, Grep, Glob, Bash) following gsd-doc-writer create_mode / update_mode instructions
779:    - Write the file to the resolved path (README.md)
780: 
781: 2. **ARCHITECTURE** — mode from resolve_modes; for update/supplement mode, include existing_content
782:    - Construct doc_assignment: `type: architecture`, `mode: {create|update|supplement}`, `preservation_mode: {value|null}`, `project_context: {INIT JSON}`, `existing_content:` (if update/supplement)
783:    - Explore the codebase following gsd-doc-writer instructions
784:    - Write the file to the resolved path (docs/ARCHITECTURE.md, or ARCHITECTURE.md if found at root as fallback)
785: 
786: 3. **CONFIGURATION** — mode from resolve_modes; for update/supplement mode, include existing_content
787:    - Construct doc_assignment: `type: configuration`, `mode: {create|update|supplement}`, `preservation_mode: {value|null}`, `project_context: {INIT JSON}`, `existing_content:` (if update/supplement)
788:    - Apply VERIFY markers to any infrastructure claim not discoverable from the repository
789:    - Explore the codebase following gsd-doc-writer instructions
790:    - Write the file to the resolved path (docs/CONFIGURATION.md, or CONFIGURATION.md if found at root as fallback)
791: 
792: **Wave 2 (sequential — begin only after all Wave 1 docs are written):**
793: 
794: Wave 2 docs can reference Wave 1 outputs since they are already written. Include `wave_1_outputs` in each doc_assignment.
795: 
796: 4. **GETTING-STARTED** — mode from resolve_modes; include wave_1_outputs: [README.md, docs/ARCHITECTURE.md, docs/CONFIGURATION.md]
797: 5. **DEVELOPMENT** — mode from resolve_modes; include wave_1_outputs
798: 6. **TESTING** — mode from resolve_modes; include wave_1_outputs
799: 7. **API** (only if queued) — mode from resolve_modes; include wave_1_outputs
800: 8. **DEPLOYMENT** (only if queued) — Apply VERIFY markers to any infrastructure claim not discoverable from the repository; include wave_1_outputs
801: 9. **CONTRIBUTING** (only if queued) — mode from resolve_modes; include wave_1_outputs
802: 
803: **Monorepo per-package READMEs (only if `monorepo_workspaces` is non-empty):**
804: 
805: After all 9 root-level docs are written, generate per-package READMEs sequentially:
806: 
807: For each resolved package directory (from workspace glob expansion) that contains a `package.json`:
808: - Determine mode: if `{package_dir}/README.md` exists, mode = `update`; else mode = `create`
809: - Construct doc_assignment: `type: readme`, `mode: {create|update}`, `scope: per_package`, `package_dir: {absolute path}`, `project_context: {INIT JSON with project_root set to package directory}`, `existing_content:` (if update)
810: - Follow gsd-doc-writer instructions for per_package scope
811: - Write the file to `{package_dir}/README.md`
812: 
813: Continue to verify_docs.
814: </step>
815: 
816: <step name="verify_docs">
817: Verify factual claims in ALL docs — both canonical (generated) and non-canonical (existing hand-written) — against the live codebase.
818: 
819: **CRITICAL: Read the work manifest first.**
820: 
821: ```
822: Read .planning/tmp/docs-work-manifest.json
823: ```
824: 
825: Extract `canonical_queue` (items with `status: "completed"`) and `review_queue` (items with `status: "pending_review"`). Both queues are verified in this step.
826: 
827: **Skip condition:** If `--verify-only` is present in `$ARGUMENTS`, this step was already handled by `verify_only_report` (early exit). Skip.
828: 
829: **Phase 1: Verify canonical docs (generated/updated docs)**
830: 
831: For each doc in `canonical_queue` that was successfully written to disk:
832: 
833: 1. Spawn the `gsd-doc-verifier` agent (or invoke sequentially if Task tool is unavailable) with a `<verify_assignment>` block:
834:    ```xml
835:    <verify_assignment>
836:    doc_path: {relative path to the doc file, e.g. README.md}
837:    project_root: {project_root from init JSON}
838:    </verify_assignment>
839:    ```
840: 
841: 2. After the verifier completes, read the result JSON from `.planning/tmp/verify-{doc_filename}.json`.
842: 
843: 3. Update the manifest: set `status: "verified"` for each canonical doc processed.
844: 
845: **Phase 2: Verify non-canonical docs (existing hand-written docs)**
846: 
847: This is NOT optional. Every doc in `review_queue` MUST be verified.
848: 
849: For each doc in `review_queue` from the manifest:
850: 
851: 1. Spawn the `gsd-doc-verifier` agent with the same `<verify_assignment>` block as above.
852: 2. Read the result JSON from `.planning/tmp/verify-{doc_filename}.json`.
853: 3. Update the manifest: set `status: "verified"` for each review_queue doc processed.
854: 
855: Non-canonical docs with failures ARE eligible for the fix_loop. When a non-canonical doc has `claims_failed > 0`, dispatch it to gsd-doc-writer in `fix` mode with the failures array — the writer's fix mode does surgical corrections on specific lines regardless of doc type (no template needed). The writer MUST NOT restructure, rephrase, or reformat any content beyond the failing claims.
856: 
857: **Phase 3: Present combined verification summary**
858: 
859: Collect ALL results (canonical + non-canonical) into a single `verification_results` array:
860: 
861: ```
862: Verification results:
863: 
864: Canonical docs (generated):
865: 
866: | Doc                    | Claims | Passed | Failed |
867: |------------------------|--------|--------|--------|
868: | README.md              | 12     | 10     | 2      |
869: | docs/architecture/overview.md | 8 | 8   | 0      |
870: 
871: Existing docs (reviewed):
872: 
873: | Doc                    | Claims | Passed | Failed |
874: |------------------------|--------|--------|--------|
875: | docs/frontend/components/button.md | 5 | 4 | 1   |
876: | docs/services/api.md   | 8      | 8      | 0      |
877: 
878: Total: {total_checked} claims checked, {total_failed} failures
879: ```
880: 
881: Write the updated manifest back to disk.
882: 
883: If all docs have `claims_failed === 0`: skip fix_loop, continue to scan_for_secrets.
884: If any doc (canonical OR non-canonical) has `claims_failed > 0`: continue to fix_loop.
885: </step>
886: 
887: <step name="fix_loop">
888: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — identify ALL docs (canonical AND non-canonical) with `claims_failed > 0` from the verification results in `.planning/tmp/verify-*.json`. Both queues are eligible for fixes.
889: 
890: Correct flagged inaccuracies by re-sending failing docs to the doc-writer in fix mode. Per D-06, max 2 iterations. Per D-05, halt immediately on regression.
891: 
892: **Skip condition:** If all docs passed verification (no failures), skip this step.
893: 
894: **Iteration tracking:**
895: - `MAX_FIX_ITERATIONS = 2`
896: - `iteration = 0`
897: - `previous_passed_docs` = set of doc_paths where claims_failed === 0 after initial verification
898: 
899: **For each iteration (while iteration < MAX_FIX_ITERATIONS and there are docs with failures):**
900: 
901: 1. For each doc with `claims_failed > 0` in the latest verification_results:
902:    a. Read the current file content from disk.
903:    b. Spawn `gsd-doc-writer` agent (or invoke sequentially) with a fix assignment:
904:       ```xml
905:       <doc_assignment>
906:       type: {original doc type from the queue, e.g. readme}
907:       mode: fix
908:       doc_path: {relative path}
909:       project_context: {INIT JSON}
910:       existing_content: {current file content read from disk}
911:       failures:
912:         - line: {line}
913:           claim: "{claim}"
914:           expected: "{expected}"
915:           actual: "{actual}"
916:       </doc_assignment>
917:       ```
918:    c. One agent spawn per doc with failures. Do not batch multiple docs into one spawn.
919: 
920: 2. After all fix agents complete, re-verify ALL docs (not just the ones that were fixed):
921:    - Re-run the same verification process as verify_docs step.
922:    - Read updated result JSONs from `.planning/tmp/verify-{doc_filename}.json`.
923: 
924: 3. **Regression detection (D-05):**
925:    For each doc in the new verification_results:
926:    - If this doc was in `previous_passed_docs` (passed in the prior round) AND now has `claims_failed > 0`, this is a REGRESSION.
927:    - If regression detected: HALT the loop immediately. Present:
928:      ```
929:      REGRESSION DETECTED -- halting fix loop.
930: 
931:      {doc_path} previously passed verification but now has {claims_failed} failures after fix iteration {iteration + 1}.
932: 
933:      This means the fix introduced new errors. Remaining failures require manual review.
934:      ```
935:      Continue to scan_for_secrets (do not attempt further fixes).
936: 
937: 4. Update `previous_passed_docs` with docs that now pass.
938: 5. Increment `iteration`.
939: 
940: **After loop exhaustion (iteration === MAX_FIX_ITERATIONS and failures remain):**
941: 
942: Present remaining failures:
943: ```
944: Fix loop completed ({MAX_FIX_ITERATIONS} iterations). Remaining failures:
945: 
946: | Doc               | Failed Claims |
947: |-------------------|---------------|
948: | {doc_path}        | {count}       |
949: 
950: These failures require manual correction. Review the verification output in .planning/tmp/verify-*.json for details.
951: ```
952: 
953: Continue to scan_for_secrets.
954: </step>
955: 
956: <step name="verify_only_report">
957: **Reached when `--verify-only` is present in `$ARGUMENTS`.** This is an early-exit step — do not proceed to dispatch, generation, commit, or report steps after this step.
958: 
959: Invoke the gsd-doc-verifier agent in read-only mode for each file in `existing_docs` from the init JSON:
960: 
961: 1. For each doc in `existing_docs`:
962:    a. Spawn `gsd-doc-verifier` (or invoke sequentially if Task tool is unavailable) with:
963:       ```xml
964:       <verify_assignment>
965:       doc_path: {doc.path}
966:       project_root: {project_root from init JSON}
967:       </verify_assignment>
968:       ```
969:    b. Read the result JSON from `.planning/tmp/verify-{doc_filename}.json`.
970: 
971: 2. Also count VERIFY markers in each doc: grep for `<!-- VERIFY:` in the file content.
972: 
973: Present a combined summary table:
974: 
975: ```
976: --verify-only audit:
977: 
978: | File                     | Claims Checked | Passed | Failed | VERIFY Markers |
979: |--------------------------|----------------|--------|--------|----------------|
980: | README.md                | 12             | 10     | 2      | 0              |
981: | docs/ARCHITECTURE.md     | 8              | 8      | 0      | 0              |
982: | docs/CONFIGURATION.md    | 5              | 3      | 2      | 5              |
983: | ...                 | ...            | ...    | ...    | ...            |
984: 
985: Total: {total_checked} claims checked, {total_failed} failures, {total_markers} VERIFY markers requiring manual review
986: ```
987: 
988: If any failures exist, show details:
989: ```
990: Failed claims:
991:   README.md:34 - "src/cli/index.ts" (expected: file exists, actual: file not found)
992:   docs/CONFIGURATION.md:12 - "npm run deploy" (expected: script in package.json, actual: script not found)
993: ```
994: 
995: Display note:
996: ```
997: To fix failures automatically: /gsd-docs-update (runs generation + fix loop)
998: To regenerate all docs from scratch: /gsd-docs-update --force
999: ```
1000: 
1001: Clean up temp files: remove `.planning/tmp/verify-*.json` files.
1002: 
1003: End workflow — do not proceed to any dispatch, commit, or report steps.
1004: </step>
1005: 
1006: <step name="scan_for_secrets">
1007: CRITICAL SECURITY CHECK: Scan all generated/updated doc files for accidentally leaked secrets before committing. Per D-07, this runs once after the fix loop completes, before commit_docs.
1008: 
1009: Build the file list from the generation queue -- include all docs that were written to disk (created, updated, supplemented, or fixed). Do not hardcode a static list; use the actual list of files that were generated or modified.
1010: 
1011: Run secret pattern detection:
1012: 
1013: ```bash
1014: # Check for common API key patterns in generated docs
1015: grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' \
1016:   {space-separated list of generated doc files} 2>/dev/null \
1017:   && SECRETS_FOUND=true || SECRETS_FOUND=false
1018: ```
1019: 
1020: **If SECRETS_FOUND=true:**
1021: 
1022: ```
1023: SECURITY ALERT: Potential secrets detected in generated documentation!
1024: 
1025: Found patterns that look like API keys or tokens in:
1026: {show grep output}
1027: 
1028: This would expose credentials if committed.
1029: 
1030: Action required:
1031: 1. Review the flagged lines above
1032: 2. Remove any real secrets from the doc files
1033: 3. Re-run /gsd-docs-update to regenerate clean docs
1034: ```
1035: 
1036: Then confirm with question:
1037: 
1038: ```
1039: question([{
1040:   question: "Potential secrets detected in generated docs. How would you like to proceed?",
1041:   header: "Security",
1042:   multiSelect: false,
1043:   options: [
1044:     { label: "Safe to proceed", description: "I've reviewed the flagged lines — no real secrets, commit the docs" },
1045:     { label: "Abort commit", description: "Skip committing — I'll clean up the docs first" }
1046:   ]
1047: }])
1048: ```
1049: 
1050: If the user selects "Abort commit": skip commit_docs and continue to report. If "Safe to proceed": continue to commit_docs.
1051: 
1052: **If SECRETS_FOUND=false:**
1053: 
1054: Continue to commit_docs.
1055: </step>
1056: 
1057: <step name="commit_docs">
1058: Only run this step if `commit_docs` is `true` from the init JSON. If `commit_docs` is false, skip to report.
1059: 
1060: Assemble the list of files that were actually generated (do not include files that failed or were skipped):
1061: 
1062: ```bash
1063: gsd-sdk query commit "docs: generate project documentation" \
1064:   --files README.md docs/ARCHITECTURE.md docs/CONFIGURATION.md docs/GETTING-STARTED.md docs/DEVELOPMENT.md docs/TESTING.md
1065: # Append any conditional docs that were generated:
1066: # --files ... docs/API.md docs/DEPLOYMENT.md CONTRIBUTING.md
1067: # Append per-package READMEs if monorepo dispatch ran:
1068: # --files ... packages/core/README.md packages/cli/README.md
1069: ```
1070: 
1071: Only include files that were successfully written to disk. Do not include failed or skipped docs.
1072: 
1073: Continue to report.
1074: </step>
1075: 
1076: <step name="report">
1077: **Read the work manifest first:** `Read .planning/tmp/docs-work-manifest.json` — use the manifest to compile the complete report covering all canonical docs, review_queue results, and gap_queue results. The manifest is the source of truth for what was processed.
1078: 
1079: Present a completion summary to the user.
1080: 
1081: **Summary format:**
1082: 
1083: ```
1084: Documentation generation complete.
1085: 
1086: Project type: {primary_type}
1087: 
1088: Generated docs:
1089: | File                     | Mode   | Lines |
1090: |--------------------------|--------|-------|
1091: | README.md                | create | 87    |
1092: | docs/ARCHITECTURE.md     | update | 124   |
1093: | docs/GETTING-STARTED.md  | create | 63    |
1094: | docs/DEVELOPMENT.md      | create | 71    |
1095: | docs/TESTING.md          | create | 58    |
1096: | docs/CONFIGURATION.md    | create | 45    |
1097: [conditional docs if generated]
1098: 
1099: {If monorepo per-package READMEs were generated:}
1100: Per-package READMEs:
1101: | Package             | Mode   | Lines |
1102: |---------------------|--------|-------|
1103: | packages/core       | create | 42    |
1104: | packages/cli        | create | 38    |
1105: 
1106: {If any docs failed or were skipped:}
1107: Skipped / failed:
1108:   - docs/API.md: agent did not complete
1109: 
1110: {If preservation_check ran:}
1111: Preservation decisions:
1112:   - {filename}: {preserve|supplement|regenerate}
1113: 
1114: {If docs/DEPLOYMENT.md or docs/CONFIGURATION.md were generated:}
1115: VERIFY markers: {N} markers placed in docs/DEPLOYMENT.md and/or docs/CONFIGURATION.md for infrastructure claims that require manual verification.
1116: 
1117: {If review_queue was non-empty:}
1118: 
1119: Existing doc accuracy review:
1120: 
1121: | Doc | Claims Checked | Passed | Failed | Fixed |
1122: |-----|----------------|--------|--------|-------|
1123: | docs/api/endpoint-map.md | 5 | 4 | 1 | 1 |
1124: 
1125: {For any remaining unfixed failures after fix_loop:}
1126: Remaining inaccuracies could not be auto-corrected — manual review recommended for flagged items above.
1127: 
1128: {If commit_docs was true:}
1129: All generated files committed.
1130: ```
1131: 
1132: Remind the user they can fact-check generated docs:
1133: 
1134: ```
1135: Run `/gsd-docs-update --verify-only` to fact-check generated docs against the codebase.
1136: ```
1137: 
1138: End workflow.
1139: </step>
1140: 
1141: </process>
1142: 
1143: <success_criteria>
1144: - [ ] docs-init JSON loaded and all fields extracted
1145: - [ ] Project type correctly classified from project_type signals
1146: - [ ] Doc queue contains all always-on docs plus only the conditional docs matching project signals
1147: - [ ] CHANGELOG.md was NOT generated or queued
1148: - [ ] Each doc was generated in correct mode (create for new, update for existing)
1149: - [ ] Wave 1 docs (README, ARCHITECTURE, CONFIGURATION) completed before Wave 2 started
1150: - [ ] Generated docs contain zero GSD methodology content
1151: - [ ] docs/DEPLOYMENT.md and docs/CONFIGURATION.md use VERIFY markers for undiscoverable claims (if generated)
1152: - [ ] All generated files committed (if commit_docs is true)
1153: - [ ] Hand-written docs (no GSD marker) prompted for preserve/supplement/regenerate before dispatch (unless --force)
1154: - [ ] --force flag skipped preservation prompts and regenerated all docs
1155: - [ ] --verify-only flag reported doc status without generating files
1156: - [ ] Per-package READMEs generated for monorepo workspaces (if applicable)
1157: - [ ] verify_docs step checked all generated docs against the live codebase
1158: - [ ] fix_loop ran at most 2 iterations and halted on regression
1159: - [ ] scan_for_secrets ran before commit and blocked on detected patterns
1160: - [ ] --verify-only invokes gsd-doc-verifier for full fact-checking (not just VERIFY marker count)
1161: </success_criteria>

(End of file - total 1161 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-docs-update"
}
```

**Output:** (pruned)
```
# Skill: gsd-docs-update
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_CaV4MFGawoeyFE5pXYUzvXmW"
}
```


## USER (turn 58)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: CP-DT-01-R Remediate delegate-task runtime dispatch after context.task seam disproven. Source forensic report: .planning/forensics/report-20260518-105705.md. Mandatory entry: read CP-DT-01-CONTEXT.md, CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-01-SUMMARY.md through CP-DT-01-05-SUMMARY.md, CP-DT-01-REVIEW.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md, and node_modules/@opencode-ai/plugin/dist/tool.d.ts. Goal: rebuild the phase plan sequence around verified OpenCode mechanisms only; no context.task; no future OpenCode assumption. Preserve original 5-plan trace shape: Plan 01 research/spec correction, Plan 02 coordinator/monitor/completion contract correction, Plan 03 delegate-task/delegation-status tool contract rewrite, Plan 04 auto-loop/ralph-loop/chaining correction, Plan 05 plugin wiring/runtime-contract tests. Required plan outputs must include: docs-first correction tasks, code/test remediation tasks, runtime evidence gates, failure stop conditions, exact verification commands, and explicit rule that mocked nativeTask injection is not L1 evidence. Do not execute implementation yet. (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: 
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
10: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
11: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
12: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
13: </required_reading>
14: 
15: <available_agent_types>
16: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
17: - gsd-phase-researcher — Researches technical approaches for a phase
18: - gsd-pattern-mapper — Analyzes codebase for existing patterns, produces PATTERNS.md
19: - gsd-planner — Creates detailed plans from phase scope
20: - gsd-plan-checker — Reviews plan quality before execution
21: </available_agent_types>
22: 
23: <process>
24: 
25: ## 0. Git Branch Invariant
26: 
27: **Do not create, rename, or switch git branches during plan-phase.** Branch identity is established at discuss-phase and is owned by the user's git workflow. A phase rename in ROADMAP.md is a plan-level change only — it does not mutate git branch names. If `phase_slug` in the init JSON differs from the current branch name, that is expected and correct; leave the branch unchanged.
28: 
29: ## 1. Initialize
30: 
31: Load all context in one call (paths only to minimize orchestrator context):
32: 
33: ```bash
34: INIT=$(gsd-sdk query init.plan-phase "$PHASE")
35: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
36: AGENT_SKILLS_RESEARCHER=$(gsd-sdk query agent-skills gsd-phase-researcher)
37: AGENT_SKILLS_PLANNER=$(gsd-sdk query agent-skills gsd-planner)
38: AGENT_SKILLS_CHECKER=$(gsd-sdk query agent-skills gsd-plan-checker)
39: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
40: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
41: MVP_MODE_CFG=$(gsd-sdk query config-get workflow.mvp_mode 2>/dev/null || echo "false")
42: ```
43: 
44: When `TDD_MODE` is `true`, the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The planner's `<required_reading>` is extended to include `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` so gate enforcement rules are available during planning.
45: 
46: When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardless of recency (e.g., Phase 7 declaring `Depends on: Phase 2` always sees Phase 2's context). Bounded recency keeps the planner's context budget focused on recent work.
47: 
48: Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
49: 
50: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
51: 
52: **File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.
53: 
54: **If `planning_exists` is false:** Error — run `/gsd-new-project` first.
55: 
56: ## 2. Parse and Normalize Arguments
57: 
58: Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--reviews`, `--text`, `--bounce`, `--skip-bounce`, `--chunked`, `--mvp`).
59: 
60: **`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only — the planner spawn (step 8), plan-checker, verification, gaps, bounce, and post-planning-gaps blocks all skip on `RESEARCH_ONLY`. Use this for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `/gsd-research-phase` command.
61: 
62: In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:
63: 
64: - **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
65: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.
66: 
67: ```bash
68: RESEARCH_ONLY=false
69: VIEW_ONLY=false
70: if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
71:   RESEARCH_ONLY=true
72:   PHASE="${BASH_REMATCH[1]}"
73: fi
74: if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
75:   VIEW_ONLY=true
76: fi
77: ```
78: 
79: Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for Claude Code remote sessions (`/rc` mode) where TUI menus don't work through the the agent App.
80: 
81: **MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-implement the chain.
82: 
83: ```bash
84: MVP_FLAG_ARG=""
85: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
86: ```
87: 
88: Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation).
89: The verb returns `true|false`. Full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostics. The mode is **all-or-nothing per phase** (PRD decision Q1) — never selective per task.
90: 
91: **Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:
92: 
93: ```bash
94: WALKING_SKELETON=false
95: if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
96:   PRIOR_SUMMARIES=$(gsd-sdk query phases.list --pick summaries_total 2>/dev/null || echo "0")
97:   if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
98: fi
99: ```
100: 
101: When `WALKING_SKELETON=true`:
102: - Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md`.
103: - The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.
104: 
105: **Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are active on Phase 1 of a new project, the planner receives `WALKING_SKELETON=true` and PRD-derived context simultaneously — the PRD informs *what the skeleton should prove*. No precedence is needed; the two signals are orthogonal. See [`references/mvp-concepts.md`](../references/mvp-concepts.md) for the broader interaction map.
106: 
107: Extract `--prd <filepath>` from $ARGUMENTS. If present, set PRD_FILE to the filepath.
108: 
109: **If no phase number:** Detect next unplanned phase from roadmap.
110: 
111: **If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `phase_slug` and `padded_phase` from init:
112: ```bash
113: mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
114: ```
115: 
116: **Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.
117: 
118: Set `CHUNKED_MODE` from flag or config:
119: ```bash
120: CHUNKED_CFG=$(gsd-sdk query config-get workflow.plan_chunked 2>/dev/null || echo "false")
121: CHUNKED_MODE=false
122: if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
123:   CHUNKED_MODE=true
124: fi
125: ```
126: 
127: ## 2.5. Validate `--reviews` Prerequisite
128: 
129: **Skip if:** No `--reviews` flag.
130: 
131: **If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.
132: 
133: **If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**
134: 
135: Error:
136: ```
137: No REVIEWS.md found for Phase {N}. Run reviews first:
138: 
139: /gsd-review --phase {N}
140: 
141: Then re-run /gsd-plan-phase {N} --reviews
142: ```
143: Exit workflow.
144: 
145: ## 3. Validate Phase
146: 
147: ```bash
148: PHASE_INFO=$(gsd-sdk query roadmap.get-phase "${PHASE}")
149: ```
150: 
151: **If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.
152: 
153: Now that `PHASE` is finalized, resolve MVP mode:
154: ```bash
155: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)
156: ```
157: 
158: ## 3.5. Handle PRD Express Path
159: 
160: **Skip if:** No `--prd` flag in arguments.
161: 
162: **If `--prd <filepath>` provided:**
163: 
164: 1. Read the PRD file:
165: ```bash
166: PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
167: if [ -z "$PRD_CONTENT" ]; then
168:   echo "Error: PRD file not found: $PRD_FILE"
169:   exit 1
170: fi
171: ```
172: 
173: 2. Display banner:
174: ```
175: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
176:  GSD ► PRD EXPRESS PATH
177: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
178: 
179: Using PRD: {PRD_FILE}
180: Generating CONTEXT.md from requirements...
181: ```
182: 
183: 3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
184:    - Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
185:    - Map each to a locked decision (everything in the PRD is treated as a locked decision)
186:    - Identify any areas the PRD doesn't cover and mark as "the agent's Discretion"
187:    - **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
188:    - Create CONTEXT.md in the phase directory
189: 
190: 4. Write CONTEXT.md:
191: ```markdown
192: # Phase [X]: [Name] - Context
193: 
194: **Gathered:** [date]
195: **Status:** Ready for planning
196: **Source:** PRD Express Path ({PRD_FILE})
197: 
198: <domain>
199: ## Phase Boundary
200: 
201: [Extracted from PRD — what this phase delivers]
202: 
203: </domain>
204: 
205: <decisions>
206: ## Implementation Decisions
207: 
208: {For each requirement/story/criterion in the PRD:}
209: ### [Category derived from content]
210: - [Requirement as locked decision]
211: 
212: ### the agent's Discretion
213: [Areas not covered by PRD — implementation details, technical choices]
214: 
215: </decisions>
216: 
217: <canonical_refs>
218: ## Canonical References
219: 
220: **Downstream agents MUST read these before planning or implementing.**
221: 
222: [MANDATORY. Extract from ROADMAP.md and any docs referenced in the PRD.
223: Use full relative paths. Group by topic area.]
224: 
225: ### [Topic area]
226: - `path/to/spec-or-adr.md` — [What it decides/defines]
227: 
228: [If no external specs: "No external specs — requirements fully captured in decisions above"]
229: 
230: </canonical_refs>
231: 
232: <specifics>
233: ## Specific Ideas
234: 
235: [Any specific references, examples, or concrete requirements from PRD]
236: 
237: </specifics>
238: 
239: <deferred>
240: ## Deferred Ideas
241: 
242: [Items in PRD explicitly marked as future/v2/out-of-scope]
243: [If none: "None — PRD covers phase scope"]
244: 
245: </deferred>
246: 
247: ---
248: 
249: *Phase: XX-name*
250: *Context gathered: [date] via PRD Express Path*
251: ```
252: 
253: 5. Commit:
254: ```bash
255: gsd-sdk query commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
256: ```
257: 
258: 6. Set `context_content` to the generated CONTEXT.md content and continue to step 5 (Handle Research).
259: 
260: **Effect:** This completely bypasses step 4 (Load CONTEXT.md) since we just created it. The rest of the workflow (research, planning, verification) proceeds normally with the PRD-derived context.
261: 
262: ## 4. Load CONTEXT.md
263: 
264: **Skip if:** PRD express path was used (CONTEXT.md already created in step 3.5).
265: 
266: Check `context_path` from init JSON.
267: 
268: If `context_path` is not null, display: `Using phase context from: ${context_path}`
269: 
270: **If `context_path` is null (no CONTEXT.md exists):**
271: 
272: Read discuss mode for context gate label:
273: ```bash
274: DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
275: ```
276: 
277: If `TEXT_MODE` is true, present as a plain-text numbered list:
278: ```
279: No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included.
280: 
281: 1. Continue without context — Plan using research + requirements only
282: [If DISCUSS_MODE is "assumptions":]
283: 2. Gather context (assumptions mode) — Analyze codebase and surface assumptions before planning
284: [If DISCUSS_MODE is "discuss" or unset:]
285: 2. Run discuss-phase first — Capture design decisions before planning
286: 
287: Enter number:
288: ```
289: 
290: Otherwise use question:
291: - header: "No context"
292: - question: "No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
293: - options:
294:   - "Continue without context" — Plan using research + requirements only
295:   If `DISCUSS_MODE` is `"assumptions"`:
296:   - "Gather context (assumptions mode)" — Analyze codebase and surface assumptions before planning
297:   If `DISCUSS_MODE` is `"discuss"` (or unset):
298:   - "Run discuss-phase first" — Capture design decisions before planning
299: 
300: If "Continue without context": Proceed to step 5.
301: If "Run discuss-phase first":
302:   **IMPORTANT:** Do NOT invoke discuss-phase as a nested Skill/Task call — question
303:   does not work correctly in nested subcontexts (#1009). Instead, display the command
304:   and exit so the user runs it as a top-level command:
305:   ```
306:   Run this command first, then re-run /gsd-plan-phase {X} ${GSD_WS}:
307: 
308:   /gsd-discuss-phase {X} ${GSD_WS}
309:   ```
310:   **Exit the plan-phase workflow. Do not continue.**
311: 
312: ## 4.5. Check AI-SPEC
313: 
314: **Skip if:** `ai_integration_phase_enabled` from config is false, or `--skip-ai-spec` flag provided.
315: 
316: ```bash
317: AI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-AI-SPEC.md 2>/dev/null | head -1)
318: AI_PHASE_CFG=$(gsd-sdk query config-get workflow.ai_integration_phase 2>/dev/null || echo "true")
319: ```
320: 
321: **Skip if `AI_PHASE_CFG` is `false`.**
322: 
323: **If `AI_SPEC_FILE` is empty:** Check phase goal for AI keywords:
324: ```bash
325: echo "${phase_goal}" | grep -qi "agent\|llm\|rag\|chatbot\|embedding\|langchain\|llamaindex\|crewai\|langgraph\|openai\|anthropic\|vector\|eval\|ai system"
326: ```
327: 
328: **If AI keywords detected AND no AI-SPEC.md:**
329: ```
330: ◆ Note: This phase appears to involve AI system development.
331:   Consider running /gsd-ai-integration-phase {N} before planning to:
332:   - Select the right framework for your use case
333:   - Research its docs and best practices
334:   - Design an evaluation strategy
335: 
336:   Continue planning without AI-SPEC? (non-blocking — /gsd-ai-integration-phase can be run after)
337: ```
338: 
339: Use question with options:
340: - "Continue — plan without AI-SPEC"
341: - "Stop — I'll run /gsd-ai-integration-phase {N} first"
342: 
343: If "Stop": Exit with `/gsd-ai-integration-phase {N}` reminder.
344: If "Continue": Proceed. (Non-blocking — planner will note AI-SPEC is absent.)
345: 
346: **If `AI_SPEC_FILE` is non-empty:** Extract framework for planner context:
347: ```bash
348: FRAMEWORK_LINE=$(grep "Selected Framework:" "${AI_SPEC_FILE}" | head -1)
349: ```
350: Pass `ai_spec_path` and `framework_line` to planner in step 7 so it can reference the AI design contract.
351: 
352: ## 5. Handle Research
353: 
354: **Skip if:** `--gaps` flag or `--skip-research` flag or `--reviews` flag.
355: 
356: ### 5.0. Research-Only Modifiers (`--view`, `--research`, prompt)
357: 
358: **Skip if:** `RESEARCH_ONLY` is `false`.
359: 
360: Three branches in research-only mode (`--research-phase <N>`):
361: 
362: 1. **`--view`** (or user picks "View" in the prompt below): print `RESEARCH.md` to stdout, no spawn, exit. If `RESEARCH.md` is missing, error with: `--view requires an existing RESEARCH.md; drop --view to spawn the researcher.`
363: 2. **`--research`** (force-refresh): re-spawn researcher unconditionally — fall through to "Spawn gsd-phase-researcher" below.
364: 3. **Neither flag AND `has_research=true`:** emit `RESEARCH.md already exists for Phase ${PHASE}.` and prompt the user with three choices: `1. Update — re-spawn researcher and refresh RESEARCH.md`, `2. View — print existing RESEARCH.md and exit (no spawn)`, `3. Skip — exit without spawning or printing`. Map "Update" → fall through to spawn, "View" → set `VIEW_ONLY=true` and emit RESEARCH.md as in (1), "Skip" → exit cleanly. Mirrors the deleted `/gsd-research-phase` standalone's existing-artifact menu (#3042 parity).
365: 
366: ```bash
367: if [[ "$VIEW_ONLY" == "true" ]]; then
368:   [[ -f "$research_path" ]] || { echo "Error: --view requires an existing RESEARCH.md (Phase ${PHASE}). Drop --view to spawn the researcher."; exit 1; }
369:   cat "$research_path"; exit 0
370: fi
371: ```
372: 
373: ### 5.1. Standard Research Decision
374: 
375: **Skip if** `RESEARCH_ONLY=true` (the research-only mode in 5.0 already determined the path: spawn or exit). Without this guard, an LLM following the workflow could fall through into "use existing, skip to step 6" → planner spawn, violating the research-only contract. **CR #3045 finding: this gate makes the early-exit unreachable from any non-research-only branch.**
376: 
377: **If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.
378: 
379: **If RESEARCH.md missing OR `--research` flag:**
380: 
381: **If no explicit flag (`--research` or `--skip-research`) and not `--auto`:**
382: Ask the user whether to research, with a contextual recommendation based on the phase:
383: 
384: If `TEXT_MODE` is true, present as a plain-text numbered list:
385: ```
386: Research before planning Phase {X}: {phase_name}?
387: 
388: 1. Research first (Recommended) — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
389: 2. Skip research — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.
390: 
391: Enter number:
392: ```
393: 
394: Otherwise use question:
395: ```
396: question([
397:   {
398:     question: "Research before planning Phase {X}: {phase_name}?",
399:     header: "Research",
400:     multiSelect: false,
401:     options: [
402:       { label: "Research first (Recommended)", description: "Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes." },
403:       { label: "Skip research", description: "Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks." }
404:     ]
405:   }
406: ])
407: ```
408: 
409: If user selects "Skip research": skip to step 6.
410: 
411: **If `--auto` and `research_enabled` is false:** Skip research silently (preserves automated behavior).
412: 
413: Display banner:
414: ```
415: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
416:  GSD ► RESEARCHING PHASE {X}
417: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
418: 
419: ◆ Spawning researcher...
420: ```
421: 
422: ### Spawn gsd-phase-researcher
423: 
424: ```bash
425: PHASE_DESC=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section)
426: ```
427: 
428: Research prompt:
429: 
430: ```markdown
431: <objective>
432: Research how to implement Phase {phase_number}: {phase_name}
433: Answer: "What do I need to know to PLAN this phase well?"
434: </objective>
435: 
436: <files_to_read>
437: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
438: - {requirements_path} (Project requirements)
439: - {state_path} (Project decisions and history)
440: </files_to_read>
441: 
442: ${AGENT_SKILLS_RESEARCHER}
443: 
444: <additional_context>
445: **Phase description:** {phase_description}
446: **Phase requirement IDs (MUST address):** {phase_req_ids}
447: 
448: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
449: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns
450: </additional_context>
451: 
452: <output>
453: Write to: {phase_dir}/{phase_num}-RESEARCH.md
454: </output>
455: ```
456: 
457: ```
458: Agent(
459:   prompt=research_prompt,
460:   subagent_type="gsd-phase-researcher",
461:   model="{researcher_model}",
462:   description="Research Phase {phase}"
463: )
464: ```
465: 
466: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
467: 
468: ### Handle Researcher Return
469: 
470: - **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 6
471: - **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort
472: 
473: ### Research-Only Early Exit (`--research-phase`)
474: 
475: **Skip if:** `RESEARCH_ONLY` is `false` (the default).
476: 
477: **If `RESEARCH_ONLY=true`:** the user invoked `/gsd-plan-phase --research-phase <N>` for research-only mode. Do **not** continue to Section 5.5+ (validation strategy, planner, plan-checker, verification, gaps, bounce, post-planning-gaps). Print the research-complete summary and exit cleanly:
478: 
479: ```text
480: ✓ Research-only mode complete (#3042)
481: 
482:   Phase:       ${PHASE}
483:   RESEARCH.md: ${research_path}
484: 
485: Re-run /gsd-plan-phase ${PHASE} to plan the phase using this research,
486: or /gsd-plan-phase ${PHASE} --research to refresh research and plan.
487: ```
488: 
489: This exits the workflow. The planner / plan-checker / verifier blocks below are skipped.
490: 
491: ## 5.5. Create Validation Strategy
492: 
493: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
494: 
495: If `research_enabled` is false and `nyquist_validation_enabled` is true: warn "Nyquist validation enabled but research disabled — VALIDATION.md cannot be created without RESEARCH.md. Plans will lack validation requirements (Dimension 8)." Continue to step 6.
496: 
497: **But Nyquist is not applicable for this run** when all of the following are true:
498: - `research_enabled` is false
499: - `has_research` is false
500: - no `--research` flag was provided
501: 
502: In that case: **skip validation-strategy creation entirely**. Do **not** expect `RESEARCH.md` or `VALIDATION.md` for this run, and continue to Step 6.
503: 
504: ```bash
505: grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null || true
506: ```
507: 
508: **If found:**
509: 1. Read template: `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
510: 2. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md` (use Write tool)
511: 3. Fill frontmatter: `{N}` → phase number, `{phase-slug}` → slug, `{date}` → current date
512: 4. Verify:
513: ```bash
514: test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
515: ```
516: 5. If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6
517: 6. If `commit_docs`: `commit "docs(phase-${PHASE}): add validation strategy"`
518: 
519: **If not found:** Warn and continue — plans may fail Dimension 8.
520: 
521: ## 5.55. Security Threat Model Gate
522: 
523: > Skip if `workflow.security_enforcement` is explicitly `false`. Absent = enabled.
524: 
525: ```bash
526: SECURITY_CFG=$(gsd-sdk query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
527: SECURITY_ASVS=$(gsd-sdk query config-get workflow.security_asvs_level --raw 2>/dev/null || echo "1")
528: SECURITY_BLOCK=$(gsd-sdk query config-get workflow.security_block_on --raw 2>/dev/null || echo "high")
529: ```
530: 
531: **If `SECURITY_CFG` is `false`:** Skip to step 5.6.
532: 
533: **If `SECURITY_CFG` is `true`:** Display banner:
534: 
535: ```
536: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
537:  GSD ► SECURITY THREAT MODEL REQUIRED (ASVS L{SECURITY_ASVS})
538: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
539: 
540: Each PLAN.md must include a <threat_model> block.
541: Block on: {SECURITY_BLOCK} severity threats.
542: Opt out: set security_enforcement: false in .planning/config.json
543: ```
544: 
545: Continue to step 5.6. Security config is passed to the planner in step 8.
546: 
547: ## 5.6. UI Design Contract Gate
548: 
549: > Skip if `workflow.ui_phase` is explicitly `false` AND `workflow.ui_safety_gate` is explicitly `false` in `.planning/config.json`. If keys are absent, treat as enabled.
550: 
551: ```bash
552: UI_PHASE_CFG=$(gsd-sdk query config-get workflow.ui_phase 2>/dev/null || echo "true")
553: UI_GATE_CFG=$(gsd-sdk query config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
554: ```
555: 
556: **If both are `false`:** Skip to step 6.
557: 
558: Check if phase has frontend indicators:
559: 
560: ```bash
561: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" 2>/dev/null)
562: echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
563: HAS_UI=$?
564: ```
565: 
566: **If `HAS_UI` is 0 (frontend indicators found):**
567: 
568: Check for existing UI-SPEC:
569: ```bash
570: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
571: ```
572: 
573: **If UI-SPEC.md found:** Set `UI_SPEC_PATH=$UI_SPEC_FILE`. Display: `Using UI design contract: ${UI_SPEC_PATH}`
574: 
575: **If UI-SPEC.md missing AND `--skip-ui` flag is present in $ARGUMENTS:** Skip silently to step 6.
576: 
577: **If UI-SPEC.md missing AND `UI_GATE_CFG` is `true`:**
578: 
579: Read ephemeral chain flag (same field as `check.auto-mode` → `auto_chain_active`):
580: ```bash
581: AUTO_CHAIN=$(gsd-sdk query check auto-mode --pick auto_chain_active 2>/dev/null || echo "false")
582: ```
583: 
584: **If `AUTO_CHAIN` is `true` (running inside a `--chain` or `--auto` pipeline):**
585: 
586: Auto-generate UI-SPEC without prompting:
587: ```
588: Skill(skill="gsd-ui-phase", args="${PHASE} --auto ${GSD_WS}")
589: ```
590: After `gsd-ui-phase` returns, re-read:
591: ```bash
592: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
593: UI_SPEC_PATH="${UI_SPEC_FILE}"
594: ```
595: Continue to step 6.
596: 
597: **If `AUTO_CHAIN` is `false` (manual invocation):**
598: 
599: Output this markdown directly (not as a code block):
600: 
601: ```
602: ## ⚠ UI-SPEC.md missing for Phase {N}
603: ▶ Recommended next step:
604: `/gsd-ui-phase {N} ${GSD_WS}` — generate UI design contract before planning
605: ───────────────────────────────────────────────
606: Also available:
607: - `/gsd-plan-phase {N} --skip-ui ${GSD_WS}` — plan without UI-SPEC (not recommended for frontend phases)
608: ```
609: 
610: **Exit the plan-phase workflow. Do not continue.**
611: 
612: **If `HAS_UI` is 1 (no frontend indicators):** Skip silently to step 5.7.
613: 
614: ## 5.7. Schema Push Detection Gate
615: 
616: > Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.
617: 
618: Check if any files in the phase scope match schema patterns:
619: 
620: ```bash
621: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
622: ```
623: 
624: Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:
625: 
626: | ORM | File Patterns |
627: |-----|--------------|
628: | Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
629: | Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
630: | Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
631: | Supabase | `supabase/migrations/*.sql` |
632: | TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |
633: 
634: Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.
635: 
636: **If schema-relevant files detected:**
637: 
638: Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.
639: 
640: Determine the push command for the detected ORM:
641: 
642: | ORM | Push Command | Non-TTY Workaround |
643: |-----|-------------|-------------------|
644: | Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
645: | Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
646: | Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
647: | Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
648: | TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |
649: 
650: Inject the following into the planner prompt (step 8) as an additional constraint:
651: 
652: ```markdown
653: <schema_push_requirement>
654: **[BLOCKING] Schema Push Required**
655: 
656: This phase modifies schema-relevant files ({detected_files}). The planner MUST include
657: a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
658: modifications are complete but BEFORE verification.
659: 
660: - ORM detected: {SCHEMA_ORM}
661: - Push command: {push_command}
662: - Non-TTY workaround: {env_hint}
663: - If push requires interactive prompts that cannot be suppressed, flag the task for
664:   manual intervention with `autonomous: false`
665: 
666: This task is mandatory — the phase CANNOT pass verification without it. Build and
667: type checks will pass without the push (types come from config, not the live database),
668: creating a false-positive verification state.
669: </schema_push_requirement>
670: ```
671: 
672: Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`
673: 
674: **If no schema-relevant files detected:** Skip silently to step 6.
675: 
676: ## 6. Check Existing Plans
677: 
678: ```bash
679: ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
680: ```
681: 
682: **If exists AND `--reviews` flag:** Skip prompt — go straight to replanning (the purpose of `--reviews` is to replan with review feedback).
683: 
684: **If exists AND no `--reviews` flag:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.
685: 
686: ## 7. Use Context Paths from INIT
687: 
688: Extract from INIT JSON:
689: 
690: ```bash
691: _gsd_field() { node -e "const o=JSON.parse(process.argv[1]); const v=o[process.argv[2]]; process.stdout.write(v==null?'':String(v))" "$1" "$2"; }
692: STATE_PATH=$(_gsd_field "$INIT" state_path)
693: ROADMAP_PATH=$(_gsd_field "$INIT" roadmap_path)
694: REQUIREMENTS_PATH=$(_gsd_field "$INIT" requirements_path)
695: RESEARCH_PATH=$(_gsd_field "$INIT" research_path)
696: VERIFICATION_PATH=$(_gsd_field "$INIT" verification_path)
697: UAT_PATH=$(_gsd_field "$INIT" uat_path)
698: CONTEXT_PATH=$(_gsd_field "$INIT" context_path)
699: REVIEWS_PATH=$(_gsd_field "$INIT" reviews_path)
700: PATTERNS_PATH=$(_gsd_field "$INIT" patterns_path)
701: 
702: # Detect spike/sketch findings skills (project-local)
703: SPIKE_FINDINGS_PATH=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
704: SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
705: ```
706: 
707: ## 7.5. Verify Nyquist Artifacts
708: 
709: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
710: 
711: Also skip if all of the following are true:
712: - `research_enabled` is false
713: - `has_research` is false
714: - no `--research` flag was provided
715: 
716: In that no-research path, Nyquist artifacts are **not required** for this run.
717: 
718: ```bash
719: VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
720: ```
721: 
722: If missing and Nyquist is still enabled/applicable — ask user:
723: 1. Re-run: `/gsd-plan-phase {PHASE} --research ${GSD_WS}`
724: 2. Disable Nyquist with the exact command:
725:    `gsd-sdk query config-set workflow.nyquist_validation false`
726: 3. Continue anyway (plans fail Dimension 8)
727: 
728: Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled) only if user selects 2 or 3.
729: 
730: ## 7.8. Spawn gsd-pattern-mapper Agent (Optional)
731: 
732: **Skip if** `workflow.pattern_mapper` is explicitly set to `false` in config.json (absent key = enabled). Also skip if no CONTEXT.md and no RESEARCH.md exist for this phase (nothing to extract file lists from).
733: 
734: Check config:
735: ```bash
736: PATTERN_MAPPER_CFG=$(gsd-sdk query config-get workflow.pattern_mapper 2>/dev/null || echo "true")
737: ```
738: 
739: **If `PATTERN_MAPPER_CFG` is `false`:** Skip to step 8.
740: 
741: **If PATTERNS.md already exists** (`PATTERNS_PATH` is non-empty from step 7): Skip to step 8 (use existing).
742: 
743: Display banner:
744: ```
745: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
746:  GSD ► PATTERN MAPPING PHASE {X}
747: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
748: 
749: ◆ Spawning pattern mapper...
750: ```
751: 
752: Pattern mapper prompt:
753: 
754: ```markdown
755: <pattern_mapping_context>
756: **Phase:** {phase_number} - {phase_name}
757: **Phase directory:** {phase_dir}
758: **Padded phase:** {padded_phase}
759: 
760: <files_to_read>
761: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
762: - {research_path} (Technical Research)
763: </files_to_read>
764: 
765: **Output file:** {phase_dir}/{padded_phase}-PATTERNS.md
766: 
767: Extract the list of files to be created/modified from CONTEXT.md and RESEARCH.md. For each file, classify by role and data flow, find the closest existing analog in the codebase, extract concrete code excerpts, and produce PATTERNS.md.
768: </pattern_mapping_context>
769: ```
770: 
771: Spawn with:
772: ```
773: Agent(
774:   prompt="{above}",
775:   subagent_type="gsd-pattern-mapper",
776:   model="{researcher_model}",
777: )
778: ```
779: 
780: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
781: 
782: **Handle return:**
783: - **`## PATTERN MAPPING COMPLETE`:** Update `PATTERNS_PATH` to the created file path, continue to step 8.
784: - **Any error or empty return:** Log warning, continue to step 8 without patterns (non-blocking).
785: 
786: After pattern mapper completes, update the path variable:
787: ```bash
788: PATTERNS_PATH="${PHASE_DIR}/${PADDED_PHASE}-PATTERNS.md"
789: ```
790: 
791: ## 8. Spawn gsd-planner Agent
792: 
793: Display banner:
794: ```
795: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
796:  GSD ► PLANNING PHASE {X}
797: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
798: 
799: ◆ Spawning planner...
800: ```
801: 
802: Planner prompt:
803: 
804: ```markdown
805: <planning_context>
806: **Phase:** {phase_number}
807: **Mode:** {standard | gap_closure | reviews}
808: 
809: <files_to_read>
810: - {state_path} (Project State)
811: - {roadmap_path} (Roadmap)
812: - {requirements_path} (Requirements)
813: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
814: - {research_path} (Technical Research)
815: - {PATTERNS_PATH} (Pattern Map — analog files and code excerpts, if exists)
816: - {verification_path} (Verification Gaps - if --gaps)
817: - {uat_path} (UAT Gaps - if --gaps)
818: - {reviews_path} (Cross-AI Review Feedback - if --reviews)
819: - {UI_SPEC_PATH} (UI Design Contract — visual/interaction specs, if exists)
820: - {SPIKE_FINDINGS_PATH} (Spike Findings — validated patterns, constraints, landmines from experiments, if exists)
821: - {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction, if exists)
822: ${CONTEXT_WINDOW >= 500000 ? `
823: **Cross-phase context (1M model enrichment):**
824: - CONTEXT.md files from the 3 most recent completed phases (locked decisions — maintain consistency)
825: - SUMMARY.md files from the 3 most recent completed phases (what was built — reuse patterns, avoid duplication)
826: - LEARNINGS.md files from the 3 most recent completed phases (structured decisions, patterns, lessons, surprises — skip silently if a phase has no LEARNINGS.md; prefix each block with \`[from Phase N LEARNINGS]\` for source attribution; if total size exceeds 15% of context budget, drop oldest first)
827: - CONTEXT.md, SUMMARY.md, and LEARNINGS.md from any phases listed in the current phase's "Depends on:" field in ROADMAP.md (regardless of recency — explicit dependencies always load, deduplicated against the 3 most recent)
828: - Skip all other prior phases to stay within context budget
829: ` : ''}
830: </files_to_read>
831: 
832: ${AGENT_SKILLS_PLANNER}
833: 
834: **Phase requirement IDs (every ID MUST appear in a plan's `requirements` field):** {phase_req_ids}
835: 
836: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
837: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
838: 
839: ${TDD_MODE === 'true' ? `
840: <tdd_mode_active>
841: **TDD Mode is ENABLED.** Apply TDD heuristics from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md to all eligible tasks:
842: - Business logic with defined I/O → type: tdd
843: - API endpoints with request/response contracts → type: tdd
844: - Data transformations, validation, algorithms → type: tdd
845: - UI, config, glue code, CRUD → standard plan (type: execute)
846: Each TDD plan gets one feature with RED/GREEN/REFACTOR gate sequence.
847: </tdd_mode_active>
848: ` : ''}
849: 
850: **MVP_MODE:** ${MVP_MODE} (when true, follow vertical-slice rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md`; when false, ignore MVP guidance entirely.)
851: **WALKING_SKELETON:** ${WALKING_SKELETON} (when true, the first deliverable must be a Walking Skeleton — produce SKELETON.md alongside PLAN.md.)
852: 
853: ${MVP_MODE === 'true' ? `
854: <mvp_mode_active>
855: **MVP Mode is ENABLED.** Follow vertical-slice planning rules from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md. Each plan must deliver a complete vertical slice — thin end-to-end functionality rather than horizontal layers.
856: </mvp_mode_active>
857: ` : ''}
858: </planning_context>
859: 
860: <downstream_consumer>
861: Output consumed by /gsd-execute-phase. Plans need:
862: - Frontmatter (wave, depends_on, files_modified, autonomous)
863: - Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY on every task)
864: - Verification criteria
865: - must_haves for goal-backward verification
866: </downstream_consumer>
867: 
868: <deep_work_rules>
869: ## Anti-Shallow Execution Rules (MANDATORY)
870: 
871: Every task MUST include these fields — they are NOT optional:
872: 
873: 1. **`<read_first>`** — Files the executor MUST read before touching anything. Always include:
874:    - The file being modified (so executor sees current state, not assumptions)
875:    - Any "source of truth" file referenced in CONTEXT.md (reference implementations, existing patterns, config files, schemas)
876:    - Any file whose patterns, signatures, types, or conventions must be replicated or respected
877: 
878: 2. **`<acceptance_criteria>`** — Verifiable conditions that prove the task was done correctly. Rules:
879:    - Every criterion must be checkable with grep, file read, test command, or CLI output
880:    - NEVER use subjective language ("looks correct", "properly configured", "consistent with")
881:    - ALWAYS include exact strings, patterns, values, or command outputs that must be present
882:    - Examples:
883:      - Code: `auth.py contains def verify_token(` / `test_auth.py exits 0`
884:      - Config: `.env.example contains DATABASE_URL=` / `Dockerfile contains HEALTHCHECK`
885:      - Docs: `README.md contains '## Installation'` / `API.md lists all endpoints`
886:      - Infra: `deploy.yml has rollback step` / `docker-compose.yml has healthcheck for db`
887: 
888: 3. **`<action>`** — Must include CONCRETE values, not references. Rules:
889:    - NEVER say "align X with Y", "match X to Y", "update to be consistent" without specifying the exact target state
890:    - ALWAYS include the actual values: config keys, function signatures, SQL statements, class names, import paths, env vars, etc.
891:    - If CONTEXT.md has a comparison table or expected values, copy them into the action verbatim
892:    - The executor should be able to complete the task from the action text alone, without needing to read CONTEXT.md or reference files (read_first is for verification, not discovery)
893: 
894: **Why this matters:** Executor agents work from the plan text. Vague instructions like "update the config to match production" produce shallow one-line changes. Concrete instructions like "add DATABASE_URL=postgresql://... , set POOL_SIZE=20, add REDIS_URL=redis://..." produce complete work. The cost of verbose plans is far less than the cost of re-doing shallow execution.
895: </deep_work_rules>
896: 
897: <quality_gate>
898: - [ ] PLAN.md files created in phase directory
899: - [ ] Each plan has valid frontmatter
900: - [ ] Tasks are specific and actionable
901: - [ ] Every task has `<read_first>` with at least the file being modified
902: - [ ] Every task has `<acceptance_criteria>` with grep-verifiable conditions
903: - [ ] Every `<action>` contains concrete values (no "align X with Y" without specifying what)
904: - [ ] Dependencies correctly identified
905: - [ ] Waves assigned for parallel execution
906: - [ ] must_haves derived from phase goal
907: </quality_gate>
908: ```
909: 
910: **If `CHUNKED_MODE` is `false` (default):** Spawn the planner as a single long-lived Agent:
911: 
912: ```text
913: Agent(
914:   prompt=filled_prompt,
915:   subagent_type="gsd-planner",
916:   model="{planner_model}",
917:   description="Plan Phase {phase}"
918: )
919: ```
920: 
921: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
922: 
923: **If `CHUNKED_MODE` is `true`:** Skip the Agent() call above — proceed to step 8.5 instead.
924: 
925: ## 8.5. Chunked Planning Mode
926: 
927: **Skip if `CHUNKED_MODE` is `false`.**
928: 
929: Chunked mode splits the single long-lived planner Agent run into a short outline Agent run followed by
930: N short per-plan Agent runs. Each run is bounded to ~3–5 min; each plan is committed individually
931: for crash resilience. If any run hangs and the terminal is force-killed, rerunning
932: `/gsd-plan-phase {N} --chunked` resumes from the last successfully committed plan.
933: 
934: **Intended for new or in-progress chunked runs.** To recover plans already written by a prior
935: *non-chunked* run, use step 6's "Add more plans" or proceed directly to `/gsd-execute-phase`
936: — don't start a fresh chunked run over existing non-chunked plans.
937: 
938: ### 8.5.1 Outline Phase (outline-only mode, ~2 min)
939: 
940: **Resume detection:** If `${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md` already exists **and
941: is valid** (contains the `## OUTLINE COMPLETE` marker), skip this sub-step — the outline
942: already exists from a previous run. Proceed directly to 8.5.2.
943: 
944: ```bash
945: OUTLINE_FILE="${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md"
946: if [[ -f "$OUTLINE_FILE" ]] && grep -q "^## OUTLINE COMPLETE" "$OUTLINE_FILE"; then
947:   # reuse existing outline — skip to 8.5.2
948: fi
949: ```
950: 
951: Display:
952: ```text
953: ◆ Chunked mode: spawning outline planner...
954: ```
955: 
956: Spawn the planner in **outline-only** mode — it must write only the outline manifest, not any
957: PLAN.md files:
958: 
959: ```javascript
960: Agent(
961:   prompt="{same planning_context as step 8, plus:}
962: 
963:   **Chunked mode: outline-only.**
964:   Do NOT write any PLAN.md files in this Task.
965:   Write only: {PHASE_DIR}/{PADDED_PHASE}-PLAN-OUTLINE.md
966: 
967:   The outline must be a markdown table with columns:
968:   Plan ID | Objective | Wave | Depends On | Requirements
969: 
970:   Return: ## OUTLINE COMPLETE with plan count.",
971:   subagent_type="gsd-planner",
972:   model="{planner_model}",
973:   description="Outline Phase {phase} (chunked)"
974: )
975: ```
976: 
977: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
978: 
979: Handle return:
980: - **`## OUTLINE COMPLETE`:** Read `PLAN-OUTLINE.md`, extract plan list. Continue to 8.5.2.
981: - **Any other return or empty:** Display error. Offer: 1) Retry outline, 2) Stop.
982: 
983: ### 8.5.2 Per-Plan Tasks (single-plan mode, ~3-5 min each)
984: 
985: For each plan entry extracted from `PLAN-OUTLINE.md`:
986: 
987: 1. **Resume check:** If `${PHASE_DIR}/{plan_id}-PLAN.md` already exists on disk **and has
988:    valid YAML frontmatter** (opening `---` delimiter present), skip this plan (do not
989:    overwrite completed work — resume safety).
990: 
991:    ```bash
992:    PLAN_FILE="${PHASE_DIR}/${plan_id}-PLAN.md"
993:    if [[ -f "$PLAN_FILE" ]] && head -1 "$PLAN_FILE" | grep -q '^---'; then
994:      continue  # plan already written, skip
995:    fi
996:    ```
997: 
998: 2. Display:
999:    ```text
1000:    ◆ Chunked mode: planning {plan_id} ({k}/{N})...
1001:    ```
1002: 
1003: 3. Spawn the planner in **single-plan** mode — it must write exactly one PLAN.md file:
1004:    ```javascript
1005:    Agent(
1006:      prompt="{same planning_context as step 8, plus:}
1007: 
1008:      **Chunked mode: single-plan.**
1009:      Write exactly ONE plan file: {PHASE_DIR}/{plan_id}-PLAN.md
1010:      Plan to write: {plan_id} — {objective}
1011:      Wave: {wave} | Depends on: {depends_on}
1012:      Phase requirement IDs to cover in this plan: {plan_requirements}
1013: 
1014:      Return: ## PLAN COMPLETE with the plan ID.",
1015:      subagent_type="gsd-planner",
1016:      model="{planner_model}",
1017:      description="Plan {plan_id} (chunked {k}/{N})"
1018:    )
1019:    ```
1020: 
1021:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1022: 
1023: 4. **Verify disk:** Check `${PHASE_DIR}/{plan_id}-PLAN.md` exists. If missing: offer 1) Retry, 2) Stop.
1024: 
1025: 5. **Commit per-plan:**
1026:    ```bash
1027:    gsd-sdk query commit "docs(${PADDED_PHASE}): plan ${plan_id} (chunked)" --files "${PHASE_DIR}/${plan_id}-PLAN.md"
1028:    ```
1029: 
1030: After all N plans are written and committed, treat this as `## PLANNING COMPLETE` and continue
1031: to step 9.
1032: 
1033: ## 9. Handle Planner Return
1034: 
1035: - **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false (from init): skip to step 13. Otherwise: step 10.
1036: - **`## PHASE SPLIT RECOMMENDED`:** The planner determined the phase exceeds the context budget for full-fidelity implementation of all source items. Handle in step 9b.
1037: - **`## ⚠ Source Audit: Unplanned Items Found`:** The planner's multi-source coverage audit found items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions that are not covered by any plan. Handle in step 9c.
1038: - **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
1039: - **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual
1040: - **Empty / truncated / no recognized marker:** → Filesystem fallback (step 9a).
1041: 
1042: ## 9a. Filesystem Fallback (Planner)
1043: 
1044: **Triggered when:** Agent() returns but the return contains no recognized marker (`## PLANNING COMPLETE`, `## PHASE SPLIT RECOMMENDED`, `## ⚠ Source Audit`, `## CHECKPOINT REACHED`, `## PLANNING INCONCLUSIVE`).
1045: 
1046: ```bash
1047: DISK_PLANS=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
1048: ```
1049: 
1050: **If `DISK_PLANS` > 0:** The planner wrote plans to disk but the Agent() return was empty or
1051: truncated (the Windows stdio hang pattern — the subagent finished but the return never
1052: arrived). Display:
1053: 
1054: ```text
1055: ◆ Planner wrote {DISK_PLANS} plan(s) to disk but did not emit a PLANNING COMPLETE marker.
1056:   This is a known Windows stdio hang pattern — work is likely recoverable.
1057: 
1058:   Plans found on disk:
1059:   {ls output of *-PLAN.md}
1060: ```
1061: 
1062: Offer 3 options:
1063: 1. **Accept plans** — treat as `## PLANNING COMPLETE` and continue through step 9 `## PLANNING COMPLETE` handling (so `--skip-verify` / `plan_checker_enabled=false` are honored — may skip to step 13 rather than step 10)
1064: 2. **Retry planner** — re-spawn the planner with the same prompt (return to step 8)
1065: 3. **Stop** — exit; user can re-run `/gsd-plan-phase {N}` to resume
1066: 
1067: **If `DISK_PLANS` is 0 and no marker:** The planner produced no output. Treat as
1068: `## PLANNING INCONCLUSIVE` and handle accordingly.
1069: 
1070: ## 9b. Handle Phase Split Recommendation
1071: 
1072: When the planner returns `## PHASE SPLIT RECOMMENDED`, it means the phase's source items exceed the context budget for full-fidelity implementation. The planner proposes groupings.
1073: 
1074: **Extract from planner return:**
1075: - Proposed sub-phases (e.g., "17a: processing core (D-01 to D-19)", "17b: billing + config UX (D-20 to D-27)")
1076: - Which source items (REQ-IDs, D-XX decisions, RESEARCH items) go in each sub-phase
1077: - Why the split is necessary (context cost estimate, file count)
1078: 
1079: **Present to user:**
1080: ```
1081: ## Phase {X} exceeds context budget for full-fidelity implementation
1082: 
1083: The planner found {N} source items that exceed the context budget when
1084: planned at full fidelity. Instead of reducing scope, we recommend splitting:
1085: 
1086: **Option 1: Split into sub-phases**
1087: - Phase {X}a: {name} — {items} ({N} source items, ~{P}% context)
1088: - Phase {X}b: {name} — {items} ({M} source items, ~{Q}% context)
1089: 
1090: **Option 2: Proceed anyway** (planner will attempt all, quality may degrade past 50% context)
1091: 
1092: **Option 3: Prioritize** — you choose which items to implement now,
1093: rest become a follow-up phase
1094: ```
1095: 
1096: Use question with these 3 options.
1097: 
1098: **If "Split":** Use `/gsd-phase --insert` to create the sub-phases, then replan each.
1099: **If "Proceed":** Return to planner with instruction to attempt all items at full fidelity, accepting more plans/tasks.
1100: **If "Prioritize":** Use question (multiSelect) to let user pick which items are "now" vs "later". Create CONTEXT.md for each sub-phase with the selected items.
1101: 
1102: ## 9c. Handle Source Audit Gaps
1103: 
1104: When the planner returns `## ⚠ Source Audit: Unplanned Items Found`, it means items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions have no corresponding plan.
1105: 
1106: **Extract from planner return:**
1107: - Each unplanned item with its source artifact and section
1108: - The planner's suggested options (A: add plan, B: split phase, C: defer with confirmation)
1109: 
1110: **Present each gap to user.** For each unplanned item:
1111: 
1112: ```
1113: ## ⚠ Unplanned: {item description}
1114: 
1115: Source: {RESEARCH.md / REQUIREMENTS.md / ROADMAP goal / CONTEXT.md}
1116: Details: {why the planner flagged this}
1117: 
1118: Options:
1119: 1. Add a plan to cover this item (recommended)

(Output capped at 50 KB. Showing lines 1-1119. Use offset=1120 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: skill

**Input:**
```json
{
  "name": "gsd-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-phase
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_pK7RfGg1PzERGswDoimLrDCI"
}
```


## USER (turn 59)

**source:** real-human

<objective>
Manage phases in ROADMAP.md with a single consolidated command.

Mode routing:
- **default** (no flag): Add a new integer phase to the end of the current milestone → add-phase workflow
- **--insert**: Insert urgent work as a decimal phase (e.g., 72.1) between existing phases → insert-phase workflow
- **--remove**: Remove a future phase and renumber subsequent phases → remove-phase workflow
- **--edit**: Edit any field of an existing phase in place → edit-phase workflow
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Add new integer phase at end of milestone | add-phase |
| --insert | Insert decimal phase (e.g., 72.1) after specified phase | insert-phase |
| --remove | Remove future phase, renumber subsequent | remove-phase |
| --edit | Edit fields of existing phase in place | edit-phase |

</routing>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md
</execution_context>

<context>
Arguments: --insert CP-DT-01 CP-DT-01-R Remediate Delegate-Task Runtime Dispatch — Re-open CP-DT-01 after runtime proof showed @opencode-ai/plugin ToolContext has no task field and delegate-task depends on a false context.task seam. Depends on CP-DT-01, CP-ST-06, CP-PTY-00. Evidence required: corrected planning docs, verified OpenCode SDK/source mechanism, code/test remediation across original 5-plan trace, and L1 OpenCode runtime smoke before completion. Source: .planning/forensics/report-20260518-105705.md

Parse the first token of --insert CP-DT-01 CP-DT-01-R Remediate Delegate-Task Runtime Dispatch — Re-open CP-DT-01 after runtime proof showed @opencode-ai/plugin ToolContext has no task field and delegate-task depends on a false context.task seam. Depends on CP-DT-01, CP-ST-06, CP-PTY-00. Evidence required: corrected planning docs, verified OpenCode SDK/source mechanism, code/test remediation across original 5-plan trace, and L1 OpenCode runtime smoke before completion. Source: .planning/forensics/report-20260518-105705.md:
- If it is `--insert`: strip the flag, pass remainder (format: <after-phase-number> <description>) to insert-phase workflow
- If it is `--remove`: strip the flag, pass remainder (phase number) to remove-phase workflow
- If it is `--edit`: strip the flag, pass remainder (phase-number [--force]) to edit-phase workflow
- Otherwise: pass all of --insert CP-DT-01 CP-DT-01-R Remediate Delegate-Task Runtime Dispatch — Re-open CP-DT-01 after runtime proof showed @opencode-ai/plugin ToolContext has no task field and delegate-task depends on a false context.task seam. Depends on CP-DT-01, CP-ST-06, CP-PTY-00. Evidence required: corrected planning docs, verified OpenCode SDK/source mechanism, code/test remediation across original 5-plan trace, and L1 OpenCode runtime smoke before completion. Source: .planning/forensics/report-20260518-105705.md (phase description) to add-phase workflow

Roadmap and state are resolved in-workflow via `init phase-op` and targeted reads.
</context>

<process>
1. Parse the leading flag (if any) from --insert CP-DT-01 CP-DT-01-R Remediate Delegate-Task Runtime Dispatch — Re-open CP-DT-01 after runtime proof showed @opencode-ai/plugin ToolContext has no task field and delegate-task depends on a false context.task seam. Depends on CP-DT-01, CP-ST-06, CP-PTY-00. Evidence required: corrected planning docs, verified OpenCode SDK/source mechanism, code/test remediation across original 5-plan trace, and L1 OpenCode runtime smoke before completion. Source: .planning/forensics/report-20260518-105705.md.
2. Load and execute the appropriate workflow end-to-end based on the routing table above.
3. Preserve all validation gates from the target workflow.
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/add-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Add a new integer phase to the end of the current milestone in the roadmap. Automatically calculates next phase number, creates phase directory, and updates roadmap structure.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - All arguments become the phase description
14: - Example: `/gsd-add-phase Add authentication` → description = "Add authentication"
15: - Example: `/gsd-add-phase Fix critical performance issues` → description = "Fix critical performance issues"
16: 
17: If no arguments provided:
18: 
19: ```
20: ERROR: Phase description required
21: Usage: /gsd-add-phase <description>
22: Example: /gsd-add-phase Add authentication system
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "0")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Check `roadmap_exists` from init JSON. If false:
37: ```
38: ERROR: No roadmap found (.planning/ROADMAP.md)
39: Run /gsd-new-project to initialize.
40: ```
41: Exit.
42: </step>
43: 
44: <step name="add_phase">
45: **Delegate the phase addition to `gsd-sdk query phase.add`:**
46: 
47: ```bash
48: RESULT=$(gsd-sdk query phase.add "${description}")
49: ```
50: 
51: The CLI handles:
52: - Finding the highest existing integer phase number
53: - Calculating next phase number (max + 1)
54: - Generating slug from description
55: - Creating the phase directory (`.planning/phases/{NN}-{slug}/`)
56: - Inserting the phase entry into ROADMAP.md with Goal, Depends on, and Plans sections
57: 
58: Extract from result: `phase_number`, `padded`, `name`, `slug`, `directory`.
59: </step>
60: 
61: <step name="update_project_state">
62: Update STATE.md to reflect the new phase:
63: 
64: 1. Read `.planning/STATE.md`
65: 2. Under "## Accumulated Context" → "### Roadmap Evolution" add entry:
66:    ```
67:    - Phase {N} added: {description}
68:    ```
69: 
70: If "Roadmap Evolution" section doesn't exist, create it.
71: </step>
72: 
73: <step name="completion">
74: Present completion summary:
75: 
76: ```
77: Phase {N} added to current milestone:
78: - Description: {description}
79: - Directory: .planning/phases/{phase-num}-{slug}/
80: - Status: Not planned yet
81: 
82: Roadmap updated: .planning/ROADMAP.md
83: 
84: ---
85: 
86: ## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}
87: 
88: **Phase {N}: {description}**
89: 
90: `/clear` then:
91: 
92: `/gsd-plan-phase {N}`
93: 
94: ---
95: 
96: **Also available:**
97: - `/gsd-add-phase <description>` — add another phase
98: - Review roadmap
99: 
100: ---
101: ```
102: </step>
103: 
104: </process>
105: 
106: <success_criteria>
107: - [ ] `gsd-sdk query phase.add` executed successfully
108: - [ ] Phase directory created
109: - [ ] Roadmap updated with new phase entry
110: - [ ] STATE.md updated with roadmap evolution note
111: - [ ] User informed of next steps
112: </success_criteria>

(End of file - total 112 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/insert-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entire roadmap.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: integer phase number to insert after
14: - Remaining arguments: phase description
15: 
16: Example: `/gsd-insert-phase 72 Fix critical auth bug`
17: -> after = 72
18: -> description = "Fix critical auth bug"
19: 
20: If arguments missing:
21: 
22: ```
23: ERROR: Both phase number and description required
24: Usage: /gsd-insert-phase <after> <description>
25: Example: /gsd-insert-phase 72 Fix critical auth bug
26: ```
27: 
28: Exit.
29: 
30: Validate first argument is an integer.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${after_phase}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: ```
45: Exit.
46: </step>
47: 
48: <step name="insert_phase">
49: **Delegate the phase insertion to `gsd-sdk query phase.insert`:**
50: 
51: ```bash
52: RESULT=$(gsd-sdk query phase.insert "${after_phase}" "${description}")
53: ```
54: 
55: The CLI handles:
56: - Verifying target phase exists in ROADMAP.md
57: - Calculating next decimal phase number (checking existing decimals on disk)
58: - Generating slug from description
59: - Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
60: - Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker
61: 
62: Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
63: </step>
64: 
65: <step name="update_project_state">
66: Update STATE.md to reflect the inserted phase via SDK handlers (never raw
67: `Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
68: blocks direct STATE.md writes):
69: 
70: 1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
71:    `{decimal_phase}`:
72: 
73:    ```bash
74:    gsd-sdk query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd-plan-phase {decimal_phase}"}'
75:    ```
76: 
77:    (Adjust field names to whatever pointers STATE.md exposes — the handler
78:    reports which fields it matched.)
79: 
80: 2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
81:    `### Roadmap Evolution` subsection under `## Accumulated Context` if missing
82:    and dedupes identical entries:
83: 
84:    ```bash
85:    gsd-sdk query state.add-roadmap-evolution \
86:      --phase {decimal_phase} \
87:      --action inserted \
88:      --after {after_phase} \
89:      --note "{description}" \
90:      --urgent
91:    ```
92: 
93:    Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
94:    (or `{ added: false, reason: "duplicate", entry: ... }` on replay).
95: </step>
96: 
97: <step name="completion">
98: Present completion summary:
99: 
100: ```
101: Phase {decimal_phase} inserted after Phase {after_phase}:
102: - Description: {description}
103: - Directory: .planning/phases/{decimal-phase}-{slug}/
104: - Status: Not planned yet
105: - Marker: (INSERTED) - indicates urgent work
106: 
107: Roadmap updated: .planning/ROADMAP.md
108: Project state updated: .planning/STATE.md
109: 
110: ---
111: 
112: ## Next Up
113: 
114: **Phase {decimal_phase}: {description}** -- urgent insertion
115: 
116: `/clear` then:
117: 
118: `/gsd-plan-phase {decimal_phase}`
119: 
120: ---
121: 
122: **Also available:**
123: - Review insertion impact: Check if Phase {next_integer} dependencies still make sense
124: - Review roadmap
125: 
126: ---
127: ```
128: </step>
129: 
130: </process>
131: 
132: <anti_patterns>
133: 
134: - Don't use this for planned work at end of milestone (use /gsd-add-phase)
135: - Don't insert before Phase 1 (decimal 0.1 makes no sense)
136: - Don't renumber existing phases
137: - Don't modify the target phase content
138: - Don't create plans yet (that's /gsd-plan-phase)
139: - Don't commit changes (user decides when to commit)
140: </anti_patterns>
141: 
142: <success_criteria>
143: Phase insertion is complete when:
144: 
145: - [ ] `gsd-sdk query phase.insert` executed successfully
146: - [ ] Phase directory created
147: - [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
148: - [ ] `gsd-sdk query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
149: - [ ] `gsd-sdk query state.patch` returned matched next-phase pointer field(s)
150: - [ ] User informed of next steps and dependency implications
151: </success_criteria>

(End of file - total 151 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/remove-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Remove an unstarted future phase from the project roadmap, delete its directory, renumber all subsequent phases to maintain a clean linear sequence, and commit the change. The git commit serves as the historical record of removal.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - Argument is the phase number to remove (integer or decimal)
14: - Example: `/gsd-remove-phase 17` → phase = 17
15: - Example: `/gsd-remove-phase 16.1` → phase = 16.1
16: 
17: If no argument provided:
18: 
19: ```
20: ERROR: Phase number required
21: Usage: /gsd-remove-phase <phase-number>
22: Example: /gsd-remove-phase 17
23: ```
24: 
25: Exit.
26: </step>
27: 
28: <step name="init_context">
29: Load phase operation context:
30: 
31: ```bash
32: INIT=$(gsd-sdk query init.phase-op "${target}")
33: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
34: ```
35: 
36: Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.
37: 
38: Also read STATE.md and ROADMAP.md content for parsing current position.
39: </step>
40: 
41: <step name="validate_future_phase">
42: Verify the phase is a future phase (not started):
43: 
44: 1. Compare target phase to current phase from STATE.md
45: 2. Target must be > current phase number
46: 
47: If target <= current phase:
48: 
49: ```
50: ERROR: Cannot remove Phase {target}
51: 
52: Only future phases can be removed:
53: - Current phase: {current}
54: - Phase {target} is current or completed
55: 
56: To abandon current work, use /gsd-pause-work instead.
57: ```
58: 
59: Exit.
60: </step>
61: 
62: <step name="confirm_removal">
63: Present removal summary and confirm:
64: 
65: ```
66: Removing Phase {target}: {Name}
67: 
68: This will:
69: - Delete: .planning/phases/{target}-{slug}/
70: - Renumber all subsequent phases
71: - Update: ROADMAP.md, STATE.md
72: 
73: Proceed? (y/n)
74: ```
75: 
76: Wait for confirmation.
77: </step>
78: 
79: <step name="execute_removal">
80: **Delegate the entire removal operation to `gsd-sdk query phase.remove`:**
81: 
82: ```bash
83: RESULT=$(gsd-sdk query phase.remove "${target}")
84: ```
85: 
86: If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:
87: 
88: ```bash
89: RESULT=$(gsd-sdk query phase.remove "${target}" --force)
90: ```
91: 
92: The CLI handles:
93: - Deleting the phase directory
94: - Renumbering all subsequent directories (in reverse order to avoid conflicts)
95: - Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
96: - Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
97: - Updating STATE.md (decrementing phase count)
98: 
99: Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
100: </step>
101: 
102: <step name="commit">
103: Stage and commit the removal:
104: 
105: ```bash
106: gsd-sdk query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
107: ```
108: 
109: The commit message preserves the historical record of what was removed.
110: </step>
111: 
112: <step name="completion">
113: Present completion summary:
114: 
115: ```
116: Phase {target} ({original-name}) removed.
117: 
118: Changes:
119: - Deleted: .planning/phases/{target}-{slug}/
120: - Renumbered: {N} directories and {M} files
121: - Updated: ROADMAP.md, STATE.md
122: - Committed: chore: remove phase {target} ({original-name})
123: 
124: ---
125: 
126: ## What's Next
127: 
128: Would you like to:
129: - `/gsd-progress` — see updated roadmap status
130: - Continue with current phase
131: - Review roadmap
132: 
133: ---
134: ```
135: </step>
136: 
137: </process>
138: 
139: <anti_patterns>
140: 
141: - Don't remove completed phases (have SUMMARY.md files) without --force
142: - Don't remove current or past phases
143: - Don't manually renumber — use `gsd-sdk query phase.remove` which handles all renumbering
144: - Don't add "removed phase" notes to STATE.md — git commit is the record
145: - Don't modify completed phase directories
146: </anti_patterns>
147: 
148: <success_criteria>
149: Phase removal is complete when:
150: 
151: - [ ] Target phase validated as future/unstarted
152: - [ ] `gsd-sdk query phase.remove` executed successfully
153: - [ ] Changes committed with descriptive message
154: - [ ] User informed of changes
155: </success_criteria>

(End of file - total 155 lines)
</content>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/edit-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Edit any field of an existing phase in ROADMAP.md in place. The phase number and position are always preserved. Guarded against in-progress and completed phases unless --force is passed. Validates depends_on references before writing. Shows a diff and requests confirmation before writing.
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: </required_reading>
8: 
9: <process>
10: 
11: <step name="parse_arguments">
12: Parse the command arguments:
13: - First argument: phase number to edit (integer or decimal)
14: - Optional flag: --force (allow editing in_progress/completed phases)
15: 
16: Examples:
17:   `/gsd-edit-phase 5`       → phase = 5, force = false
18:   `/gsd-edit-phase 5 --force` → phase = 5, force = true
19:   `/gsd-edit-phase 12.1`    → phase = 12.1, force = false
20: 
21: If no argument provided:
22: 
23: ```
24: ERROR: Phase number required
25: Usage: /gsd-edit-phase <phase-number> [--force]
26: Example: /gsd-edit-phase 5
27: Example: /gsd-edit-phase 5 --force
28: ```
29: 
30: Exit.
31: </step>
32: 
33: <step name="init_context">
34: Load phase operation context:
35: 
36: ```bash
37: INIT=$(gsd-sdk query init.phase-op "${target}")
38: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
39: ```
40: 
41: Check `roadmap_exists` from init JSON. If false:
42: ```
43: ERROR: No roadmap found (.planning/ROADMAP.md)
44: Run /gsd-new-project to initialize.
45: ```
46: Exit.
47: </step>
48: 
49: <step name="load_phase">
50: Read the current phase section from ROADMAP.md:
51: 
52: ```bash
53: PHASE_DATA=$(gsd-sdk query roadmap get-phase "${target}")
54: ```
55: 
56: Parse the JSON result. If `found` is false:
57: 
58: ```
59: ERROR: Phase {target} not found in ROADMAP.md
60: 
61: Available phases can be seen with /gsd-progress.
62: ```
63: 
64: Exit.
65: 
66: Extract from the result:
67: - `phase_name` — the phase title
68: - `goal` — the phase goal/description
69: - `success_criteria` — array of criteria
70: - `section` — full raw section text (preserves depends_on, requirements, plans, etc.)
71: 
72: Also parse the full section text to extract additional fields not in the SDK result:
73: - `depends_on` — from `**Depends on:** ...` or `**Depends on**: ...` line
74: - `requirements` — from `**Requirements:** ...` block if present
75: </step>
76: 
77: <step name="check_phase_status">
78: Determine the phase status from disk. Compare against STATE.md current phase:
79: 
80: ```bash
81: ANALYZE=$(gsd-sdk query roadmap analyze)
82: ```
83: 
84: Find the phase entry in the `phases` array. Extract `disk_status`.
85: 
86: Map disk_status to a user-friendly status:
87: - `complete` → status = `completed`
88: - `planned` or `partial` → status = `in_progress`
89: - `empty`, `no_directory`, `discussed`, `researched` → status = `future`
90: 
91: If status is `in_progress` or `completed` AND `--force` was NOT passed:
92: 
93: ```
94: ERROR: Cannot edit Phase {target} — status is {status}
95: 
96: Editing an in-progress or completed phase may invalidate executed plans.
97: 
98: To edit anyway, run:
99:   /gsd-edit-phase {target} --force
100: ```
101: 
102: Exit.
103: 
104: If `--force` was passed and status is `in_progress` or `completed`, continue with a warning printed to the user:
105: 
106: ```
107: WARNING: Editing Phase {target} which is {status}. Proceeding due to --force.
108: ```
109: </step>
110: 
111: <step name="present_current_values">
112: Display the current phase fields clearly:
113: 
114: ```
115: Current values for Phase {target}: {phase_name}
116: 
117: Title:            {phase_name}
118: Goal:             {goal}
119: Depends on:       {depends_on or "(none)"}
120: Requirements:     {requirements or "(none)"}
121: Success Criteria:
122:   1. {criterion_1}
123:   2. {criterion_2}
124:   ...
125: ```
126: 
127: Then ask the user what they want to change:
128: 
129: ```
130: What would you like to do?
131: 
132:   [1] Edit specific fields (title, goal, depends_on, requirements, success_criteria)
133:   [2] Regenerate all fields from a clarified intent
134:   [3] Cancel
135: 
136: Enter choice (1, 2, or 3):
137: ```
138: 
139: Wait for user input.
140: </step>
141: 
142: <step name="collect_edits">
143: 
144: **If user chose [3] Cancel:** Exit cleanly.
145: 
146: **If user chose [1] Edit specific fields:**
147: 
148: Ask which fields to edit. For each field the user wants to change, prompt for the new value. Only fields the user explicitly answers become updates; empty answers preserve the existing value.
149: 
150: ```
151: Which fields do you want to update? (comma-separated or "all")
152: Options: title, goal, depends_on, requirements, success_criteria
153: ```
154: 
155: For each selected field, ask:
156: 
157: ```
158: New value for {field} [current: {current_value}]:
159: ```
160: 
161: Build an `updates` map of {field → new_value} for non-empty answers.
162: 
163: **If user chose [2] Regenerate all from clarified intent:**
164: 
165: Ask the user:
166: 
167: ```
168: Describe the revised intent for Phase {target} (replace the current description):
169: ```
170: 
171: Wait for user input. Use the clarified intent to rewrite all fields:
172: - Generate a clear, concise `title` from the intent
173: - Write a complete `goal` statement
174: - Produce updated `requirements` if the original had them
175: - Generate `success_criteria` (3-5 measurable criteria)
176: - Preserve `depends_on` unless the user explicitly mentioned changing it
177: </step>
178: 
179: <step name="validate_depends_on">
180: If `depends_on` is being updated (or preserved as non-empty), validate that every referenced phase number exists in ROADMAP.md:
181: 
182: ```bash
183: ALL_PHASES=$(gsd-sdk query roadmap analyze)
184: ```
185: 
186: Parse the `phases` array to get all valid phase numbers.
187: 
188: For each phase number referenced in `depends_on`:
189: - Normalize it (strip whitespace, "Phase" prefix if present)
190: - Check it is in the valid phase numbers set
191: - It must not reference itself (phase {target})
192: 
193: If any reference is invalid:
194: 
195: ```
196: ERROR: depends_on references invalid phase(s): {bad_refs}
197: 
198: Valid phase numbers: {valid_list}
199: 
200: Fix the depends_on field and try again.
201: ```
202: 
203: Exit (do not write).
204: </step>
205: 
206: <step name="show_diff_and_confirm">
207: Build the updated phase section by applying the changes to the original `section` text:
208: 
209: - For `title`: replace the heading text after `Phase {N}:`
210: - For `goal`: replace the `**Goal:**` line value
211: - For `depends_on`: replace or add the `**Depends on:**` line
212: - For `requirements`: replace or add the requirements block
213: - For `success_criteria`: replace the numbered list under `**Success Criteria**:`
214: - For full regeneration: rebuild the entire section from the new field values
215: 
216: Show a unified-style diff of old vs. new:
217: 
218: ```
219: Proposed changes to Phase {target}:
220: 
221: --- current
222: +++ updated
223: @@ ...
224: - **Goal:** {old_goal}
225: + **Goal:** {new_goal}
226: ...
227: 
228: Apply these changes? (y/n):
229: ```
230: 
231: Wait for confirmation. If the user says `n`, exit without writing.
232: </step>
233: 
234: <step name="write_updated_phase">
235: Write the updated phase back in place in ROADMAP.md.
236: 
237: Read the full ROADMAP.md content, locate the phase section by its header (`## Phase {N}:` or `### Phase {N}:`), and replace exactly the old section text with the new section text. All content before and after the section (including other phases, milestone headers, and the summary checklist) must be left unchanged.
238: 
239: After writing ROADMAP.md, update STATE.md Roadmap Evolution:
240: 
241: ```bash
242: gsd-sdk query state.add-roadmap-evolution \
243:   --phase {target} \
244:   --action edited \
245:   --note "edited fields: {changed_field_list}"
246: ```
247: </step>
248: 
249: <step name="completion">
250: Present completion summary:
251: 
252: ```
253: Phase {target} updated in ROADMAP.md.
254: 
255: Fields changed: {changed_field_list}
256: 
257: ---
258: 
259: ## What's Next
260: 
261: - `/gsd-progress` — view updated roadmap
262: - `/gsd-plan-phase {target}` — re-plan this phase (if needed)
263: - `/gsd-discuss-phase {target}` — discuss implementation approach
264: 
265: ---
266: ```
267: </step>
268: 
269: </process>
270: 
271: <anti_patterns>
272: - Don't renumber the phase — number and position must be preserved exactly
273: - Don't modify other phases when editing one
274: - Don't skip depends_on validation (invalid references block writes)
275: - Don't write without showing a diff and getting confirmation
276: - Don't edit in_progress/completed phases without --force
277: - Don't use raw Write on ROADMAP.md without reading it first; always replace section in place
278: - Don't modify the phase directory structure — only ROADMAP.md changes
279: - Don't commit the change — that's the user's decision
280: </anti_patterns>
281: 
282: <success_criteria>
283: Edit-phase is complete when:
284: 
285: - [ ] Phase {target} found and loaded from ROADMAP.md
286: - [ ] Status check performed; in_progress/completed blocked without --force
287: - [ ] Current values presented to user
288: - [ ] User chose edit mode (specific fields or full regeneration)
289: - [ ] depends_on references validated; invalid references blocked
290: - [ ] Diff shown and confirmed by user
291: - [ ] Updated phase written back in place; number, position, and status preserved
292: - [ ] STATE.md Roadmap Evolution updated
293: - [ ] User informed of next steps
294: </success_criteria>

(End of file - total 294 lines)
</content>

### Tool: grep

**Input:**
```json
{
  "callID": "call_33qEOJJ034TE4EELebuv0BiR"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_q9kUx0f6nFz6fqefotfKjMFo"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_XivTMoSnMWtj1ehCuhFW92l5"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_1wAJkM64t6tWSdX2VKuqskL6"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-quick"
}
```

**Output:** (pruned)
```
# Skill: gsd-quick
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_F9k8cT8dcGLDMDuYIFsd88dW"
}
```


## USER (turn 60)

**source:** real-human

<objective>
Execute small, ad-hoc tasks with GSD guarantees (atomic commits, STATE.md tracking).

Quick mode is the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
- Quick tasks live in `.planning/quick/` separate from planned phases
- Updates STATE.md "Quick Tasks Completed" table (NOT ROADMAP.md)

**Default:** Skips research, discussion, plan-checker, verifier. Use when you know exactly what to do.

**`--discuss` flag:** Lightweight discussion phase before planning. Surfaces assumptions, clarifies gray areas, captures decisions in CONTEXT.md. Use when the task has ambiguity worth resolving upfront.

**`--full` flag:** Enables the complete quality pipeline — discussion + research + plan-checking + verification. One flag for everything.

**`--validate` flag:** Enables plan-checking (max 2 iterations) and post-execution verification only. Use when you want quality guarantees without discussion or research.

**`--research` flag:** Spawns a focused research agent before planning. Investigates implementation approaches, library options, and pitfalls for the task. Use when you're unsure of the best approach.

Granular flags are composable: `--discuss --research --validate` gives the same result as `--full`.

**Subcommands:**
- `list` — List all quick tasks with status
- `status <slug>` — Show status of a specific quick task
- `resume <slug>` — Resume a specific quick task by slug
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md
</execution_context>

<context>
--research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace.

Context files are resolved inside the workflow (`init quick`) and delegated via `<files_to_read>` blocks.
</context>

<process>

**Parse --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. for subcommands FIRST:**

- If --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. starts with "list": SUBCMD=list
- If --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. starts with "status ": SUBCMD=status, SLUG=remainder (strip whitespace, sanitize)
- If --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. starts with "resume ": SUBCMD=resume, SLUG=remainder (strip whitespace, sanitize)
- Otherwise: SUBCMD=run, pass full --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. to the quick workflow as-is

**Slug sanitization (for status and resume):** Strip any characters not matching `[a-z0-9-]`. Reject slugs longer than 60 chars or containing `..` or `/`. If invalid, output "Invalid session slug." and stop.

## LIST subcommand

When SUBCMD=list:

```bash
ls -d .planning/quick/*/  2>/dev/null
```

For each directory found:
- Check if PLAN.md exists
- Check if SUMMARY.md exists; if so, read `status` from its frontmatter via:
  ```bash
  gsd-sdk query frontmatter.get .planning/quick/{dir}/SUMMARY.md status
  ```
- Determine directory creation date: `stat -f "%SB" -t "%Y-%m-%d"` (macOS) or `stat -c "%w"` (Linux); fall back to the date prefix in the directory name (format: `YYYYMMDD-` prefix)
- Derive display status:
  - SUMMARY.md exists, frontmatter status=complete → `complete ✓`
  - SUMMARY.md exists, frontmatter status=incomplete OR status missing → `incomplete`
  - SUMMARY.md missing, dir created <7 days ago → `in-progress`
  - SUMMARY.md missing, dir created ≥7 days ago → `abandoned? (>7 days, no summary)`

**SECURITY:** Directory names are read from the filesystem. Before displaying any slug, sanitize: strip non-printable characters, ANSI escape sequences, and path separators using: `name.replace(/[^\x20-\x7E]/g, '').replace(/[/\\]/g, '')`. Never pass raw directory names to shell commands via string interpolation.

Display format:
```
Quick Tasks
────────────────────────────────────────────────────────────
slug                           date        status
backup-s3-policy               2026-04-10  in-progress
auth-token-refresh-fix         2026-04-09  complete ✓
update-node-deps               2026-04-08  abandoned? (>7 days, no summary)
────────────────────────────────────────────────────────────
3 tasks (1 complete, 2 incomplete/in-progress)
```

If no directories found: print `No quick tasks found.` and stop.

STOP after displaying the list. Do NOT proceed to further steps.

## STATUS subcommand

When SUBCMD=status and SLUG is set (already sanitized):

Find directory matching `*-{SLUG}` pattern:
```bash
dir=$(ls -d .planning/quick/*-{SLUG}/ 2>/dev/null | head -1)
```

If no directory found, print `No quick task found with slug: {SLUG}` and stop.

Read PLAN.md and SUMMARY.md (if exists) for the given slug. Display:
```
Quick Task: {slug}
─────────────────────────────────────
Plan file: .planning/quick/{dir}/PLAN.md
Status: {status from SUMMARY.md frontmatter, or "no summary yet"}
Description: {first non-empty line from PLAN.md after frontmatter}
Last action: {last meaningful line of SUMMARY.md, or "none"}
─────────────────────────────────────
Resume with: /gsd-quick resume {slug}
```

No agent spawn. STOP after printing.

## RESUME subcommand

When SUBCMD=resume and SLUG is set (already sanitized):

1. Find the directory matching `*-{SLUG}` pattern:
   ```bash
   dir=$(ls -d .planning/quick/*-{SLUG}/ 2>/dev/null | head -1)
   ```
2. If no directory found, print `No quick task found with slug: {SLUG}` and stop.

3. Read PLAN.md to extract description and SUMMARY.md (if exists) to extract status.

4. Print before spawning:
   ```
   [quick] Resuming: .planning/quick/{dir}/
   [quick] Plan: {description from PLAN.md}
   [quick] Status: {status from SUMMARY.md, or "in-progress"}
   ```

5. Load context via:
   ```bash
   gsd-sdk query init.quick
   ```

6. Proceed to execute the quick workflow with resume context, passing the slug and plan directory so the executor picks up where it left off.

## RUN subcommand (default)

When SUBCMD=run:

Execute end-to-end.
Preserve all workflow gates (validation, task description, planning, execution, state updates, commits).

</process>

<notes>
- Quick tasks live in `.planning/quick/` — separate from phases, not tracked in ROADMAP.md
- Each quick task gets a `YYYYMMDD-{slug}/` directory with PLAN.md and eventually SUMMARY.md
- STATE.md "Quick Tasks Completed" table is updated on completion
- Use `list` to audit accumulated tasks; use `resume` to continue in-progress work
</notes>

<security_notes>
- Slugs from --research --validate Correct CP-DT-01 runtime-truth planning artifacts after forensic report .planning/forensics/report-20260518-105705.md. Scope: planning docs only, no src/test changes. Required edits: .planning/STATE.md and .planning/ROADMAP.md must no longer say CP-DT-01 COMPLETE; mark CP-DT-01 RE-OPENED / RUNTIME BLOCKED because @opencode-ai/plugin ToolContext v1.15.4 has no task field and delegate-task depends on invalid context.task seam. Update CP-DT-01-RESEARCH.md, CP-DT-01-PATTERN.md, CP-DT-01-SPEC.md, CP-DT-01-VALIDATION.md, CP-DT-01-GATE-SPEC.md using the forensic report evidence. Preserve original artifacts but add correction sections; do not erase history. Required validation: grep proves all COMPLETE/runtime-ready claims are corrected or explicitly qualified; grep proves ToolContext/no task evidence appears in corrected docs; final output must include next GSD command to create remediation plans preserving 5-plan trace. are sanitized before use in file paths: only [a-z0-9-] allowed, max 60 chars, reject ".." and "/"
- File names from readdir/ls are sanitized before display: strip non-printable chars and ANSI sequences
- Artifact content (plan descriptions, task titles) rendered as plain text only — never executed or passed to agent prompts without DATA_START/DATA_END boundaries
- Status fields read via `gsd-sdk query frontmatter.get` — never eval'd or shell-expanded
</security_notes>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/quick.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute small, ad-hoc tasks with GSD guarantees (atomic commits, STATE.md tracking). Quick mode spawns gsd-planner (quick mode) + gsd-executor(s), tracks tasks in `.planning/quick/`, and updates STATE.md's "Quick Tasks Completed" table.
3: 
4: With `--full` flag: enables the complete quality pipeline — discussion + research + plan-checking + verification. One flag for everything.
5: 
6: With `--validate` flag: enables plan-checking (max 2 iterations) and post-execution verification only. Use when you want quality guarantees without discussion or research.
7: 
8: With `--discuss` flag: lightweight discussion phase before planning. Surfaces assumptions, clarifies gray areas, captures decisions in CONTEXT.md so the planner treats them as locked.
9: 
10: With `--research` flag: spawns a focused research agent before planning. Investigates implementation approaches, library options, and pitfalls. Use when you're unsure how to approach a task.
11: 
12: Granular flags are composable: `--discuss --research --validate` gives the same result as `--full`.
13: </purpose>
14: 
15: <required_reading>
16: Read all files referenced by the invoking prompt's execution_context before starting.
17: </required_reading>
18: 
19: <available_agent_types>
20: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
21: - gsd-phase-researcher — Researches technical approaches for a phase
22: - gsd-planner — Creates detailed plans from phase scope
23: - gsd-plan-checker — Reviews plan quality before execution
24: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
25: - gsd-verifier — Verifies phase completion, checks quality gates
26: - gsd-code-reviewer — Reviews source files for bugs, security issues, and code quality
27: </available_agent_types>
28: 
29: <process>
30: **Step 1: Parse arguments and get task description**
31: 
32: Parse `$ARGUMENTS` for:
33: - `--full` flag → store `$FULL_MODE=true`, `$DISCUSS_MODE=true`, `$RESEARCH_MODE=true`, `$VALIDATE_MODE=true`
34: - `--validate` flag → store `$VALIDATE_MODE=true`
35: - `--discuss` flag → store `$DISCUSS_MODE=true`
36: - `--research` flag → store `$RESEARCH_MODE=true`
37: - Remaining text → use as `$DESCRIPTION` if non-empty
38: 
39: After parsing, normalize: if `$DISCUSS_MODE` and `$RESEARCH_MODE` and `$VALIDATE_MODE` are all true, set `$FULL_MODE=true`. This ensures `--discuss --research --validate` is treated identically to `--full`.
40: 
41: If `$DESCRIPTION` is empty after parsing, prompt user interactively:
42: 
43: 
44: **Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
45: 
46: ```
47: question(
48:   header: "Quick Task",
49:   question: "What do you want to do?",
50:   followUp: null
51: )
52: ```
53: 
54: Store response as `$DESCRIPTION`.
55: 
56: If still empty, re-prompt: "Please provide a task description."
57: 
58: Display banner based on active flags:
59: 
60: If `$FULL_MODE` (all phases enabled — `--full` or all granular flags):
61: ```
62: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
63:  GSD ► QUICK TASK (FULL)
64: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
65: 
66: ◆ Discussion + research + plan checking + verification enabled
67: ```
68: 
69: If `$DISCUSS_MODE` and `$VALIDATE_MODE` (no research):
70: ```
71: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
72:  GSD ► QUICK TASK (DISCUSS + VALIDATE)
73: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
74: 
75: ◆ Discussion + plan checking + verification enabled
76: ```
77: 
78: If `$DISCUSS_MODE` and `$RESEARCH_MODE` (no validate):
79: ```
80: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
81:  GSD ► QUICK TASK (DISCUSS + RESEARCH)
82: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
83: 
84: ◆ Discussion + research enabled
85: ```
86: 
87: If `$RESEARCH_MODE` and `$VALIDATE_MODE` (no discuss):
88: ```
89: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
90:  GSD ► QUICK TASK (RESEARCH + VALIDATE)
91: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
92: 
93: ◆ Research + plan checking + verification enabled
94: ```
95: 
96: If `$DISCUSS_MODE` only:
97: ```
98: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
99:  GSD ► QUICK TASK (DISCUSS)
100: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
101: 
102: ◆ Discussion phase enabled — surfacing gray areas before planning
103: ```
104: 
105: If `$RESEARCH_MODE` only:
106: ```
107: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
108:  GSD ► QUICK TASK (RESEARCH)
109: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
110: 
111: ◆ Research phase enabled — investigating approaches before planning
112: ```
113: 
114: If `$VALIDATE_MODE` only:
115: ```
116: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
117:  GSD ► QUICK TASK (VALIDATE)
118: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
119: 
120: ◆ Plan checking + verification enabled
121: ```
122: 
123: ---
124: 
125: **Step 2: Initialize**
126: 
127: ```bash
128: if ! command -v gsd-sdk &>/dev/null; then
129:   echo "⚠ gsd-sdk not found in PATH — /gsd-quick requires it."
130:   echo ""
131:   echo "Install the query-capable GSD SDK CLI:"
132:   echo "  npm install -g get-shit-done-cc"
133:   echo ""
134:   echo "Or update GSD to get the latest packages:"
135:   echo "  /gsd-update"
136:   exit 1
137: fi
138: ```
139: 
140: ```bash
141: INIT=$(gsd-sdk query init.quick "$DESCRIPTION")
142: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
143: AGENT_SKILLS_PLANNER=$(gsd-sdk query agent-skills gsd-planner)
144: AGENT_SKILLS_EXECUTOR=$(gsd-sdk query agent-skills gsd-executor)
145: AGENT_SKILLS_CHECKER=$(gsd-sdk query agent-skills gsd-plan-checker)
146: AGENT_SKILLS_VERIFIER=$(gsd-sdk query agent-skills gsd-verifier)
147: ```
148: 
149: Parse JSON for: `planner_model`, `executor_model`, `checker_model`, `verifier_model`, `commit_docs`, `branch_name`, `quick_id`, `slug`, `date`, `timestamp`, `quick_dir`, `task_dir`, `roadmap_exists`, `planning_exists`.
150: 
151: ```bash
152: USE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")
153: ```
154: 
155: If the project uses git submodules, worktree isolation is unsafe **only when the quick task touches a submodule path**. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every quick task in a submodule project even when the task was nowhere near a submodule. Parse submodule paths from `.gitmodules` so the executor can act on actual submodule paths rather than the mere file's existence:
156: 
157: ```bash
158: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
159: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths used as
160: # a fail-loud commit-time guard inside the quick-task executor — if the
161: # executor stages any path that falls inside SUBMODULE_PATHS, it must abort
162: # the commit and surface the conflict rather than silently corrupting the
163: # submodule state.
164: if [ -f .gitmodules ]; then
165:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
166: else
167:   SUBMODULE_PATHS=""
168: fi
169: ```
170: 
171: Quick mode does not have a pre-declared `files_modified` list (the task is freeform), so use a fail-loud guard at commit time: when the executor stages files for the quick-task commit, if any staged path falls inside a `SUBMODULE_PATHS` entry, abort with a clear error explaining that worktree-isolated commits cannot safely span submodule boundaries — the user can re-run with `workflow.use_worktrees=false` to fall back to sequential execution on the main tree. If `SUBMODULE_PATHS` is empty (no `.gitmodules` in the repo), worktree isolation proceeds normally.
172: 
173: **If `roadmap_exists` is false:** Error — Quick mode requires an active project with ROADMAP.md. Run `/gsd-new-project` first.
174: 
175: Quick tasks can run mid-phase - validation only checks ROADMAP.md exists, not phase status.
176: 
177: ---
178: 
179: **Step 2.5: Handle quick-task branching**
180: 
181: **If `branch_name` is empty/null:** Skip and continue on the current branch.
182: 
183: **If `branch_name` is set:** Check out the quick-task branch before any planning commits.
184: 
185: The new branch must fork off the project's default branch (`origin/HEAD`), not
186: off whatever HEAD happens to be checked out — otherwise consecutive quick tasks
187: compound on top of each other and stay unpushed (#2916). If `$branch_name`
188: already exists locally, reuse it as-is so resumed work is not rebased.
189: 
190: ```bash
191: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
192: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
193: 
194: if git show-ref --verify --quiet "refs/heads/$branch_name"; then
195:   git switch "$branch_name" \
196:     || { echo "ERROR: Could not switch to existing quick-task branch '$branch_name'." >&2; exit 1; }
197: else
198:   # Fetch the default branch so origin/$DEFAULT_BRANCH is current. If the fetch
199:   # fails (offline, no remote, auth failure) AND we have no local copy of
200:   # origin/$DEFAULT_BRANCH to fall back on, abort — creating the branch off
201:   # arbitrary HEAD is exactly the bug #2916 fixed.
202:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then
203:     if ! git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
204:       echo "ERROR: Could not fetch origin/$DEFAULT_BRANCH and no local copy exists. Refusing to create '$branch_name' off the current HEAD (#2916). Resolve the remote/network issue and retry." >&2
205:       exit 1
206:     fi
207:     echo "WARNING: git fetch origin $DEFAULT_BRANCH failed; using the local copy of origin/$DEFAULT_BRANCH as base." >&2
208:   fi
209: 
210:   if [ -n "$(git status --porcelain)" ]; then
211:     echo "WARNING: Uncommitted changes present. Carrying them onto the new quick-task branch — they will be branched off origin/$DEFAULT_BRANCH (not the previous-task HEAD)."
212:   else
213:     # Best-effort: fast-forward the local default branch so subsequent local
214:     # work sees the latest tip. Failure here is non-fatal because we always
215:     # create the new branch directly from origin/$DEFAULT_BRANCH below.
216:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null \
217:       && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null \
218:       || true
219:   fi
220: 
221:   # Pin the new branch to origin/$DEFAULT_BRANCH so the start point is
222:   # deterministic regardless of which branch we are currently on (#2916).
223:   # On success HEAD is exactly at origin/$DEFAULT_BRANCH, so a post-creation
224:   # merge-base / "ahead-of" guard would be unreachable — the explicit base
225:   # argument here is the single source of correctness for #2916.
226:   git checkout -b "$branch_name" "origin/$DEFAULT_BRANCH" \
227:     || { echo "ERROR: Could not create '$branch_name' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
228: fi
229: ```
230: 
231: All quick-task commits for this run stay on that branch. User handles merge/rebase afterward.
232: 
233: ---
234: 
235: **Step 3: Create task directory**
236: 
237: ```bash
238: mkdir -p "${task_dir}"
239: ```
240: 
241: ---
242: 
243: **Step 4: Create quick task directory**
244: 
245: Create the directory for this quick task:
246: 
247: ```bash
248: QUICK_DIR=".planning/quick/${quick_id}-${slug}"
249: mkdir -p "$QUICK_DIR"
250: ```
251: 
252: Report to user:
253: ```
254: Creating quick task ${quick_id}: ${DESCRIPTION}
255: Directory: ${QUICK_DIR}
256: ```
257: 
258: Store `$QUICK_DIR` for use in orchestration.
259: 
260: ---
261: 
262: **Step 4.5: Discussion phase (only when `$DISCUSS_MODE`)**
263: 
264: Skip this step entirely if NOT `$DISCUSS_MODE`.
265: 
266: Display banner:
267: ```
268: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
269:  GSD ► DISCUSSING QUICK TASK
270: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
271: 
272: ◆ Surfacing gray areas for: ${DESCRIPTION}
273: ```
274: 
275: **4.5a. Identify gray areas**
276: 
277: Analyze `$DESCRIPTION` to identify 2-4 gray areas — implementation decisions that would change the outcome and that the user should weigh in on.
278: 
279: Use the domain-aware heuristic to generate phase-specific (not generic) gray areas:
280: - Something users **SEE** → layout, density, interactions, states
281: - Something users **CALL** → responses, errors, auth, versioning
282: - Something users **RUN** → output format, flags, modes, error handling
283: - Something users **READ** → structure, tone, depth, flow
284: - Something being **ORGANIZED** → criteria, grouping, naming, exceptions
285: 
286: Each gray area should be a concrete decision point, not a vague category. Example: "Loading behavior" not "UX".
287: 
288: **4.5b. Present gray areas**
289: 
290: ```
291: question(
292:   header: "Gray Areas",
293:   question: "Which areas need clarification before planning?",
294:   options: [
295:     { label: "${area_1}", description: "${why_it_matters_1}" },
296:     { label: "${area_2}", description: "${why_it_matters_2}" },
297:     { label: "${area_3}", description: "${why_it_matters_3}" },
298:     { label: "All clear", description: "Skip discussion — I know what I want" }
299:   ],
300:   multiSelect: true
301: )
302: ```
303: 
304: If user selects "All clear" → skip to Step 5 (no CONTEXT.md written).
305: 
306: **4.5c. Discuss selected areas**
307: 
308: For each selected area, ask 1-2 focused questions via question:
309: 
310: ```
311: question(
312:   header: "${area_name}",
313:   question: "${specific_question_about_this_area}",
314:   options: [
315:     { label: "${concrete_choice_1}", description: "${what_this_means}" },
316:     { label: "${concrete_choice_2}", description: "${what_this_means}" },
317:     { label: "${concrete_choice_3}", description: "${what_this_means}" },
318:     { label: "You decide", description: "the agent's discretion" }
319:   ],
320:   multiSelect: false
321: )
322: ```
323: 
324: Rules:
325: - Options must be concrete choices, not abstract categories
326: - Highlight recommended choice where you have a clear opinion
327: - If user selects "Other" with freeform text, switch to plain text follow-up (per questioning.md freeform rule)
328: - If user selects "You decide", capture as the agent's Discretion in CONTEXT.md
329: - Max 2 questions per area — this is lightweight, not a deep dive
330: 
331: Collect all decisions into `$DECISIONS`.
332: 
333: **4.5d. Write CONTEXT.md**
334: 
335: Write `${QUICK_DIR}/${quick_id}-CONTEXT.md` using the standard context template structure:
336: 
337: ```markdown
338: # Quick Task ${quick_id}: ${DESCRIPTION} - Context
339: 
340: **Gathered:** ${date}
341: **Status:** Ready for planning
342: 
343: <domain>
344: ## Task Boundary
345: 
346: ${DESCRIPTION}
347: 
348: </domain>
349: 
350: <decisions>
351: ## Implementation Decisions
352: 
353: ### ${area_1_name}
354: - ${decision_from_discussion}
355: 
356: ### ${area_2_name}
357: - ${decision_from_discussion}
358: 
359: ### the agent's Discretion
360: ${areas_where_user_said_you_decide_or_areas_not_discussed}
361: 
362: </decisions>
363: 
364: <specifics>
365: ## Specific Ideas
366: 
367: ${any_specific_references_or_examples_from_discussion}
368: 
369: [If none: "No specific requirements — open to standard approaches"]
370: 
371: </specifics>
372: 
373: <canonical_refs>
374: ## Canonical References
375: 
376: ${any_specs_adrs_or_docs_referenced_during_discussion}
377: 
378: [If none: "No external specs — requirements fully captured in decisions above"]
379: 
380: </canonical_refs>
381: ```
382: 
383: Note: Quick task CONTEXT.md omits `<code_context>` and `<deferred>` sections (no codebase scouting, no phase scope to defer to). Keep it lean. The `<canonical_refs>` section is included when external docs were referenced — omit it only if no external docs apply.
384: 
385: Report: `Context captured: ${QUICK_DIR}/${quick_id}-CONTEXT.md`
386: 
387: ---
388: 
389: **Step 4.75: Research phase (only when `$RESEARCH_MODE`)**
390: 
391: Skip this step entirely if NOT `$RESEARCH_MODE`.
392: 
393: Display banner:
394: ```
395: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
396:  GSD ► RESEARCHING QUICK TASK
397: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
398: 
399: ◆ Investigating approaches for: ${DESCRIPTION}
400: ```
401: 
402: Spawn a single focused researcher (not 4 parallel researchers like full phases — quick tasks need targeted research, not broad domain surveys):
403: 
404: ```
405: Agent(
406:   prompt="
407: <research_context>
408: 
409: **Mode:** quick-task
410: **Task:** ${DESCRIPTION}
411: **Output:** ${QUICK_DIR}/${quick_id}-RESEARCH.md
412: 
413: <files_to_read>
414: - .planning/STATE.md (Project state — what's already built)
415: - .planning/PROJECT.md (Project context)
416: - ./AGENTS.md (if exists — project-specific guidelines)
417: ${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (User decisions — research should align with these)' : ''}
418: </files_to_read>
419: 
420: ${AGENT_SKILLS_PLANNER}
421: 
422: </research_context>
423: 
424: <focus>
425: This is a quick task, not a full phase. Research should be concise and targeted:
426: 1. Best libraries/patterns for this specific task
427: 2. Common pitfalls and how to avoid them
428: 3. Integration points with existing codebase
429: 4. Any constraints or gotchas worth knowing before planning
430: 
431: Do NOT produce a full domain survey. Target 1-2 pages of actionable findings.
432: </focus>
433: 
434: <output>
435: Write research to: ${QUICK_DIR}/${quick_id}-RESEARCH.md
436: Use standard research format but keep it lean — skip sections that don't apply.
437: Return: ## RESEARCH COMPLETE with file path
438: </output>
439: ",
440:   subagent_type="gsd-phase-researcher",
441:   model="{planner_model}",
442:   description="Research: ${DESCRIPTION}"
443: )
444: ```
445: 
446: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
447: 
448: After researcher returns:
449: 1. Verify research exists at `${QUICK_DIR}/${quick_id}-RESEARCH.md`
450: 2. Report: "Research complete: ${QUICK_DIR}/${quick_id}-RESEARCH.md"
451: 
452: If research file not found, warn but continue: "Research agent did not produce output — proceeding to planning without research."
453: 
454: ---
455: 
456: **Step 5: Spawn planner (quick mode)**
457: 
458: **If `$VALIDATE_MODE`:** Use `quick-full` mode with stricter constraints.
459: 
460: **If NOT `$VALIDATE_MODE`:** Use standard `quick` mode.
461: 
462: ```
463: Agent(
464:   prompt="
465: <planning_context>
466: 
467: **Mode:** ${VALIDATE_MODE ? 'quick-full' : 'quick'}
468: **Directory:** ${QUICK_DIR}
469: **Description:** ${DESCRIPTION}
470: 
471: <files_to_read>
472: - .planning/STATE.md (Project State)
473: - ./AGENTS.md (if exists — follow project-specific guidelines)
474: ${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (User decisions — locked, do not revisit)' : ''}
475: ${RESEARCH_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md (Research findings — use to inform implementation choices)' : ''}
476: </files_to_read>
477: 
478: ${AGENT_SKILLS_PLANNER}
479: 
480: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
481: 
482: </planning_context>
483: 
484: <constraints>
485: - Create a SINGLE plan with 1-3 focused tasks
486: - Quick tasks should be atomic and self-contained
487: ${RESEARCH_MODE ? '- Research findings are available — use them to inform library/pattern choices' : '- No research phase'}
488: ${VALIDATE_MODE ? '- Target ~40% context usage (structured for verification)' : '- Target ~30% context usage (simple, focused)'}
489: ${VALIDATE_MODE ? '- MUST generate `must_haves` in plan frontmatter (truths, artifacts, key_links)' : ''}
490: ${VALIDATE_MODE ? '- Each task MUST have `files`, `action`, `verify`, `done` fields' : ''}
491: </constraints>
492: 
493: <output>
494: Write plan to: ${QUICK_DIR}/${quick_id}-PLAN.md
495: Return: ## PLANNING COMPLETE with plan path
496: </output>
497: ",
498:   subagent_type="gsd-planner",
499:   model="{planner_model}",
500:   description="Quick plan: ${DESCRIPTION}"
501: )
502: ```
503: 
504: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
505: 
506: After planner returns:
507: 1. Verify plan exists at `${QUICK_DIR}/${quick_id}-PLAN.md`
508: 2. Extract plan count (typically 1 for quick tasks)
509: 3. Report: "Plan created: ${QUICK_DIR}/${quick_id}-PLAN.md"
510: 
511: If plan not found, error: "Planner failed to create ${quick_id}-PLAN.md"
512: 
513: ---
514: 
515: **Step 5.5: Plan-checker loop (only when `$VALIDATE_MODE`)**
516: 
517: Skip this step entirely if NOT `$VALIDATE_MODE`.
518: 
519: Display banner:
520: ```
521: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
522:  GSD ► CHECKING PLAN
523: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
524: 
525: ◆ Spawning plan checker...
526: ```
527: 
528: Checker prompt:
529: 
530: ```markdown
531: <verification_context>
532: **Mode:** quick-full
533: **Task Description:** ${DESCRIPTION}
534: 
535: <files_to_read>
536: - ${QUICK_DIR}/${quick_id}-PLAN.md (Plan to verify)
537: </files_to_read>
538: 
539: ${AGENT_SKILLS_CHECKER}
540: 
541: **Scope:** This is a quick task, not a full phase. Skip checks that require a ROADMAP phase goal.
542: </verification_context>
543: 
544: <check_dimensions>
545: - Requirement coverage: Does the plan address the task description?
546: - Task completeness: Do tasks have files, action, verify, done fields?
547: - Key links: Are referenced files real?
548: - Scope sanity: Is this appropriately sized for a quick task (1-3 tasks)?
549: - must_haves derivation: Are must_haves traceable to the task description?
550: 
551: Skip: cross-plan deps (single plan), ROADMAP alignment
552: ${DISCUSS_MODE ? '- Context compliance: Does the plan honor locked decisions from CONTEXT.md?' : '- Skip: context compliance (no CONTEXT.md)'}
553: </check_dimensions>
554: 
555: <expected_output>
556: - ## VERIFICATION PASSED — all checks pass
557: - ## ISSUES FOUND — structured issue list
558: </expected_output>
559: ```
560: 
561: ```
562: Agent(
563:   prompt=checker_prompt,
564:   subagent_type="gsd-plan-checker",
565:   model="{checker_model}",
566:   description="Check quick plan: ${DESCRIPTION}"
567: )
568: ```
569: 
570: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
571: 
572: **Handle checker return:**
573: 
574: - **`## VERIFICATION PASSED`:** Display confirmation, proceed to step 6.
575: - **`## ISSUES FOUND`:** Display issues, check iteration count, enter revision loop.
576: 
577: **Revision loop (max 2 iterations):**
578: 
579: Track `iteration_count` (starts at 1 after initial plan + check).
580: 
581: **If iteration_count < 2:**
582: 
583: Display: `Sending back to planner for revision... (iteration ${N}/2)`
584: 
585: Revision prompt:
586: 
587: ```markdown
588: <revision_context>
589: **Mode:** quick-full (revision)
590: 
591: <files_to_read>
592: - ${QUICK_DIR}/${quick_id}-PLAN.md (Existing plan)
593: </files_to_read>
594: 
595: ${AGENT_SKILLS_PLANNER}
596: 
597: **Checker issues:** ${structured_issues_from_checker}
598: 
599: </revision_context>
600: 
601: <instructions>
602: Make targeted updates to address checker issues.
603: Do NOT replan from scratch unless issues are fundamental.
604: Return what changed.
605: </instructions>
606: ```
607: 
608: ```
609: Agent(
610:   prompt=revision_prompt,
611:   subagent_type="gsd-planner",
612:   model="{planner_model}",
613:   description="Revise quick plan: ${DESCRIPTION}"
614: )
615: ```
616: 
617: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
618: 
619: After planner returns → spawn checker again, increment iteration_count.
620: 
621: **If iteration_count >= 2:**
622: 
623: Display: `Max iterations reached. ${N} issues remain:` + issue list
624: 
625: Offer: 1) Force proceed, 2) Abort
626: 
627: ---
628: 
629: **Step 5.6: Pre-dispatch plan commit (worktree mode only)**
630: 
631: When `USE_WORKTREES !== "false"`, commit PLAN.md to the current branch **before** spawning the executor. This ensures the worktree inherits PLAN.md at its branch HEAD so the executor can read it via a worktree-rooted path — avoiding the main-repo path priming that triggers CC #36182 path-resolution drift.
632: 
633: Skip this step entirely if `USE_WORKTREES === "false"` (non-worktree mode: PLAN.md is committed in Step 8 as usual).
634: 
635: ```bash
636: if [ "${USE_WORKTREES}" != "false" ]; then
637:   COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
638:   if [ "$COMMIT_DOCS" != "false" ]; then
639:     git add "${QUICK_DIR}/${quick_id}-PLAN.md"
640:     # No-op skip if nothing actually staged (idempotent re-runs).
641:     if git diff --cached --quiet -- "${QUICK_DIR}/${quick_id}-PLAN.md"; then
642:       echo "ℹ Pre-dispatch PLAN.md commit skipped (no staged changes)"
643:     else
644:       # Run hooks normally (#2924). If a project opts out via
645:       # workflow.worktree_skip_hooks=true, honor that opt-in only.
646:       SKIP_HOOKS=$(gsd-sdk query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
647:       if [ "$SKIP_HOOKS" = "true" ]; then
648:         git commit --no-verify -m "docs(${quick_id}): pre-dispatch plan for ${DESCRIPTION}" -- "${QUICK_DIR}/${quick_id}-PLAN.md" \
649:           || { echo "ERROR: pre-dispatch PLAN.md commit failed (--no-verify path). Aborting before executor dispatch." >&2; exit 1; }
650:       else
651:         git commit -m "docs(${quick_id}): pre-dispatch plan for ${DESCRIPTION}" -- "${QUICK_DIR}/${quick_id}-PLAN.md" \
652:           || { echo "ERROR: pre-dispatch PLAN.md commit failed — likely a pre-commit hook failure. Fix the hook output above (or set workflow.worktree_skip_hooks=true to bypass) and re-run." >&2; exit 1; }
653:       fi
654:     fi
655:   fi
656: fi
657: ```
658: 
659: ---
660: 
661: **Step 6: Spawn executor**
662: 
663: Capture current HEAD before spawning (used for worktree branch check):
664: ```bash
665: EXPECTED_BASE=$(git rev-parse HEAD)
666: ```
667: 
668: Spawn gsd-executor with plan reference:
669: 
670: ```
671: Agent(
672:   prompt="
673: Execute quick task ${quick_id}.
674: 
675: ${USE_WORKTREES !== "false" ? `
676: <worktree_branch_check>
677: FIRST ACTION before any other work: verify this worktree's HEAD is bound to a per-agent
678: branch and that the branch is based on the correct commit.
679: 
680: Step 1 — HEAD attachment assertion (MANDATORY, runs before any reset/commit):
681:   HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
682:   ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
683:   if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
684:     echo "FATAL: worktree HEAD is on '$ACTUAL_BRANCH' (expected per-agent branch like worktree-agent-*)." >&2
685:     echo "Refusing to commit/reset on a protected ref. DO NOT self-recover via 'git update-ref refs/heads/$ACTUAL_BRANCH' — that destroys concurrent work (#2924)." >&2
686:     echo "Aborting before any commits. Surface as a blocker for human review." >&2
687:     exit 1
688:   fi
689:   if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
690:     echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace (Claude Code's per-agent worktree branch namespace)." >&2
691:     echo "Refusing to commit; surface as blocker (#2924)." >&2
692:     exit 1
693:   fi
694: 
695: Step 2 — Base correctness (only after Step 1 passes):
696:   Run: git merge-base HEAD ${EXPECTED_BASE}
697:   If the result differs from ${EXPECTED_BASE}, hard-reset to the correct base (safe — Step 1 confirmed HEAD is on a per-agent branch and the worktree is fresh):
698:     git reset --hard ${EXPECTED_BASE}
699:   Then verify: if [ "$(git rev-parse HEAD)" != "${EXPECTED_BASE}" ]; then echo "ERROR: Could not correct worktree base"; exit 1; fi
700: 
701: This corrects a known issue where EnterWorktree creates branches from main instead of the feature branch HEAD (#2015) and prevents the destructive HEAD-on-master self-recovery path (#2924).
702: </worktree_branch_check>
703: ` : ''}
704: 
705: <files_to_read>
706: - ${QUICK_DIR}/${quick_id}-PLAN.md (Plan)
707: - .planning/STATE.md (Project state)
708: - ./AGENTS.md (Project instructions, if exists)
709: - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
710: </files_to_read>
711: 
712: ${AGENT_SKILLS_EXECUTOR}
713: 
714: <submodule_commit_guard>
715: SUBMODULE_PATHS for this project: ${SUBMODULE_PATHS}
716: 
717: If SUBMODULE_PATHS is non-empty, you MUST run this fail-loud guard immediately
718: before EVERY git commit you create during this quick task (after \`git add\`,
719: before \`git commit\`). Quick mode does not have a pre-declared files_modified
720: list, so the guard runs at commit time:
721: 
722: \`\`\`bash
723: SUBMODULE_PATHS=\"${SUBMODULE_PATHS}\"
724: if [ -n \"\$SUBMODULE_PATHS\" ]; then
725:   STAGED=\$(git diff --cached --name-only)
726:   for sm_raw in \$SUBMODULE_PATHS; do
727:     sm=\"\${sm_raw#./}\"
728:     sm=\"\${sm%/}\"
729:     [ -z \"\$sm\" ] && continue
730:     for f_raw in \$STAGED; do
731:       f=\"\${f_raw#./}\"
732:       f=\"\${f%/}\"
733:       case \"\$f\" in
734:         \"\$sm\"|\"\$sm\"/*)
735:           echo \"ABORT: staged path \$f_raw falls inside submodule \$sm — worktree-isolated commits cannot safely span submodule boundaries. Re-run with workflow.use_worktrees=false.\" >&2
736:           exit 1 ;;
737:       esac
738:     done
739:   done
740: fi
741: \`\`\`
742: 
743: If the guard aborts, do NOT attempt the commit, do NOT remove the staged files,
744: and do NOT continue subsequent tasks. Surface the abort message in your
745: SUMMARY.md and stop — the user must rerun with worktrees disabled.
746: </submodule_commit_guard>
747: 
748: <constraints>
749: - Execute all tasks in the plan
750: - Commit each task atomically (code changes only)
751: - Run the <submodule_commit_guard> bash block before every \`git commit\` if SUBMODULE_PATHS is non-empty
752: - Create summary at: ${QUICK_DIR}/${quick_id}-SUMMARY.md
753: - Do NOT commit docs artifacts (SUMMARY.md, STATE.md, PLAN.md) — the orchestrator handles the docs commit in Step 8
754: - Do NOT update ROADMAP.md (quick tasks are separate from planned phases)
755: </constraints>
756: ",
757:   subagent_type="gsd-executor",
758:   model="{executor_model}",
759:   ${USE_WORKTREES !== "false" ? 'isolation="worktree",' : ''}
760:   description="Execute: ${DESCRIPTION}"
761: )
762: ```
763: 
764: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
765: 
766: After executor returns:
767: 1. **Worktree cleanup:** If the executor ran with `isolation="worktree"`, merge the worktree branch back and clean up:
768:    ```bash
769:    # Find worktrees created by the executor.
770:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
771:    # `.claude/worktrees/agent-` (the namespace Claude Code's `isolation="worktree"`
772:    # uses). The previous exclusion filter (`grep -v "$(pwd)$"`) destroyed the parent
773:    # workspace's `.git` whenever the workspace itself was a worktree (multi-workspace
774:    # setups, and the cross-drive Windows case where `git worktree list` reports the
775:    # registry path on a different drive than `$(pwd)`).
776:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
777:    while IFS= read -r WT; do
778:      [ -z "$WT" ] && continue
779:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
780:      if [ -n "$WT_BRANCH" ] && [ "$WT_BRANCH" != "HEAD" ]; then
781:        # --- Orchestrator file protection (#1756) ---
782:        # Backup STATE.md and ROADMAP.md before merge (main always wins)
783:        STATE_BACKUP=$(mktemp)
784:        ROADMAP_BACKUP=$(mktemp)
785:        [ -f .planning/STATE.md ] && cp .planning/STATE.md "$STATE_BACKUP" || true
786:        [ -f .planning/ROADMAP.md ] && cp .planning/ROADMAP.md "$ROADMAP_BACKUP" || true
787: 
788:        # Pre-merge deletion guard: block merges that delete tracked .planning/ files
789:        DELETIONS=$(git diff --diff-filter=D --name-only HEAD..."$WT_BRANCH" 2>/dev/null || true)
790:        if [ -n "$DELETIONS" ]; then
791:          echo "BLOCKED: Worktree branch $WT_BRANCH contains file deletions: $DELETIONS"
792:          echo "Review these deletions before merging. If intentional, remove this guard and re-run."
793:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
794:          continue
795:        fi
796: 
797:        git merge "$WT_BRANCH" --no-ff --no-edit -m "chore: merge quick task worktree ($WT_BRANCH)" 2>&1 || {
798:          echo "⚠ Merge conflict from worktree $WT_BRANCH — resolve manually"
799:          echo "  STATE.md backup:   $STATE_BACKUP"
800:          echo "  ROADMAP.md backup: $ROADMAP_BACKUP"
801:          echo "  Restore with: cp \$STATE_BACKUP .planning/STATE.md && cp \$ROADMAP_BACKUP .planning/ROADMAP.md"
802:          break
803:        }
804: 
805:        # Restore orchestrator-owned files
806:        if [ -s "$STATE_BACKUP" ]; then cp "$STATE_BACKUP" .planning/STATE.md; fi
807:        if [ -s "$ROADMAP_BACKUP" ]; then cp "$ROADMAP_BACKUP" .planning/ROADMAP.md; fi
808:        rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
809: 
810:        # Detect files deleted on main but re-added by worktree merge
811:        # (e.g., archived phase directories that were intentionally removed)
812:        # A "resurrected" file must have a deletion event in main's ancestry —
813:        # brand-new files (e.g. SUMMARY.md just created by the agent) have no
814:        # such history and must NOT be removed (#2501, #3195).
815:        DELETED_FILES=$(git diff --diff-filter=A --name-only HEAD~1 -- .planning/ 2>/dev/null || true)
816:        for RESURRECTED in $DELETED_FILES; do
817:          # Only delete if this file was previously tracked on main and then
818:          # deliberately removed (has a deletion event in git history).
819:          WAS_DELETED=$(git log --follow --diff-filter=D --name-only --format="" HEAD~1 -- "$RESURRECTED" 2>/dev/null | grep -c . || true)
820:          if [ "${WAS_DELETED:-0}" -gt 0 ]; then
821:            git rm -f "$RESURRECTED" 2>/dev/null || true
822:          fi
823:        done
824: 
825:        if ! git diff --quiet .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || \
826:           [ -n "$DELETED_FILES" ]; then
827:          COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
828:          if [ "$COMMIT_DOCS" != "false" ]; then
829:            git add .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || true
830:            git commit --amend --no-edit 2>/dev/null || true
831:          fi
832:        fi
833: 
834:        # Safety net: rescue uncommitted SUMMARY.md before worktree removal (#2296, mirrors #2070, #2838).
835:        # Filesystem-level (find + cp) bypasses git's --exclude-standard filter, which silently
836:        # drops .planning/SUMMARY.md when projects gitignore .planning/ — the rescue's prior
837:        # `git ls-files --exclude-standard` form returned empty in that case and the SUMMARY
838:        # was lost on `git worktree remove --force`.
839:        while IFS= read -r SUMMARY; do
840:          [ -z "$SUMMARY" ] && continue
841:          REL_PATH="${SUMMARY#$WT/}"
842:          if [ ! -f "$REL_PATH" ] || ! cmp -s "$SUMMARY" "$REL_PATH"; then
843:            mkdir -p "$(dirname "$REL_PATH")"
844:            cp "$SUMMARY" "$REL_PATH"
845:            echo "⚠ Rescued $REL_PATH from worktree before removal"
846:          fi
847:        done < <(find "$WT/.planning" -name "*SUMMARY.md" 2>/dev/null)
848: 
849:        if ! git worktree remove "$WT" --force; then
850:          WT_NAME=$(basename "$WT")
851:          if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
852:            echo "⚠ Worktree $WT is locked — attempting to unlock and retry"
853:            git worktree unlock "$WT" 2>/dev/null || true
854:            if ! git worktree remove "$WT" --force; then
855:              echo "⚠ Residual worktree at $WT — manual cleanup required after session exits:"
856:              echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
857:            fi
858:          else
859:            echo "⚠ Residual worktree at $WT (remove failed) — investigate manually"
860:          fi
861:        fi
862:        git branch -D "$WT_BRANCH" 2>/dev/null || true
863:      fi
864:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
865:    ```
866:    If `workflow.use_worktrees` is `false`, skip this step.
867: 2. Verify summary exists at `${QUICK_DIR}/${quick_id}-SUMMARY.md`
868: 3. Extract commit hash from executor output
869: 4. Report completion status
870: 
871: **Known Claude Code bug (classifyHandoffIfNeeded):** If executor reports "failed" with error `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a real failure. Check if summary file exists and git log shows commits. If so, treat as successful.
872: 
873: If summary not found, error: "Executor failed to create ${quick_id}-SUMMARY.md"
874: 
875: Note: For quick tasks producing multiple plans (rare), spawn executors in parallel waves per execute-phase patterns.
876: 
877: ---
878: 
879: **Step 6.25: Code review (auto)**
880: 
881: Skip this step entirely if `$FULL_MODE` is false.
882: 
883: **Config gate:**
884: ```bash
885: CODE_REVIEW_ENABLED=$(gsd-sdk query config-get workflow.code_review 2>/dev/null || echo "true")
886: ```
887: If `"false"`, skip with message "Code review skipped (workflow.code_review=false)".
888: 
889: **Scope files from executor's commits:**
890: ```bash
891: # Find the diff base: last commit before quick task started
892: # Use git log to find commits referencing the quick task id, then take the parent of the oldest
893: QUICK_COMMITS=$(git log --oneline --format="%H" --grep="${quick_id}" 2>/dev/null)
894: if [ -n "$QUICK_COMMITS" ]; then
895:   DIFF_BASE=$(echo "$QUICK_COMMITS" | tail -1)^
896:   # Verify parent exists (guard against first commit in repo)
897:   git rev-parse "${DIFF_BASE}" >/dev/null 2>&1 || DIFF_BASE=$(echo "$QUICK_COMMITS" | tail -1)
898: else
899:   # No commits found for this quick task — skip review
900:   DIFF_BASE=""
901: fi
902: 
903: if [ -n "$DIFF_BASE" ]; then
904:   CHANGED_FILES=$(git diff --name-only "${DIFF_BASE}..HEAD" -- . ':!.planning' 2>/dev/null | tr '\n' ' ')
905: else
906:   CHANGED_FILES=""
907: fi
908: ```
909: 
910: If `CHANGED_FILES` is empty, skip with "No source files changed — skipping code review."
911: 
912: **Invoke review:**
913: ```
914: Agent(
915:   prompt="Review these files for bugs, security issues, and code quality.
916:   Files: ${CHANGED_FILES}
917:   Output: ${QUICK_DIR}/${quick_id}-REVIEW.md
918:   Depth: quick",
919:   subagent_type="gsd-code-reviewer",
920:   model="{executor_model}"
921: )
922: ```
923: 
924: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
925: 
926: If review produces findings, display advisory message. **Error handling:** Failures are non-blocking — catch and proceed.
927: 
928: ---
929: 
930: **Step 6.5: Verification (only when `$VALIDATE_MODE`)**
931: 
932: Skip this step entirely if NOT `$VALIDATE_MODE`.
933: 
934: Display banner:
935: ```
936: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
937:  GSD ► VERIFYING RESULTS
938: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
939: 
940: ◆ Spawning verifier...
941: ```
942: 
943: ```
944: Agent(
945:   prompt="Verify quick task goal achievement.
946: Task directory: ${QUICK_DIR}
947: Task goal: ${DESCRIPTION}
948: 
949: <files_to_read>
950: - ${QUICK_DIR}/${quick_id}-PLAN.md (Plan)
951: </files_to_read>
952: 
953: ${AGENT_SKILLS_VERIFIER}
954: 
955: Check must_haves against actual codebase. Create VERIFICATION.md at ${QUICK_DIR}/${quick_id}-VERIFICATION.md.",
956:   subagent_type="gsd-verifier",
957:   model="{verifier_model}",
958:   description="Verify: ${DESCRIPTION}"
959: )
960: ```
961: 
962: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
963: 
964: Read verification status:
965: ```bash
966: grep "^status:" "${QUICK_DIR}/${quick_id}-VERIFICATION.md" | cut -d: -f2 | tr -d ' '
967: ```
968: 
969: Store as `$VERIFICATION_STATUS`.
970: 
971: | Status | Action |
972: |--------|--------|
973: | `passed` | Store `$VERIFICATION_STATUS = "Verified"`, continue to step 7 |
974: | `human_needed` | Display items needing manual check, store `$VERIFICATION_STATUS = "Needs Review"`, continue |
975: | `gaps_found` | Display gap summary, offer: 1) Re-run executor to fix gaps, 2) Accept as-is. Store `$VERIFICATION_STATUS = "Gaps"` |
976: 
977: ---
978: 
979: **Step 7: Update STATE.md**
980: 
981: Update STATE.md with quick task completion record.
982: 
983: **7a. Check if "Quick Tasks Completed" section exists:**
984: 
985: Read STATE.md and check for `### Quick Tasks Completed` section.
986: 
987: **7b. If section doesn't exist, create it:**
988: 
989: Insert after `### Blockers/Concerns` section:
990: 
991: **If `$VALIDATE_MODE`:**
992: ```markdown
993: ### Quick Tasks Completed
994: 
995: | # | Description | Date | Commit | Status | Directory |
996: |---|-------------|------|--------|--------|-----------|
997: ```
998: 
999: **If NOT `$VALIDATE_MODE`:**
1000: ```markdown
1001: ### Quick Tasks Completed
1002: 
1003: | # | Description | Date | Commit | Directory |
1004: |---|-------------|------|--------|-----------|
1005: ```
1006: 
1007: **Note:** If the table already exists, match its existing column format. If adding `--validate` (or `--full`) to a project that already has quick tasks without a Status column, add the Status column to the header and separator rows, and leave Status empty for the new row's predecessors.
1008: 
1009: **7c. Append new row to table:**
1010: 
1011: Use `date` from init:
1012: 
1013: **If `$VALIDATE_MODE` (or table has Status column):**
1014: ```markdown
1015: | ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | ${VERIFICATION_STATUS} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
1016: ```
1017: 
1018: **If NOT `$VALIDATE_MODE` (and table has no Status column):**
1019: ```markdown
1020: | ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
1021: ```
1022: 
1023: **7d. Update "Last activity" line:**
1024: 
1025: Use `date` from init:
1026: ```
1027: Last activity: ${date} - Completed quick task ${quick_id}: ${DESCRIPTION}
1028: ```
1029: 
1030: Use Edit tool to make these changes atomically
1031: 
1032: ---
1033: 
1034: **Step 8: Final commit and completion**
1035: 
1036: Stage and commit quick task artifacts. This step MUST always run — even if the executor already committed some files (e.g. when running without worktree isolation). The `gsd-sdk query commit` command (or legacy `gsd-tools.cjs` commit) handles already-committed files gracefully.
1037: 
1038: Build file list:
1039: - `${QUICK_DIR}/${quick_id}-PLAN.md`
1040: - `${QUICK_DIR}/${quick_id}-SUMMARY.md`
1041: - `.planning/STATE.md`
1042: - If `$DISCUSS_MODE` and context file exists: `${QUICK_DIR}/${quick_id}-CONTEXT.md`
1043: - If `$RESEARCH_MODE` and research file exists: `${QUICK_DIR}/${quick_id}-RESEARCH.md`
1044: - If `$VALIDATE_MODE` and verification file exists: `${QUICK_DIR}/${quick_id}-VERIFICATION.md`
1045: - If `${QUICK_DIR}/${quick_id}-deferred-items.md` exists: `${QUICK_DIR}/${quick_id}-deferred-items.md`
1046: 
1047: ```bash
1048: # Explicitly stage all artifacts before commit — PLAN.md may be untracked
1049: # if the executor ran without worktree isolation and committed docs early
1050: # Filter .planning/ files from staging if commit_docs is disabled (#1783)
1051: COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
1052: if [ "$COMMIT_DOCS" = "false" ]; then
1053:   file_list_filtered=$(echo "${file_list}" | tr ' ' '\n' | grep -v '^\.planning/' | tr '\n' ' ')
1054:   git add ${file_list_filtered} 2>/dev/null
1055: else
1056:   git add ${file_list} 2>/dev/null
1057: fi
1058: gsd-sdk query commit "docs(quick-${quick_id}): ${DESCRIPTION}" --files ${file_list}
1059: ```
1060: 
1061: Get final commit hash:
1062: ```bash
1063: commit_hash=$(git rev-parse --short HEAD)
1064: ```
1065: 
1066: Display completion output:
1067: 
1068: **If `$VALIDATE_MODE`:**
1069: ```
1070: ---
1071: 
1072: GSD > QUICK TASK COMPLETE (VALIDATED)
1073: 
1074: Quick Task ${quick_id}: ${DESCRIPTION}
1075: 
1076: ${RESEARCH_MODE ? 'Research: ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
1077: Summary: ${QUICK_DIR}/${quick_id}-SUMMARY.md
1078: Verification: ${QUICK_DIR}/${quick_id}-VERIFICATION.md (${VERIFICATION_STATUS})
1079: Commit: ${commit_hash}
1080: 
1081: ---
1082: 
1083: Ready for next task: /gsd-quick ${GSD_WS}
1084: ```
1085: 
1086: **If NOT `$VALIDATE_MODE`:**
1087: ```
1088: ---
1089: 
1090: GSD > QUICK TASK COMPLETE
1091: 
1092: Quick Task ${quick_id}: ${DESCRIPTION}
1093: 
1094: ${RESEARCH_MODE ? 'Research: ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
1095: Summary: ${QUICK_DIR}/${quick_id}-SUMMARY.md
1096: Commit: ${commit_hash}
1097: 
1098: ---
1099: 
1100: Ready for next task: /gsd-quick ${GSD_WS}
1101: ```
1102: 
1103: </process>
1104: 
1105: <success_criteria>
1106: - [ ] ROADMAP.md validation passes
1107: - [ ] User provides task description
1108: - [ ] `--full`, `--validate`, `--discuss`, and `--research` flags parsed from arguments when present
1109: - [ ] `--full` sets all booleans (`$FULL_MODE`, `$DISCUSS_MODE`, `$RESEARCH_MODE`, `$VALIDATE_MODE`)
1110: - [ ] Slug generated (lowercase, hyphens, max 40 chars)
1111: - [ ] Quick ID generated (YYMMDD-xxx format, 2s Base36 precision)
1112: - [ ] Directory created at `.planning/quick/YYMMDD-xxx-slug/`
1113: - [ ] (--discuss) Gray areas identified and presented, decisions captured in `${quick_id}-CONTEXT.md`
1114: - [ ] (--research) Research agent spawned, `${quick_id}-RESEARCH.md` created
1115: - [ ] `${quick_id}-PLAN.md` created by planner (honors CONTEXT.md decisions when --discuss, uses RESEARCH.md findings when --research)
1116: - [ ] (--validate) Plan checker validates plan, revision loop capped at 2
1117: - [ ] `${quick_id}-SUMMARY.md` created by executor
1118: - [ ] (--validate) `${quick_id}-VERIFICATION.md` created by verifier
1119: - [ ] STATE.md updated with quick task row (Status column when --validate)
1120: - [ ] Artifacts committed
1121: </success_criteria>

(End of file - total 1121 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>

### Tool: glob

**Input:**
```json
{
  "callID": "call_uNgFxc8isRL0u9i2uEzDxvRT"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_lmEW8MPjnJVuOKKEhNtUWmDR"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_gqaSRlBuigm9B9NgVI24SLBI"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ahK2aLGGtQBtu4rDSJlHFScY"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_mmpxSFly523drWLESkNzPeZV"
}
```


## USER (turn 61)

**source:** real-human

linh động và manual đi gsd command chỉ mang tính hướng dẫn hãy xác định goal cuối cùng là gì 

## COMPACTED (2026-05-18T11:03:14.529Z)

**raw_event:**

```json
{
  "id": "evt_e3ac11b4d001uZHEGCZuX6l7Fu",
  "type": "session.compacted",
  "properties": {
    "sessionID": "ses_1c857a177ffeYERktxuHRawNcX"
  }
}
```

**Continuity index:** See `session-continuity.json` for active delegations and pending work at time of compaction.

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


## USER (turn 62)

**source:** real-human

đây là goal cuối cùng "vậy route gsd để chỉnh sửa lại các tài liệu này cho đúng và từ đó truy vết từ các summary và implement và sửa lại code và test theo trình tự 5 plan - sử dụng execute slash command để append các workflow và commands gsd trực tiếp tại đây, các hệ quả là delegation task tool tới agents nào sẽ được tự hướng dẫn qua các command đó tới gsd agent tương ứng "

### Tool: skill

**Input:**
```json
{
  "name": "gsd-quick"
}
```

**Output:** (pruned)
```
# Skill: gsd-quick
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_OtBOXw4ffcDofsOuGAoisdGo"
}
```


### Tool: hivemind-command-engine

**Input:**
```json
{
  "callID": "call_dF8rDObKx0jnAVpCS4lOfwVV"
}
```


## USER (turn 63)

**source:** real-human

đây là toàn bộ regresssion /Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-LIFECYCLE.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-FIX.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-ITER2.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md  plan thêm trong đây như là gaps

## USER (turn 64)

**source:** real-human

đây là toàn bộ regresssion /Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/.gitkeep
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-01-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-CONTEXT.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-LIFECYCLE.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-FIX.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW-ITER2.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-REVIEW.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md
/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md  plan thêm trong đây như là gaps

### Tool: skill

**Input:**
```json
{
  "name": "gsd-plan-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-plan-phase
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_s56wiQgKKXK7KmGe36NhuG8G"
}
```


## USER (turn 65)

**source:** real-human

@gsd-planner /gsd-plan-phase CP-DT-01 --gaps --skip-research --text --prd .planning/forensics/report-20260518-105705.md

### Tool: skill

**Input:**
```json
{
  "name": "writing-plans"
}
```

**Output:** (pruned)
```
# Skill: writing-plans
```


## USER (turn 66)

**source:** real-human

<objective>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification.

**Default flow:** Research (if needed) → Plan → Verify → Done

**Research-only mode (`--research-phase <N>`):** Spawn `gsd-phase-researcher` for phase `N`, write `RESEARCH.md`, then exit before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops where iterating on research alone is dramatically cheaper than re-spawning the planner. Replaces the deleted `/gsd-research-phase` command (#3042).

**Research-only modifiers:**
- **No flag** — when `RESEARCH.md` already exists, prompt the user to choose `update / view / skip`.
- **`--research`** — force-refresh: re-spawn the researcher unconditionally, no prompt. Skips the existing-RESEARCH.md menu.
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout. Does not spawn the researcher. Cheapest mode for the correction-without-replanning loop. If no `RESEARCH.md` exists yet, errors with a hint to drop `--view`.

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), spawn gsd-planner, verify with gsd-plan-checker, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API. Do not skip questioning steps because `question` appears unavailable; use `vscode_askquestions` instead.
</runtime_note>

<context>
Phase number: CP-DT-01 --gaps (optional — auto-detects next unplanned phase if omitted)

**Flags:**
- `--research` — Force re-research even if RESEARCH.md exists
- `--skip-research` — Skip research, go straight to planning
- `--gaps` — Gap closure mode (reads VERIFICATION.md, skips research)
- `--skip-verify` — Skip verification loop
- `--prd <file>` — Use a PRD/acceptance criteria file instead of discuss-phase. Parses requirements into CONTEXT.md automatically. Skips discuss-phase entirely.
- `--reviews` — Replan incorporating cross-AI review feedback from REVIEWS.md (produced by `/gsd-review`)
- `--text` — Use plain-text numbered lists instead of TUI menus (required for `/rc` remote sessions)
- `--mvp` — Vertical MVP mode. Planner organizes tasks as feature slices (UI→API→DB) instead of horizontal layers. On Phase 1 of a new project, also emits `SKELETON.md` (Walking Skeleton). Can be persisted on a phase via `**Mode:** mvp` in ROADMAP.md.

Normalize phase input in step 2 before any directory lookups.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/plan-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a revision loop (max 3 iterations).
3: </purpose>
4: 
5: <required_reading>
6: Read all files referenced by the invoking prompt's execution_context before starting.
7: 
8: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
9: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/revision-loop.md
10: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
11: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
12: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
13: </required_reading>
14: 
15: <available_agent_types>
16: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
17: - gsd-phase-researcher — Researches technical approaches for a phase
18: - gsd-pattern-mapper — Analyzes codebase for existing patterns, produces PATTERNS.md
19: - gsd-planner — Creates detailed plans from phase scope
20: - gsd-plan-checker — Reviews plan quality before execution
21: </available_agent_types>
22: 
23: <process>
24: 
25: ## 0. Git Branch Invariant
26: 
27: **Do not create, rename, or switch git branches during plan-phase.** Branch identity is established at discuss-phase and is owned by the user's git workflow. A phase rename in ROADMAP.md is a plan-level change only — it does not mutate git branch names. If `phase_slug` in the init JSON differs from the current branch name, that is expected and correct; leave the branch unchanged.
28: 
29: ## 1. Initialize
30: 
31: Load all context in one call (paths only to minimize orchestrator context):
32: 
33: ```bash
34: INIT=$(gsd-sdk query init.plan-phase "$PHASE")
35: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
36: AGENT_SKILLS_RESEARCHER=$(gsd-sdk query agent-skills gsd-phase-researcher)
37: AGENT_SKILLS_PLANNER=$(gsd-sdk query agent-skills gsd-planner)
38: AGENT_SKILLS_CHECKER=$(gsd-sdk query agent-skills gsd-plan-checker)
39: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
40: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
41: MVP_MODE_CFG=$(gsd-sdk query config-get workflow.mvp_mode 2>/dev/null || echo "false")
42: ```
43: 
44: When `TDD_MODE` is `true`, the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The planner's `<required_reading>` is extended to include `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md` so gate enforcement rules are available during planning.
45: 
46: When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardless of recency (e.g., Phase 7 declaring `Depends on: Phase 2` always sees Phase 2's context). Bounded recency keeps the planner's context budget focused on recent work.
47: 
48: Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
49: 
50: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
51: 
52: **File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.
53: 
54: **If `planning_exists` is false:** Error — run `/gsd-new-project` first.
55: 
56: ## 2. Parse and Normalize Arguments
57: 
58: Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--reviews`, `--text`, `--bounce`, `--skip-bounce`, `--chunked`, `--mvp`).
59: 
60: **`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only — the planner spawn (step 8), plan-checker, verification, gaps, bounce, and post-planning-gaps blocks all skip on `RESEARCH_ONLY`. Use this for cross-phase research, doc review before committing to a planning approach, and correction-without-replanning loops. Replaces the deleted `/gsd-research-phase` command.
61: 
62: In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:
63: 
64: - **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
65: - **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.
66: 
67: ```bash
68: RESEARCH_ONLY=false
69: VIEW_ONLY=false
70: if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
71:   RESEARCH_ONLY=true
72:   PHASE="${BASH_REMATCH[1]}"
73: fi
74: if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
75:   VIEW_ONLY=true
76: fi
77: ```
78: 
79: Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for Claude Code remote sessions (`/rc` mode) where TUI menus don't work through the the agent App.
80: 
81: **MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-implement the chain.
82: 
83: ```bash
84: MVP_FLAG_ARG=""
85: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
86: ```
87: 
88: Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation).
89: The verb returns `true|false`. Full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostics. The mode is **all-or-nothing per phase** (PRD decision Q1) — never selective per task.
90: 
91: **Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:
92: 
93: ```bash
94: WALKING_SKELETON=false
95: if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
96:   PRIOR_SUMMARIES=$(gsd-sdk query phases.list --pick summaries_total 2>/dev/null || echo "0")
97:   if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
98: fi
99: ```
100: 
101: When `WALKING_SKELETON=true`:
102: - Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/skeleton-template.md`.
103: - The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.
104: 
105: **Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are active on Phase 1 of a new project, the planner receives `WALKING_SKELETON=true` and PRD-derived context simultaneously — the PRD informs *what the skeleton should prove*. No precedence is needed; the two signals are orthogonal. See [`references/mvp-concepts.md`](../references/mvp-concepts.md) for the broader interaction map.
106: 
107: Extract `--prd <filepath>` from $ARGUMENTS. If present, set PRD_FILE to the filepath.
108: 
109: **If no phase number:** Detect next unplanned phase from roadmap.
110: 
111: **If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `phase_slug` and `padded_phase` from init:
112: ```bash
113: mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
114: ```
115: 
116: **Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.
117: 
118: Set `CHUNKED_MODE` from flag or config:
119: ```bash
120: CHUNKED_CFG=$(gsd-sdk query config-get workflow.plan_chunked 2>/dev/null || echo "false")
121: CHUNKED_MODE=false
122: if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
123:   CHUNKED_MODE=true
124: fi
125: ```
126: 
127: ## 2.5. Validate `--reviews` Prerequisite
128: 
129: **Skip if:** No `--reviews` flag.
130: 
131: **If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.
132: 
133: **If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**
134: 
135: Error:
136: ```
137: No REVIEWS.md found for Phase {N}. Run reviews first:
138: 
139: /gsd-review --phase {N}
140: 
141: Then re-run /gsd-plan-phase {N} --reviews
142: ```
143: Exit workflow.
144: 
145: ## 3. Validate Phase
146: 
147: ```bash
148: PHASE_INFO=$(gsd-sdk query roadmap.get-phase "${PHASE}")
149: ```
150: 
151: **If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.
152: 
153: Now that `PHASE` is finalized, resolve MVP mode:
154: ```bash
155: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)
156: ```
157: 
158: ## 3.5. Handle PRD Express Path
159: 
160: **Skip if:** No `--prd` flag in arguments.
161: 
162: **If `--prd <filepath>` provided:**
163: 
164: 1. Read the PRD file:
165: ```bash
166: PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
167: if [ -z "$PRD_CONTENT" ]; then
168:   echo "Error: PRD file not found: $PRD_FILE"
169:   exit 1
170: fi
171: ```
172: 
173: 2. Display banner:
174: ```
175: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
176:  GSD ► PRD EXPRESS PATH
177: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
178: 
179: Using PRD: {PRD_FILE}
180: Generating CONTEXT.md from requirements...
181: ```
182: 
183: 3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
184:    - Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
185:    - Map each to a locked decision (everything in the PRD is treated as a locked decision)
186:    - Identify any areas the PRD doesn't cover and mark as "the agent's Discretion"
187:    - **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
188:    - Create CONTEXT.md in the phase directory
189: 
190: 4. Write CONTEXT.md:
191: ```markdown
192: # Phase [X]: [Name] - Context
193: 
194: **Gathered:** [date]
195: **Status:** Ready for planning
196: **Source:** PRD Express Path ({PRD_FILE})
197: 
198: <domain>
199: ## Phase Boundary
200: 
201: [Extracted from PRD — what this phase delivers]
202: 
203: </domain>
204: 
205: <decisions>
206: ## Implementation Decisions
207: 
208: {For each requirement/story/criterion in the PRD:}
209: ### [Category derived from content]
210: - [Requirement as locked decision]
211: 
212: ### the agent's Discretion
213: [Areas not covered by PRD — implementation details, technical choices]
214: 
215: </decisions>
216: 
217: <canonical_refs>
218: ## Canonical References
219: 
220: **Downstream agents MUST read these before planning or implementing.**
221: 
222: [MANDATORY. Extract from ROADMAP.md and any docs referenced in the PRD.
223: Use full relative paths. Group by topic area.]
224: 
225: ### [Topic area]
226: - `path/to/spec-or-adr.md` — [What it decides/defines]
227: 
228: [If no external specs: "No external specs — requirements fully captured in decisions above"]
229: 
230: </canonical_refs>
231: 
232: <specifics>
233: ## Specific Ideas
234: 
235: [Any specific references, examples, or concrete requirements from PRD]
236: 
237: </specifics>
238: 
239: <deferred>
240: ## Deferred Ideas
241: 
242: [Items in PRD explicitly marked as future/v2/out-of-scope]
243: [If none: "None — PRD covers phase scope"]
244: 
245: </deferred>
246: 
247: ---
248: 
249: *Phase: XX-name*
250: *Context gathered: [date] via PRD Express Path*
251: ```
252: 
253: 5. Commit:
254: ```bash
255: gsd-sdk query commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
256: ```
257: 
258: 6. Set `context_content` to the generated CONTEXT.md content and continue to step 5 (Handle Research).
259: 
260: **Effect:** This completely bypasses step 4 (Load CONTEXT.md) since we just created it. The rest of the workflow (research, planning, verification) proceeds normally with the PRD-derived context.
261: 
262: ## 4. Load CONTEXT.md
263: 
264: **Skip if:** PRD express path was used (CONTEXT.md already created in step 3.5).
265: 
266: Check `context_path` from init JSON.
267: 
268: If `context_path` is not null, display: `Using phase context from: ${context_path}`
269: 
270: **If `context_path` is null (no CONTEXT.md exists):**
271: 
272: Read discuss mode for context gate label:
273: ```bash
274: DISCUSS_MODE=$(gsd-sdk query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")
275: ```
276: 
277: If `TEXT_MODE` is true, present as a plain-text numbered list:
278: ```
279: No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included.
280: 
281: 1. Continue without context — Plan using research + requirements only
282: [If DISCUSS_MODE is "assumptions":]
283: 2. Gather context (assumptions mode) — Analyze codebase and surface assumptions before planning
284: [If DISCUSS_MODE is "discuss" or unset:]
285: 2. Run discuss-phase first — Capture design decisions before planning
286: 
287: Enter number:
288: ```
289: 
290: Otherwise use question:
291: - header: "No context"
292: - question: "No CONTEXT.md found for Phase {X}. Plans will use research and requirements only — your design preferences won't be included. Continue or capture context first?"
293: - options:
294:   - "Continue without context" — Plan using research + requirements only
295:   If `DISCUSS_MODE` is `"assumptions"`:
296:   - "Gather context (assumptions mode)" — Analyze codebase and surface assumptions before planning
297:   If `DISCUSS_MODE` is `"discuss"` (or unset):
298:   - "Run discuss-phase first" — Capture design decisions before planning
299: 
300: If "Continue without context": Proceed to step 5.
301: If "Run discuss-phase first":
302:   **IMPORTANT:** Do NOT invoke discuss-phase as a nested Skill/Task call — question
303:   does not work correctly in nested subcontexts (#1009). Instead, display the command
304:   and exit so the user runs it as a top-level command:
305:   ```
306:   Run this command first, then re-run /gsd-plan-phase {X} ${GSD_WS}:
307: 
308:   /gsd-discuss-phase {X} ${GSD_WS}
309:   ```
310:   **Exit the plan-phase workflow. Do not continue.**
311: 
312: ## 4.5. Check AI-SPEC
313: 
314: **Skip if:** `ai_integration_phase_enabled` from config is false, or `--skip-ai-spec` flag provided.
315: 
316: ```bash
317: AI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-AI-SPEC.md 2>/dev/null | head -1)
318: AI_PHASE_CFG=$(gsd-sdk query config-get workflow.ai_integration_phase 2>/dev/null || echo "true")
319: ```
320: 
321: **Skip if `AI_PHASE_CFG` is `false`.**
322: 
323: **If `AI_SPEC_FILE` is empty:** Check phase goal for AI keywords:
324: ```bash
325: echo "${phase_goal}" | grep -qi "agent\|llm\|rag\|chatbot\|embedding\|langchain\|llamaindex\|crewai\|langgraph\|openai\|anthropic\|vector\|eval\|ai system"
326: ```
327: 
328: **If AI keywords detected AND no AI-SPEC.md:**
329: ```
330: ◆ Note: This phase appears to involve AI system development.
331:   Consider running /gsd-ai-integration-phase {N} before planning to:
332:   - Select the right framework for your use case
333:   - Research its docs and best practices
334:   - Design an evaluation strategy
335: 
336:   Continue planning without AI-SPEC? (non-blocking — /gsd-ai-integration-phase can be run after)
337: ```
338: 
339: Use question with options:
340: - "Continue — plan without AI-SPEC"
341: - "Stop — I'll run /gsd-ai-integration-phase {N} first"
342: 
343: If "Stop": Exit with `/gsd-ai-integration-phase {N}` reminder.
344: If "Continue": Proceed. (Non-blocking — planner will note AI-SPEC is absent.)
345: 
346: **If `AI_SPEC_FILE` is non-empty:** Extract framework for planner context:
347: ```bash
348: FRAMEWORK_LINE=$(grep "Selected Framework:" "${AI_SPEC_FILE}" | head -1)
349: ```
350: Pass `ai_spec_path` and `framework_line` to planner in step 7 so it can reference the AI design contract.
351: 
352: ## 5. Handle Research
353: 
354: **Skip if:** `--gaps` flag or `--skip-research` flag or `--reviews` flag.
355: 
356: ### 5.0. Research-Only Modifiers (`--view`, `--research`, prompt)
357: 
358: **Skip if:** `RESEARCH_ONLY` is `false`.
359: 
360: Three branches in research-only mode (`--research-phase <N>`):
361: 
362: 1. **`--view`** (or user picks "View" in the prompt below): print `RESEARCH.md` to stdout, no spawn, exit. If `RESEARCH.md` is missing, error with: `--view requires an existing RESEARCH.md; drop --view to spawn the researcher.`
363: 2. **`--research`** (force-refresh): re-spawn researcher unconditionally — fall through to "Spawn gsd-phase-researcher" below.
364: 3. **Neither flag AND `has_research=true`:** emit `RESEARCH.md already exists for Phase ${PHASE}.` and prompt the user with three choices: `1. Update — re-spawn researcher and refresh RESEARCH.md`, `2. View — print existing RESEARCH.md and exit (no spawn)`, `3. Skip — exit without spawning or printing`. Map "Update" → fall through to spawn, "View" → set `VIEW_ONLY=true` and emit RESEARCH.md as in (1), "Skip" → exit cleanly. Mirrors the deleted `/gsd-research-phase` standalone's existing-artifact menu (#3042 parity).
365: 
366: ```bash
367: if [[ "$VIEW_ONLY" == "true" ]]; then
368:   [[ -f "$research_path" ]] || { echo "Error: --view requires an existing RESEARCH.md (Phase ${PHASE}). Drop --view to spawn the researcher."; exit 1; }
369:   cat "$research_path"; exit 0
370: fi
371: ```
372: 
373: ### 5.1. Standard Research Decision
374: 
375: **Skip if** `RESEARCH_ONLY=true` (the research-only mode in 5.0 already determined the path: spawn or exit). Without this guard, an LLM following the workflow could fall through into "use existing, skip to step 6" → planner spawn, violating the research-only contract. **CR #3045 finding: this gate makes the early-exit unreachable from any non-research-only branch.**
376: 
377: **If `has_research` is true (from init) AND no `--research` flag:** Use existing, skip to step 6.
378: 
379: **If RESEARCH.md missing OR `--research` flag:**
380: 
381: **If no explicit flag (`--research` or `--skip-research`) and not `--auto`:**
382: Ask the user whether to research, with a contextual recommendation based on the phase:
383: 
384: If `TEXT_MODE` is true, present as a plain-text numbered list:
385: ```
386: Research before planning Phase {X}: {phase_name}?
387: 
388: 1. Research first (Recommended) — Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes.
389: 2. Skip research — Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks.
390: 
391: Enter number:
392: ```
393: 
394: Otherwise use question:
395: ```
396: question([
397:   {
398:     question: "Research before planning Phase {X}: {phase_name}?",
399:     header: "Research",
400:     multiSelect: false,
401:     options: [
402:       { label: "Research first (Recommended)", description: "Investigate domain, patterns, and dependencies before planning. Best for new features, unfamiliar integrations, or architectural changes." },
403:       { label: "Skip research", description: "Plan directly from context and requirements. Best for bug fixes, simple refactors, or well-understood tasks." }
404:     ]
405:   }
406: ])
407: ```
408: 
409: If user selects "Skip research": skip to step 6.
410: 
411: **If `--auto` and `research_enabled` is false:** Skip research silently (preserves automated behavior).
412: 
413: Display banner:
414: ```
415: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
416:  GSD ► RESEARCHING PHASE {X}
417: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
418: 
419: ◆ Spawning researcher...
420: ```
421: 
422: ### Spawn gsd-phase-researcher
423: 
424: ```bash
425: PHASE_DESC=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section)
426: ```
427: 
428: Research prompt:
429: 
430: ```markdown
431: <objective>
432: Research how to implement Phase {phase_number}: {phase_name}
433: Answer: "What do I need to know to PLAN this phase well?"
434: </objective>
435: 
436: <files_to_read>
437: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
438: - {requirements_path} (Project requirements)
439: - {state_path} (Project decisions and history)
440: </files_to_read>
441: 
442: ${AGENT_SKILLS_RESEARCHER}
443: 
444: <additional_context>
445: **Phase description:** {phase_description}
446: **Phase requirement IDs (MUST address):** {phase_req_ids}
447: 
448: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
449: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, research should account for project skill patterns
450: </additional_context>
451: 
452: <output>
453: Write to: {phase_dir}/{phase_num}-RESEARCH.md
454: </output>
455: ```
456: 
457: ```
458: Agent(
459:   prompt=research_prompt,
460:   subagent_type="gsd-phase-researcher",
461:   model="{researcher_model}",
462:   description="Research Phase {phase}"
463: )
464: ```
465: 
466: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
467: 
468: ### Handle Researcher Return
469: 
470: - **`## RESEARCH COMPLETE`:** Display confirmation, continue to step 6
471: - **`## RESEARCH BLOCKED`:** Display blocker, offer: 1) Provide context, 2) Skip research, 3) Abort
472: 
473: ### Research-Only Early Exit (`--research-phase`)
474: 
475: **Skip if:** `RESEARCH_ONLY` is `false` (the default).
476: 
477: **If `RESEARCH_ONLY=true`:** the user invoked `/gsd-plan-phase --research-phase <N>` for research-only mode. Do **not** continue to Section 5.5+ (validation strategy, planner, plan-checker, verification, gaps, bounce, post-planning-gaps). Print the research-complete summary and exit cleanly:
478: 
479: ```text
480: ✓ Research-only mode complete (#3042)
481: 
482:   Phase:       ${PHASE}
483:   RESEARCH.md: ${research_path}
484: 
485: Re-run /gsd-plan-phase ${PHASE} to plan the phase using this research,
486: or /gsd-plan-phase ${PHASE} --research to refresh research and plan.
487: ```
488: 
489: This exits the workflow. The planner / plan-checker / verifier blocks below are skipped.
490: 
491: ## 5.5. Create Validation Strategy
492: 
493: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
494: 
495: If `research_enabled` is false and `nyquist_validation_enabled` is true: warn "Nyquist validation enabled but research disabled — VALIDATION.md cannot be created without RESEARCH.md. Plans will lack validation requirements (Dimension 8)." Continue to step 6.
496: 
497: **But Nyquist is not applicable for this run** when all of the following are true:
498: - `research_enabled` is false
499: - `has_research` is false
500: - no `--research` flag was provided
501: 
502: In that case: **skip validation-strategy creation entirely**. Do **not** expect `RESEARCH.md` or `VALIDATION.md` for this run, and continue to Step 6.
503: 
504: ```bash
505: grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null || true
506: ```
507: 
508: **If found:**
509: 1. Read template: `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/VALIDATION.md`
510: 2. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md` (use Write tool)
511: 3. Fill frontmatter: `{N}` → phase number, `{phase-slug}` → slug, `{date}` → current date
512: 4. Verify:
513: ```bash
514: test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
515: ```
516: 5. If `VALIDATION_CREATED=false`: STOP — do not proceed to Step 6
517: 6. If `commit_docs`: `commit "docs(phase-${PHASE}): add validation strategy"`
518: 
519: **If not found:** Warn and continue — plans may fail Dimension 8.
520: 
521: ## 5.55. Security Threat Model Gate
522: 
523: > Skip if `workflow.security_enforcement` is explicitly `false`. Absent = enabled.
524: 
525: ```bash
526: SECURITY_CFG=$(gsd-sdk query config-get workflow.security_enforcement --raw 2>/dev/null || echo "true")
527: SECURITY_ASVS=$(gsd-sdk query config-get workflow.security_asvs_level --raw 2>/dev/null || echo "1")
528: SECURITY_BLOCK=$(gsd-sdk query config-get workflow.security_block_on --raw 2>/dev/null || echo "high")
529: ```
530: 
531: **If `SECURITY_CFG` is `false`:** Skip to step 5.6.
532: 
533: **If `SECURITY_CFG` is `true`:** Display banner:
534: 
535: ```
536: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
537:  GSD ► SECURITY THREAT MODEL REQUIRED (ASVS L{SECURITY_ASVS})
538: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
539: 
540: Each PLAN.md must include a <threat_model> block.
541: Block on: {SECURITY_BLOCK} severity threats.
542: Opt out: set security_enforcement: false in .planning/config.json
543: ```
544: 
545: Continue to step 5.6. Security config is passed to the planner in step 8.
546: 
547: ## 5.6. UI Design Contract Gate
548: 
549: > Skip if `workflow.ui_phase` is explicitly `false` AND `workflow.ui_safety_gate` is explicitly `false` in `.planning/config.json`. If keys are absent, treat as enabled.
550: 
551: ```bash
552: UI_PHASE_CFG=$(gsd-sdk query config-get workflow.ui_phase 2>/dev/null || echo "true")
553: UI_GATE_CFG=$(gsd-sdk query config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
554: ```
555: 
556: **If both are `false`:** Skip to step 6.
557: 
558: Check if phase has frontend indicators:
559: 
560: ```bash
561: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" 2>/dev/null)
562: echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
563: HAS_UI=$?
564: ```
565: 
566: **If `HAS_UI` is 0 (frontend indicators found):**
567: 
568: Check for existing UI-SPEC:
569: ```bash
570: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
571: ```
572: 
573: **If UI-SPEC.md found:** Set `UI_SPEC_PATH=$UI_SPEC_FILE`. Display: `Using UI design contract: ${UI_SPEC_PATH}`
574: 
575: **If UI-SPEC.md missing AND `--skip-ui` flag is present in $ARGUMENTS:** Skip silently to step 6.
576: 
577: **If UI-SPEC.md missing AND `UI_GATE_CFG` is `true`:**
578: 
579: Read ephemeral chain flag (same field as `check.auto-mode` → `auto_chain_active`):
580: ```bash
581: AUTO_CHAIN=$(gsd-sdk query check auto-mode --pick auto_chain_active 2>/dev/null || echo "false")
582: ```
583: 
584: **If `AUTO_CHAIN` is `true` (running inside a `--chain` or `--auto` pipeline):**
585: 
586: Auto-generate UI-SPEC without prompting:
587: ```
588: Skill(skill="gsd-ui-phase", args="${PHASE} --auto ${GSD_WS}")
589: ```
590: After `gsd-ui-phase` returns, re-read:
591: ```bash
592: UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
593: UI_SPEC_PATH="${UI_SPEC_FILE}"
594: ```
595: Continue to step 6.
596: 
597: **If `AUTO_CHAIN` is `false` (manual invocation):**
598: 
599: Output this markdown directly (not as a code block):
600: 
601: ```
602: ## ⚠ UI-SPEC.md missing for Phase {N}
603: ▶ Recommended next step:
604: `/gsd-ui-phase {N} ${GSD_WS}` — generate UI design contract before planning
605: ───────────────────────────────────────────────
606: Also available:
607: - `/gsd-plan-phase {N} --skip-ui ${GSD_WS}` — plan without UI-SPEC (not recommended for frontend phases)
608: ```
609: 
610: **Exit the plan-phase workflow. Do not continue.**
611: 
612: **If `HAS_UI` is 1 (no frontend indicators):** Skip silently to step 5.7.
613: 
614: ## 5.7. Schema Push Detection Gate
615: 
616: > Detects schema-relevant files in the phase scope and injects a mandatory `[BLOCKING]` schema push task into the plan. Prevents false-positive verification where build/types pass because TypeScript types come from config, not the live database.
617: 
618: Check if any files in the phase scope match schema patterns:
619: 
620: ```bash
621: PHASE_SECTION=$(gsd-sdk query roadmap.get-phase "${PHASE}" --pick section 2>/dev/null)
622: ```
623: 
624: Scan `PHASE_SECTION`, `CONTEXT.md` (if loaded), and `RESEARCH.md` (if exists) for file paths matching these ORM patterns:
625: 
626: | ORM | File Patterns |
627: |-----|--------------|
628: | Payload CMS | `src/collections/**/*.ts`, `src/globals/**/*.ts` |
629: | Prisma | `prisma/schema.prisma`, `prisma/schema/*.prisma` |
630: | Drizzle | `drizzle/schema.ts`, `src/db/schema.ts`, `drizzle/*.ts` |
631: | Supabase | `supabase/migrations/*.sql` |
632: | TypeORM | `src/entities/**/*.ts`, `src/migrations/**/*.ts` |
633: 
634: Also check if any existing PLAN.md files for this phase already reference these file patterns in `files_modified`.
635: 
636: **If schema-relevant files detected:**
637: 
638: Set `SCHEMA_PUSH_REQUIRED=true` and `SCHEMA_ORM={detected_orm}`.
639: 
640: Determine the push command for the detected ORM:
641: 
642: | ORM | Push Command | Non-TTY Workaround |
643: |-----|-------------|-------------------|
644: | Payload CMS | `npx payload migrate` | `CI=true PAYLOAD_MIGRATING=true npx payload migrate` |
645: | Prisma | `npx prisma db push` | `npx prisma db push --accept-data-loss` (if destructive) |
646: | Drizzle | `npx drizzle-kit push` | `npx drizzle-kit push` |
647: | Supabase | `supabase db push` | Set `SUPABASE_ACCESS_TOKEN` env var |
648: | TypeORM | `npx typeorm migration:run` | `npx typeorm migration:run -d src/data-source.ts` |
649: 
650: Inject the following into the planner prompt (step 8) as an additional constraint:
651: 
652: ```markdown
653: <schema_push_requirement>
654: **[BLOCKING] Schema Push Required**
655: 
656: This phase modifies schema-relevant files ({detected_files}). The planner MUST include
657: a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
658: modifications are complete but BEFORE verification.
659: 
660: - ORM detected: {SCHEMA_ORM}
661: - Push command: {push_command}
662: - Non-TTY workaround: {env_hint}
663: - If push requires interactive prompts that cannot be suppressed, flag the task for
664:   manual intervention with `autonomous: false`
665: 
666: This task is mandatory — the phase CANNOT pass verification without it. Build and
667: type checks will pass without the push (types come from config, not the live database),
668: creating a false-positive verification state.
669: </schema_push_requirement>
670: ```
671: 
672: Display: `Schema files detected ({SCHEMA_ORM}) — [BLOCKING] push task will be injected into plans`
673: 
674: **If no schema-relevant files detected:** Skip silently to step 6.
675: 
676: ## 6. Check Existing Plans
677: 
678: ```bash
679: ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null || true
680: ```
681: 
682: **If exists AND `--reviews` flag:** Skip prompt — go straight to replanning (the purpose of `--reviews` is to replan with review feedback).
683: 
684: **If exists AND no `--reviews` flag:** Offer: 1) Add more plans, 2) View existing, 3) Replan from scratch.
685: 
686: ## 7. Use Context Paths from INIT
687: 
688: Extract from INIT JSON:
689: 
690: ```bash
691: _gsd_field() { node -e "const o=JSON.parse(process.argv[1]); const v=o[process.argv[2]]; process.stdout.write(v==null?'':String(v))" "$1" "$2"; }
692: STATE_PATH=$(_gsd_field "$INIT" state_path)
693: ROADMAP_PATH=$(_gsd_field "$INIT" roadmap_path)
694: REQUIREMENTS_PATH=$(_gsd_field "$INIT" requirements_path)
695: RESEARCH_PATH=$(_gsd_field "$INIT" research_path)
696: VERIFICATION_PATH=$(_gsd_field "$INIT" verification_path)
697: UAT_PATH=$(_gsd_field "$INIT" uat_path)
698: CONTEXT_PATH=$(_gsd_field "$INIT" context_path)
699: REVIEWS_PATH=$(_gsd_field "$INIT" reviews_path)
700: PATTERNS_PATH=$(_gsd_field "$INIT" patterns_path)
701: 
702: # Detect spike/sketch findings skills (project-local)
703: SPIKE_FINDINGS_PATH=$(ls ./.opencode/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
704: SKETCH_FINDINGS_PATH=$(ls ./.opencode/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
705: ```
706: 
707: ## 7.5. Verify Nyquist Artifacts
708: 
709: Skip if `nyquist_validation_enabled` is false OR `research_enabled` is false.
710: 
711: Also skip if all of the following are true:
712: - `research_enabled` is false
713: - `has_research` is false
714: - no `--research` flag was provided
715: 
716: In that no-research path, Nyquist artifacts are **not required** for this run.
717: 
718: ```bash
719: VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
720: ```
721: 
722: If missing and Nyquist is still enabled/applicable — ask user:
723: 1. Re-run: `/gsd-plan-phase {PHASE} --research ${GSD_WS}`
724: 2. Disable Nyquist with the exact command:
725:    `gsd-sdk query config-set workflow.nyquist_validation false`
726: 3. Continue anyway (plans fail Dimension 8)
727: 
728: Proceed to Step 7.8 (or Step 8 if pattern mapper is disabled) only if user selects 2 or 3.
729: 
730: ## 7.8. Spawn gsd-pattern-mapper Agent (Optional)
731: 
732: **Skip if** `workflow.pattern_mapper` is explicitly set to `false` in config.json (absent key = enabled). Also skip if no CONTEXT.md and no RESEARCH.md exist for this phase (nothing to extract file lists from).
733: 
734: Check config:
735: ```bash
736: PATTERN_MAPPER_CFG=$(gsd-sdk query config-get workflow.pattern_mapper 2>/dev/null || echo "true")
737: ```
738: 
739: **If `PATTERN_MAPPER_CFG` is `false`:** Skip to step 8.
740: 
741: **If PATTERNS.md already exists** (`PATTERNS_PATH` is non-empty from step 7): Skip to step 8 (use existing).
742: 
743: Display banner:
744: ```
745: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
746:  GSD ► PATTERN MAPPING PHASE {X}
747: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
748: 
749: ◆ Spawning pattern mapper...
750: ```
751: 
752: Pattern mapper prompt:
753: 
754: ```markdown
755: <pattern_mapping_context>
756: **Phase:** {phase_number} - {phase_name}
757: **Phase directory:** {phase_dir}
758: **Padded phase:** {padded_phase}
759: 
760: <files_to_read>
761: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
762: - {research_path} (Technical Research)
763: </files_to_read>
764: 
765: **Output file:** {phase_dir}/{padded_phase}-PATTERNS.md
766: 
767: Extract the list of files to be created/modified from CONTEXT.md and RESEARCH.md. For each file, classify by role and data flow, find the closest existing analog in the codebase, extract concrete code excerpts, and produce PATTERNS.md.
768: </pattern_mapping_context>
769: ```
770: 
771: Spawn with:
772: ```
773: Agent(
774:   prompt="{above}",
775:   subagent_type="gsd-pattern-mapper",
776:   model="{researcher_model}",
777: )
778: ```
779: 
780: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
781: 
782: **Handle return:**
783: - **`## PATTERN MAPPING COMPLETE`:** Update `PATTERNS_PATH` to the created file path, continue to step 8.
784: - **Any error or empty return:** Log warning, continue to step 8 without patterns (non-blocking).
785: 
786: After pattern mapper completes, update the path variable:
787: ```bash
788: PATTERNS_PATH="${PHASE_DIR}/${PADDED_PHASE}-PATTERNS.md"
789: ```
790: 
791: ## 8. Spawn gsd-planner Agent
792: 
793: Display banner:
794: ```
795: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
796:  GSD ► PLANNING PHASE {X}
797: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
798: 
799: ◆ Spawning planner...
800: ```
801: 
802: Planner prompt:
803: 
804: ```markdown
805: <planning_context>
806: **Phase:** {phase_number}
807: **Mode:** {standard | gap_closure | reviews}
808: 
809: <files_to_read>
810: - {state_path} (Project State)
811: - {roadmap_path} (Roadmap)
812: - {requirements_path} (Requirements)
813: - {context_path} (USER DECISIONS from /gsd-discuss-phase)
814: - {research_path} (Technical Research)
815: - {PATTERNS_PATH} (Pattern Map — analog files and code excerpts, if exists)
816: - {verification_path} (Verification Gaps - if --gaps)
817: - {uat_path} (UAT Gaps - if --gaps)
818: - {reviews_path} (Cross-AI Review Feedback - if --reviews)
819: - {UI_SPEC_PATH} (UI Design Contract — visual/interaction specs, if exists)
820: - {SPIKE_FINDINGS_PATH} (Spike Findings — validated patterns, constraints, landmines from experiments, if exists)
821: - {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction, if exists)
822: ${CONTEXT_WINDOW >= 500000 ? `
823: **Cross-phase context (1M model enrichment):**
824: - CONTEXT.md files from the 3 most recent completed phases (locked decisions — maintain consistency)
825: - SUMMARY.md files from the 3 most recent completed phases (what was built — reuse patterns, avoid duplication)
826: - LEARNINGS.md files from the 3 most recent completed phases (structured decisions, patterns, lessons, surprises — skip silently if a phase has no LEARNINGS.md; prefix each block with \`[from Phase N LEARNINGS]\` for source attribution; if total size exceeds 15% of context budget, drop oldest first)
827: - CONTEXT.md, SUMMARY.md, and LEARNINGS.md from any phases listed in the current phase's "Depends on:" field in ROADMAP.md (regardless of recency — explicit dependencies always load, deduplicated against the 3 most recent)
828: - Skip all other prior phases to stay within context budget
829: ` : ''}
830: </files_to_read>
831: 
832: ${AGENT_SKILLS_PLANNER}
833: 
834: **Phase requirement IDs (every ID MUST appear in a plan's `requirements` field):** {phase_req_ids}
835: 
836: **Project instructions:** Read ./AGENTS.md if exists — follow project-specific guidelines
837: **Project skills:** Check .claude/skills/ or .agents/skills/ directory (if either exists) — read SKILL.md files, plans should account for project skill rules
838: 
839: ${TDD_MODE === 'true' ? `
840: <tdd_mode_active>
841: **TDD Mode is ENABLED.** Apply TDD heuristics from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md to all eligible tasks:
842: - Business logic with defined I/O → type: tdd
843: - API endpoints with request/response contracts → type: tdd
844: - Data transformations, validation, algorithms → type: tdd
845: - UI, config, glue code, CRUD → standard plan (type: execute)
846: Each TDD plan gets one feature with RED/GREEN/REFACTOR gate sequence.
847: </tdd_mode_active>
848: ` : ''}
849: 
850: **MVP_MODE:** ${MVP_MODE} (when true, follow vertical-slice rules from `@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md`; when false, ignore MVP guidance entirely.)
851: **WALKING_SKELETON:** ${WALKING_SKELETON} (when true, the first deliverable must be a Walking Skeleton — produce SKELETON.md alongside PLAN.md.)
852: 
853: ${MVP_MODE === 'true' ? `
854: <mvp_mode_active>
855: **MVP Mode is ENABLED.** Follow vertical-slice planning rules from @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-mvp-mode.md. Each plan must deliver a complete vertical slice — thin end-to-end functionality rather than horizontal layers.
856: </mvp_mode_active>
857: ` : ''}
858: </planning_context>
859: 
860: <downstream_consumer>
861: Output consumed by /gsd-execute-phase. Plans need:
862: - Frontmatter (wave, depends_on, files_modified, autonomous)
863: - Tasks in XML format with read_first and acceptance_criteria fields (MANDATORY on every task)
864: - Verification criteria
865: - must_haves for goal-backward verification
866: </downstream_consumer>
867: 
868: <deep_work_rules>
869: ## Anti-Shallow Execution Rules (MANDATORY)
870: 
871: Every task MUST include these fields — they are NOT optional:
872: 
873: 1. **`<read_first>`** — Files the executor MUST read before touching anything. Always include:
874:    - The file being modified (so executor sees current state, not assumptions)
875:    - Any "source of truth" file referenced in CONTEXT.md (reference implementations, existing patterns, config files, schemas)
876:    - Any file whose patterns, signatures, types, or conventions must be replicated or respected
877: 
878: 2. **`<acceptance_criteria>`** — Verifiable conditions that prove the task was done correctly. Rules:
879:    - Every criterion must be checkable with grep, file read, test command, or CLI output
880:    - NEVER use subjective language ("looks correct", "properly configured", "consistent with")
881:    - ALWAYS include exact strings, patterns, values, or command outputs that must be present
882:    - Examples:
883:      - Code: `auth.py contains def verify_token(` / `test_auth.py exits 0`
884:      - Config: `.env.example contains DATABASE_URL=` / `Dockerfile contains HEALTHCHECK`
885:      - Docs: `README.md contains '## Installation'` / `API.md lists all endpoints`
886:      - Infra: `deploy.yml has rollback step` / `docker-compose.yml has healthcheck for db`
887: 
888: 3. **`<action>`** — Must include CONCRETE values, not references. Rules:
889:    - NEVER say "align X with Y", "match X to Y", "update to be consistent" without specifying the exact target state
890:    - ALWAYS include the actual values: config keys, function signatures, SQL statements, class names, import paths, env vars, etc.
891:    - If CONTEXT.md has a comparison table or expected values, copy them into the action verbatim
892:    - The executor should be able to complete the task from the action text alone, without needing to read CONTEXT.md or reference files (read_first is for verification, not discovery)
893: 
894: **Why this matters:** Executor agents work from the plan text. Vague instructions like "update the config to match production" produce shallow one-line changes. Concrete instructions like "add DATABASE_URL=postgresql://... , set POOL_SIZE=20, add REDIS_URL=redis://..." produce complete work. The cost of verbose plans is far less than the cost of re-doing shallow execution.
895: </deep_work_rules>
896: 
897: <quality_gate>
898: - [ ] PLAN.md files created in phase directory
899: - [ ] Each plan has valid frontmatter
900: - [ ] Tasks are specific and actionable
901: - [ ] Every task has `<read_first>` with at least the file being modified
902: - [ ] Every task has `<acceptance_criteria>` with grep-verifiable conditions
903: - [ ] Every `<action>` contains concrete values (no "align X with Y" without specifying what)
904: - [ ] Dependencies correctly identified
905: - [ ] Waves assigned for parallel execution
906: - [ ] must_haves derived from phase goal
907: </quality_gate>
908: ```
909: 
910: **If `CHUNKED_MODE` is `false` (default):** Spawn the planner as a single long-lived Agent:
911: 
912: ```text
913: Agent(
914:   prompt=filled_prompt,
915:   subagent_type="gsd-planner",
916:   model="{planner_model}",
917:   description="Plan Phase {phase}"
918: )
919: ```
920: 
921: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
922: 
923: **If `CHUNKED_MODE` is `true`:** Skip the Agent() call above — proceed to step 8.5 instead.
924: 
925: ## 8.5. Chunked Planning Mode
926: 
927: **Skip if `CHUNKED_MODE` is `false`.**
928: 
929: Chunked mode splits the single long-lived planner Agent run into a short outline Agent run followed by
930: N short per-plan Agent runs. Each run is bounded to ~3–5 min; each plan is committed individually
931: for crash resilience. If any run hangs and the terminal is force-killed, rerunning
932: `/gsd-plan-phase {N} --chunked` resumes from the last successfully committed plan.
933: 
934: **Intended for new or in-progress chunked runs.** To recover plans already written by a prior
935: *non-chunked* run, use step 6's "Add more plans" or proceed directly to `/gsd-execute-phase`
936: — don't start a fresh chunked run over existing non-chunked plans.
937: 
938: ### 8.5.1 Outline Phase (outline-only mode, ~2 min)
939: 
940: **Resume detection:** If `${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md` already exists **and
941: is valid** (contains the `## OUTLINE COMPLETE` marker), skip this sub-step — the outline
942: already exists from a previous run. Proceed directly to 8.5.2.
943: 
944: ```bash
945: OUTLINE_FILE="${PHASE_DIR}/${PADDED_PHASE}-PLAN-OUTLINE.md"
946: if [[ -f "$OUTLINE_FILE" ]] && grep -q "^## OUTLINE COMPLETE" "$OUTLINE_FILE"; then
947:   # reuse existing outline — skip to 8.5.2
948: fi
949: ```
950: 
951: Display:
952: ```text
953: ◆ Chunked mode: spawning outline planner...
954: ```
955: 
956: Spawn the planner in **outline-only** mode — it must write only the outline manifest, not any
957: PLAN.md files:
958: 
959: ```javascript
960: Agent(
961:   prompt="{same planning_context as step 8, plus:}
962: 
963:   **Chunked mode: outline-only.**
964:   Do NOT write any PLAN.md files in this Task.
965:   Write only: {PHASE_DIR}/{PADDED_PHASE}-PLAN-OUTLINE.md
966: 
967:   The outline must be a markdown table with columns:
968:   Plan ID | Objective | Wave | Depends On | Requirements
969: 
970:   Return: ## OUTLINE COMPLETE with plan count.",
971:   subagent_type="gsd-planner",
972:   model="{planner_model}",
973:   description="Outline Phase {phase} (chunked)"
974: )
975: ```
976: 
977: > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
978: 
979: Handle return:
980: - **`## OUTLINE COMPLETE`:** Read `PLAN-OUTLINE.md`, extract plan list. Continue to 8.5.2.
981: - **Any other return or empty:** Display error. Offer: 1) Retry outline, 2) Stop.
982: 
983: ### 8.5.2 Per-Plan Tasks (single-plan mode, ~3-5 min each)
984: 
985: For each plan entry extracted from `PLAN-OUTLINE.md`:
986: 
987: 1. **Resume check:** If `${PHASE_DIR}/{plan_id}-PLAN.md` already exists on disk **and has
988:    valid YAML frontmatter** (opening `---` delimiter present), skip this plan (do not
989:    overwrite completed work — resume safety).
990: 
991:    ```bash
992:    PLAN_FILE="${PHASE_DIR}/${plan_id}-PLAN.md"
993:    if [[ -f "$PLAN_FILE" ]] && head -1 "$PLAN_FILE" | grep -q '^---'; then
994:      continue  # plan already written, skip
995:    fi
996:    ```
997: 
998: 2. Display:
999:    ```text
1000:    ◆ Chunked mode: planning {plan_id} ({k}/{N})...
1001:    ```
1002: 
1003: 3. Spawn the planner in **single-plan** mode — it must write exactly one PLAN.md file:
1004:    ```javascript
1005:    Agent(
1006:      prompt="{same planning_context as step 8, plus:}
1007: 
1008:      **Chunked mode: single-plan.**
1009:      Write exactly ONE plan file: {PHASE_DIR}/{plan_id}-PLAN.md
1010:      Plan to write: {plan_id} — {objective}
1011:      Wave: {wave} | Depends on: {depends_on}
1012:      Phase requirement IDs to cover in this plan: {plan_requirements}
1013: 
1014:      Return: ## PLAN COMPLETE with the plan ID.",
1015:      subagent_type="gsd-planner",
1016:      model="{planner_model}",
1017:      description="Plan {plan_id} (chunked {k}/{N})"
1018:    )
1019:    ```
1020: 
1021:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
1022: 
1023: 4. **Verify disk:** Check `${PHASE_DIR}/{plan_id}-PLAN.md` exists. If missing: offer 1) Retry, 2) Stop.
1024: 
1025: 5. **Commit per-plan:**
1026:    ```bash
1027:    gsd-sdk query commit "docs(${PADDED_PHASE}): plan ${plan_id} (chunked)" --files "${PHASE_DIR}/${plan_id}-PLAN.md"
1028:    ```
1029: 
1030: After all N plans are written and committed, treat this as `## PLANNING COMPLETE` and continue
1031: to step 9.
1032: 
1033: ## 9. Handle Planner Return
1034: 
1035: - **`## PLANNING COMPLETE`:** Display plan count. If `--skip-verify` or `plan_checker_enabled` is false (from init): skip to step 13. Otherwise: step 10.
1036: - **`## PHASE SPLIT RECOMMENDED`:** The planner determined the phase exceeds the context budget for full-fidelity implementation of all source items. Handle in step 9b.
1037: - **`## ⚠ Source Audit: Unplanned Items Found`:** The planner's multi-source coverage audit found items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions that are not covered by any plan. Handle in step 9c.
1038: - **`## CHECKPOINT REACHED`:** Present to user, get response, spawn continuation (step 12)
1039: - **`## PLANNING INCONCLUSIVE`:** Show attempts, offer: Add context / Retry / Manual
1040: - **Empty / truncated / no recognized marker:** → Filesystem fallback (step 9a).
1041: 
1042: ## 9a. Filesystem Fallback (Planner)
1043: 
1044: **Triggered when:** Agent() returns but the return contains no recognized marker (`## PLANNING COMPLETE`, `## PHASE SPLIT RECOMMENDED`, `## ⚠ Source Audit`, `## CHECKPOINT REACHED`, `## PLANNING INCONCLUSIVE`).
1045: 
1046: ```bash
1047: DISK_PLANS=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
1048: ```
1049: 
1050: **If `DISK_PLANS` > 0:** The planner wrote plans to disk but the Agent() return was empty or
1051: truncated (the Windows stdio hang pattern — the subagent finished but the return never
1052: arrived). Display:
1053: 
1054: ```text
1055: ◆ Planner wrote {DISK_PLANS} plan(s) to disk but did not emit a PLANNING COMPLETE marker.
1056:   This is a known Windows stdio hang pattern — work is likely recoverable.
1057: 
1058:   Plans found on disk:
1059:   {ls output of *-PLAN.md}
1060: ```
1061: 
1062: Offer 3 options:
1063: 1. **Accept plans** — treat as `## PLANNING COMPLETE` and continue through step 9 `## PLANNING COMPLETE` handling (so `--skip-verify` / `plan_checker_enabled=false` are honored — may skip to step 13 rather than step 10)
1064: 2. **Retry planner** — re-spawn the planner with the same prompt (return to step 8)
1065: 3. **Stop** — exit; user can re-run `/gsd-plan-phase {N}` to resume
1066: 
1067: **If `DISK_PLANS` is 0 and no marker:** The planner produced no output. Treat as
1068: `## PLANNING INCONCLUSIVE` and handle accordingly.
1069: 
1070: ## 9b. Handle Phase Split Recommendation
1071: 
1072: When the planner returns `## PHASE SPLIT RECOMMENDED`, it means the phase's source items exceed the context budget for full-fidelity implementation. The planner proposes groupings.
1073: 
1074: **Extract from planner return:**
1075: - Proposed sub-phases (e.g., "17a: processing core (D-01 to D-19)", "17b: billing + config UX (D-20 to D-27)")
1076: - Which source items (REQ-IDs, D-XX decisions, RESEARCH items) go in each sub-phase
1077: - Why the split is necessary (context cost estimate, file count)
1078: 
1079: **Present to user:**
1080: ```
1081: ## Phase {X} exceeds context budget for full-fidelity implementation
1082: 
1083: The planner found {N} source items that exceed the context budget when
1084: planned at full fidelity. Instead of reducing scope, we recommend splitting:
1085: 
1086: **Option 1: Split into sub-phases**
1087: - Phase {X}a: {name} — {items} ({N} source items, ~{P}% context)
1088: - Phase {X}b: {name} — {items} ({M} source items, ~{Q}% context)
1089: 
1090: **Option 2: Proceed anyway** (planner will attempt all, quality may degrade past 50% context)
1091: 
1092: **Option 3: Prioritize** — you choose which items to implement now,
1093: rest become a follow-up phase
1094: ```
1095: 
1096: Use question with these 3 options.
1097: 
1098: **If "Split":** Use `/gsd-phase --insert` to create the sub-phases, then replan each.
1099: **If "Proceed":** Return to planner with instruction to attempt all items at full fidelity, accepting more plans/tasks.
1100: **If "Prioritize":** Use question (multiSelect) to let user pick which items are "now" vs "later". Create CONTEXT.md for each sub-phase with the selected items.
1101: 
1102: ## 9c. Handle Source Audit Gaps
1103: 
1104: When the planner returns `## ⚠ Source Audit: Unplanned Items Found`, it means items from REQUIREMENTS.md, RESEARCH.md, ROADMAP goal, or CONTEXT.md decisions have no corresponding plan.
1105: 
1106: **Extract from planner return:**
1107: - Each unplanned item with its source artifact and section
1108: - The planner's suggested options (A: add plan, B: split phase, C: defer with confirmation)
1109: 
1110: **Present each gap to user.** For each unplanned item:
1111: 
1112: ```
1113: ## ⚠ Unplanned: {item description}
1114: 
1115: Source: {RESEARCH.md / REQUIREMENTS.md / ROADMAP goal / CONTEXT.md}
1116: Details: {why the planner flagged this}
1117: 
1118: Options:
1119: 1. Add a plan to cover this item (recommended)

(Output capped at 50 KB. Showing lines 1-1119. Use offset=1120 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: glob

**Input:**
```json
{
  "callID": "call_Y146h5aZQunnQUYvfHKcR5J5"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-PLAN.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-05-SUMMARY.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/forensics/report-20260518-105705.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_ROeBkGEihos23tqEFaKxK0Gv"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_XjWXujtS6F1im99vJ4p1O2FG"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-03-SUMMARY.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-02-SUMMARY.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-04-SUMMARY.md"
}
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_PLMX9C4jBW8mZlAoD9Fql5JN"
}
```


## USER (turn 67)

**source:** real-human

@gsd-doc-writer /gsd-docs-update CP-DT-01 --scope runtime-truth --files .planning/STATE.md,.planning/ROADMAP.md,.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-RESEARCH.md,.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-PATTERN.md,.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-SPEC.md,.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-VALIDATION.md,.planning/phases/CP-DT-01-delegate-task-ecosystem-revamp/CP-DT-01-GATE-SPEC.md --note "Re-open CP-DT-01: plugin ToolContext has no task field; native Task invocation from custom tool is disproven. Rewrite docs to distinguish verified OpenCode runtime contract from mocked seam. Preserve 5-plan trace and create gap closure plan in phase directory before source edits."

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-docs-update"
}
```

**Output:** (pruned)
```
# Skill: gsd-docs-update
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: apply_patch

**Input:**
```json
{
  "callID": "call_FhIAg7YbIDKTqeZQjZSNWWsW"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_sgCFi70R1CJiPfRfk20d5KPC"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_DlA1iRXGrZ7lh0JTX7YW7EYu"
}
```


## USER (turn 68)

**source:** real-human

khi chạy slásh command không thêm `@agent` When execute-slash-command append the slash command directly to the foreground without the parameter of `@agent` the agents are instructed and resolved and if needed will be used through task tool for sequential actions following. 

### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-execute-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-execute-phase
```


### Tool: execute-slash-command

**Input:**
```json
{
  "callID": "call_oW0Qy6FJ1YPPuZb56yRGpePY"
}
```


## USER (turn 69)

**source:** real-human

<objective>
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Optional wave filter:
- `--wave N` executes only Wave `N` for pacing, quota management, or staged rollout
- phase verification/completion still only happens when no incomplete plans remain after the selected wave finishes

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `CP-DT-01 --wave 6 --text`
- If a documented flag is absent from `CP-DT-01 --wave 6 --text`, treat it as inactive

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase: CP-DT-01 --wave 6 --text

**Available optional flags (documentation only — not automatically active):**
- `--wave N` — Execute only Wave `N` in the phase. Use when you want to pace execution or stay inside usage limits.
- `--gaps-only` — Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verify-work creates fix plans.
- `--interactive` — Execute plans sequentially inline (no subagents) with user checkpoints between tasks. Lower token usage, pair-programming style. Best for small phases, bug fixes, and verification gaps.

**Active flags must be derived from `CP-DT-01 --wave 6 --text`:**
- `--wave N` is active only if the literal `--wave` token is present in `CP-DT-01 --wave 6 --text`
- `--gaps-only` is active only if the literal `--gaps-only` token is present in `CP-DT-01 --wave 6 --text`
- `--interactive` is active only if the literal `--interactive` token is present in `CP-DT-01 --wave 6 --text`
- If none of these tokens appear, run the standard full-phase execution flow with no flag-specific filtering
- Do not infer that a flag is active just because it is documented in this prompt

Context files are resolved inside the workflow via `gsd-sdk query init.execute-phase` and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-phase.md</path>
<type>file</type>
<content>
1: <purpose>
2: Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to subagents.
3: </purpose>
4: 
5: <core_principle>
6: Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
7: </core_principle>
8: 
9: <runtime_compatibility>
10: **Subagent spawning is runtime-specific:**
11: - **Claude Code:** Uses `Agent(subagent_type="gsd-executor", ...)` — blocks until complete, returns result
12: - **Copilot:** Subagent spawning does not reliably return completion signals. **Default to
13:   sequential inline execution**: read and follow execute-plan.md directly for each plan
14:   instead of spawning parallel agents. Only attempt parallel spawning if the user
15:   explicitly requests it — and in that case, rely on the spot-check fallback in step 3
16:   to detect completion.
17: - **Other runtimes:** If `Agent`/`agent` tool is unavailable, use sequential inline execution as the
18:   fallback. Check for tool availability at runtime rather than assuming based on runtime name.
19: 
20: **Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
21: the orchestrator never receives the completion signal, treat it as successful based on spot-checks
22: and continue to the next wave/plan. Never block indefinitely waiting for a signal — always verify
23: via filesystem and git state.
24: </runtime_compatibility>
25: 
26: <required_reading>
27: Read STATE.md before any operation to load project context.
28: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/agent-contracts.md
29: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/context-budget.md
30: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
31: </required_reading>
32: 
33: <available_agent_types>
34: These are the valid GSD subagent types registered in .claude/agents/ (or equivalent for your runtime).
35: Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:
36: 
37: - gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
38: - gsd-verifier — Verifies phase completion, checks quality gates
39: - gsd-planner — Creates detailed plans from phase scope
40: - gsd-phase-researcher — Researches technical approaches for a phase
41: - gsd-plan-checker — Reviews plan quality before execution
42: - gsd-debugger — Diagnoses and fixes issues
43: - gsd-codebase-mapper — Maps project structure and dependencies
44: - gsd-integration-checker — Checks cross-phase integration
45: - gsd-nyquist-auditor — Validates verification coverage
46: - gsd-ui-researcher — Researches UI/UX approaches
47: - gsd-ui-checker — Reviews UI implementation quality
48: - gsd-ui-auditor — Audits UI against design requirements
49: </available_agent_types>
50: 
51: <process>
52: 
53: <step name="parse_args" priority="first">
54: Parse `$ARGUMENTS` before loading any context:
55: 
56: - First positional token → `PHASE_ARG`
57: - Optional `--wave N` → `WAVE_FILTER`
58: - Optional `--gaps-only` keeps its current meaning
59: - Optional `--cross-ai` → `CROSS_AI_FORCE=true` (force all plans through cross-AI execution)
60: - Optional `--no-cross-ai` → `CROSS_AI_DISABLED=true` (disable cross-AI for this run, overrides config and frontmatter)
61: 
62: If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
63: </step>
64: 
65: <step name="initialize" priority="first">
66: Load all context in one call:
67: 
68: ```bash
69: INIT=$(gsd-sdk query init.execute-phase "${PHASE_ARG}")
70: if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
71: AGENT_SKILLS=$(gsd-sdk query agent-skills gsd-executor)
72: ```
73: 
74: Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`, `response_language`.
75: 
76: **Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls — do NOT pass `model="inherit"` to Agent. Omitting the `model=` parameter causes Claude Code to inherit the current orchestrator model automatically. Only set `model=` when `executor_model` is an explicit model name (e.g., `"claude-sonnet-4-6"`, `"claude-opus-4-7"`).
77: 
78: **If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.
79: 
80: Read worktree config:
81: 
82: ```bash
83: USE_WORKTREES=$(gsd-sdk query config-get workflow.use_worktrees 2>/dev/null || echo "true")
84: ```
85: 
86: If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled worktree isolation whenever `.gitmodules` existed, which penalised every plan in a submodule project even when the plan was nowhere near a submodule. Compute submodule paths once and intersect them per-plan with the plan's declared `files_modified` frontmatter.
87: 
88: ```bash
89: # Parse submodule paths from .gitmodules once (empty if no .gitmodules).
90: # SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
91: if [ -f .gitmodules ]; then
92:   SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
93: else
94:   SUBMODULE_PATHS=""
95: fi
96: ```
97: 
98: `SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different files — only plans whose paths intersect a submodule must drop worktree isolation; plans nowhere near a submodule keep parallel isolation.
99: 
100: When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are project-disabled.
101: 
102: Read context window size for adaptive prompt enrichment:
103: 
104: ```bash
105: CONTEXT_WINDOW=$(gsd-sdk query config-get context_window 2>/dev/null || echo "200000")
106: ```
107: 
108: When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
109: - Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
110: - Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
111: - This enables cross-phase awareness and history-aware verification
112: 
113: When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
114: - Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md
115: - Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/planner-antipatterns.md
116: - Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
117: - This reduces executor static overhead by ~40% while preserving behavioral correctness
118: 
119: **If `phase_found` is false:** Error — phase directory not found.
120: **If `plan_count` is 0:** Error — no plans found in phase.
121: **If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.
122: 
123: When `parallelization` is false, plans within a wave execute sequentially.
124: 
125: **Runtime detection for Copilot:**
126: Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
127: or absence of the `Agent()` subagent API. If running under Copilot, force sequential inline
128: execution regardless of the `parallelization` setting — Copilot's subagent completion
129: signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
130: internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
131: inline path for each plan.
132: 
133: **REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT touch `workflow.auto_advance` (the user's persistent settings preference). You MUST execute this bash block before any config reads:
134: ```bash
135: # REQUIRED: prevents stale auto-chain from previous --auto runs
136: if [[ ! "$ARGUMENTS" =~ --auto ]]; then
137:   gsd-sdk query config-set workflow._auto_chain_active false || true
138: fi
139: ```
140: 
141: Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
142: ```bash
143: MVP_FLAG_ARG=""
144: if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
145: MVP_MODE=$(gsd-sdk query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)
146: TDD_MODE=$(gsd-sdk query config-get workflow.tdd_mode 2>/dev/null || echo "false")
147: ```
148: 
149: **MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
150: ```bash
151: if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
152:   IS_BEHAVIOR_ADDING=$(gsd-sdk query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)
153:   if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
154:     RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
155:     if [ -z "$RED_COMMIT" ]; then
156:       gsd-sdk query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true
157:       echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
158:       exit 1
159:     fi
160:   fi
161: fi
162: ```
163: Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. See `execute-mvp-tdd.md` for the halt report format.
164: </step>
165: 
166: <step name="check_blocking_antipatterns" priority="first">
167: **MANDATORY — Check for blocking anti-patterns before any other work.**
168: 
169: Look for a `.continue-here.md` in the current phase directory:
170: 
171: ```bash
172: ls ${phase_dir}/.continue-here.md 2>/dev/null || true
173: ```
174: 
175: If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.
176: 
177: **If one or more `blocking` anti-patterns are found:**
178: 
179: This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:
180: 
181: 1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
182: 2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
183: 3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.
184: 
185: Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.
186: 
187: **If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
188: </step>
189: 
190: <step name="check_interactive_mode">
191: **Parse `--interactive` flag from $ARGUMENTS.**
192: 
193: **If `--interactive` flag present:** Switch to interactive execution mode.
194: 
195: Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
196: checkpoints between tasks. The user can review, modify, or redirect work at any point.
197: 
198: **Interactive execution flow:**
199: 
200: 1. Load plan inventory as normal (discover_and_group_plans)
201: 2. For each plan (sequentially, ignoring wave grouping):
202: 
203:    a. **Present the plan to the user:**
204:       ```
205:       ## Plan {plan_id}: {plan_name}
206: 
207:       Objective: {from plan file}
208:       Tasks: {task_count}
209: 
210:       Options:
211:       - Execute (proceed with all tasks)
212:       - Review first (show task breakdown before starting)
213:       - Skip (move to next plan)
214:       - Stop (end execution, save progress)
215:       ```
216: 
217:    b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.
218: 
219:    c. **If "Execute":** Read and follow `/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md` **inline**
220:       (do NOT spawn a subagent). Execute tasks one at a time.
221: 
222:    d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
223:       their feedback before continuing. Otherwise proceed to next task.
224: 
225:    e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.
226: 
227: 3. After all plans: proceed to verification (same as normal mode).
228: 
229: **Benefits of interactive mode:**
230: - No subagent overhead — dramatically lower token usage
231: - User catches mistakes early — saves costly verification cycles
232: - Maintains GSD's planning/tracking structure
233: - Best for: small phases, bug fixes, verification gaps, learning GSD
234: 
235: **Skip to handle_branching step** (interactive plans execute inline after grouping).
236: </step>
237: 
238: <step name="handle_branching">
239: Check `branching_strategy` from init:
240: 
241: **"none":** Skip, continue on current branch.
242: 
243: **"phase" or "milestone":** Use pre-computed `branch_name` from init.
244: 
245: Fork the new phase branch off `origin/HEAD` (the project's default branch), not the current HEAD — otherwise consecutive phases compound and stay unpushed (#2916). If `$BRANCH_NAME` already exists locally, reuse it as-is.
246: 
247: ```bash
248: DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
249: DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
250: 
251: if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
252:   git switch "$BRANCH_NAME" || { echo "ERROR: Could not switch to existing branch '$BRANCH_NAME'." >&2; exit 1; }
253: else
254:   if ! git fetch --quiet origin "$DEFAULT_BRANCH"; then  # #2916
255:     git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH" \
256:       || { echo "ERROR: fetch origin/$DEFAULT_BRANCH failed and no local copy exists. Refusing to create '$BRANCH_NAME' off current HEAD (#2916)." >&2; exit 1; }
257:     echo "WARNING: fetch origin/$DEFAULT_BRANCH failed; using local copy as base." >&2
258:   fi
259:   if [ -n "$(git status --porcelain)" ]; then
260:     echo "WARNING: Uncommitted changes will be carried onto '$BRANCH_NAME' (branched off origin/$DEFAULT_BRANCH, not previous HEAD)."
261:   else
262:     git switch --quiet "$DEFAULT_BRANCH" 2>/dev/null && git merge --ff-only --quiet "origin/$DEFAULT_BRANCH" 2>/dev/null || true
263:   fi
264:   # Pinned base + fail-fast: on success HEAD is exactly at origin/$DEFAULT_BRANCH,
265:   # so a post-creation merge-base or "ahead-of" guard would be unreachable. The
266:   # explicit base argument here is the single source of correctness for #2916.
267:   git checkout -b "$BRANCH_NAME" "origin/$DEFAULT_BRANCH" \
268:     || { echo "ERROR: Could not create '$BRANCH_NAME' from origin/$DEFAULT_BRANCH (#2916)." >&2; exit 1; }
269: fi
270: ```
271: 
272: All subsequent commits go to this branch. User handles merging.
273: </step>
274: 
275: <step name="validate_phase">
276: From init JSON: `phase_dir`, `plan_count`, `incomplete_count`.
277: 
278: Report: "Found {plan_count} plans in {phase_dir} ({incomplete_count} incomplete)"
279: 
280: **Update STATE.md for phase start:**
281: ```bash
282: gsd-sdk query state.begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
283: ```
284: This updates Status, Last Activity, Current focus, Current Position, and plan counts in STATE.md so frontmatter and body text reflect the active phase immediately.
285: </step>
286: 
287: <step name="discover_and_group_plans">
288: Load plan inventory with wave grouping in one call:
289: 
290: ```bash
291: PLAN_INDEX=$(gsd-sdk query phase-plan-index "${PHASE_NUMBER}")
292: ```
293: 
294: Parse JSON for: `phase`, `plans[]` (each with `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves` (map of wave number → plan IDs), `incomplete`, `has_checkpoints`.
295: 
296: **Filtering:** Skip plans where `has_summary: true`. If `--gaps-only`: also skip non-gap_closure plans. If `WAVE_FILTER` is set: also skip plans whose `wave` does not equal `WAVE_FILTER`.
297: 
298: **Wave safety check:** If `WAVE_FILTER` is set and there are still incomplete plans in any lower wave that match the current execution mode, STOP and tell the user to finish earlier waves first. Do not let Wave 2+ execute while prerequisite earlier-wave plans remain incomplete.
299: 
300: If all filtered: "No matching incomplete plans" → exit.
301: 
302: Report:
303: ```
304: ## Execution Plan
305: 
306: **Phase {X}: {Name}** — {total_plans} matching plans across {wave_count} wave(s)
307: 
308: {If WAVE_FILTER is set: `Wave filter active: executing only Wave {WAVE_FILTER}`.}
309: 
310: | Wave | Plans | What it builds |
311: |------|-------|----------------|
312: | 1 | 01-01, 01-02 | {from plan objectives, 3-8 words} |
313: | 2 | 01-03 | ... |
314: ```
315: </step>
316: 
317: <step name="cross_ai_delegation">
318: **Optional step 2.5 — Delegate plans to an external AI runtime.**
319: 
320: This step runs after plan discovery and before normal wave execution. It identifies plans
321: that should be delegated to an external AI command and executes them via stdin-based prompt
322: delivery. Plans handled here are removed from the execute_waves plan list so the normal
323: executor skips them.
324: 
325: **Activation logic:**
326: 
327: 1. If `CROSS_AI_DISABLED` is true (`--no-cross-ai` flag): skip this step entirely.
328: 2. If `CROSS_AI_FORCE` is true (`--cross-ai` flag): mark ALL incomplete plans for cross-AI execution.
329: 3. Otherwise: check each plan's frontmatter for `cross_ai: true` AND verify config
330:    `workflow.cross_ai_execution` is `true`. Plans matching both conditions are marked for cross-AI.
331: 
332: ```bash
333: CROSS_AI_ENABLED=$(gsd-sdk query config-get workflow.cross_ai_execution 2>/dev/null || echo "false")
334: CROSS_AI_CMD=$(gsd-sdk query config-get workflow.cross_ai_command 2>/dev/null || echo "")
335: CROSS_AI_TIMEOUT=$(gsd-sdk query config-get workflow.cross_ai_timeout 2>/dev/null || echo "300")
336: ```
337: 
338: **If no plans are marked for cross-AI:** Skip to execute_waves.
339: 
340: **If plans are marked but `cross_ai_command` is empty:** Error — tell user to set
341: `workflow.cross_ai_command` via `gsd-sdk query config-set workflow.cross_ai_command "<command>"`.
342: 
343: **For each cross-AI plan (sequentially):**
344: 
345: 1. **Construct the task prompt** from the plan file:
346:    - Extract `<objective>` and `<tasks>` sections from the PLAN.md
347:    - Append PROJECT.md context (project name, description, tech stack)
348:    - Format as a self-contained execution prompt
349: 
350: 2. **Check for dirty working tree before execution:**
351:    ```bash
352:    if ! git diff --quiet HEAD 2>/dev/null; then
353:      echo "WARNING: dirty working tree detected — the external AI command may produce uncommitted changes that conflict with existing modifications"
354:    fi
355:    ```
356: 
357: 3. **Run the external command** from the project root, writing the prompt to stdin.
358:    Never shell-interpolate the prompt — always pipe via stdin to prevent injection:
359:    ```bash
360:    echo "$TASK_PROMPT" | timeout "${CROSS_AI_TIMEOUT}s" ${CROSS_AI_CMD} > "$CANDIDATE_SUMMARY" 2>"$ERROR_LOG"
361:    EXIT_CODE=$?
362:    ```
363: 
364: 4. **Evaluate the result:**
365: 
366:    **Success (exit 0 + valid summary):**
367:    - Read `$CANDIDATE_SUMMARY` and validate it contains meaningful content
368:      (not empty, has at least a heading and description — a valid SUMMARY.md structure)
369:    - Write it as the plan's SUMMARY.md file
370:    - Update STATE.md plan status to complete
371:    - Update ROADMAP.md progress
372:    - Mark plan as handled — skip it in execute_waves
373: 
374:    **Failure (non-zero exit or invalid summary):**
375:    - Display the error output and exit code
376:    - Warn: "The external command may have left uncommitted changes or partial edits
377:      in the working tree. Review `git status` and `git diff` before proceeding."
378:    - Offer three choices:
379:      - **retry** — run the same plan through cross-AI again
380:      - **skip** — fall back to normal executor for this plan (re-add to execute_waves list)
381:      - **abort** — stop execution entirely, preserve state for resume
382: 
383: 5. **After all cross-AI plans processed:** Remove successfully handled plans from the
384:    incomplete plan list so execute_waves skips them. Any skipped-to-fallback plans remain
385:    in the list for normal executor processing.
386: </step>
387: 
388: <step name="execute_waves">
389: Execute each selected wave in sequence. Within a wave: parallel if `PARALLELIZATION=true`, sequential if `false`.
390: 
391: **Stream-idle-timeout prevention — checkpoint heartbeats (#2410):**
392: 
393: Multi-plan phases can accumulate enough subagent context that the the agent API
394: SSE layer terminates with `Stream idle timeout - partial response received`
395: between a large tool_result and the next assistant turn (seen on Claude Code
396: + Opus 4.7 at ~200K+ cache_read). To keep the stream warm, emit short
397: assistant-text heartbeats — **no tool call, just a literal line** — at every
398: wave and plan boundary. Each heartbeat MUST start with `[checkpoint]` so
399: tooling and `/gsd-manager`'s background-completion handler can grep partial
400: transcripts. `{P}/{Q}` is the phase-wide completed/total plans counter and
401: increases monotonically across waves. `{status}` is `complete` (success),
402: `failed` (executor error), or `checkpoint` (human-gate returned).
403: 
404: ```
405: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
406: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
407: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} {status} ({P}/{Q} plans done)
408: [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} complete, {P}/{Q} plans done ({wave_success}/{wave_plan_count} ok)
409: ```
410: 
411: **For each wave:**
412: 
413: 1. **Intra-wave files_modified overlap check (BEFORE spawning):**
414: 
415:    Before spawning any agents for this wave, inspect the `files_modified` list of all plans
416:    in the wave. Check every pair of plans in the wave — if any two plans share even one file
417:    in their `files_modified` lists, those plans have an implicit dependency and MUST NOT run
418:    in parallel.
419: 
420:    **Detection algorithm (pseudocode):**
421:    ```
422:    seen_files = {}
423:    overlapping_plans = []
424:    for each plan in wave_plans:
425:      for each file in plan.files_modified:
426:        if file in seen_files:
427:          overlapping_plans.add(plan, seen_files[file])  # both plans overlap on this file
428:        else:
429:          seen_files[file] = plan
430:    ```
431: 
432:    **If overlap is detected:**
433:    - Warn the user:
434:      ```
435:      ⚠ Intra-wave files_modified overlap detected in Wave {N}:
436:        Plan {A} and Plan {B} both modify {file}
437:        Running these plans sequentially to avoid parallel worktree conflicts.
438:      ```
439:    - Override `PARALLELIZATION` to `false` for this wave only — run all plans in the wave
440:      sequentially regardless of the global parallelization setting.
441:    - This is a safety net for plans that were incorrectly assigned to the same wave.
442:      The planner should have caught this; flag it as a planning defect so the user can
443:      replan the phase if desired.
444: 
445:    **If no overlap:** proceed normally (parallel if `PARALLELIZATION=true`).
446: 
447: 2. **Describe what's being built (BEFORE spawning):**
448: 
449:    **First, emit the wave-start checkpoint heartbeat as a literal assistant-text
450:    line — no tool call (#2410). Do NOT skip this even for single-plan waves; it
451:    is required before any further reasoning or spawning:**
452: 
453:    ```
454:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} starting, {wave_plan_count} plan(s), {P}/{Q} plans done
455:    ```
456: 
457:    Then read each plan's `<objective>`. Extract what's being built and why.
458: 
459:    ```
460:    ---
461:    ## Wave {N}
462: 
463:    **{Plan ID}: {Plan Name}**
464:    {2-3 sentences: what this builds, technical approach, why it matters}
465: 
466:    Spawning {count} agent(s)...
467:    ---
468:    ```
469: 
470:    - Bad: "Executing terrain generation plan"
471:    - Good: "Procedural terrain generator using Perlin noise — creates height maps, biome zones, and collision meshes. Required before vehicle physics can interact with ground."
472: 
473: 2.5. **Per-plan worktree decision (run for each plan in this wave BEFORE its dispatch):**
474: 
475:    Read and execute `get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` for each plan. It extracts `PLAN_FILES` from the plan's JSON, intersects against `SUBMODULE_PATHS` (with normalization, bidirectional matching, and glob-prefix handling), and sets `USE_WORKTREES_FOR_PLAN` to `false` when the plan touches a submodule path. Append `plan_id` to a `WAVE_WORKTREE_PLANS` accumulator when `USE_WORKTREES_FOR_PLAN != false`.
476: 
477:    The dispatch branches in step 3 below MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`.
478: 
479: 3. **Spawn executor agents:**
480: 
481:    **Emit a plan-start heartbeat (literal line, no tool call) immediately before
482:    each `Agent()` dispatch (#2410):**
483: 
484:    ```
485:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} starting ({P}/{Q} plans done)
486:    ```
487: 
488:    Pass paths only — executors read files themselves with their fresh context window.
489:    For 200k models, this keeps orchestrator context lean (~10-15%).
490:    For 1M+ models (Opus 4.6, Sonnet 4.6), richer context can be passed directly.
491: 
492:    **Worktree mode** (`USE_WORKTREES_FOR_PLAN` is not `false` — evaluated per-plan in step 2.5):
493: 
494:    Before spawning, capture the current HEAD:
495:    ```bash
496:    EXPECTED_BASE=$(git rev-parse HEAD)
497:    ```
498: 
499:    **Sequential dispatch for parallel execution (waves with 2+ agents):**
500:    When spawning multiple agents in a wave, dispatch each `Agent()` call **one at a time
501:    with `run_in_background: true`** — do NOT send all Agent calls in a single message.
502:    `git worktree add` acquires an exclusive lock on `.git/config.lock`, so simultaneous
503:    calls race for this lock and fail. Sequential dispatch ensures each worktree finishes
504:    creation before the next begins (the round-trip latency of each tool call provides
505:    natural spacing), while all agents still **run in parallel** once created.
506: 
507:    ```text
508:    # CORRECT: dispatch one Agent() per message, each with run_in_background: true
509:    # → worktrees created sequentially, agents execute in parallel
510:    #
511:    # WRONG: multiple Agent() calls in a single message
512:    # → simultaneous git worktree add → .git/config.lock contention → failures
513:    ```
514: 
515:    ```text
516:    Agent(
517:      subagent_type="gsd-executor",
518:      description="Execute plan {plan_number} of phase {phase_number}",
519:      # Only include model= when executor_model is an explicit model name.
520:      # When executor_model is "inherit", omit this parameter entirely so
521:      # Claude Code inherits the orchestrator model automatically.
522:      model="{executor_model}",  # omit this line when executor_model == "inherit"
523:      isolation="worktree",
524:      prompt="
525:        <objective>
526:        Execute plan {plan_number} of phase {phase_number}-{phase_name}.
527:        Commit each task atomically. Create SUMMARY.md.
528:        Do NOT update STATE.md or ROADMAP.md — the orchestrator owns those writes after all worktree agents in the wave complete.
529:        </objective>
530: 
531:        <worktree_branch_check>
532:        FIRST ACTION: HEAD assertion MUST run before any reset/checkout. Worktrees
533:        spawned by Claude Code's `isolation="worktree"` use the `worktree-agent-<id>`
534:        namespace. If HEAD is on a protected ref (main/master/develop/trunk/release/*)
535:        or detached, HALT — do NOT self-recover by force-rewinding via `git update-ref`,
536:        that destroys concurrent commits in multi-active scenarios (#2924). Only after
537:        Step 1 passes is `git reset --hard` safe (#2015 — affects all platforms).
538:        ```bash
539:        HEAD_REF=$(git symbolic-ref --quiet HEAD || echo "DETACHED")
540:        ACTUAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
541:        if [ "$HEAD_REF" = "DETACHED" ] || echo "$ACTUAL_BRANCH" | grep -Eq '^(main|master|develop|trunk|release/.*)$'; then
542:          echo "FATAL: worktree HEAD on '$ACTUAL_BRANCH' (expected worktree-agent-*); refusing to self-recover via 'git update-ref' (#2924)." >&2
543:          exit 1
544:        fi
545:        if ! echo "$ACTUAL_BRANCH" | grep -Eq '^worktree-agent-[A-Za-z0-9._/-]+$'; then
546:          echo "FATAL: worktree HEAD '$ACTUAL_BRANCH' is not in the worktree-agent-* namespace; refusing to commit (#2924)." >&2
547:          exit 1
548:        fi
549:        ACTUAL_BASE=$(git merge-base HEAD {EXPECTED_BASE})
550:        if [ "$ACTUAL_BASE" != "{EXPECTED_BASE}" ]; then
551:          git reset --hard {EXPECTED_BASE}
552:          [ "$(git rev-parse HEAD)" != "{EXPECTED_BASE}" ] && { echo "ERROR: could not correct worktree base"; exit 1; }
553:        fi
554:        ```
555:        Per-commit HEAD/cwd-drift/path-guard: `agents/gsd-executor.md` steps 0/0a/0b + `references/worktree-path-safety.md` (in <execution_context>).
556:        </worktree_branch_check>
557: 
558:        <parallel_execution>
559:        You are running as a PARALLEL executor agent in a git worktree. Worktree path safety (cwd-drift, absolute-path guards) is in `worktree-path-safety.md` (loaded below).
560:        Run `git commit` normally — hooks run by default. Do NOT pass `--no-verify`
561:        unless the orchestrator surfaces `workflow.worktree_skip_hooks=true` in this
562:        prompt; silent bypass violates project AGENTS.md guidance (#2924).
563: 
564:        IMPORTANT: Do NOT modify STATE.md or ROADMAP.md. execute-plan.md
565:        auto-detects worktree mode (`.git` is a file, not a directory) and skips
566:        shared file updates automatically. The orchestrator updates them centrally
567:        after merge.
568: 
569:        REQUIRED: SUMMARY.md MUST be committed before you return. In worktree mode the
570:        git_commit_metadata step in execute-plan.md commits SUMMARY.md and REQUIREMENTS.md
571:        only (STATE.md and ROADMAP.md are excluded automatically). Do NOT skip or defer
572:        this commit — the orchestrator force-removes the worktree after you return, and
573:        any uncommitted SUMMARY.md will be permanently lost (#2070).
574:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
575:        </parallel_execution>
576: 
577:        <execution_context>
578:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
579:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
580:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/checkpoints.md
581:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/tdd.md
582:        @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/worktree-path-safety.md
583:        ${CONTEXT_WINDOW < 200000 ? '' : '@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/executor-examples.md'}
584:        </execution_context>
585: 
586:        <files_to_read>
587:        Read these files at execution start using the Read tool:
588:        - {phase_dir}/{plan_file} (Plan)
589:        - .planning/PROJECT.md (Project context — core value, requirements, evolution rules)
590:        - .planning/STATE.md (State)
591:        - .planning/config.json (Config, if exists)
592:        ${CONTEXT_WINDOW >= 500000 ? `
593:        - ${phase_dir}/*-CONTEXT.md (User decisions from discuss-phase — honors locked choices)
594:        - ${phase_dir}/*-RESEARCH.md (Technical research — pitfalls and patterns to follow)
595:        - ${prior_wave_summaries} (SUMMARY.md files from earlier waves in this phase — what was already built)
596:        ` : ''}
597:        - ./AGENTS.md (Project instructions, if exists — follow project-specific guidelines and coding conventions)
598:        - .claude/skills/ or .agents/skills/ (Project skills, if either exists — list skills, read SKILL.md for each, follow relevant rules during implementation)
599:        </files_to_read>
600: 
601:        ${AGENT_SKILLS}
602: 
603:        <mcp_tools>
604:        If AGENTS.md or project instructions reference MCP tools (e.g. jCodeMunch, context7,
605:        or other MCP servers), prefer those tools over Grep/Glob for code navigation when available.
606:        MCP tools often save significant tokens by providing structured code indexes.
607:        Check tool availability first — if MCP tools are not accessible, fall back to Grep/Glob.
608:        </mcp_tools>
609: 
610:        <success_criteria>
611:        - [ ] All tasks executed
612:        - [ ] Each task committed individually
613:        - [ ] SUMMARY.md created in plan directory
614:        - [ ] No modifications to shared orchestrator artifacts (the orchestrator handles all post-wave shared-file writes)
615:        </success_criteria>
616:      "
617:    )
618:    ```
619: 
620:    > **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above to spawn executor agent(s), stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.
621: 
622:    **Sequential mode** (`USE_WORKTREES_FOR_PLAN` is `false` — either project-level `USE_WORKTREES=false`, or per-plan submodule intersection forced it false in step 2.5):
623: 
624:    Omit `isolation="worktree"` from the Agent call. Replace the `<parallel_execution>` block with:
625: 
626:    ```
627:        <sequential_execution>
628:        You are running as a SEQUENTIAL executor agent on the main working tree.
629:        Use normal git commits (with hooks). Do NOT use --no-verify.
630:        REQUIRED ORDER: Write SUMMARY.md → commit → only then any narration. No text between Write and commit (truncation risk; #2070 rescue is not primary defense).
631:        </sequential_execution>
632:    ```
633: 
634:    The sequential mode Agent prompt uses the same structure as worktree mode but with these differences in success_criteria — since there is only one agent writing at a time, there are no shared-file conflicts:
635: 
636:    ```
637:        <success_criteria>
638:        - [ ] All tasks executed
639:        - [ ] Each task committed individually
640:        - [ ] SUMMARY.md created in plan directory
641:        - [ ] STATE.md updated with position and decisions
642:        - [ ] ROADMAP.md updated with plan progress (via `roadmap update-plan-progress`)
643:        </success_criteria>
644:    ```
645: 
646:    When worktrees are disabled for a plan (per-plan or project-level), that plan's executor runs on the main working tree. If **any** plan in the current wave dropped to sequential mode, execute the affected plan(s) **one at a time** to avoid concurrent writes to the main working tree — plans in the same wave that retained worktree isolation can still run in parallel alongside the sequential ones, but two non-worktree plans in the same wave must serialize. When the project-level `USE_WORKTREES=false`, all plans in the wave serialize regardless of the `PARALLELIZATION` setting.
647: 
648: 4. **Wait for all agents in wave to complete.**
649: 
650:    **Plan-complete heartbeat (#2410):** as each executor returns (or is verified
651:    via spot-check below), emit one line — `complete` advances `{P}`, `failed`
652:    and `checkpoint` do not but still warm the stream:
653: 
654:    ```
655:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} complete ({P}/{Q} plans done)
656:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} failed ({P}/{Q} plans done)
657:    [checkpoint] phase {PHASE_NUMBER} wave {N}/{M} plan {plan_id} checkpoint ({P}/{Q} plans done)
658:    ```
659: 
660:    **Completion signal fallback (Copilot and runtimes where Agent() may not return):**
661: 
662:    If a spawned agent does not return a completion signal but appears to have finished
663:    its work, do NOT block indefinitely. Instead, verify completion via spot-checks:
664: 
665:    ```bash
666:    # For each plan in this wave, check if the executor finished:
667:    SUMMARY_EXISTS=$(test -f "{phase_dir}/{plan_number}-{plan_padded}-SUMMARY.md" && echo "true" || echo "false")
668:    COMMITS_FOUND=$(git log --oneline --all --grep="{phase_number}-{plan_padded}" --since="1 hour ago" | head -1)
669:    ```
670: 
671:    **If SUMMARY.md exists AND commits are found:** The agent completed successfully —
672:    treat as done and proceed to step 5. Log: `"✓ {Plan ID} completed (verified via spot-check — completion signal not received)"`
673: 
674:    **If SUMMARY.md does NOT exist after a reasonable wait:** The agent may still be
675:    running or may have failed silently. Check `git log --oneline -5` for recent
676:    activity. If commits are still appearing, wait longer. If no activity, report
677:    the plan as failed and route to the failure handler in step 6.
678: 
679:    **This fallback applies automatically to all runtimes.** Claude Code's Agent() normally
680:    returns synchronously, but the fallback ensures resilience if it doesn't.
681: 
682: 5. **Post-wave hook validation (parallel mode only):** Hooks run on every executor commit by default (#2924); this post-wave run only fires when `workflow.worktree_skip_hooks=true` opted out of per-commit hooks:
683:    ```bash
684:    SKIP_HOOKS=$(gsd-sdk query config-get workflow.worktree_skip_hooks 2>/dev/null || echo "false")
685:    if [ "$SKIP_HOOKS" = "true" ]; then
686:      # Stash uncommitted changes under a named ref so we always pop (bare `git stash` strands them on hook/script failure).
687:      STASHED=false
688:      if (! git diff --quiet || ! git diff --cached --quiet) && git stash push -u -m "gsd-post-wave-hook-$$" >/dev/null 2>&1; then STASHED=true; fi
689:      git hook run pre-commit 2>&1 || echo "⚠ Pre-commit hooks failed — review before continuing"
690:      [ "$STASHED" = "true" ] && (git stash pop >/dev/null 2>&1 || echo "⚠ Could not pop gsd-post-wave-hook stash — recover manually")
691:    fi
692:    ```
693:    If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"
694: 
695: 5.5. **Worktree cleanup (when `isolation="worktree"` was used):**
696: 
697:    **Standard wave contract:** Each wave's worktrees merge to main via the templated path below before the next wave's worktrees fork. The cleanup loop runs once per wave at the end of the wave lifecycle. Worktrees created in wave N must be fully removed before wave N+1 forks new ones.
698: 
699:    **Cross-wave dependency deviation (supported execution mode):** When the orchestrator legitimately deviates from the standard wave model — for example, a phase with cross-wave plan dependencies that requires custom inter-worktree base-update merges (e.g., `merge: bring 09-01 + 09-02 into 09-03 base`) — the cleanup loop below is NOT automatically re-entered for those custom merges. The deviation path produces correct final history but bypasses this loop, leaving `worktree-agent-*` directories in place. Use the **cleanup-tail snippet** below to remove any residual worktrees after such a deviation.
700: 
701:    When executor agents ran in worktree isolation, their commits land on temporary branches in separate working trees. After the wave completes, merge these changes back and clean up:
702: 
703:    ```bash
704:    # List worktrees created by this wave's agents.
705:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
706:    # `.claude/worktrees/agent-` (the namespace Claude Code's `isolation="worktree"`
707:    # uses). The previous exclusion filter (`grep -v "$(pwd)$"`) destroyed the parent
708:    # workspace's `.git` whenever the workspace itself was a worktree (multi-workspace
709:    # setups, and the cross-drive Windows case where `git worktree list` reports the
710:    # registry path on a different drive than `$(pwd)`).
711:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
712:    while IFS= read -r WT; do
713:      [ -z "$WT" ] && continue
714:      # Get the branch name for this worktree
715:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
716:      if [ -n "$WT_BRANCH" ] && [ "$WT_BRANCH" != "HEAD" ]; then
717:        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
718: 
719:        # --- Orchestrator file protection (#1756) ---
720:        # Snapshot orchestrator-owned files BEFORE merge. If the worktree
721:        # branch outlived a milestone transition, its versions of STATE.md
722:        # and ROADMAP.md are stale. Main always wins for these files.
723:        STATE_BACKUP=$(mktemp)
724:        ROADMAP_BACKUP=$(mktemp)
725:        [ -f .planning/STATE.md ] && cp .planning/STATE.md "$STATE_BACKUP" || true
726:        [ -f .planning/ROADMAP.md ] && cp .planning/ROADMAP.md "$ROADMAP_BACKUP" || true
727: 
728:        # Snapshot list of files on main BEFORE merge to detect resurrections
729:        PRE_MERGE_FILES=$(git ls-files .planning/)
730: 
731:        # Pre-merge deletion check: warn if the worktree branch deletes tracked files
732:        DELETIONS=$(git diff --diff-filter=D --name-only HEAD..."$WT_BRANCH" 2>/dev/null || true)
733:        if [ -n "$DELETIONS" ]; then
734:          echo "BLOCKED: Worktree branch $WT_BRANCH contains file deletions: $DELETIONS"
735:          echo "Review these deletions before merging. If intentional, remove this guard and re-run."
736:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
737:          continue
738:        fi
739: 
740:        # Merge the worktree branch into the current branch (--no-ff ensures a merge commit so HEAD~1 is reliable)
741:        git merge "$WT_BRANCH" --no-ff --no-edit -m "chore: merge executor worktree ($WT_BRANCH)" 2>&1 || {
742:          echo "⚠ Merge conflict from worktree $WT_BRANCH — resolve manually"
743:          echo "  STATE.md backup:   $STATE_BACKUP"
744:          echo "  ROADMAP.md backup: $ROADMAP_BACKUP"
745:          echo "  Restore with: cp \$STATE_BACKUP .planning/STATE.md && cp \$ROADMAP_BACKUP .planning/ROADMAP.md"
746:          break
747:        }
748: 
749:        # Post-merge deletion audit: detect bulk file deletions in merge commit (#2384)
750:        # --diff-filter=D HEAD~1 HEAD shows files deleted by the merge commit itself.
751:        # Exclude .planning/ — orchestrator-owned deletions there are expected (resurrections
752:        # are handled below). Require ALLOW_BULK_DELETE=1 to bypass for intentional large refactors.
753:        MERGE_DEL_COUNT=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -vc '^\.planning/' || true)
754:        if [ "$MERGE_DEL_COUNT" -gt 5 ] && [ "${ALLOW_BULK_DELETE:-0}" != "1" ]; then
755:          MERGE_DELETIONS=$(git diff --diff-filter=D --name-only HEAD~1 HEAD 2>/dev/null | grep -v '^\.planning/' || true)
756:          echo "⚠ BLOCKED: Merge of $WT_BRANCH deleted $MERGE_DEL_COUNT files outside .planning/ — reverting to protect repository integrity (#2384)"
757:          echo "$MERGE_DELETIONS"
758:          echo "  If these deletions are intentional, re-run with ALLOW_BULK_DELETE=1"
759:          git reset --hard HEAD~1 2>/dev/null || true
760:          rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
761:          continue
762:        fi
763: 
764:        # Restore orchestrator-owned files (main always wins)
765:        if [ -s "$STATE_BACKUP" ]; then
766:          cp "$STATE_BACKUP" .planning/STATE.md
767:        fi
768:        if [ -s "$ROADMAP_BACKUP" ]; then
769:          cp "$ROADMAP_BACKUP" .planning/ROADMAP.md
770:        fi
771:        rm -f "$STATE_BACKUP" "$ROADMAP_BACKUP"
772: 
773:        # Detect files deleted on main but re-added by worktree merge
774:        # (e.g., archived phase directories that were intentionally removed)
775:        # A "resurrected" file must have a deletion event in main's ancestry —
776:        # brand-new files (e.g. SUMMARY.md just created by the executor) have no
777:        # such history and must NOT be removed (#2501).
778:        DELETED_FILES=$(git diff --diff-filter=A --name-only HEAD~1 -- .planning/ 2>/dev/null || true)
779:        for RESURRECTED in $DELETED_FILES; do
780:          # Only delete if this file was previously tracked on main and then
781:          # deliberately removed (has a deletion event in git history).
782:          WAS_DELETED=$(git log --follow --diff-filter=D --name-only --format="" HEAD~1 -- "$RESURRECTED" 2>/dev/null | grep -c . || true)
783:          if [ "${WAS_DELETED:-0}" -gt 0 ]; then
784:            git rm -f "$RESURRECTED" 2>/dev/null || true
785:          fi
786:        done
787: 
788:        # Amend merge commit with restored files if any changed
789:        if ! git diff --quiet .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || \
790:           [ -n "$DELETED_FILES" ]; then
791:          # Only amend the commit with .planning/ files if commit_docs is enabled (#1783)
792:          COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
793:          if [ "$COMMIT_DOCS" != "false" ]; then
794:            git add .planning/STATE.md .planning/ROADMAP.md 2>/dev/null || true
795:            git commit --amend --no-edit 2>/dev/null || true
796:          fi
797:        fi
798: 
799:        # Safety net: rescue uncommitted SUMMARY.md before worktree removal (#2070, #2838).
800:        # Filesystem-level (find + cp) bypasses git's --exclude-standard filter, which silently
801:        # drops .planning/SUMMARY.md when projects gitignore .planning/ — the rescue's prior
802:        # `git ls-files --exclude-standard` form returned empty in that case and the SUMMARY
803:        # was lost on `git worktree remove --force`.
804:        while IFS= read -r SUMMARY; do
805:          [ -z "$SUMMARY" ] && continue
806:          REL_PATH="${SUMMARY#$WT/}"
807:          if [ ! -f "$REL_PATH" ] || ! cmp -s "$SUMMARY" "$REL_PATH"; then
808:            mkdir -p "$(dirname "$REL_PATH")"
809:            cp "$SUMMARY" "$REL_PATH"
810:            echo "⚠ Rescued $REL_PATH from worktree before removal"
811:          fi
812:        done < <(find "$WT/.planning" -name "*SUMMARY.md" 2>/dev/null)
813: 
814:        # Remove the worktree
815:        if ! git worktree remove "$WT" --force; then
816:          WT_NAME=$(basename "$WT")
817:          if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
818:            echo "⚠ Worktree $WT is locked — attempting to unlock and retry"
819:            git worktree unlock "$WT" 2>/dev/null || true
820:            if ! git worktree remove "$WT" --force; then
821:              echo "⚠ Residual worktree at $WT — manual cleanup required after session exits:"
822:              echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
823:            fi
824:          else
825:            echo "⚠ Residual worktree at $WT (remove failed) — investigate manually"
826:          fi
827:        fi
828: 
829:        # Delete the temporary branch
830:        git branch -D "$WT_BRANCH" 2>/dev/null || true
831:      fi
832:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
833:    ```
834: 
835:    **Cleanup-tail snippet (use after any wave whose merges did not flow through the templated path above):**
836: 
837:    If the orchestrator deviated from the standard wave merge path (e.g., custom inter-worktree base-update merges with `merge: bring …` style messages), run this snippet after the custom merges are complete. It discovers and removes any residual `worktree-agent-*` worktrees. Safe to run when no residuals exist — it is a no-op in that case.
838: 
839:    ```bash
840:    # Cleanup-tail: remove residual agent worktrees after a cross-wave-dependency deviation.
841:    # Inclusion-based filter (#2774): match ONLY agent-spawned worktrees under
842:    # `.claude/worktrees/agent-`. Do NOT use exclusion filters (grep -v "$(pwd)$") —
843:    # they destroy the parent workspace's .git in multi-workspace or cross-drive setups.
844:    # Read line-by-line so worktree paths containing whitespace are preserved (#2774).
845:    while IFS= read -r WT; do
846:      [ -z "$WT" ] && continue
847:      WT_BRANCH=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
848:      [ -z "$WT_BRANCH" ] || [ "$WT_BRANCH" = "HEAD" ] && continue
849:      echo "Cleaning up residual worktree: $WT (branch: $WT_BRANCH)"
850:      git worktree unlock "$WT" 2>/dev/null || true
851:      if ! git worktree remove "$WT" --force; then
852:        WT_NAME=$(basename "$WT")
853:        if [ -f ".git/worktrees/${WT_NAME}/locked" ]; then
854:          echo "⚠ Worktree $WT is locked — unlock failed; manual cleanup required:"
855:          echo "    git worktree unlock \"$WT\" && git worktree remove \"$WT\" --force && git branch -D \"$WT_BRANCH\""
856:        else
857:          echo "⚠ Residual worktree at $WT — remove failed; manual cleanup required"
858:        fi
859:      else
860:        git branch -D "$WT_BRANCH" 2>/dev/null || true
861:      fi
862:    done < <(git worktree list --porcelain | grep "^worktree " | grep "\.claude/worktrees/agent-" | sed 's/^worktree //')
863:    git worktree prune
864:    ```
865: 
866:    **When to skip step 5.5:**
867: 
868:    **If no plan in this wave used worktree isolation** (project-level `USE_WORKTREES=false` OR every plan in the wave had `USE_WORKTREES_FOR_PLAN=false` — i.e. `WAVE_WORKTREE_PLANS` from step 2.5 is empty): all agents ran on the main working tree — skip this step entirely.
869: 
870:    **If the orchestrator merged via custom messages (cross-wave-dependency deviation):** the templated cleanup loop above was not triggered for those merges. Run the cleanup-tail snippet above instead. After the snippet completes, proceed to step 5.6.
871: 
872:    **If at least one plan used worktrees but others did not:** still run this cleanup — it iterates over actual `git worktree list` output and only merges back the worktrees that were created, leaving sequential plans' commits on the main tree untouched.
873: 
874:    **If no worktrees found at runtime:** Skip silently — agents may have been spawned without worktree isolation, or the orchestrator already cleaned them up.
875: 
876: 5.6. **Post-merge build & test gate:**
877: 
878:    After merging all worktrees in a wave (parallel mode), or after the last plan completes
879:    (serial mode), run a build and then the project's test suite to catch cross-plan
880:    integration issues that individual worktree self-checks cannot detect (e.g., conflicting
881:    type definitions, removed exports, import changes, link errors).
882: 
883:    This addresses the Generator self-evaluation blind spot identified in Anthropic's
884:    harness engineering research: agents reliably report Self-Check: PASSED even when
885:    merging their work creates failures.
886: 
887:    Read and execute `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md`.
888: 
889: 5.7. **Post-wave shared artifact update (when at least one plan used worktrees, skip if tests failed):**
890: 
891:    When **any** executor agent in this wave ran with `isolation="worktree"`, that agent skipped STATE.md and ROADMAP.md updates to avoid last-merge-wins overwrites. The orchestrator is the single writer for these files. After worktrees are merged back, update shared artifacts once for every completed plan in the wave (worktree-mode plans **and** sequential plans that ran on the main tree but deferred to the orchestrator for tracking writes).
892: 
893:    **Only update tracking when tests passed (TEST_EXIT=0).**
894:    If tests failed or timed out, skip the tracking update — plans should
895:    not be marked as complete when integration tests are failing or inconclusive.
896: 
897:    ```bash
898:    # Guard: only update tracking if post-merge tests passed
899:    # Timeout (124) is treated as inconclusive — do NOT mark plans complete
900:    if [ "${TEST_EXIT}" -eq 0 ]; then
901:      # Update ROADMAP plan progress for each completed plan in this wave
902:      for plan_id in {completed_plan_ids}; do
903:        gsd-sdk query roadmap.update-plan-progress "${PHASE_NUMBER}" "${plan_id}" "complete"
904:      done
905: 
906:      # Only commit tracking files if they actually changed
907:      if ! git diff --quiet .planning/ROADMAP.md .planning/STATE.md 2>/dev/null; then
908:        gsd-sdk query commit "docs(phase-${PHASE_NUMBER}): update tracking after wave ${N}" --files .planning/ROADMAP.md .planning/STATE.md
909:      fi
910:    elif [ "${TEST_EXIT}" -eq 124 ]; then

(Output capped at 50 KB. Showing lines 1-910. Use offset=911 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Runtime skill location is `.opencode/skills/`; meta-builder source-of-truth is `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md"}
<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md</path>
<type>file</type>
<content>
1: <ui_patterns>
2: 
3: Visual patterns for user-facing GSD output. Orchestrators @-reference this file.
4: 
5: ## Stage Banners
6: 
7: Use for major workflow transitions.
8: 
9: ```
10: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11:  GSD ► {STAGE NAME}
12: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13: ```
14: 
15: **Stage names (uppercase):**
16: - `QUESTIONING`
17: - `RESEARCHING`
18: - `DEFINING REQUIREMENTS`
19: - `CREATING ROADMAP`
20: - `PLANNING PHASE {N}`
21: - `EXECUTING WAVE {N}`
22: - `VERIFYING`
23: - `PHASE {N} COMPLETE ✓`
24: - `MILESTONE COMPLETE 🎉`
25: 
26: ---
27: 
28: ## Checkpoint Boxes
29: 
30: User action required. 62-character width.
31: 
32: ```
33: ╔══════════════════════════════════════════════════════════════╗
34: ║  CHECKPOINT: {Type}                                          ║
35: ╚══════════════════════════════════════════════════════════════╝
36: 
37: {Content}
38: 
39: ──────────────────────────────────────────────────────────────
40: → {ACTION PROMPT}
41: ──────────────────────────────────────────────────────────────
42: ```
43: 
44: **Types:**
45: - `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
46: - `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
47: - `CHECKPOINT: Action Required` → `→ Type "done" when complete`
48: 
49: ---
50: 
51: ## Status Symbols
52: 
53: ```
54: ✓  Complete / Passed / Verified
55: ✗  Failed / Missing / Blocked
56: ◆  In Progress
57: ○  Pending
58: ⚡ Auto-approved
59: ⚠  Warning
60: 🎉 Milestone complete (only in banner)
61: ```
62: 
63: ---
64: 
65: ## Progress Display
66: 
67: **Phase/milestone level:**
68: ```
69: Progress: ████████░░ 80%
70: ```
71: 
72: **Task level:**
73: ```
74: Tasks: 2/4 complete
75: ```
76: 
77: **Plan level:**
78: ```
79: Plans: 3/5 complete
80: ```
81: 
82: ---
83: 
84: ## Spawning Indicators
85: 
86: ```
87: ◆ Spawning researcher...
88: 
89: ◆ Spawning 4 researchers in parallel...
90:   → Stack research
91:   → Features research
92:   → Architecture research
93:   → Pitfalls research
94: 
95: ✓ Researcher complete: STACK.md written
96: ```
97: 
98: ---
99: 
100: ## Next Up Block
101: 
102: Always at end of major completions.
103: 
104: ```
105: ───────────────────────────────────────────────────────────────
106: 
107: ## ▶ Next Up
108: 
109: **{Identifier}: {Name}** — {one-line description}
110: 
111: `/clear` then:
112: 
113: `{copy-paste command}`
114: 
115: ───────────────────────────────────────────────────────────────
116: 
117: **Also available:**
118: - `/gsd-alternative-1` — description
119: - `/gsd-alternative-2` — description
120: 
121: ───────────────────────────────────────────────────────────────
122: ```
123: 
124: ---
125: 
126: ## Error Box
127: 
128: ```
129: ╔══════════════════════════════════════════════════════════════╗
130: ║  ERROR                                                       ║
131: ╚══════════════════════════════════════════════════════════════╝
132: 
133: {Error description}
134: 
135: **To fix:** {Resolution steps}
136: ```
137: 
138: ---
139: 
140: ## Tables
141: 
142: ```
143: | Phase | Status | Plans | Progress |
144: |-------|--------|-------|----------|
145: | 1     | ✓      | 3/3   | 100%     |
146: | 2     | ◆      | 1/4   | 25%      |
147: | 3     | ○      | 0/2   | 0%       |
148: ```
149: 
150: ---
151: 
152: ## Anti-Patterns
153: 
154: - Varying box/banner widths
155: - Mixing banner styles (`===`, `---`, `***`)
156: - Skipping `GSD ►` prefix in banners
157: - Random emoji (`🚀`, `✨`, `💫`)
158: - Missing Next Up block after completions
159: 
160: </ui_patterns>

(End of file - total 160 lines)
</content>

### Tool: session-tracker

**Input:**
```json
{
  "callID": "call_EfBfnWcT7iUSXw4sfO8QfuyC"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_EPpMMd7VN7zMu9SkMewRC3dg"
}
```

