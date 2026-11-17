import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { setTimeout } from 'timers/promises'
import { styleText } from 'util'

const BUMP = process.argv[2] ?? 'patch' // can be any pnpm supports

// Enter root dir
process.chdir(execSync('git rev-parse --show-toplevel').toString().trim())

// Allow script to only run on main
const BRANCH = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
if (BRANCH !== 'main') {
  console.error(styleText('red', `script should onlt be run on main (you are on '${BRANCH}')`))
  process.exit(1)
}
// Pull and ensure main is upto date
execSync('git fetch --quiet origin main')
if (execSync('git rev-list --count HEAD..origin/main').toString().trim() !== '0') {
  console.error(styleText('red', 'main is behind origin. please pull first!'))
  process.exit(1)
}

// bump lachesis version
execSync(`cd apps/lachesis && pnpm version ${BUMP} --no-git-tag-version`)

// Prepare release string
const VERSION = JSON.parse(readFileSync('apps/lachesis/package.json', 'utf8')).version
const DATE = new Date().toISOString().split('T')[0]
const RELEASE = `<release version="${VERSION}" date="${DATE}"><url type="details">https://github.com/lepsehq/lepse/releases/tag/v${VERSION}</url><description /></release>`

// Write release string to metainfo
const METAINFO = 'apps/lachesis/src-tauri/app.lepse.Lepse.metainfo.xml'
writeFileSync(
  METAINFO,
  readFileSync(METAINFO, 'utf-8').replace(
    '<releases>',
    `<releases>${RELEASE}` /* this is to prepend the release at the topmost of `<releases>` */
  )
)
execSync(`pnpm prettier --write ${METAINFO}`)

// Commit
execSync('git add .') // safe to assume no other changes were made (pnpm version doesn't run with changes)
execSync(`git commit -m "v${VERSION}"`)
execSync(`git tag -a "v${VERSION}" -m "v${VERSION}"`)

// Push
process.stdout.write(styleText('yellow', 'pushing in '))
for (let i = 12; i > 0; i--) {
  process.stdout.write(styleText('yellow', i % 4 === 0 ? Math.round(i / 4).toString() : '.'))
  await setTimeout(1000 / 4)
}
process.stdout.write('\n')
execSync('git push --follow-tags')
