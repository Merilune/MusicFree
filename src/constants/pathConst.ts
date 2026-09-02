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
 * Android no longer has broad storage access. Keep downloads inside the app's
 * external files directory, and migrate any legacy/public configured path to it.
 */
export function getDownloadMusicPath(configuredPath?: string | null) {
    if (!configuredPath) {
        return defaultDownloadMusicPath;
    }

    if (Platform.OS !== "android") {
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
    importedMusicPath: `${basePath}/data/imported_music/`,
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
