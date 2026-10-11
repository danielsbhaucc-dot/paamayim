import { PARASHOT } from '../../src/data/parashot';
import { hebrewTokens, aramaicTokens, alignable } from '../../src/data/alignTokens';
import fs from 'node:fs';
for (const id of process.argv.slice(2)) {
  const p = PARASHOT[id];
  const rows = p.verses.filter((v) => alignable(v.hebrew)).map((v) => ({ id: v.id, he: hebrewTokens(v.hebrew, false), ar: aramaicTokens(v.onkelos) }));
  fs.writeFileSync(`.cache/align-${id}.json`, JSON.stringify(rows));
  console.log(id, p.verses.length, rows.length);
}
