import { supportLocalMediaType } from "@/constants/mediaConst";
import {
    getLegacyPathFromAndroidDocumentId,
    scanAndroidSafAudioFiles,
} from "@/utils/androidSaf";
import { readDir, stat } from "react-native-fs";

export interface ILocalMediaFile {
    path: string;
    name: string;
    legacyPath?: string;
}

function normalizeLocalPath(filePath: string) {
    return filePath.startsWith("file://") ? filePath.slice(7) : filePath;
}

export function isSupportedLocalMedia(filePath: string) {
    const normalizedPath = filePath.toLowerCase();
    return supportLocalMediaType.some(extension =>
        normalizedPath.endsWith(extension),
    );
}

export async function scanLocalMusicPaths(
    inputPaths: string[],
    shouldContinue: () => boolean = () => true,
) {
    const safDirectories = inputPaths.filter(path => path.startsWith("content://"));
    const pendingPaths = inputPaths
        .filter(path => !path.startsWith("content://"))
        .map(normalizeLocalPath);
    const musicFiles: ILocalMediaFile[] = [];
    const visitedDirectories = new Set<string>();

    for (const directoryUri of safDirectories) {
        if (!shouldContinue()) {
            throw new Error("Import Broken");
        }
        const files = await scanAndroidSafAudioFiles(directoryUri);
        files.forEach(file => {
            if (isSupportedLocalMedia(file.name)) {
                musicFiles.push({
                    path: file.uri,
                    name: file.name,
                    legacyPath: getLegacyPathFromAndroidDocumentId(
                        file.documentId,
                    ) ?? undefined,
                });
            }
        });
    }

    while (pendingPaths.length) {
        if (!shouldContinue()) {
            throw new Error("Import Broken");
        }

        const currentPath = pendingPaths.shift() as string;
        try {
            const currentStat = await stat(currentPath);
            if (currentStat.isFile()) {
                if (isSupportedLocalMedia(currentPath)) {
                    musicFiles.push({
                        path: currentPath,
                        name: currentPath.split("/").pop() ?? currentPath,
                    });
                }
                continue;
            }
            if (!currentStat.isDirectory() || visitedDirectories.has(currentPath)) {
                continue;
            }

            visitedDirectories.add(currentPath);
            const children = await readDir(currentPath);
            children.forEach(child => {
                if (child.isDirectory()) {
                    pendingPaths.push(child.path);
                } else if (child.isFile() && isSupportedLocalMedia(child.path)) {
                    musicFiles.push({
                        path: child.path,
                        name: child.name,
                    });
                }
            });
        } catch {
            // Ignore entries that disappeared or became inaccessible mid-scan.
        }
    }

    return [...new Map(musicFiles.map(file => [file.path, file])).values()];
}
