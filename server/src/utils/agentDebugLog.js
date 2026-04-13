// #region agent log
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const INGEST =
  "http://127.0.0.1:7676/ingest/d2d9894a-c4b8-455f-81ec-2cb81c2d7279";
const SESSION_ID = "a7216d";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT_LOG = path.join(__dirname, "..", "..", "..", "debug-a7216d.log");

function appendNdjsonLine(line) {
  const dirs = [
    path.dirname(REPO_ROOT_LOG),
    process.cwd(),
    path.join(process.cwd(), ".."),
  ];
  for (const dir of dirs) {
    try {
      const p = path.join(dir, "debug-a7216d.log");
      fs.appendFileSync(p, line);
      return;
    } catch {
      /* try next */
    }
  }
}

export function agentDebugLog(location, message, data, hypothesisId, runId = "pre-fix") {
  const payload = {
    sessionId: SESSION_ID,
    location,
    message,
    data: data && typeof data === "object" ? data : { value: data },
    timestamp: Date.now(),
    hypothesisId: hypothesisId || "NA",
    runId,
  };
  appendNdjsonLine(`${JSON.stringify(payload)}\n`);
  console.info(
    `[a7216d] ${payload.hypothesisId} ${payload.message}`,
    JSON.stringify(payload.data).slice(0, 300)
  );
  fetch(INGEST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
// #endregion
