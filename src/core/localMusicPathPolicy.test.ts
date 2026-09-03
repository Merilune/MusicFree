import {
    isPathInsideDirectory,
    shouldRetainUnavailableLocalPath,
} from "./localMusicPathPolicy";

describe("local music path policy", () => {
    const appBasePath = "/storage/emulated/0/Android/data/audiora/files";

    it("retains inaccessible public music records on Android", () => {
        expect(shouldRetainUnavailableLocalPath(
            "/storage/emulated/0/Music/legacy.mp3",
            "android",
            appBasePath,
        )).toBe(true);
    });

    it("still removes missing app-managed files", () => {
        expect(shouldRetainUnavailableLocalPath(
            `${appBasePath}/data/imported_music/missing.mp3`,
            "android",
            appBasePath,
        )).toBe(false);
    });

    it("does not change missing-path behavior on other platforms", () => {
        expect(shouldRetainUnavailableLocalPath(
            "/public/music/missing.mp3",
            "ios",
            appBasePath,
        )).toBe(false);
    });

    it("does not confuse a sibling directory with the app directory", () => {
        expect(isPathInsideDirectory(
            `${appBasePath}-other/song.mp3`,
            appBasePath,
        )).toBe(false);
    });
});
