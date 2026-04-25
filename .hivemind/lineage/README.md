# Hivemind Execution Lineage Category

## Owner

`src/lib/execution-lineage.ts`

## Role

rebuildable execution lineage projection under `.hivemind/`; not a workflow authority graph.

## Schema

ExecutionLineageRecord JSON plus derived Markdown.

## Index

planId, taskId, delegationId, sessionId, childSessionId, pipelineKey.

## Retention

discardable projection.

## Rebuild

rebuilt from continuity, delegation records, and journal entries.

## Marker

derived projection
