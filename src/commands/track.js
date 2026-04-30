import fs from 'node:fs'
import { command, arg, summary } from 'paparam'
import { capture } from '../lib/snapshot.js'
import { makeRepoSlug, deleteStash } from '../lib/storage.js'
import { getRepoRoot } from '../lib/git.js'
import { bold, cyan, green, gray, yellow } from '../lib/color.js'
import { activeSession, registerRepo, getSessionStashDir } from '../lib/sessions.js'
import { initStorageDir } from '../lib/config.js'

export const trackCmd = command(
  'track',
  summary('Track the curent repo in the active session'),
  arg('[path]'),
  async (cmd) => {
    initStorageDir(cmd)
    try {
      const session = activeSession()

      if (!session) {
        console.log(`\n  ${gray('No active session.')}\n`)
        return
      }

      let repoRoot
      try {
        repoRoot = getRepoRoot(cmd.args.path)
      } catch {
        throw new Error(
          'Not inside a git repository. `wrn track` must be run from within a git repo.'
        )
      }

      const slug = makeRepoSlug(repoRoot)
      const stashDir = getSessionStashDir(session, slug)

      if (fs.existsSync(stashDir)) {
        console.log(
          `  ${gray('Re-tracking')} ${cyan(slug)} ${gray('— replacing previous snapshot.')}`
        )
      }

      deleteStash(stashDir)
      capture(slug, process.cwd(), stashDir, session, { clean: false })
      registerRepo(session, slug, repoRoot)

      console.log(
        `\n  ${green('↓')} ${bold('Tracked')} ${cyan(slug)} ${gray('in')} ${cyan(session)}\n`
      )
    } catch (err) {
      console.error(`\n  ${bold('\x1b[31mError:\x1b[0m')} ${err.message}\n`)
      process.exit(1)
    }
  }
)
