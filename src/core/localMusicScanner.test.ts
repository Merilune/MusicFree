import { readDir, stat } from "react-native-fs";
import { scanAndroidSafAudioFiles } from "@/utils/androidSaf";
import {
    isSupportedLocalMedia,
    scanLocalMusicPaths,
} from "./localMusicScanner";

const mockReadDir = readDir as jest.MockedFunction<typeof readDir>;
const mockStat = stat as jest.MockedFunction<typeof stat>;
const mockScanAndroidSafAudioFiles =
    scanAndroidSafAudioFiles as jest.MockedFunction<
        typeof scanAndroidSafAudioFiles
    >;

jest.mock("@/utils/androidSaf", () => ({
    getLegacyPathFromAndroidDocumentId: jest.fn(documentId =>
        documentId?.startsWith("primary:")
            ? `/storage/emulated/0/${documentId.slice(8)}`
            : null,
    ),
    scanAndroidSafAudioFiles: jest.fn(),
}));

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
        name: path.split("/").pop() ?? path,
        isFile: () => false,
        isDirectory: () => true,
    } as Awaited<ReturnType<typeof readDir>>[number];
}

function fileEntry(path: string) {
    return {
        path,
        name: path.split("/").pop() ?? path,
        isFile: () => true,
        isDirectory: () => false,
    } as Awaited<ReturnType<typeof readDir>>[number];
}

describe("local music scanner", () => {
    beforeEach(() => {
        mockReadDir.mockReset();
        mockStat.mockReset();
        mockScanAndroidSafAudioFiles.mockReset();
    });

    it("imports files returned directly by the Android document picker", async () => {
        mockStat.mockResolvedValue(fileStat());

        await expect(scanLocalMusicPaths([
            "file:///storage/app/imported/song.mp3",
            "/storage/app/imported/notes.txt",
        ])).resolves.toEqual([
            {
                path: "/storage/app/imported/song.mp3",
                name: "song.mp3",
            },
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
            { path: "/music/track.flac", name: "track.flac" },
            { path: "/music/live/encore.m4a", name: "encore.m4a" },
        ]);
    });

    it("scans an authorized SAF directory without copying its audio files", async () => {
        mockScanAndroidSafAudioFiles.mockResolvedValue([
            {
                uri: "content://music/song-1",
                name: "Song One.mp3",
                documentId: "primary:Music/Song One.mp3",
            },
            { uri: "content://music/cover", name: "cover.jpg" },
        ]);

        await expect(scanLocalMusicPaths([
            "content://com.android.externalstorage.documents/tree/primary%3AMusic",
        ])).resolves.toEqual([
            {
                path: "content://music/song-1",
                name: "Song One.mp3",
                legacyPath: "/storage/emulated/0/Music/Song One.mp3",
            },
        ]);
        expect(mockStat).not.toHaveBeenCalled();
        expect(mockReadDir).not.toHaveBeenCalled();
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
