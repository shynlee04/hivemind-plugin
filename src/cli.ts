#!/usr/bin/env node

import { cwd } from 'node:process'

import { resolveCliInvocation } from './cli/command-routing.js'
import { runDoctorCommand } from './cli/doctor.js'
import { runHarnessCommand } from './cli/harness.js'
import { initProject } from './cli/init.js'
import { runSettingsCommand } from './cli/settings.js'

type ParsedArgs = {
  flags: Record<string, string | boolean>
  positionals: string[]
}

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {}
  const positionals: string[] = []

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      positionals.push(arg)
      continue
    }

    const key = arg.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      flags[key] = true
      continue
    }

    flags[key] = next
    index += 1
  }

  return { flags, positionals }
}

function printHelp(): void {
  console.log([
    'HiveMind Revamp CLI',
    '',
    'Commands:',
    '  init      Bootstrap runtime entry surfaces and control plane',
    '  doctor    Repair runtime entry and recovery spine',
    '  settings  Persist runtime attachment defaults',
    '  harness   Validate runtime attachment and server health',
    '',
    'Alias binaries:',
    '  hm-init, hm-doctor, hm-settings, hm-harness',
    '',
    'Profile flags:',
    '  --name <value>              Preferred user name for runtime guidance',
    '  --lang <value>              Chat language (for example: en, vi, Vietnamese)',
    '  --artifact-lang <value>     Artifact/document language override',
    '  --governance <value>        Governance posture',
    '  --automation <value>        Automation posture',
    '  --output-style <value>      Output style preference',
    '  --expert-level <value>      User expertise level',
    '  --preset <value>            Use an explicit non-interactive preset (guided-onboarding)',
  ].join('\n'))
}

/**
 * Run the revamp CLI entrypoint.
 *
 * @param argv Process argv without the node and executable segments.
 * @param executablePath Executable path for alias resolution.
 * @returns Process exit code.
 */
export async function runCli(argv: string[], executablePath?: string): Promise<number> {
  const parsed = parseArgs(argv)
  const resolved = resolveCliInvocation(executablePath, parsed.positionals)
  const flags = parsed.flags
  const json = flags.json === true
  const directory = typeof flags['project-root'] === 'string' ? flags['project-root'] : cwd()

  if (resolved.command === 'help') {
    printHelp()
    return 0
  }

  let result: unknown
  switch (resolved.command) {
    case 'init':
      result = await initProject(directory, {
        preferredUserName: typeof flags.name === 'string'
          ? flags.name
          : typeof flags['preferred-name'] === 'string'
            ? flags['preferred-name']
            : undefined,
        language: typeof flags.lang === 'string' ? flags.lang : undefined,
        artifactLanguage: typeof flags['artifact-lang'] === 'string'
          ? flags['artifact-lang']
          : typeof flags['artifact-language'] === 'string'
            ? flags['artifact-language']
            : undefined,
        governanceMode: typeof flags.governance === 'string' ? flags.governance : undefined,
        automationLevel: typeof flags.automation === 'string' ? flags.automation : undefined,
        outputStyle: typeof flags['output-style'] === 'string' ? flags['output-style'] : undefined,
        expertLevel: typeof flags['expert-level'] === 'string' ? flags['expert-level'] : undefined,
        presetId: typeof flags.preset === 'string' ? flags.preset as 'guided-onboarding' : undefined,
        silent: true,
      })
      break
    case 'doctor':
      result = await runDoctorCommand(directory, {
        sessionId: typeof flags['session-id'] === 'string' ? flags['session-id'] : `ses_doctor_${Date.now()}`,
      })
      break
    case 'settings':
      result = await runSettingsCommand(directory, {
        sessionId: typeof flags['session-id'] === 'string' ? flags['session-id'] : `ses_settings_${Date.now()}`,
        preferredUserName: typeof flags.name === 'string'
          ? flags.name
          : typeof flags['preferred-name'] === 'string'
            ? flags['preferred-name']
            : undefined,
        language: typeof flags.lang === 'string' ? flags.lang : undefined,
        artifactLanguage: typeof flags['artifact-lang'] === 'string'
          ? flags['artifact-lang']
          : typeof flags['artifact-language'] === 'string'
            ? flags['artifact-language']
            : undefined,
        governanceMode: typeof flags.governance === 'string' ? flags.governance : undefined,
        automationLevel: typeof flags.automation === 'string' ? flags.automation : undefined,
        outputStyle: typeof flags['output-style'] === 'string' ? flags['output-style'] : undefined,
        expertLevel: typeof flags['expert-level'] === 'string' ? flags['expert-level'] : undefined,
        presetId: typeof flags.preset === 'string' ? flags.preset as 'guided-onboarding' : undefined,
      })
      break
    case 'harness':
      result = await runHarnessCommand(directory, {
        serverUrl: typeof flags['server-url'] === 'string' ? flags['server-url'] : undefined,
      })
      break
    default:
      printHelp()
      return 1
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(result)
  }
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2), process.argv[1])
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(error)
      process.exitCode = 1
    })
}
