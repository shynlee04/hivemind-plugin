import { z } from 'zod'

export const timestampSchema = z.string().min(1)
export const sessionScopeSchema = z.enum(['main', 'sub-session'])
export const kernelLineageSchema = z.enum(['hivefiver', 'hiveminder'])
export const agentModeSchema = z.enum(['all', 'primary', 'sub'])

export const entryKernelStateKindSchema = z.enum([
  'uninitialized',
  'repair-required',
  'qa-pending',
  'ready',
  'blocked',
])

export const entryKernelQaStateSchema = z.enum([
  'not-required',
  'pending',
  'passed',
  'failed',
  'blocked',
])

export const entryKernelReleaseStateSchema = z.enum(['blocked', 'released'])
export const verificationVerdictSchema = z.enum(['pending', 'accepted', 'rejected'])
export const dependencyStatusSchema = z.enum(['clear', 'blocked'])
export const freshnessStatusSchema = z.enum(['fresh', 'warn', 'blocked'])
