# axios 제거 및 fetch 전환

> 2026-04-01

## 배경

- axios 라이브러리에 공급망(supply chain) 해킹 이슈가 발생
- 외부 의존성 제거를 통한 보안 강화 필요

### axios 공급망 공격 요약

> 출처: [The Hacker News — Axios Supply Chain Attack Pushes Cross-Platform RAT via Compromised npm Account](https://thehackernews.com/2026/03/axios-supply-chain-attack-pushes-cross.html) (2026-03-31, Ravie Lakshmanan)

2026년 3월 31일, axios npm 패키지의 메인테이너(`jasonsaayman`) 계정이 탈취되어 악성 버전이 npm에 게시되었다.

**영향받는 버전:**
- `axios@1.14.1`
- `axios@0.30.4`

**공격 방식:**
1. 공격자가 메인테이너의 npm 토큰(장기 클래식 토큰)을 탈취하여 계정 장악
2. 악성 의존성 `plain-crypto-js@4.2.1`을 사전 준비 (정상 4.2.0 배포 → 18시간 후 악성 4.2.1 배포)
3. 탈취한 계정으로 axios 1.14.1, 0.30.4를 39분 간격으로 게시 — 둘 다 `plain-crypto-js@4.2.1`을 런타임 의존성으로 주입
4. `plain-crypto-js`의 `postinstall` 스크립트가 플랫폼별 RAT(원격 접근 트로이목마)를 드롭

**플랫폼별 페이로드:**
| 플랫폼 | 드로퍼 방식 | RAT 위치 |
|--------|------------|----------|
| macOS | AppleScript → C++ 바이너리 다운로드 | `/Library/Caches/com.apple.act.mond` |
| Windows | PowerShell 복사(`wt.exe`) + VBScript → PowerShell RAT | `%PROGRAMDATA%\wt.exe` |
| Linux | `execSync` → Python RAT 다운로드 | `/tmp/ld.py` |

**주요 특징:**
- axios 소스 코드 자체는 수정되지 않아 diff 기반 코드 리뷰로 탐지 어려움
- 감염 후 `postinstall` 스크립트 삭제 + `package.json`을 정상 버전으로 교체하여 포렌식 회피
- RAT는 60초 주기로 C2 서버(`sfrclak[.]com`)에 비콘 전송, 명령 실행·파일 시스템 열거·추가 페이로드 배포 가능
- Elastic Security Labs에 따르면 macOS 바이너리가 북한 위협 행위자(UNC1069)의 WAVESHAPER 백도어와 유사성 확인

**권장 조치:**
- 안전한 버전(1.14.0 또는 0.30.3)으로 다운그레이드
- `node_modules`에서 `plain-crypto-js` 제거
- RAT 아티팩트 존재 시 시스템 전체 자격증명 로테이션
- CI/CD 파이프라인에서 영향받는 버전 설치 여부 감사
- C2 도메인(`sfrclak[.]com`) 차단

## 변경 내용

### 1. `src/index.js` — axios → fetch API 전환

| 항목 | 변경 전 (axios) | 변경 후 (fetch) |
|------|-----------------|-----------------|
| import | `import axios from "axios"` | 제거 (네이티브 API 사용) |
| JSON 요청 | `axios.get(url, opts)` → `response.data` | `fetch(url, opts)` → `response.json()` |
| 스트림 다운로드 | `axios({ responseType: "stream" })` → `response.data` | `fetch(url)` → `Readable.fromWeb(response.body)` |
| 에러 처리 | axios가 4xx/5xx 자동 throw | `response.ok` 수동 체크 |

- `Readable.fromWeb()`으로 Web ReadableStream → Node.js stream 변환 (Node.js 18.13+ stable)
- `node:stream`에서 `Readable` import 추가

### 2. `package.json` — 의존성 제거

```diff
- "dependencies": {
-   "axios": "^1.14.0"
- },
+ "dependencies": {},
```

axios 및 하위 패키지 23개가 제거되어 **zero-dependency** 프로젝트가 됨.

## 영향

- Node.js 18 이상 필요 (`Readable.fromWeb` 사용)
- 기존 동작(버전 조회, 바이너리 다운로드, 백업, 권한 설정)은 동일하게 유지
