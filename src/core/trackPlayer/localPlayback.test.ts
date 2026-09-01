jest.mock("react-native-reanimated", () => ({
    Easing: {
        exp: jest.fn(),
        out: jest.fn(easing => easing),
    },
}));

import { getLocalPlaybackSource } from "./localPlayback";

function createMusicItem(
    overrides: Partial<IMusic.IMusicItem> = {},
): IMusic.IMusicItem {
    return {
        id: "song-id",
        platform: "source-plugin",
        title: "Song",
        artist: "Artist",
        ...overrides,
    } as IMusic.IMusicItem;
}

describe("getLocalPlaybackSource", () => {
    it("uses the path carried by the requested music item", () => {
        const musicItem = createMusicItem({
            $: { localPath: "/storage/emulated/0/Music/song.mp3" },
        });

        expect(getLocalPlaybackSource(musicItem)).toEqual({
            url: "file:///storage/emulated/0/Music/song.mp3",
        });
    });

    it("uses the matching local-sheet item when an online copy has no path", () => {
        const requestedItem = createMusicItem();
        const localMusicItem = createMusicItem({
            $: { localPath: "/storage/emulated/0/Music/downloaded.flac" },
        });

        expect(
            getLocalPlaybackSource(requestedItem, localMusicItem),
        ).toEqual({
            url: "file:///storage/emulated/0/Music/downloaded.flac",
        });
    });

    it("prefers the validated local-sheet path over stale item metadata", () => {
        const requestedItem = createMusicItem({
            $: { localPath: "/old/Documents/song.mp3" },
        });
        const localMusicItem = createMusicItem({
            $: { localPath: "/new/Documents/song.mp3" },
        });

        expect(
            getLocalPlaybackSource(requestedItem, localMusicItem),
        ).toEqual({
            url: "file:///new/Documents/song.mp3",
        });
    });

    it("preserves content URIs", () => {
        const musicItem = createMusicItem({
            url: "content://media/external/audio/media/42",
        });

        expect(getLocalPlaybackSource(musicItem)).toEqual({
            url: "content://media/external/audio/media/42",
        });
    });

    it("returns null when neither item has a local path", () => {
        expect(getLocalPlaybackSource(createMusicItem())).toBeNull();
    });
});
