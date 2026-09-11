export const fakeAudioUrl = "musicfree://fake-audio";
export const proposedAudioUrl = "musicfree://proposed-audio";

export function shouldHandlePlaybackError(url?: string) {
    return !!url && url !== fakeAudioUrl && url !== proposedAudioUrl;
}
