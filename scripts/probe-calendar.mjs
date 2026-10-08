import { HDate, Sedra, gematriya, parshiot } from '@hebcal/core';
import { getLeyningOnDate, getLeyningForParsha } from '@hebcal/leyning';

const today = new HDate(new Date('2026-10-07'));
console.log('today', today.toString(), 'year', today.getFullYear());

for (const il of [true, false]) {
  const sedra = new Sedra(today.getFullYear(), il);
  const result = sedra.lookup(today);
  console.log('\nIL', il, result.parsha, 'chag', result.chag, 'shabbat', result.hdate.toString());
  const reading = getLeyningOnDate(result.hdate, il, false, 'he');
  console.log('name', reading?.name);
  console.log('summary', reading?.summary);
  console.log('haftara', reading?.haftara);
  console.log('haft', JSON.stringify(reading?.haft));
  console.log('aliyah1', JSON.stringify(reading?.fullkriyah?.['1']));
  console.log('reason', reading?.reason);
}

const base = getLeyningForParsha('Bereshit', 'he');
console.log('\nbase name', base.name);
console.log('aliyot', Object.keys(base.fullkriyah));
console.log('a1', base.fullkriyah['1']);
console.log('a7', base.fullkriyah['7']);
console.log('gem', [1, 15, 16, 27].map((n) => gematriya(n)));
console.log('parshiot count', parshiot.length);
console.log(parshiot.join(', '));
