const fs = require('fs')
const selected = JSON.parse(
  fs.readFileSync('C:/Users/mrauc/Documents/FastTyper/scripts/fragments-raw.json', 'utf8'),
)

function escJsx(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

const byLevel = {}
for (let L = 1; L <= 9; L++) byLevel[L] = []
for (const p of selected) byLevel[p.level].push(p)

let body = `import { H1, H2, Stack, Table, Text } from 'cursor/canvas'

/** 100 fragments — Janusz Korczak, Król Maciuś Pierwszy (Wolne Lektury) */
export default function MaciusFragments() {
  return (
    <Stack gap={24}>
      <H1>Król Maciuś — 100 fragmentów</H1>
      <Text tone="secondary">
        Tylko litery, spacje, kropka i przecinek. Poziomy: 1 = 6–10 słów … 9 = 46–50 słów.
        Źródło: wolnelektury.pl/katalog/lektura/krol-macius-pierwszy
      </Text>
`

for (let L = 1; L <= 9; L++) {
  const min = 5 * L + 1
  const max = 5 * L + 5
  const rows = byLevel[L]
  body += `
      <Stack gap={8}>
        <H2>Poziom ${L} · ${min}–${max} słów (${rows.length})</H2>
        <Table
          striped
          stickyHeader
          headers={['#', 'Słowa', 'Fragment']}
          columnAlign={['right', 'right', 'left']}
          rows={[
`
  rows.forEach((r, i) => {
    body += `            ['${i + 1}', '${r.words}', \`${escJsx(r.text)}\`],\n`
  })
  body += `          ]}
        />
      </Stack>
`
}

body += `    </Stack>
  )
}
`

const outPath =
  'C:/Users/mrauc/.cursor/projects/c-Users-mrauc-Documents-FastTyper/canvases/macius-fragments.canvas.tsx'
fs.writeFileSync(outPath, body)
console.log('canvas written', outPath, 'levels', Object.fromEntries(Object.entries(byLevel).map(([k,v])=>[k,v.length])))
