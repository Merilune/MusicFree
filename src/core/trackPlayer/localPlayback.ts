import { addFileScheme } from "@/utils/fileUtils";
import { getLocalPath } from "@/utils/mediaUtils";

/**
 * Resolve a playable local source without involving an online source plugin.
 *
 * A downloaded song can be opened from an online list item that has the same
 * identity but does not carry the local path. Prefer the validated item kept by
 * LocalMusicSheet in that case, then fall back to the path on the requested
 * item (including media-extra paths and restored queue items).
 */
export function getLocalPlaybackSource(
    musicItem: IMusic.IMusicItem,
    localMusicItem?: IMusic.IMusicItem,
) {
    const localPath =
        (localMusicItem ? getLocalPath(localMusicItem) : null) ??
        getLocalPath(musicItem);

    return localPath
        ? {
            url: addFileScheme(localPath),
        }
        : null;
}
