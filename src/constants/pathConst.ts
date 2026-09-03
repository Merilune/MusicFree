import { Platform } from "react-native";
import RNFS, { CachesDirectoryPath } from "react-native-fs";

export const basePath =
    Platform.OS === "android"
        ? RNFS.ExternalDirectoryPath
        : RNFS.DocumentDirectoryPath;

const defaultDownloadMusicPath =
    Platform.OS === "android"
        ? `${basePath}/download/`
        : `${basePath}/download`;

/**
 * Android public directories are represented by a persisted SAF URI. Legacy
 * raw public paths fall back to app storage until the user authorizes a folder.
 */
export function getDownloadMusicPath(configuredPath?: string | null) {
    if (!configuredPath) {
        return defaultDownloadMusicPath;
    }

    if (Platform.OS !== "android") {
        return configuredPath;
    }

    if (configuredPath.startsWith("content://")) {
        return configuredPath;
    }

    const normalizedPath = configuredPath.startsWith("file://")
        ? configuredPath.slice(7)
        : configuredPath;
    return normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)
        ? normalizedPath
        : defaultDownloadMusicPath;
}

export default {
    basePath,
    pluginPath: `${basePath}/plugins/`,
    logPath: `${basePath}/log/`,
    dataPath: `${basePath}/data/`,
    cachePath: `${basePath}/cache/`,
    musicCachePath: CachesDirectoryPath + "/TrackPlayer",
    imageCachePath: CachesDirectoryPath + "/image_manager_disk_cache",
    localLrcPath: `${basePath}/local_lrc/`,
    lrcCachePath: `${basePath}/cache/lrc/`,
    downloadCachePath: `${basePath}/cache/download/`,
    downloadPath: `${basePath}/download/`,
    downloadMusicPath: defaultDownloadMusicPath,
    mmkvPath: `${basePath}/mmkv`,
    mmkvCachePath: `${basePath}/cache/mmkv`,
};
