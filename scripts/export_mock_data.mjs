import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const sourceFile = path.join(repoRoot, "frontend", "src", "lib", "mock_database.js");
  const outFile = path.join(repoRoot, "backend", "app", "seed_data", "mock_data.json");

  const mod = await import(pathToFileURL(sourceFile).href);
  const payload = {
    exported_at: new Date().toISOString(),
    jobs: mod.JOBS_DEMO ?? [],
    courses: mod.TUM_COURSES ?? [],
  };

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`Wrote ${payload.jobs.length} jobs and ${payload.courses.length} courses to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
