import { loadEnvFile } from "node:process";

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export function loadDotEnv(path = ".env"): void {
  try {
    loadEnvFile(path);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }
}
