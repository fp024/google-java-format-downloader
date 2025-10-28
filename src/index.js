import axios from "axios";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const streamPipeline = promisify(pipeline);
const execFileAsync = promisify(execFile);

// 설정
const GITHUB_API =
  "https://api.github.com/repos/google/google-java-format/releases/latest";
const DOWNLOAD_DIR = path.join(__dirname, "..", "target");

// target 디렉토리가 없으면 생성
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 플랫폼별 바이너리 파일명 매핑
const PLATFORM_BINARIES = {
  "linux-x64": "google-java-format_linux-x86-64",
  "darwin-x64": "google-java-format_darwin-x86-64",
  "darwin-arm64": "google-java-format_darwin-arm64",
  "win32-x64": "google-java-format_windows-x86-64.exe",
};

// 현재 플랫폼 감지
function getCurrentPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "win32" && arch === "x64") return "win32-x64";

  throw new Error(`지원하지 않는 플랫폼입니다: ${platform}-${arch}`);
}

// GitHub API에서 최신 버전 조회
async function getLatestVersion() {
  try {
    console.log("GitHub에서 최신 버전 확인 중...");
    const response = await axios.get(GITHUB_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "google-java-format-updater",
      },
    });

    // tag_name에서 버전 추출 (예: "v1.23.0" -> "1.23.0")
    const version = response.data.tag_name.replace(/^v/, "");
    console.log(`GitHub 최신 릴리즈: ${response.data.tag_name}`);

    return version;
  } catch (error) {
    console.error("최신 버전 조회 실패:", error.message);
    if (error.response?.status === 403) {
      console.error("GitHub API rate limit에 도달했을 수 있습니다.");
    }
    throw error;
  }
}

// 현재 설치된 버전 읽기 (바이너리 실행)
async function getCurrentVersion(platform) {
  const binaryName = PLATFORM_BINARIES[platform];
  const binaryPath = path.join(
    DOWNLOAD_DIR,
    `${binaryName}${platform.includes("win32") ? "" : ".bin"}`
  );

  if (!fs.existsSync(binaryPath)) {
    return null;
  }

  try {
    const { stdout, stderr } = await execFileAsync(binaryPath, ["--version"]);
    // 버전 정보는 stderr에 출력됨
    const output = stdout || stderr;
    // 출력 예: "google-java-format: Version 1.23.0"
    const match = output.match(/(\d+\.\d+\.\d+)/);
    if (match) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("현재 버전 확인 실패:", error.message);
    return null;
  }
}

// 버전 문자열 정규화 (v 접두사 제거)
function normalizeVersion(version) {
  if (!version) return null;
  return version.replace(/^v/, "").trim();
}

// 버전 비교
function isUpdateNeeded(currentVersion, latestVersion) {
  if (!currentVersion) return true;

  const current = normalizeVersion(currentVersion).split(".").map(Number);
  const latest = normalizeVersion(latestVersion).split(".").map(Number);

  for (let i = 0; i < Math.max(current.length, latest.length); i++) {
    const c = current[i] || 0;
    const l = latest[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

// google-java-format 다운로드
async function downloadGoogleJavaFormat(version, platform) {
  const binaryName = PLATFORM_BINARIES[platform];
  const downloadUrl = `https://github.com/google/google-java-format/releases/download/v${version}/${binaryName}`;
  const outputPath = path.join(
    DOWNLOAD_DIR,
    `${binaryName}${platform.includes("win32") ? "" : ".bin"}`
  );

  try {
    console.log(`다운로드 중: ${downloadUrl}`);
    const response = await axios({
      method: "GET",
      url: downloadUrl,
      responseType: "stream",
    });

    // 기존 파일 백업
    if (fs.existsSync(outputPath)) {
      const backupPath = `${outputPath}.backup`;
      fs.renameSync(outputPath, backupPath);
      console.log(`기존 파일 백업: ${backupPath}`);
    }

    // 새 파일 다운로드
    await streamPipeline(response.data, fs.createWriteStream(outputPath));

    // 실행 권한 부여 (Linux/Mac)
    if (platform !== "win32-x64") {
      fs.chmodSync(outputPath, 0o755);
    }

    console.log(`다운로드 완료: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("다운로드 실패:", error.message);
    throw error;
  }
}

// 메인 함수
async function main() {
  try {
    const platform = getCurrentPlatform();
    console.log(`현재 플랫폼: ${platform}`);

    const currentVersion = await getCurrentVersion(platform);
    console.log(`현재 버전: ${currentVersion || "설치되지 않음"}`);

    const latestVersion = await getLatestVersion();
    console.log(`최신 버전: ${latestVersion}`);

    if (isUpdateNeeded(currentVersion, latestVersion)) {
      console.log("\n업데이트가 필요합니다.");
      console.log(`${currentVersion || "없음"} → ${latestVersion}`);

      await downloadGoogleJavaFormat(latestVersion, platform);

      console.log("\n✅ 업데이트 완료!");
    } else {
      console.log("\n✅ 이미 최신 버전입니다.");
    }
  } catch (error) {
    console.error("\n❌ 오류 발생:", error.message);
    process.exit(1);
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}

export { main, getLatestVersion, getCurrentVersion, getCurrentPlatform };
