import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const index = JSON.parse(await readFile('data/index.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const esc = (value) => String(value).replace(/[&<>"]/g,
  (one) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[one]);

const mmdd = (when) => (when ? when.slice(5).replace('-', '.') : '-');

function eventsOf(one) {
  return [
    ['필기 접수', one.writtenApplyStart, one.writtenApplyEnd],
    ['필기 시험', one.writtenStart, one.writtenEnd],
    ['필기 발표', one.writtenPass, ''],
    ['실기 접수', one.practicalApplyStart, one.practicalApplyEnd],
    ['실기 시험', one.practicalStart, one.practicalEnd],
    ['최종 발표', one.practicalPass, ''],
  ];
}

let body = '';
for (const target of index.targets) {
  const raw = JSON.parse(await readFile(target.path, 'utf8'));
  body += `<h2>${esc(raw.name)} <small>jmCd ${esc(raw.jmCd)}</small></h2>`;
  body += `<p class="api">JSON <a href="${esc(raw.jmCd)}.json">${esc(raw.jmCd)}.json</a></p>`;

  for (const one of raw.found) {
    const rows = eventsOf(one).filter(([, from]) => from).map(([label, from, to]) => {
      const span = to && to !== from ? `${mmdd(from)} ~ ${mmdd(to)}` : mmdd(from);
      const done = (to || from) < today;
      return `<tr class="${done ? 'past' : ''}"><td>${esc(label)}</td>` +
        `<td>${esc(span)}</td><td>${done ? '종료' : 'D-' +
          Math.round((new Date(from + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
        }</td></tr>`;
    }).join('');
    body += `<h3>${one.year}년 ${esc(one.round)}회</h3><table>${rows}</table>`;
  }
}

const page = `<!doctype html><html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>국가자격 시험일정</title><style>
:root{color-scheme:light dark}
body{font:15px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;
 max-width:720px;margin:0 auto;padding:24px 16px}
h1{font-size:20px;margin:0 0 4px}
h2{font-size:17px;margin:28px 0 4px;border-top:1px solid #8883;padding-top:18px}
h2 small{font-weight:400;color:#8a8a8a;font-size:12px}
h3{font-size:14px;margin:16px 0 6px;color:#8a8a8a}
table{border-collapse:collapse;width:100%}
td{padding:5px 8px;border-bottom:1px solid #8882;font-size:14px}
td:nth-child(2){color:#8a8a8a}td:nth-child(3){text-align:right;font-weight:600;width:64px}
tr.past td{opacity:.45;font-weight:400}
.api{font-size:13px;color:#8a8a8a;margin:2px 0 0}
footer{margin-top:32px;font-size:12px;color:#8a8a8a}
</style>
<h1>국가자격 시험일정</h1>
<p class="api">공공데이터포털 한국산업인력공단 국가자격 시험일정 조회 서비스에서
주 1회 받아 갱신한다. 색인 <a href="index.json">index.json</a></p>
${body}
<footer>갱신 ${esc(index.fetched)}</footer>
</html>`;

const privacy = `<!doctype html><html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>개인정보처리방침</title><style>
:root{color-scheme:light dark}
body{font:15px/1.7 system-ui,-apple-system,'Segoe UI',sans-serif;
 max-width:720px;margin:0 auto;padding:24px 16px}
h1{font-size:20px}h2{font-size:16px;margin-top:24px}
footer{margin-top:32px;font-size:12px;color:#8a8a8a}
</style>
<h1>개인정보처리방침</h1>
<p>본 방침은 득상담사(DeukCounselor) 앱과 이 사이트에 적용된다.</p>
<h2>수집하는 개인정보</h2>
<p>없다. 회원가입·로그인이 없고, 이름·이메일·전화번호·위치 등 어떤 개인정보도
수집하지 않는다.</p>
<h2>학습 기록의 저장</h2>
<p>문제 풀이 기록·학습 목표·설정은 사용자의 기기 안(localStorage)에만 저장되며
외부 서버로 전송되지 않는다. 앱을 삭제하면 함께 삭제된다.</p>
<h2>네트워크 사용</h2>
<p>앱은 시험 일정 표시를 위해 공개 일정 JSON을 읽기 전용으로 내려받는다.
이 과정에서 개인정보를 보내지 않는다.</p>
<h2>알림 권한</h2>
<p>학습 목표 알림 표시에만 쓰이며, 알림 내용은 기기 밖으로 나가지 않는다.
권한은 언제든 시스템 설정에서 끌 수 있다.</p>
<h2>제3자 제공·광고</h2>
<p>제3자 제공, 광고, 분석 도구가 없다.</p>
<h2>문의</h2>
<p>deukpack@gmail.com</p>
<footer>시행일 2026-09-03</footer>
</html>`;

await mkdir('site', { recursive: true });
await writeFile('site/index.html', page);
await writeFile('site/privacy.html', privacy);
await cp('data', 'site', { recursive: true });
console.log(`site/index.html · site/privacy.html 생성 (${index.targets.length} 종목)`);
