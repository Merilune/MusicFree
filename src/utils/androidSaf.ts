import {
    EncodingType,
    StorageAccessFramework,
} from "expo-file-system/legacy";

const JSON_MIME_TYPE = "application/json";

export function removeJsonExtension(fileName: string) {
    return fileName.replace(/\.json$/i, "");
}

export async function saveJsonToSelectedAndroidDirectory(
    fileName: string,
    content: string,
) {
    const permission =
        await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) {
        return null;
    }

    const fileUri = await StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        removeJsonExtension(fileName),
        JSON_MIME_TYPE,
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: EncodingType.UTF8,
    });
    return fileUri;
}
