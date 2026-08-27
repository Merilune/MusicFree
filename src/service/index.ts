import Config from "@/core/appConfig";
import RNTrackPlayer, { Event, State } from "react-native-track-player";
import trackPlayer from "@/core/trackPlayer";
import MusicSheet from "@/core/musicSheet";
import Toast from "@/utils/toast";
import { musicIsPaused } from "@/utils/trackUtils";
import PersistStatus from "@/utils/persistStatus";
import { DeviceEventEmitter, NativeModules } from "react-native";

let resumeState: State | null;

/** 把当前收藏态推给紧凑通知（实心红心/空心白心） */
function pushCompactFavoriteState(musicItem: IMusic.IMusicItem | null) {
    const isFavorite = musicItem
        ? MusicSheet.getSortedMusicListBySheetId(
              MusicSheet.defaultSheet.id,
          ).has(musicItem)
        : false;
    NativeModules.LyricUtil?.setCompactNotificationFavorite?.(isFavorite)?.catch?.(
        () => undefined,
    );
}

module.exports = async function () {
    // 紧凑通知上的收藏按钮（原生 MusicService 补丁发出的事件）
    DeviceEventEmitter.addListener("remote-favorite", () => {
        const musicItem = trackPlayer.currentMusic;
        if (!musicItem) {
            return;
        }
        const favList = MusicSheet.getSortedMusicListBySheetId(
            MusicSheet.defaultSheet.id,
        );
        if (favList.has(musicItem)) {
            MusicSheet.removeMusic(
                MusicSheet.defaultSheet.id,
                musicItem,
            ).catch(() => undefined);
            Toast.warn("已取消收藏");
            pushCompactFavoriteState(musicItem);
        } else {
            MusicSheet.addMusic(
                MusicSheet.defaultSheet.id,
                musicItem,
            ).catch(() => undefined);
            Toast.success("已收藏");
            pushCompactFavoriteState(musicItem);
        }
    });

    // 换歌后同步新歌的收藏态到通知
    RNTrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, () => {
        pushCompactFavoriteState(trackPlayer.currentMusic);
    });
    RNTrackPlayer.addEventListener(Event.RemotePlay, () => trackPlayer.play());
    RNTrackPlayer.addEventListener(Event.RemotePause, () =>
        trackPlayer.pause(),
    );
    RNTrackPlayer.addEventListener(Event.RemotePrevious, () =>
        trackPlayer.skipToPrevious(),
    );
    RNTrackPlayer.addEventListener(Event.RemoteNext, () =>
        trackPlayer.skipToNext(),
    );
    RNTrackPlayer.addEventListener(
        Event.RemoteDuck,
        async ({ paused, permanent }) => {
            if (Config.getConfig("basic.notInterrupt")) {
                return;
            }
            if (permanent) {
                return trackPlayer.pause();
            }
            const tempRemoteDuckConf = Config.getConfig(
                "basic.tempRemoteDuck",
            );
            if (tempRemoteDuckConf === "lowerVolume") {
                if (paused) {
                    const tempRemoteDuckVolume = Config.getConfig(
                        "basic.tempRemoteDuckVolume",
                    ) ?? 0.5;
                    return RNTrackPlayer.setVolume(1 - tempRemoteDuckVolume);
                } else {
                    return RNTrackPlayer.setVolume(1);
                }
            } else {
                if (paused) {
                    resumeState =
                        (await RNTrackPlayer.getPlaybackState()).state ??
                        State.Paused;
                    return trackPlayer.pause();
                } else {
                    if (resumeState && !musicIsPaused(resumeState)) {
                        resumeState = null;
                        return trackPlayer.play();
                    }
                    resumeState = null;
                }
            }
        },
    );


    RNTrackPlayer.addEventListener(Event.PlaybackProgressUpdated, evt => {
        PersistStatus.set("music.progress", evt.position);
    });

    RNTrackPlayer.addEventListener(Event.RemoteStop, async () => {
        RNTrackPlayer.stop();
    });

    RNTrackPlayer.addEventListener(Event.RemoteSeek, async evt => {
        trackPlayer.seekTo(evt.position);
    });
};
