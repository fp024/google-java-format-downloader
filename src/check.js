import {
  getLatestVersion,
  getCurrentVersion,
  getCurrentPlatform,
} from "./index.js";

const platform = getCurrentPlatform();

const [currentVersion, latestVersion] = await Promise.all([
  getCurrentVersion(platform),
  getLatestVersion(),
]);

console.log("=== Google Java Format 버전 정보 ===");
console.log(`현재 설치된 버전: ${currentVersion || "설치되지 않음"}`);
console.log(`최신 버전: ${latestVersion}`);

if (!currentVersion) {
  console.log("\n상태: ⚠️  설치되지 않음");
} else if (currentVersion === latestVersion) {
  console.log("\n상태: ✅ 최신 버전");
} else {
  console.log("\n상태: 🔄 업데이트 가능");
  console.log(`업데이트 명령: pnpm run update`);
}
