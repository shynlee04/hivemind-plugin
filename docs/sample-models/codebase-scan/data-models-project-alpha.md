# Data Models (project-alpha)

- Generated: 2026-02-24T22:37:15+0700
- Persistence backend: Dexie (`via-gent-persistence`)

## Canonical Domain Schemas

- `ProjectSchema` (`project.schema.ts`)
- `ThreadSchema`, `ThreadMessageSchema`, `ThreadToolCallSchema` (`thread.schema.ts`)
- `FileMetadataSchema`, `FileSyncStatusSchema` (`file.schema.ts`)
- `NoteSchema` (`note.schema.ts`)
- `PluginTypeSchema`, `PluginCapabilitySchema`, `ProjectPluginsSchema` (`plugin.schema.ts`)

## Primary Dexie Tables (selected)

- Core: `projects`, `ideState`, `conversations`
- AI/session: `taskContexts`, `toolExecutions`, `threads`, `toolExecutionLogs`, `credentials`
- State: `providerConfigs`, `agentConfigs`, `conversationState`, `ragState`, `workspaceState`, `terminalState`
- Sync/files: `syncStatus`, `fileMetadata`, `fileSnapshots`, `fileContentCache`, `fsaHandles`, `sessionSnapshots`, `idbFiles`
- Knowledge/content: `sources`, `collections`, `synthesisResults`, `oramaIndexes`, `embedding_models`, `notes`, `savedBlocks`, `codeSnippets`, `workflows`
- Plugins/study: `plugins`, `pluginSettings`, `pluginMarketplace`, `pluginStorage`, `flashcards`, `flashcardSets`, `studySessions`, `studyCards`, `quizzes`, `quizQuestions`
