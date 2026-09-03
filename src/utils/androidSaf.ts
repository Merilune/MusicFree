import {
    EncodingType,
    StorageAccessFramework,
} from "expo-file-system/legacy";
import NativeUtils from "@/native/utils";

const JSON_MIME_TYPE = "application/json";
const DEFAULT_MUSIC_DIRECTORY = "Music/Audiora";

export interface IAndroidSafAudioFile {
    uri: string;
    name: string;
    documentId?: string;
}

export function getLegacyPathFromAndroidDocumentId(documentId?: string) {
    if (!documentId) {
        return null;
    }
    if (documentId.startsWith("primary:")) {
        return `/storage/emulated/0/${documentId.slice("primary:".length)}`;
    }
    if (documentId.startsWith("raw:")) {
        return documentId.slice("raw:".length);
    }
    return null;
}

export function isAndroidSafUri(uri?: string | null) {
    return uri?.startsWith("content://") ?? false;
}

export function getDefaultMusicDirectoryUri() {
    return StorageAccessFramework.getUriForDirectoryInRoot(
        DEFAULT_MUSIC_DIRECTORY,
    );
}

export function getAndroidSafDirectoryLabel(uri?: string | null) {
    if (!isAndroidSafUri(uri)) {
        return DEFAULT_MUSIC_DIRECTORY;
    }
    const treeMatch = uri?.match(/\/tree\/([^/]+)/);
    if (!treeMatch) {
        return DEFAULT_MUSIC_DIRECTORY;
    }
    try {
        return decodeURIComponent(treeMatch[1]).replace(/^primary:/, "");
    } catch {
        return DEFAULT_MUSIC_DIRECTORY;
    }
}

export async function requestAndroidDirectoryAccess(
    initialDirectoryUri: string | null = getDefaultMusicDirectoryUri(),
) {
    const permission =
        await StorageAccessFramework.requestDirectoryPermissionsAsync(
            initialDirectoryUri,
        );
    return permission.granted ? permission.directoryUri : null;
}

export function scanAndroidSafAudioFiles(directoryUri: string) {
    return NativeUtils.scanSafAudioFiles(directoryUri);
}

export function androidSafUriExists(uri: string) {
    return NativeUtils.safUriExists(uri);
}

export function getMimeTypeForFile(fileName: string) {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
    case "mp3": return "audio/mpeg";
    case "flac": return "audio/flac";
    case "m4a": return "audio/mp4";
    case "ogg": return "audio/ogg";
    case "opus": return "audio/opus";
    case "wav": return "audio/wav";
    case "aac":
    case "acc": return "audio/aac";
    case "lrc": return "text/plain";
    default: return "application/octet-stream";
    }
}

export function copyLocalFileToAndroidDirectory(
    sourcePath: string,
    directoryUri: string,
    displayName: string,
) {
    return NativeUtils.copyFileToSafDirectory(
        sourcePath,
        directoryUri,
        displayName,
        getMimeTypeForFile(displayName),
    );
}

export function deleteAndroidSafUri(uri: string) {
    return NativeUtils.deleteSafUri(uri);
}

export async function writeTextToAndroidDirectory(
    directoryUri: string,
    fileName: string,
    content: string,
) {
    const extension = fileName.split(".").pop();
    const baseName = extension
        ? fileName.slice(0, -(extension.length + 1))
        : fileName;
    const fileUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        baseName,
        getMimeTypeForFile(fileName),
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: EncodingType.UTF8,
    });
    return fileUri;
}

export function removeJsonExtension(fileName: string) {
    return fileName.replace(/\.json$/i, "");
}

export async function saveJsonToSelectedAndroidDirectory(
    fileName: string,
    content: string,
) {
    const directoryUri = await requestAndroidDirectoryAccess(null);
    if (!directoryUri) {
        return null;
    }

    const fileUri = await StorageAccessFramework.createFileAsync(
        directoryUri,
        removeJsonExtension(fileName),
        JSON_MIME_TYPE,
    );
    await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: EncodingType.UTF8,
    });
    return fileUri;
}
