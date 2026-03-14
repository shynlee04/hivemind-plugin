/**
 * State Anchors
 * Cross-session persistent values (≤200 LOC)
 */

import * as fs from 'fs'
import * as path from 'path'
import { getHivemindPath } from '../../shared/paths'
import { log } from '../../shared/logging'

export interface Anchor {
  key: string
  value: string
  createdAt: number
  updatedAt: number
}

const ANCHORS_FILE = 'anchors.json'

function getAnchorsPath(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'state', ANCHORS_FILE)
}

export function loadAnchors(projectRoot: string): Map<string, Anchor> {
  const filePath = getAnchorsPath(projectRoot)
  
  if (!fs.existsSync(filePath)) {
    return new Map()
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content) as Record<string, Anchor>
    return new Map(Object.entries(data))
  } catch {
    return new Map()
  }
}

export function saveAnchors(projectRoot: string, anchors: Map<string, Anchor>): void {
  const filePath = getAnchorsPath(projectRoot)
  const dir = path.dirname(filePath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  const data = Object.fromEntries(anchors)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

export function setAnchor(projectRoot: string, key: string, value: string): Anchor {
  const anchors = loadAnchors(projectRoot)
  const now = Date.now()
  
  const anchor: Anchor = {
    key,
    value,
    createdAt: anchors.get(key)?.createdAt ?? now,
    updatedAt: now,
  }
  
  anchors.set(key, anchor)
  saveAnchors(projectRoot, anchors)
  log.info('Anchor saved', key)
  
  return anchor
}

export function getAnchor(projectRoot: string, key: string): Anchor | undefined {
  return loadAnchors(projectRoot).get(key)
}

export function deleteAnchor(projectRoot: string, key: string): boolean {
  const anchors = loadAnchors(projectRoot)
  const existed = anchors.delete(key)
  saveAnchors(projectRoot, anchors)
  return existed
}
