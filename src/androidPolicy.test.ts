import { existsSync, readFileSync } from "fs";
import { join } from "path";

const repositoryRoot = join(__dirname, "..");

function readRepositoryFile(...segments: string[]) {
    return readFileSync(join(repositoryRoot, ...segments), "utf8");
}

describe("Android permission and network policy", () => {
    const mainManifest = readRepositoryFile(
        "android", "app", "src", "main", "AndroidManifest.xml",
    );

    it("does not request broad photo access for picker-only image selection", () => {
        expect(mainManifest).not.toContain("android.permission.READ_MEDIA_IMAGES");
    });

    it.each([
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.ACCESS_NOTIFICATION_POLICY",
    ])("removes unused transitive permission %s", permission => {
        const permissionOffset = mainManifest.indexOf(permission);
        expect(permissionOffset).toBeGreaterThan(-1);
        expect(mainManifest.slice(permissionOffset, permissionOffset + 120))
            .toContain("tools:node=\"remove\"");
    });

    it("keeps a debug-only cleartext override for Metro", () => {
        const debugConfigPath = join(
            repositoryRoot,
            "android", "app", "src", "debug", "res", "xml",
            "network_security_config.xml",
        );
        expect(existsSync(debugConfigPath)).toBe(true);
        expect(readFileSync(debugConfigPath, "utf8"))
            .toContain("<base-config cleartextTrafficPermitted=\"true\" />");
    });

    it("keeps the Intent import required by the compact notification action", () => {
        const lyricModule = readRepositoryFile(
            "android", "app", "src", "main", "java", "fun", "xwj",
            "musicfree", "lyricUtil", "LyricUtilModule.kt",
        );
        expect(lyricModule).toContain("import android.content.Intent");
        expect(lyricModule).toContain("val intent = Intent(\"mf.compact.favstate\")");
    });
});
