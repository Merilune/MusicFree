jest.mock("expo-file-system/legacy", () => ({
    EncodingType: {
        UTF8: "utf8",
    },
    StorageAccessFramework: {
        getUriForDirectoryInRoot: jest.fn(
            folder => `content://root/${encodeURIComponent(folder)}`,
        ),
        requestDirectoryPermissionsAsync: jest.fn(),
        createFileAsync: jest.fn(),
        writeAsStringAsync: jest.fn(),
    },
}));

jest.mock("@/native/utils", () => ({
    __esModule: true,
    default: {
        copyFileToSafDirectory: jest.fn(),
        deleteSafUri: jest.fn(),
        safUriExists: jest.fn(),
        scanSafAudioFiles: jest.fn(),
    },
}));

import {
    copyLocalFileToAndroidDirectory,
    getAndroidSafDirectoryLabel,
    getLegacyPathFromAndroidDocumentId,
    getMimeTypeForFile,
    isAndroidSafUri,
    removeJsonExtension,
    requestAndroidDirectoryAccess,
    saveJsonToSelectedAndroidDirectory,
    writeTextToAndroidDirectory,
} from "./androidSaf";

const mockStorageAccessFramework = jest.requireMock(
    "expo-file-system/legacy",
).StorageAccessFramework;
const mockRequestDirectoryPermissionsAsync =
    mockStorageAccessFramework.requestDirectoryPermissionsAsync as jest.Mock;
const mockCreateFileAsync =
    mockStorageAccessFramework.createFileAsync as jest.Mock;
const mockWriteAsStringAsync =
    mockStorageAccessFramework.writeAsStringAsync as jest.Mock;
const mockNativeUtils = jest.requireMock("@/native/utils").default;

describe("Android SAF backup", () => {
    beforeEach(() => {
        mockRequestDirectoryPermissionsAsync.mockReset();
        mockCreateFileAsync.mockReset();
        mockWriteAsStringAsync.mockReset();
        mockNativeUtils.copyFileToSafDirectory.mockReset();
    });

    it("creates and writes a JSON file in the selected directory", async () => {
        mockRequestDirectoryPermissionsAsync.mockResolvedValue({
            granted: true,
            directoryUri: "content://tree/backups",
        });
        mockCreateFileAsync.mockResolvedValue("content://tree/backups/backup.json");

        await expect(saveJsonToSelectedAndroidDirectory(
            "AudioraBackup-2026.json",
            "{\"ok\":true}",
        )).resolves.toBe("content://tree/backups/backup.json");
        expect(mockCreateFileAsync).toHaveBeenCalledWith(
            "content://tree/backups",
            "AudioraBackup-2026",
            "application/json",
        );
        expect(mockRequestDirectoryPermissionsAsync).toHaveBeenCalledWith(
            null,
        );
        expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
            "content://tree/backups/backup.json",
            "{\"ok\":true}",
            { encoding: "utf8" },
        );
    });

    it("does not create a file when directory access is cancelled", async () => {
        mockRequestDirectoryPermissionsAsync.mockResolvedValue({ granted: false });

        await expect(saveJsonToSelectedAndroidDirectory(
            "AudioraBackup.json",
            "{}",
        )).resolves.toBeNull();
        expect(mockCreateFileAsync).not.toHaveBeenCalled();
        expect(mockWriteAsStringAsync).not.toHaveBeenCalled();
    });

    it("removes only the trailing JSON extension", () => {
        expect(removeJsonExtension("AudioraBackup.JSON")).toBe("AudioraBackup");
        expect(removeJsonExtension("Audiora.json.backup")).toBe("Audiora.json.backup");
    });

    it("returns the persisted directory URI after access is granted", async () => {
        mockRequestDirectoryPermissionsAsync.mockResolvedValue({
            granted: true,
            directoryUri: "content://tree/music",
        });

        await expect(requestAndroidDirectoryAccess("content://tree/old"))
            .resolves.toBe("content://tree/music");
        expect(mockRequestDirectoryPermissionsAsync).toHaveBeenCalledWith(
            "content://tree/old",
        );
    });

    it("formats SAF directory labels and media MIME types", () => {
        expect(isAndroidSafUri("content://tree/music")).toBe(true);
        expect(getAndroidSafDirectoryLabel(
            "content://provider/tree/primary%3AMusic%2FAudiora/document/id",
        )).toBe("Music/Audiora");
        expect(getMimeTypeForFile("track.flac")).toBe("audio/flac");
        expect(getMimeTypeForFile("lyrics.lrc")).toBe("text/plain");
        expect(getLegacyPathFromAndroidDocumentId(
            "primary:Music/Audiora/track.mp3",
        )).toBe("/storage/emulated/0/Music/Audiora/track.mp3");
        expect(getLegacyPathFromAndroidDocumentId(
            "raw:/storage/1234/music.mp3",
        )).toBe("/storage/1234/music.mp3");
    });

    it("streams a completed download into the authorized directory", async () => {
        mockNativeUtils.copyFileToSafDirectory.mockResolvedValue(
            "content://music/track",
        );

        await expect(copyLocalFileToAndroidDirectory(
            "/app/download/track.flac",
            "content://tree/music",
            "track.flac",
        )).resolves.toBe("content://music/track");
        expect(mockNativeUtils.copyFileToSafDirectory).toHaveBeenCalledWith(
            "/app/download/track.flac",
            "content://tree/music",
            "track.flac",
            "audio/flac",
        );
    });

    it("writes a standalone lyric file into the authorized directory", async () => {
        mockCreateFileAsync.mockResolvedValue("content://music/lyrics");

        await expect(writeTextToAndroidDirectory(
            "content://tree/music",
            "Song.lrc",
            "[00:00]Song",
        )).resolves.toBe("content://music/lyrics");
        expect(mockCreateFileAsync).toHaveBeenCalledWith(
            "content://tree/music",
            "Song",
            "text/plain",
        );
        expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
            "content://music/lyrics",
            "[00:00]Song",
            { encoding: "utf8" },
        );
    });
});
