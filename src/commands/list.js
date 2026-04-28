import { command, summary } from 'paparam'
import { getRepoRoot } from '../lib/git.js'
import { makeRepoSlug, listStashes } from '../lib/storage.js'
import { listSessions } from '../lib/sessions.js'
import { green, bold, cyan, yellow, gray, dim } from '../lib/color.js'

export const listCmd = command('list', summary('List all stashes for this repo'), async () => {
  try {
    const repoRoot = getRepoRoot()
    const slug = makeRepoSlug(repoRoot)
    const stashes = listStashes(slug)
    const sessions = listSessions()

    if (stashes.length === 0 && sessions.length === 0) {
      console.log(`\n  ${gray('No stashes found for this repo.')}\n`)
      return
    }

    console.log()
    if (stashes.length) {
      console.log(`  ${green('Stashes')}`)
      for (const meta of stashes) {
        const date = new Date(meta.timestamp).toLocaleString()
        const s = meta.stats
        const detail = s ? dim(`${s.files}t ${s.untracked ?? 0}u ${s.links}l ${s.modified}m`) : ''
        console.log(`  ${cyan(bold(meta.name))}  ${yellow(meta.branch)}  ${gray(date)}  ${detail}`)
      }
      console.log()
    }
    if (sessions.length) {
      console.log(`  ${green('Sessions')}`)
      for (const session of sessions) {
        const date = new Date(session.timestamp).toLocaleString()
        const s = session.repos
        const detail = s ? dim(`${Object.entries(session.repos).length}r`) : ''
        console.log(`  ${cyan(bold(session.name).padEnd(36, ' '))} ${gray(date)}  ${detail}`)
      }
      console.log()
      console.log(`  ${dim('t=tracked  u=untracked  l=symlinks  m=modified r=repos')}`)
      console.log()
    }
  } catch (err) {
    console.error(`\n  ${bold('\x1b[31mError:\x1b[0m')} ${err.message}\n`)
    process.exit(1)
  }
})
