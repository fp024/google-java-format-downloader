# Google Java Format Downloader

Google Java Format의 최신 버전을 자동으로 확인하고 업데이트하는 Node.js 프로그램입니다.

## 기능

- GitHub API를 통한 최신 버전 자동 확인
- 설치된 바이너리를 직접 실행하여 현재 버전 확인
- 버전 비교를 통한 업데이트 필요 여부 판단
- 플랫폼별 바이너리 자동 다운로드 (Linux, macOS, Windows 지원)
- 기존 파일 백업
- `target` 폴더에 바이너리 파일 관리

## 설치

```bash
pnpm install
```

## 사용법

### 최신 버전으로 업데이트

```bash
pnpm run update
```

### 최신 버전만 확인

```bash
pnpm run check
```

### 직접 실행

```bash
node src/index.js
```

## 지원 플랫폼

- Linux x86-64
- macOS x86-64 (Intel)
- macOS ARM64 (Apple Silicon)
- Windows x86-64

## 동작 방식

1. GitHub API를 통해 최신 릴리즈 버전 조회
2. `target` 폴더의 바이너리를 실행하여 현재 설치된 버전 확인
3. 버전 비교하여 업데이트 필요 여부 판단
4. 필요시 GitHub Release에서 플랫폼에 맞는 바이너리 다운로드
5. 기존 파일은 `.backup` 확장자로 백업
6. 새 바이너리를 `target` 폴더에 저장

## 파일 구조

```
.
├── src/
│   ├── index.js                       # 메인 스크립트 (업데이트 실행)
│   └── check.js                       # 버전 확인 스크립트
├── target/                            # 다운로드된 바이너리 저장 폴더
│   └── google-java-format_linux-x86-64.bin
├── package.json                       # 프로젝트 설정
└── README.md                          # 이 파일
```

## 라이선스

ISC
