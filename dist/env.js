import { loadEnvFile } from "node:process";
function isMissingFileError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
export function loadDotEnv(path = ".env") {
    try {
        loadEnvFile(path);
    }
    catch (error) {
        if (!isMissingFileError(error)) {
            throw error;
        }
    }
}
