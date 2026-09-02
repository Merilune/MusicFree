import { supportLocalMediaType } from "@/constants/mediaConst";
import { readDir, stat } from "react-native-fs";

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
    const pendingPaths = inputPaths.map(normalizeLocalPath);
    const musicPaths: string[] = [];
    const visitedDirectories = new Set<string>();

    while (pendingPaths.length) {
        if (!shouldContinue()) {
            throw new Error("Import Broken");
        }

        const currentPath = pendingPaths.shift() as string;
        try {
            const currentStat = await stat(currentPath);
            if (currentStat.isFile()) {
                if (isSupportedLocalMedia(currentPath)) {
                    musicPaths.push(currentPath);
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
                    musicPaths.push(child.path);
                }
            });
        } catch {
            // Ignore entries that disappeared or became inaccessible mid-scan.
        }
    }

    return [...new Set(musicPaths)];
}
