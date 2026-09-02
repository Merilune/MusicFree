import pathConst from "@/constants/pathConst";
import { Platform } from "react-native";

export function normalizeLocalMusicPath(localPath: string) {
    const normalizedPath = localPath.startsWith("file://")
        ? localPath.slice(7)
        : localPath;
    return normalizedPath.replace(/\/+$/, "");
}

export function isPathInsideDirectory(localPath: string, directoryPath: string) {
    const normalizedPath = normalizeLocalMusicPath(localPath);
    const normalizedDirectory = normalizeLocalMusicPath(directoryPath);
    return normalizedPath === normalizedDirectory ||
        normalizedPath.startsWith(`${normalizedDirectory}/`);
}

export function shouldRetainUnavailableLocalPath(
    localPath: string,
    platform = Platform.OS,
    appBasePath = pathConst.basePath,
) {
    return platform === "android" &&
        !isPathInsideDirectory(localPath, appBasePath);
}
