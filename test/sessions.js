import { test, hook } from 'brittle'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'wrn-test-sessions-'))
process.env.WRN_HOME = tmpHome

const {
  readSession,
  writeSession,
  registerRepo,
  activeSession,
  setActiveSession,
  clearActiveSession,
  listSessions,
  getSessionStashDir
} = await import('../src/lib/sessions.js')

test('readSession returns null for unknown session', (t) => {
  t.is(readSession('nonexistent'), null)
})

test('writeSession / readSession round-trips', (t) => {
  const session = { name: 'roundtrip', timestamp: 12345, repos: {} }
  writeSession(session)
  t.alike(readSession('roundtrip'), session)
})

test('registerRepo adds repo to session.repos', (t) => {
  registerRepo('mysession', 'repo-abc123', '/path/to/repo')
  const session = readSession('mysession')
  t.is(session.repos['repo-abc123'].repoPath, '/path/to/repo')
  t.is(session.repos['repo-abc123'].repoSlug, 'repo-abc123')
})

test('activeSession returns null when no current file exists', (t) => {
  clearActiveSession()
  t.is(activeSession(), null)
})

test('setActiveSession writes current file; activeSession returns name', (t) => {
  setActiveSession('foo')
  t.is(activeSession(), 'foo')
})

test('clearActiveSession removes file; activeSession returns null', (t) => {
  setActiveSession('bar')
  clearActiveSession()
  t.is(activeSession(), null)
})

test('listSessions returns [] when sessions dir is missing', (t) => {
  const savedHome = process.env.WRN_HOME
  process.env.WRN_HOME = path.join(os.tmpdir(), 'wrn-nonexistent-dir-' + Date.now())
  t.alike(listSessions(), [])
  process.env.WRN_HOME = savedHome
})

test('listSessions returns sessions sorted by timestamp descending', (t) => {
  writeSession({ name: 'older', timestamp: 1000, repos: {} })
  writeSession({ name: 'newer', timestamp: 9000, repos: {} })
  const sessions = listSessions()
  const names = sessions.map((s) => s.name)
  t.ok(names.indexOf('newer') < names.indexOf('older'))
})

test('getSessionStashDir returns path ending with sessions/<name>/<slug>', (t) => {
  const dir = getSessionStashDir('mysession', 'myrepo')
  t.ok(dir.endsWith(path.join('sessions', 'mysession', 'myrepo')))
})

hook(() => fs.rmSync(tmpHome, { recursive: true, force: true }))
