import FastImage from "@/components/base/fastImage";
import Icon from "@/components/base/icon.tsx";
import ThemeText from "@/components/base/themeText";
import { ImgAsset } from "@/constants/assetsConst";
import { useI18N } from "@/core/i18n";
import { ROUTE_PATH, useNavigate } from "@/core/router";
import TrackPlayer, {
    useCurrentMusic,
    useMusicState,
    useProgress,
} from "@/core/trackPlayer";
import useColors from "@/hooks/useColors";
import rpx, { fontRpx } from "@/utils/rpx";
import { musicIsPaused } from "@/utils/trackUtils";
import { resolveArtwork } from "@/utils/artwork";
import { useMediaExtraProperty } from "@/utils/mediaExtra";
import Color from "color";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { DimensionValue } from "react-native";

function formatTime(value?: number) {
    const seconds = Math.max(0, Math.floor(value ?? 0));
    const minute = Math.floor(seconds / 60);
    const second = seconds % 60;
    return `${minute}:${String(second).padStart(2, "0")}`;
}

function getProgressPercent(
    position?: number,
    duration?: number,
): DimensionValue {
    if (!position || !duration || duration <= 0) {
        return "0%";
    }
    return `${Math.min(
        100,
        Math.max(0, (position / duration) * 100),
    )}%` as DimensionValue;
}

// 主色偏深就用白字，偏浅就用黑字，避免按钮文字看不清
function contrastOn(background: string): string {
    try {
        return Color(background).isDark() ? "#FFFFFF" : "#000000";
    } catch {
        return "#FFFFFF";
    }
}

function safeAlpha(source: string, alpha: number, fallback: string) {
    try {
        return Color(source).alpha(alpha).toString();
    } catch {
        return fallback;
    }
}

export default function HomeHero() {
    const currentMusic = useCurrentMusic();
    const musicState = useMusicState();
    const { position, duration } = useProgress();
    const colors = useColors();
    const navigate = useNavigate();
    const { t } = useI18N();
    const primaryColor = colors.primary ?? "#D94B32";
    useMediaExtraProperty(currentMusic, "associatedArtwork");
    const artwork = resolveArtwork(currentMusic);
    const progressDuration = duration || currentMusic?.duration;
    const isPlaying = currentMusic && !musicIsPaused(musicState);

    const foreground = colors.text ?? "#F5F2EB";
    const mutedForeground = colors.textSecondary ?? safeAlpha(foreground, 0.64, foreground);
    // 一层很淡的主色染色，让卡片带一点主题色又不抢壁纸
    const primaryTint = safeAlpha(primaryColor, 0.1, "transparent");
    const playIconColor = contrastOn(primaryColor);

    return (
        <Pressable
            disabled={!currentMusic}
            accessibilityRole={currentMusic ? "button" : undefined}
            accessibilityLabel={currentMusic?.title}
            onPress={() => navigate(ROUTE_PATH.MUSIC_DETAIL)}
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: safeAlpha(foreground, 0.08, "transparent"),
                },
            ]}>
            {/* 主色染色层 */}
            <View style={[styles.tintLayer, { backgroundColor: primaryTint }]} />
            <View style={styles.content}>
                <View style={styles.kickerRow}>
                    <View
                        style={[
                            styles.kickerLine,
                            { backgroundColor: primaryColor },
                        ]}
                    />
                    <ThemeText
                        fontSize="caption"
                        fontWeight="bold"
                        color={mutedForeground}
                        style={styles.kickerText}>
                        {currentMusic
                            ? t("home.continueListening")
                            : "AUDIORA / LIBRARY"}
                    </ThemeText>
                </View>
                <View style={styles.titleRow}>
                    <ThemeText
                        numberOfLines={2}
                        fontSize="section"
                        fontWeight="bold"
                        color={foreground}
                        style={styles.title}>
                        {currentMusic?.title ?? t("home.welcomeTitle")}
                    </ThemeText>
                    <View
                        style={[
                            styles.platformBadge,
                            {
                                backgroundColor: safeAlpha(
                                    foreground,
                                    0.1,
                                    "transparent",
                                ),
                            },
                        ]}>
                        <ThemeText fontSize="tag" color={mutedForeground}>
                            {currentMusic?.platform ?? "Audiora"}
                        </ThemeText>
                    </View>
                </View>
                <ThemeText
                    numberOfLines={1}
                    fontSize="subTitle"
                    color={mutedForeground}
                    style={styles.desc}>
                    {currentMusic?.artist || t("home.welcomeSubtitle")}
                </ThemeText>
                <View style={styles.bottomRow}>
                    <View style={styles.progressBlock}>
                        <View style={styles.progressTimeRow}>
                            <ThemeText fontSize="tag" color={mutedForeground}>
                                {formatTime(currentMusic ? position : 0)}
                            </ThemeText>
                            <ThemeText fontSize="tag" color={mutedForeground}>
                                {formatTime(progressDuration)}
                            </ThemeText>
                        </View>
                        <View
                            style={[
                                styles.progressTrack,
                                {
                                    backgroundColor: safeAlpha(
                                        foreground,
                                        0.14,
                                        "rgba(0,0,0,0.14)",
                                    ),
                                },
                            ]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: primaryColor,
                                        width: getProgressPercent(
                                            currentMusic ? position : 0,
                                            progressDuration,
                                        ),
                                    },
                                ]}
                            />
                        </View>
                    </View>
                    {currentMusic ? (
                        <Pressable
                            style={[
                                styles.playButton,
                                { backgroundColor: primaryColor },
                            ]}
                            onPress={evt => {
                                evt.stopPropagation();
                                if (isPlaying) {
                                    TrackPlayer.pause();
                                } else {
                                    TrackPlayer.play(currentMusic);
                                }
                            }}>
                            <Icon
                                name={isPlaying ? "pause" : "play"}
                                size={rpx(38)}
                                color={playIconColor}
                            />
                        </Pressable>
                    ) : null}
                </View>
            </View>
            <View
                style={[
                    styles.coverFrame,
                    {
                        borderColor: safeAlpha(
                            foreground,
                            0.1,
                            "transparent",
                        ),
                    },
                ]}>
                <FastImage
                    source={artwork}
                    placeholderSource={ImgAsset.albumDefault}
                    style={styles.cover}
                />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        minHeight: rpx(268),
        marginHorizontal: rpx(24),
        marginTop: rpx(12),
        borderRadius: rpx(24),
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
        flexDirection: "row",
        alignItems: "center",
        padding: rpx(24),
    },
    // 铺满卡片的主色淡染层
    tintLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        minWidth: 0,
        zIndex: 1,
        paddingRight: rpx(22),
    },
    kickerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    kickerLine: {
        width: rpx(32),
        height: rpx(4),
        borderRadius: rpx(2),
        marginRight: rpx(10),
    },
    kickerText: {
        letterSpacing: rpx(1.6),
        textTransform: "uppercase",
    },
    titleRow: {
        marginTop: rpx(18),
        flexDirection: "row",
        alignItems: "flex-start",
    },
    title: {
        flex: 1,
        minWidth: 0,
        lineHeight: fontRpx(48),
    },
    platformBadge: {
        minHeight: rpx(34),
        paddingHorizontal: rpx(12),
        borderRadius: rpx(17),
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: rpx(12),
        marginTop: rpx(5),
    },
    desc: {
        marginTop: rpx(12),
        lineHeight: fontRpx(36),
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: rpx(28),
    },
    progressBlock: {
        flex: 1,
        minWidth: 0,
    },
    progressTimeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: rpx(9),
    },
    progressTrack: {
        height: rpx(7),
        borderRadius: rpx(4),
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: rpx(4),
    },
    playButton: {
        width: rpx(68),
        height: rpx(68),
        borderRadius: rpx(34),
        marginLeft: rpx(18),
        alignItems: "center",
        justifyContent: "center",
    },
    coverFrame: {
        width: rpx(162),
        height: rpx(162),
        zIndex: 1,
        borderRadius: rpx(22),
        borderWidth: StyleSheet.hairlineWidth,
        padding: rpx(8),
    },
    cover: {
        width: "100%",
        height: "100%",
        borderRadius: rpx(16),
    },
});
