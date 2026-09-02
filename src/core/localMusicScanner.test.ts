import { readDir, stat } from "react-native-fs";
import {
    isSupportedLocalMedia,
    scanLocalMusicPaths,
} from "./localMusicScanner";

const mockReadDir = readDir as jest.MockedFunction<typeof readDir>;
const mockStat = stat as jest.MockedFunction<typeof stat>;

function fileStat() {
    return {
        isFile: () => true,
        isDirectory: () => false,
    } as Awaited<ReturnType<typeof stat>>;
}

function directoryStat() {
    return {
        isFile: () => false,
        isDirectory: () => true,
    } as Awaited<ReturnType<typeof stat>>;
}

function directoryEntry(path: string) {
    return {
        path,
        isFile: () => false,
        isDirectory: () => true,
    } as Awaited<ReturnType<typeof readDir>>[number];
}

function fileEntry(path: string) {
    return {
        path,
        isFile: () => true,
        isDirectory: () => false,
    } as Awaited<ReturnType<typeof readDir>>[number];
}

describe("local music scanner", () => {
    beforeEach(() => {
        mockReadDir.mockReset();
        mockStat.mockReset();
    });

    it("imports files returned directly by the Android document picker", async () => {
        mockStat.mockResolvedValue(fileStat());

        await expect(scanLocalMusicPaths([
            "file:///storage/app/imported/song.mp3",
            "/storage/app/imported/notes.txt",
        ])).resolves.toEqual([
            "/storage/app/imported/song.mp3",
        ]);
        expect(mockReadDir).not.toHaveBeenCalled();
    });

    it("recursively scans directories and ignores unsupported files", async () => {
        mockStat.mockImplementation(async path =>
            path === "/music" || path === "/music/live"
                ? directoryStat()
                : fileStat(),
        );
        mockReadDir.mockImplementation(async path => {
            if (path === "/music") {
                return [
                    fileEntry("/music/track.flac"),
                    fileEntry("/music/readme.txt"),
                    directoryEntry("/music/live"),
                ];
            }
            return [fileEntry("/music/live/encore.m4a")];
        });

        await expect(scanLocalMusicPaths(["/music"])).resolves.toEqual([
            "/music/track.flac",
            "/music/live/encore.m4a",
        ]);
    });

    it("stops promptly when an import is cancelled", async () => {
        await expect(scanLocalMusicPaths(
            ["/music/song.mp3"],
            () => false,
        )).rejects.toThrow("Import Broken");
        expect(mockStat).not.toHaveBeenCalled();
    });

    it("recognizes supported extensions case-insensitively", () => {
        expect(isSupportedLocalMedia("/music/SONG.OPUS")).toBe(true);
        expect(isSupportedLocalMedia("/music/cover.png")).toBe(false);
    });
});
