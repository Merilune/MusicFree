import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Color from "color";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import rpx from "@/utils/rpx";
import Tag from "@/components/base/tag";
import ThemeText from "@/components/base/themeText";
import { fontSizeConst } from "@/constants/uiConst";
import { isSameMediaItem } from "@/utils/mediaUtils";
import IconButton from "@/components/base/iconButton";
import Loading from "@/components/base/loading";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useColors from "@/hooks/useColors";
import TrackPlayer, { useCurrentMusic, usePlayList } from "@/core/trackPlayer";
import { FlashList } from "@shopify/flash-list";
import Icon from "@/components/base/icon.tsx";

const ITEM_HEIGHT = rpx(108);
const ITEM_WIDTH = rpx(750);

interface IPlayListProps {
    item: IMusic.IMusicItem;
    isCurrentMusic: boolean;
}

function PlayListItemView(props: IPlayListProps) {
    const colors = useColors();
    const { item, isCurrentMusic } = props;

    // 正在播放这一行的标识色：主题高亮色，没有就用主色
    const highlightColor = colors.textHighlight ?? colors.primary;
    // 整行淡色底：把标识色降到 12% 不透明度
    let highlightRowColor = highlightColor;
    try {
        highlightRowColor = Color(highlightColor).alpha(0.12).toString();
    } catch {
        // 非法色值就直接用原色
    }

    return (
        <Pressable
            onPress={() => {
                TrackPlayer.play(item);
            }}
            style={[
                style.musicItem,
                isCurrentMusic && {
                    backgroundColor: highlightRowColor,
                },
            ]}>
            {isCurrentMusic && (
                <View style={[style.currentPlayingBar, { backgroundColor: highlightColor }]} />
            )}
            {isCurrentMusic && (
                <Icon
                    name="musical-note"
                    color={highlightColor}
                    size={fontSizeConst.content}
                    style={style.currentPlaying}
                />
            )}
            <ThemeText
                style={[
                    style.musicItemTitle,
                    {
                        color: isCurrentMusic ? highlightColor : colors.text,
                    },
                ]}
                fontWeight={isCurrentMusic ? "semibold" : "regular"}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {item.title}
                {item.artist && (
                    <Text style={{ fontSize: fontSizeConst.description }}>
                        {" "}
                        - {item.artist}
                    </Text>
                )}
            </ThemeText>
            <Tag tagName={item.platform} />
            <IconButton
                style={{ marginLeft: rpx(14) }}
                name="x-mark"
                sizeType="small"
                onPress={() => {
                    TrackPlayer.remove(item);
                }}
            />
        </Pressable>
    );
}

const PlayListItem = React.memo(
    PlayListItemView,
    (prev, next) =>
        !!isSameMediaItem(prev.item, next.item) &&
        prev.isCurrentMusic === next.isCurrentMusic,
);

interface IBodyProps {
    loading?: boolean;
}
export default function Body(props: IBodyProps) {
    const { loading } = props;
    const playList = usePlayList();
    const currentMusicItem = useCurrentMusic();
    const listRef = useRef<FlashList<IMusic.IMusicItem> | null>(null);
    const safeAreaInsets = useSafeAreaInsets();

    const initIndex = useMemo(() => {
        const id = playList.findIndex(_ =>
            isSameMediaItem(currentMusicItem, _),
        );

        if (id !== -1) {
            return id;
        }
        return undefined;
    }, [currentMusicItem, playList]);

    const renderItem = ({ item }: { item: IMusic.IMusicItem; index: number }) => {
        return (
            <PlayListItem
                item={item}
                isCurrentMusic={!!isSameMediaItem(item, currentMusicItem)}
            />
        );
    };

    return loading ? (
        <Loading />
    ) : (
        <View
            style={[
                style.playList,
                {
                    paddingBottom: safeAreaInsets.bottom,
                },
            ]}>
            <FlashList
                ref={_ => {
                    listRef.current = _;
                }}
                extraData={{ currentMusicItem }}
                estimatedItemSize={ITEM_HEIGHT}
                data={playList}
                initialScrollIndex={initIndex}
                renderItem={renderItem}
                // RNGH ScrollView wins pan over home RN ScrollView behind the panel
                renderScrollComponent={GHScrollView as any}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                bounces
            />
        </View>
    );
}

const style = StyleSheet.create({
    playList: {
        width: rpx(750),
        flex: 1,
        minHeight: 0,
    },
    currentPlaying: {
        marginRight: rpx(6),
    },
    // 正在播放行左侧的主题色竖条
    currentPlayingBar: {
        position: "absolute",
        left: 0,
        top: rpx(18),
        bottom: rpx(18),
        width: rpx(6),
        borderRadius: rpx(3),
    },
    musicItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        paddingHorizontal: rpx(24),
        flexDirection: "row",
        alignItems: "center",
    },
    musicItemTitle: {
        flex: 1,
    },
});
