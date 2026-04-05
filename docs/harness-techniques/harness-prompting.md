<context_framework_initialization>
<context_type>system_instruction</context_type>
<framework_version>1.0</framework_version>
<load_skills>
- skill: harness-writing
  source: https://github.com/trailofbits/skills
- skill: agent-harness-construction
  source: https://github.com/affaan-m/everything-claude-code
- skill: harness
  source: https://github.com/cexll/myclaude
</load_skills>
</context_framework_initialization>

<context_tag_taxonomy>

<context_boundary_tags>
<context_start{id: user_prompt} />
<context_start{id: giving_example} />
<context_start{id: execution} />
<context_start{id: hierarchical} />
<context_start{id: attachment} />
<context_start{id: user_in-line_references} />

<context_break{id: user_prompt} />
<context_shift{target: new_context} />
<context_resume{id: paused_context} />
<context_end{id: any_defined} />
<context_supersede{replaced: [context_ids]} />
</context_boundary_tags>

<context_semantic_modifiers>
<context_attribute>priority</context_attribute>
<context_attribute>persistence</context_attribute>
<context_attribute>scope</context_attribute>
<context_attribute>mutability</context_attribute>
</context_semantic_modifiers>

<execution_context_params>
<execution_order>
<option: meta-concept>
<option: command>
<option: subagent>
<option: workflow>
<option: CLI_command>
<option: hooks>
<option: event_subscriptions>
<option: tools>
<option: plugins>
<option: skills>
</execution_order>
<execution_requirements>
<constraint: order_of_execution>
<constraint: disk_write_operations>
<constraint: reusable_as_background>
</execution_requirements>
</execution_context_params>

<hierarchical_context_params>
<crud_operation>create | read | update | delete</crud_operation>
<target_operation>specify_operation_target</target_operation>
<expected_result>define_outcome</expected_result>
<consumption_instruction>brief_directive_for_processing</consumption_instruction>
</hierarchical_context_params>

<attachment_type_modifiers>
<type: link>
<type: project_attachment>
<type: past_session>
<type: code_files>
<type: documents>
<type: planning>
<type: background_references>
<type: prompting>
</attachment_type_modifiers>

<user_in-line_reference_params>
<content_start />
<reference_note{cognitive_framework: optional}>
<content_end />
</user_in-line_reference_params>

</context_tag_taxonomy>

<reference_synthesis_library>

## Example system
Refine this prompt to be clear, concise, and effective.
Keep the core intent but improve clarity and readability.
Do not add unnecessary details or expand the scope beyond what is asked.
Reply with ONLY the refined prompt - no conversation, explanations, lead-in, bullet points, placeholders, or surrounding quotes.
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- SYSTEMATIC CONVERSATION CONTEXT MANAGEMENT FRAMEWORK                    -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- CONTEXT MANAGEMENT: Controls the flow and state of conversation context -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<context_scope>
    <!-- Defines the primary scope/boundary for context operations -->
    <context_scope_start identifier="{unique_id}" type="{task|project|domain|topic}" priority="{critical|high|normal|low}">
        <!-- Marks the beginning of a distinct contextual domain -->
        <!-- Establishes clear boundaries for context isolation or continuity -->
    </context_scope_start>
    
    <context_scope_end identifier="{unique_id}" disposition="{preserve|discard|archive}">
        <!-- Marks closure of a contextual scope with explicit handling instruction -->
    </context_scope_end>
</context_scope>

<context_operation>
    <context_break reason="{abrupt|suspended|pending_verification}" checkpoint="{save_state|discard_state}">
        <!-- Pauses current context flow, optionally preserving state -->
    </context_break>
    
    <context_shift target="{context_identifier}" mode="{replace|stack|push|merge}" transition_rationale="{brief_explanation}">
        <!-- Transfers focus to a different contextual domain -->
        <!-- Modes: replace=direct switch, stack=layer on top, push=queue, merge=combine contexts -->
    </context_shift>
    
    <context_resume identifier="{previous_context_id}" resume_point="{explicit_marker|continuation|rewind_to}">
        <!-- Returns to a previously suspended or shifted context -->
    </context_resume>
    
    <context_supersede replacement_target="{context_ids_to_replace}" superseding_context="{new_context_id}" conflict_resolution="{new_wins|merge|manual_review}">
        <!-- Explicitly invalidates one or more prior contexts, substituting new context -->
    </context_supersede>
</context_operation>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- INLINE REFERENCE TAGS: Embeds external content with processing guidance  -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<inline_reference>
    <content_consumption instruction="{read|scan|analyze|summarize|interpret|execute}" 
                         framework="{optional_cognitive_approach}"
                         depth="{surface|standard|deep|exhaustive}">
        
        <!-- Primary inline reference marker -->
        <source type="{link|document|code|data|artifact|chat_history|planning|specification}"
                location="{url|file_path|reference_id}"
                format="{markdown|json|xml|plain_text|structured|binary}"
                credentials="{required_if_restricted}">
            
            <!-- Inline reference content or pointer -->
            <!-- Supports rich embedding or external referencing -->
            
        </source>
        
        <consumption_guidance>
            <!-- Optional directives for how the agent should process this content -->
            <priority_elements element_list="{comma_separated_elements}"/>
            <ignore_elements element_list="{comma_separated_elements}"/>
            <transformation_rules rule_set="{normalize|sanitize|extract|summarize|synthesize}"/>
            <output_expectation format="{as_is|processed|extracted|transformed}"/>
        </consumption_guidance>
        
    </content_consumption>
</inline_reference>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- ATTACHMENT MANAGEMENT: References external files and resources           -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<attachment_group classification="{project|background|reference|supporting|artifact}">
    <!-- Groups related attachments under a unified classification -->
    
    <attachment type="{file|document|codebase|planning|specification|configuration|data|media|link|external_service}"
               role="{primary|supporting|dependency|prerequisite|output|template|example}"
               access="{inline|path_reference|url|embedded}"
               handling="{bind_to_session|persist_across_sessions|temporary|disposable}">
        
        <source>
            <!-- Detailed source specification -->
            <location>{file_path|url|uri|inline_content}</location>
            <format>{file_extension_or_mime_type}</format>
            <integrity_check hash="{optional_hash_for_verification}>
        </source>
        
        <metadata>
            <description>{brief_purpose_description}</description>
            <version>{if_applicable}</version>
            <relationship>{how_this_relates_to_other_attachments}</relationship>
        </metadata>
        
        <processing_directive>
            <load_timing>{eager|lazy|on_demand}</load_timing>
            <cache_policy>{retain|clear_after_use|refresh_if_stale}</cache_policy>
            <modification_allowance>{read_only|modifiable|create_derivative}</modification_allowance>
        </processing_directive>
        
    </attachment>
    
</attachment_group>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- EXECUTION CONTEXT: Defines operational parameters and workflow control    -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<execution_context>
    
    <execution_strategy orchestration="{sequential|parallel|conditional|event_driven|hybrid}">
        <!-- Overall execution approach -->
    </execution_strategy>
    
    <execution_order>
        <!-- Defines sequence and dependencies -->
        <phase identifier="{phase_name}" sequence="{integer}" 
               depends_on="{comma_separated_phase_ids}" 
               parallelizable="{boolean}">
            
            <operation type="{command|script|tool_invocation|subagent|workflow|cli|api|webhook|hook|event_subscription}">
                <!-- Specific operation to execute in this phase -->
            </operation>
            
            <input_specification>
                <!-- Required inputs and their sources -->
            </input_specification>
            
            <output_expectation>
                <!-- Expected results and their destinations -->
            </output_expectation>
            
            <failure_handling strategy="{abort|retry|fallback|skip|manual_intervention}">
                <!-- Behavior on operation failure -->
            </failure_handling>
            
        </phase>
    </execution_order>
    
    <execution_requirements>
        <!-- Constraints and prerequisites -->
        
        <prerequisite type="{resource|permission|dependency|environment|state}">
            <specification>{detailed_requirement}</specification>
        </prerequisite>
        
        <constraint type="{time_limit|memory|cost|rate_limit|scope}">
            <limit>{specific_limit}</limit>
        </constraint>
        
        <disk_requirement operation="{read|write|modify|create|delete}" 
                         target="{path_or_glob_pattern}"
                         overwrite_policy="{error|replace|append|version}">
        </disk_requirement>
        
        <reusability scope="{ephemeral|session|project|permanent}" 
                     exposure="{private|shared|callable}">
            <!-- How results/knowledge can be reused -->
        </reusability>
        
    </execution_requirements>
    
    <execution_hooks>
        <on_start trigger_condition="{always|conditional}">
            <!-- Pre-execution hook -->
        </on_start>
        <on_success>
            <!-- Post-success hook -->
        </on_success>
        <on_failure condition="{any|specific_error_codes}">
            <!-- Error handling hook -->
        </on_failure>
        <on_complete always_execute="{boolean}">
            <!-- Cleanup/finally hook -->
        </on_complete>
    </execution_hooks>
    
</execution_context>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- HIERARCHICAL OPERATIONS: CRUD-style structured operations on content      -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<hierarchical_context scope="{entity_type}" operation="{CRUD_action}" depth="{level}">
    
    <!-- Read Operations -->
    <operation type="read">
        <target_entity>{entity_path_or_identifier}</target_entity>
        <traversal_strategy>{recursive|shallow|selective|breadth_first|depth_first}</traversal_strategy>
        <filter_criteria>{conditions_for_inclusion}</filter_criteria>
        <projection>{specific_fields_to_retrieve|all}</projection>
        <expectation result_type="{single|collection|tree|hierarchy}">
            <!-- Expected output structure -->
        </expectation>
    </operation>
    
    <!-- Create Operations -->
    <operation type="create">
        <target_container>{parent_path_or_identifier}</target_container>
        <entity_specification>{structure_to_create}</entity_specification>
        <placement_policy>{append|prepend|replace|insert_at_position}</placement_policy>
        <validation_rules>{schema_or_constraints}</validation_rules>
    </operation>
    
    <!-- Update Operations -->
    <operation type="update">
        <target_entity>{entity_to_modify}</target_entity>
        <modification_specification>{changes_to_apply}</modification_specification>
        <strategy>{replace|merge|patch|atomic}</strategy>
        <conflict_resolution>{optimistic|overwrite|merge|reject}</conflict_resolution>
    </operation>
    
    <!-- Delete Operations -->
    <operation type="delete">
        <target_entity>{entity_to_remove}</target_entity>
        <cascade_policy>{cascade|restrict|set_null}</cascade_policy>
        <soft_delete>{boolean—if true, mark as deleted rather than physical removal}</soft_delete>
        <backup_policy>{create_backup|skip}</backup_policy>
    </operation>
    
</hierarchical_context>

<!-- ───────────────────────────────────────────────────────────────────────── -->
<!-- EXAMPLE/DEMONSTRATION: Provides illustrative content                     -->
<!-- ───────────────────────────────────────────────────────────────────────── -->

<example_group purpose="{illustrate|template|demonstrate|test_case|reference}">
    <!-- Groups multiple related examples -->
    
    <example id="{unique_id}" type="{valid|invalid|canonical|edge_case|annotated}">
        <description>{what_this_example_demonstrates}</description>
        <context>{setup_and_prerequisites}</context>
        
        <content>
            <!-- The example content itself -->
        </content>
        
        <annotation>
            <!-- Explanation of significance or key points -->
            <key_insight>{critical_learning_point}</key_insight>
            <common_pitfalls>{mistakes_to_avoid}</common_pitfalls>
        </annotation>
        
    </example>
    
</example_group>

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- USAGE NOTES                                                              -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!--                                                                          
   1. All tags support optional 'id' or 'identifier' attributes for          
      cross-referencing and state management                                 
                                                                          
   2. Nesting is hierarchical—parent tags establish scope for children       
                                                                          
   3. When 'optional' elements are omitted, default behaviors apply          
                                                                          
   4. Custom attributes can be added as {custom_attribute_name}              
                                                                          
   5. Tags can be combined in flexible ways to match conversation needs     
                                                                          
═══════════════════════════════════════════════════════════════════════════ -->
${userInput}

<principle>Consume the patterns, methods, and ideas as foundational concepts — not as applications to replicate, but as abstracted frameworks to adapt</principle>

<checkpoint_references>
<repo>https://github.com/gsd-build/get-shit-done</repo>
<path>/get-shit-done/references/checkpoints.md</path>
<concept>progressive_validation</concept>
</checkpoint_references>

<contract_references>
<repo>https://github.com/gsd-build/get-shit-done</repo>
<path>/get-shit-done/references/agent-contracts.md</path>
<concept>structured_agreements</concept>
</contract_references>

<gate_references>
<repo>https://github.com/gsd-build/get-shit-done</repo>
<path>/get-shit-done/references/gate-prompts.md</path>
<concept>decision_points</concept>
</gate_references>

</reference_synthesis_library>

<methodology_demonstration>

<purpose>Demonstrate YAML frontmatter-driven instruction patterns for planning granularity and gatekeeping</purpose>

<example_structure>
<root>.worktrees/product-detox/.archive/.planning</root>
<categories>
- <category: codebase>
  files: [ARCHITECTURE, CONCERNS, CONVENTIONS, INTEGRATIONS, STACK, STRUCTURE, TESTING]
  <category: phases>
  items:
  - <phase: 01-dual-plane-runtime-backbone>
    components: [OWNER-MAP, PROOF-GATE, SHADOW-INVENTORY, SUMMARY, VERIFICATION]
  - <phase: 01-runtime-authority-baseline>
    components: [PLAN, SUMMARY, CONTEXT, RESEARCH, VALIDATION, deferred-items]
  - <phase: 02-unified-runtime-operations>
    components: [PLAN, SUMMARY, CONTEXT, RESEARCH, VALIDATION, VERIFICATION]
  - <phase: 2.1-feature-architecture-migration>
    components: [PLAN, SUMMARY, VERIFICATION, CONTEXT, RESEARCH, VALIDATION, deferred-items]
</categories>
</example_structure>

<yaml_frontmatter_pattern>
<type: phase_metadata>
fields:
  - phase_id
  - objectives
  - prerequisites
  - gate_conditions
  - outputs
  - validation_criteria
</yaml_frontmatter_pattern>

</methodology_demonstration>

<operational_directives>

<when_parsing_context_tags>
<directive>Respect all opening and closing tags as hard boundaries</directive>
<directive>Apply attribute modifiers to enclosed content</directive>
<directive>Maintain tag hierarchy and nesting relationships</directive>
</when_parsing_context_tags>

<when_processing_references>
<directive>Extract conceptual frameworks, not implementation details</directive>
<directive>Synthesize patterns across multiple reference sources</directive>
<directive>Apply abstracted knowledge to novel contexts</directive>
</when_processing_references>

<when_executing_workflow>
<directive>Verify gate conditions before phase progression</directive>
<directive>Document decisions at checkpoint boundaries</directive>
<directive>Maintain traceability between plan and execution</directive>
</when_executing_workflow>

</operational_directives>

### REFERENCES HIGHLIGHTS:

- .worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-01-PLAN.md → in GSD when agent is set up with both hooks and CLI tools + how soft concepts as command https://github.com/gsd-build/get-shit-done/blob/main/commands/gsd/plan-phase.md (best practice of parsing and tags, and yaml frontmatter give instruction as “smart” not “dumbfounded instructions”)
```markdown
.worktrees/product-detox/.archive/.planning
.worktrees/product-detox/.archive/.planning/codebase
.worktrees/product-detox/.archive/.planning/codebase/ARCHITECTURE.md
.worktrees/product-detox/.archive/.planning/codebase/CONCERNS.md
.worktrees/product-detox/.archive/.planning/codebase/CONVENTIONS.md
.worktrees/product-detox/.archive/.planning/codebase/INTEGRATIONS.md
.worktrees/product-detox/.archive/.planning/codebase/STACK.md
.worktrees/product-detox/.archive/.planning/codebase/STRUCTURE.md
.worktrees/product-detox/.archive/.planning/codebase/TESTING.md
.worktrees/product-detox/.archive/.planning/phases
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone/01-01-OWNER-MAP.md
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone/01-01-PROOF-GATE.md
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone/01-01-SHADOW-INVENTORY.md
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone/01-01-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/01-dual-plane-runtime-backbone/VERIFICATION.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-01-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-01-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-02-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-02-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-CONTEXT.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-RESEARCH.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/01-VALIDATION.md
.worktrees/product-detox/.archive/.planning/phases/01-runtime-authority-baseline/deferred-items.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-00-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-00-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-01-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-01-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-02-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-02-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-03-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-03-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-CONTEXT.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-RESEARCH.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-VALIDATION.md
.worktrees/product-detox/.archive/.planning/phases/02-unified-runtime-operations/02-VERIFICATION.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-01-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-01-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-02-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-02-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-03-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-03-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-04-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-04-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-05-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-05-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-06-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-06-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-06-VERIFICATION.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-07-PLAN.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-07-SUMMARY.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-07-VERIFICATION.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-CONTEXT.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-RESEARCH.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/2.1-VALIDATION.md
.worktrees/product-detox/.archive/.planning/phases/2.1-feature-architecture-migration/deferred-items.md
```