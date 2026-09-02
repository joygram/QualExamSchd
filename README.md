# 국가자격 시험일정

공공데이터포털의 한국산업인력공단 국가자격 시험일정 조회 서비스에서
주 1회 받아 JSON 으로 공개한다. 앱과 페이지는 인증키 없이 이것을 읽는다.

공개 주소는 GitHub Pages 다.

    https://joygram.github.io/QualExamSchd/            사람이 보는 표
    https://joygram.github.io/QualExamSchd/index.json  종목 색인
    https://joygram.github.io/QualExamSchd/9511.json   직업상담사 2급

## 무엇이 들어 있나

회차마다 접수·시험·발표 열 개의 날짜가 `YYYY-MM-DD` 로 들어온다.

    {
      "year": 2026, "round": "3",
      "writtenApplyStart": "2026-07-20", "writtenApplyEnd": "2026-08-02",
      "writtenStart": "2026-08-07", "writtenEnd": "2026-09-01",
      "writtenPass": "2026-09-09",
      "practicalApplyStart": "2026-09-21", "practicalApplyEnd": "2026-10-19",
      "practicalStart": "2026-10-24", "practicalEnd": "2026-11-13",
      "practicalPass": "2026-12-11"
    }

한 회차가 빠른접수·일반접수 두 행으로 오므로 접수 시작일이 이른 쪽으로
합친다. 아직 공고되지 않은 연도는 건너뛴다.

## 종목 추가

`targets.json` 에 한 줄 넣으면 다음 갱신부터 받는다.

    [
      { "jmCd": "9511", "name": "직업상담사 2급" }
    ]

종목코드는 Q-Net 종목 상세 주소의 `jmCd` 값이다.

    https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=9511

## 갱신

`refresh.yml` 이 매주 일요일에 돈다. 바뀌었을 때만 `data/` 를 커밋하고
Pages 를 다시 발행한다. Actions 탭에서 손으로 돌릴 수도 있다.

인증키는 `DATA_GO_KR_KEY` 시크릿에 둔다. 공개 저장소지만 시크릿은
공개되지 않으며 로그에서도 가려진다. 이 워크플로에는 `pull_request`
트리거가 없어 포크가 시크릿에 닿지 못한다. 응답 본문을 에러에 실을 때도
키를 지운다.

받는 쪽은 <https://www.data.go.kr/data/15074408/openapi.do> 에서 활용신청
한다. 자동 승인이다. `numOfRows` 는 50 을 넘길 수 없다.

이름이 비슷한 국가자격 CBT 시행정보(`15059979`)에는 시험일이 없다 —
시행계획 등록·삭제 이력이라 컬럼이 다섯 개뿐이다.

## 직접 돌리기

    DATA_GO_KR_KEY=... node fetch.mjs
    node site.mjs
