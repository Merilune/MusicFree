jest.mock("expo-file-system/legacy", () => ({
    EncodingType: {
        UTF8: "utf8",
    },
    StorageAccessFramework: {
        requestDirectoryPermissionsAsync: jest.fn(),
        createFileAsync: jest.fn(),
        writeAsStringAsync: jest.fn(),
    },
}));

import {
    removeJsonExtension,
    saveJsonToSelectedAndroidDirectory,
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

describe("Android SAF backup", () => {
    beforeEach(() => {
        mockRequestDirectoryPermissionsAsync.mockReset();
        mockCreateFileAsync.mockReset();
        mockWriteAsStringAsync.mockReset();
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
});
