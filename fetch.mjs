import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ENDPOINT = 'https://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList';
const TARGETS = JSON.parse(await readFile('targets.json', 'utf8'));

const dashed = (value) =>
  /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : '';

const pick = (row, key) => dashed(String(row[key] ?? '').trim());

function toSchedule(row, year) {
  return {
    year,
    round: String(row.implSeq ?? ''),
    description: String(row.description ?? ''),
    writtenApplyStart: pick(row, 'docRegStartDt'),
    writtenApplyEnd: pick(row, 'docRegEndDt'),
    writtenStart: pick(row, 'docExamStartDt'),
    writtenEnd: pick(row, 'docExamEndDt'),
    writtenPass: pick(row, 'docPassDt'),
    practicalApplyStart: pick(row, 'pracRegStartDt'),
    practicalApplyEnd: pick(row, 'pracRegEndDt'),
    practicalStart: pick(row, 'pracExamStartDt'),
    practicalEnd: pick(row, 'pracExamEndDt'),
    practicalPass: pick(row, 'pracPassDt'),
  };
}

async function ask(key, year, jmCd) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', key);
  url.searchParams.set('dataFormat', 'json');
  url.searchParams.set('implYy', String(year));
  url.searchParams.set('qualgbCd', 'T');
  url.searchParams.set('jmCd', jmCd);
  url.searchParams.set('numOfRows', '50');
  url.searchParams.set('pageNo', '1');

  const answer = await fetch(url);
  const body = (await answer.text()).replaceAll(key, '***');
  if (!answer.ok) throw new Error(`${answer.status} ${body.slice(0, 300)}`);
  const parsed = JSON.parse(body);
  if (parsed.header?.resultCode !== '00') {
    throw new Error(`${parsed.header?.resultCode} ${parsed.header?.resultMsg ?? ''}`);
  }
  return parsed.body?.items ?? [];
}

function merge(rows, year) {
  const box = new Map();
  for (const row of rows) {
    const one = toSchedule(row, year);
    const at = `${one.year}-${one.round}`;
    const before = box.get(at);
    if (!before) box.set(at, one);
    else if (one.writtenApplyStart && one.writtenApplyStart < before.writtenApplyStart) {
      box.set(at, { ...before, writtenApplyStart: one.writtenApplyStart });
    }
  }
  return [...box.values()];
}

const key = process.env.DATA_GO_KR_KEY;
if (!key) {
  console.error('DATA_GO_KR_KEY 가 없다.');
  process.exit(1);
}

const thisYear = new Date().getFullYear();
await mkdir('data', { recursive: true });
const index = [];

for (const target of TARGETS) {
  const found = [];
  for (const year of [thisYear, thisYear + 1]) {
    let rows;
    try {
      rows = await ask(key, year, target.jmCd);
    } catch (reason) {
      console.error(`${target.name} ${year} 실패: ${reason.message}`);
      continue;
    }
    if (rows.length === 0) {
      console.log(`${target.name} ${year} 은 아직 공고되지 않았다.`);
      continue;
    }
    found.push(...merge(rows, year));
  }

  found.sort((a, b) => a.year - b.year || Number(a.round) - Number(b.round));
  if (found.length === 0) {
    console.error(`${target.name} 은 받지 못했다.`);
    continue;
  }

  const path = `data/${target.jmCd}.json`;
  await writeFile(path, `${JSON.stringify(
    { jmCd: target.jmCd, name: target.name, fetched: new Date().toISOString(), found },
    null, 2)}\n`);
  index.push({ jmCd: target.jmCd, name: target.name, path, rounds: found.length });
  console.log(`${target.name} ${found.length} 회차 -> ${path}`);
  for (const one of found) {
    console.log(`  ${one.year} ${one.round}회 필기 ${one.writtenStart} 실기 ${one.practicalStart}`);
  }
}

await writeFile('data/index.json',
  `${JSON.stringify({ fetched: new Date().toISOString(), targets: index }, null, 2)}\n`);
console.log(`색인 ${index.length} 종목`);
