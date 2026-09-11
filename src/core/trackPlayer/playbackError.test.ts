import {
    fakeAudioUrl,
    proposedAudioUrl,
    shouldHandlePlaybackError,
} from "./playbackError";

describe("shouldHandlePlaybackError", () => {
    it("ignores the source-resolution placeholder", () => {
        expect(shouldHandlePlaybackError(proposedAudioUrl)).toBe(false);
    });

    it("ignores the fake next-track marker", () => {
        expect(shouldHandlePlaybackError(fakeAudioUrl)).toBe(false);
    });

    it("handles errors from real sources", () => {
        expect(
            shouldHandlePlaybackError("https://example.com/music.flac"),
        ).toBe(true);
        expect(shouldHandlePlaybackError("file:///music/song.mp3")).toBe(true);
    });

    it("ignores a missing current source", () => {
        expect(shouldHandlePlaybackError()).toBe(false);
    });
});
