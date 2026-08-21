import pluginManager from "@/core/pluginManager";

/**
 * MV actions are opt-in. A plugin must expose getMvSource and the item must
 * carry one of the identifiers used by common providers.
 */
export function canPlayMusicVideo(
    musicItem?: IMusic.IMusicItem | null,
): boolean {
    if (!musicItem) {
        return false;
    }

    const plugin = pluginManager.getByMedia(musicItem);
    if (!plugin?.supportedMethods.has("getMvSource")) {
        return false;
    }

    const item = musicItem as Record<string, unknown>;
    return [
        "mv",
        "mvId",
        "mvid",
        "mvHash",
        "mvVid",
        "mvCopyrightId",
        "videoId",
        "is_video",
        "bvid",
    ].some(key => Boolean(item[key]));
}

export function getVideoIdentifier(musicItem: IMusic.IMusicItem): string {
    const item = musicItem as Record<string, unknown>;
    for (const key of ["videoId", "mv", "mvid", "bvid", "id"]) {
        const value = item[key];
        if (value !== undefined && value !== null && String(value).trim()) {
            return String(value);
        }
    }
    return "unknown";
}
