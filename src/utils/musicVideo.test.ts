jest.mock("@/core/pluginManager", () => ({
    __esModule: true,
    default: {
        getByMedia: jest.fn(),
    },
}));

import pluginManager from "@/core/pluginManager";
import { canPlayMusicVideo, getVideoIdentifier } from "./musicVideo";

const getByMedia = pluginManager.getByMedia as jest.Mock;

describe("music video helpers", () => {
    beforeEach(() => {
        getByMedia.mockReset();
    });

    it("requires both a plugin method and a video identifier", () => {
        getByMedia.mockReturnValue({
            supportedMethods: new Set(["getMvSource"]),
        });

        expect(canPlayMusicVideo({
            id: "song-1",
            platform: "fixture",
            title: "Song",
            artist: "Artist",
            album: "Album",
            artwork: "",
            duration: 1,
        })).toBe(false);

        expect(canPlayMusicVideo({
            id: "song-1",
            platform: "fixture",
            title: "Song",
            artist: "Artist",
            album: "Album",
            artwork: "",
            duration: 1,
            mv: 123,
        })).toBe(true);
    });

    it("accepts video IDs used by common providers", () => {
        getByMedia.mockReturnValue({
            supportedMethods: new Set(["getMvSource"]),
        });

        expect(canPlayMusicVideo({
            id: "song-1",
            platform: "fixture",
            title: "Song",
            artist: "Artist",
            album: "Album",
            artwork: "",
            duration: 1,
            bvid: "BV1fixture",
        })).toBe(true);
        expect(getVideoIdentifier({
            id: "song-1",
            platform: "fixture",
            title: "Song",
            artist: "Artist",
            album: "Album",
            artwork: "",
            duration: 1,
            videoId: "video-1",
        })).toBe("video-1");
    });
});
