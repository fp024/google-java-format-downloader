# Change Log

> 뭔가 중요한 문제 수정이 있을 때만 적어보자! 😊

## 2025-10-28-a

### Fixed
- **Windows 환경에서 업데이트가 실행되지 않던 문제 수정**
  - **문제**: `src/index.js`의 193번 줄에서 모듈 직접 실행 여부를 판단하는 조건문이 Windows 환경에서 제대로 작동하지 않음
  - **원인**: 
    - `import.meta.url`은 `file:///G:/git/...` 형식의 URL
    - `process.argv[1]`은 Git Bash에서 `/g/git/...` 형식의 경로
    - 두 값의 형식이 달라 비교가 실패하여 `main()` 함수가 실행되지 않음
  - **해결**: 
    - `fileURLToPath()`를 사용하여 URL을 파일 시스템 경로로 변환
    - `path.resolve()`를 사용하여 경로를 정규화
    - Windows와 Unix 계열 시스템 모두에서 정상 작동하도록 개선
  
  ```javascript
  // Before
  if (import.meta.url === `file://${process.argv[1]}`) {
    await main();
  }
  
  // After
  const isMainModule = () => {
    try {
      const scriptPath = fileURLToPath(import.meta.url);
      const argvPath = path.resolve(process.argv[1]);
      return scriptPath === argvPath;
    } catch {
      return false;
    }
  };
  
  if (isMainModule()) {
    await main();
  }
  ```

### Verified
- ✅ Windows (Git Bash) 환경에서 정상 동작 확인
- ✅ 최신 버전(v1.32.0) 다운로드 성공
- ✅ 버전 확인 기능 정상 작동
