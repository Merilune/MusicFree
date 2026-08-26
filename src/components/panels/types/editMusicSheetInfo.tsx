import AppBar from "@/components/base/appBar.tsx";
import Image from "@/components/base/image.tsx";
import Input from "@/components/base/input.tsx";
import SliderRow from "@/components/base/sliderRow.tsx";
import ThemeText from "@/components/base/themeText.tsx";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView.tsx";
import PanelFullscreen from "@/components/panels/base/panelFullscreen.tsx";
import { hidePanel } from "@/components/panels/usePanel.ts";
import { ImgAsset } from "@/constants/assetsConst.ts";
import globalStyle from "@/constants/globalStyle.ts";
import pathConst from "@/constants/pathConst.ts";
import { fontSizeConst } from "@/constants/uiConst.ts";
import { useI18N } from "@/core/i18n";
import MusicSheet from "@/core/musicSheet";
import {
    DEFAULT_BACKGROUND_BLUR,
    DEFAULT_BACKGROUND_OPACITY,
} from "@/core/theme";
import useColors from "@/hooks/useColors.ts";
import {
    pickBackgroundImage,
    removeBackgroundImage,
    saveBackgroundImage,
} from "@/utils/backgroundImage";
import { addFileScheme, addRandomHash } from "@/utils/fileUtils.ts";
import rpx from "@/utils/rpx";
import Toast from "@/utils/toast.ts";
import { devLog } from "@/utils/log";
import { readAsStringAsync } from "expo-file-system/legacy";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { exists, unlink, writeFile } from "react-native-fs";
import { launchImageLibrary } from "react-native-image-picker";

interface IEditSheetDetailProps {
  musicSheet: IMusic.IMusicSheetItem;
}

export default function EditMusicSheetInfo(props: IEditSheetDetailProps) {
    const { musicSheet } = props;
    const colors = useColors();
    const { t } = useI18N();

    const [coverImg, setCoverImg] = useState(musicSheet?.coverImg);
    const [title, setTitle] = useState(musicSheet?.title);
    const [background, setBackground] = useState<string | undefined>(
        musicSheet?.background,
    );
    const [backgroundBlur, setBackgroundBlur] = useState(
        musicSheet?.backgroundBlur ?? DEFAULT_BACKGROUND_BLUR,
    );
    const [backgroundOpacity, setBackgroundOpacity] = useState(
        musicSheet?.backgroundOpacity ?? DEFAULT_BACKGROUND_OPACITY,
    );

    const onChangeCoverPress = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: "photo",
            });
            const uri = result.assets?.[0].uri;
            if (!uri) {
                return;
            }
            devLog("info", "📁[编辑歌单信息] 选择封面图片", { uri });
            setCoverImg(uri);
        } catch (e) {
            devLog("warn", "📁[编辑歌单信息] 选择图片失败", e);
        }
    };

    const onChangeBackgroundPress = async () => {
        try {
            const uri = await pickBackgroundImage();
            if (!uri) {
                return;
            }
            setBackground(uri);
        } catch (e) {
            devLog("warn", "🎨[编辑歌单信息] 选择背景失败", e);
        }
    };

    function onTitleChange(_: string) {
        setTitle(_);
    }

    async function onConfirm() {
    // 判断是否相同
        if (
            coverImg === musicSheet?.coverImg &&
      title === musicSheet?.title &&
      background === musicSheet?.background &&
      backgroundBlur === (musicSheet?.backgroundBlur ?? DEFAULT_BACKGROUND_BLUR) &&
      backgroundOpacity ===
        (musicSheet?.backgroundOpacity ?? DEFAULT_BACKGROUND_OPACITY)
        ) {
            hidePanel();
            return;
        }

        let newCoverImg = coverImg;
        if (coverImg && coverImg !== musicSheet?.coverImg) {
            newCoverImg = addFileScheme(
                `${pathConst.dataPath}sheet${musicSheet.id}${coverImg.substring(
                    coverImg.lastIndexOf("."),
                )}`,
            );
            try {
                if ((await exists(newCoverImg))) {
                    await unlink(newCoverImg);
                }

                // Copy
                const rawImage = await readAsStringAsync(coverImg, {
                    encoding: "base64",
                });
                await writeFile(newCoverImg, rawImage, "base64");
            } catch (e) {
                devLog("warn", "📁[编辑歌单信息] 写入图片失败", e);
            }
        }

        let newBackground = background;
        if (background !== musicSheet?.background) {
            if (background) {
                try {
                    // 歌单背景单独存一份，之后换封面不会连带把背景换掉
                    newBackground = await saveBackgroundImage(
                        background,
                        `sheetBg${musicSheet.id}`,
                    );
                } catch (e) {
                    devLog("warn", "🎨[编辑歌单信息] 写入背景失败", e);
                    newBackground = musicSheet?.background;
                }
            } else {
                // 清除背景：连文件一起删掉，别留垃圾
                await removeBackgroundImage(musicSheet?.background);
                newBackground = undefined;
            }
        }

        let _title = title;
        if (!_title?.length) {
            _title = musicSheet.title;
        }
        // 更新歌单信息
        MusicSheet.updateMusicSheetBase(musicSheet.id, {
            coverImg: newCoverImg ? addRandomHash(newCoverImg) : undefined,
            title: _title,
            background: newBackground,
            backgroundBlur,
            backgroundOpacity,
        }).then(() => {
            Toast.success(t("panel.editMusicSheetInfo.toast.updateSuccess"));
        });
        hidePanel();
    }

    return (
        <PanelFullscreen>
            <VerticalSafeAreaView style={globalStyle.fwflex1}>
                <AppBar onBackPress={hidePanel} withStatusBar>
                    {t("panel.editMusicSheetInfo.title")}
                </AppBar>
                <ScrollView style={globalStyle.fwflex1}>
                    <View style={style.row}>
                        <ThemeText>{t("common.cover")}</ThemeText>
                        <TouchableOpacity
                            onPress={onChangeCoverPress}
                            onLongPress={() => {
                                setCoverImg(undefined);
                            }}>
                            <Image
                                style={style.coverImg}
                                uri={coverImg}
                                emptySrc={ImgAsset.albumDefault}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={style.row}>
                        <ThemeText>{t("panel.editMusicSheetInfo.sheetName")}</ThemeText>
                        <Input
                            numberOfLines={1}
                            textAlign="right"
                            value={title}
                            hasHorizontalPadding={false}
                            onChangeText={onTitleChange}
                            style={[
                                style.titleInput,
                                {
                                    height: fontSizeConst.content * 2.5,
                                    borderBottomColor: colors.text,
                                },
                            ]}
                        />
                    </View>
                    <View style={style.row}>
                        <View style={style.backgroundLabel}>
                            <ThemeText>
                                {t("panel.editMusicSheetInfo.background")}
                            </ThemeText>
                            <ThemeText
                                fontSize="description"
                                fontColor="textSecondary">
                                {t("panel.editMusicSheetInfo.backgroundDesc")}
                            </ThemeText>
                        </View>
                        <TouchableOpacity
                            onPress={onChangeBackgroundPress}
                            onLongPress={() => {
                                setBackground(undefined);
                            }}>
                            <Image
                                style={style.coverImg}
                                uri={background}
                                emptySrc={ImgAsset.addBackground}
                            />
                        </TouchableOpacity>
                    </View>
                    {coverImg ? (
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                                setBackground(coverImg);
                            }}
                            style={[
                                {
                                    borderColor: colors.primary,
                                },
                                style.secondaryButton,
                            ]}>
                            <ThemeText fontSize="subTitle" color={colors.primary}>
                                {t("panel.editMusicSheetInfo.useCoverAsBackground")}
                            </ThemeText>
                        </TouchableOpacity>
                    ) : null}
                    {background ? (
                        <>
                            <SliderRow
                                title={t("setCustomTheme.blur")}
                                value={backgroundBlur}
                                minimumValue={0}
                                maximumValue={50}
                                step={1}
                                onChange={setBackgroundBlur}
                            />
                            <SliderRow
                                title={t("setCustomTheme.opacity")}
                                value={backgroundOpacity}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.01}
                                format={val => `${Math.round(val * 100)}%`}
                                onChange={setBackgroundOpacity}
                            />
                        </>
                    ) : null}
                    <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={onConfirm}
                        style={[
                            {
                                backgroundColor: colors.primary,
                            },
                            style.button,
                        ]}>
                        <ThemeText color={"white"}>{t("common.confirm")}</ThemeText>
                    </TouchableOpacity>
                </ScrollView>
            </VerticalSafeAreaView>
        </PanelFullscreen>
    );
}

const style = StyleSheet.create({
    row: {
        marginTop: rpx(28),
        height: rpx(120),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: rpx(12),
        paddingHorizontal: rpx(24),
    },
    coverImg: {
        width: rpx(100),
        height: rpx(100),
        borderRadius: rpx(28),
    },
    backgroundLabel: {
        flex: 1,
        marginRight: rpx(24),
        rowGap: rpx(6),
    },
    button: {
        marginHorizontal: rpx(24),
        borderRadius: rpx(8),
        height: rpx(72),
        marginTop: rpx(24),
        marginBottom: rpx(48),
        justifyContent: "center",
        alignItems: "center",
    },
    secondaryButton: {
        marginHorizontal: rpx(24),
        borderRadius: rpx(8),
        borderWidth: 1,
        height: rpx(72),
        marginTop: rpx(12),
        justifyContent: "center",
        alignItems: "center",
    },
    titleInput: {
        width: "50%",
        borderBottomWidth: 1,
        includeFontPadding: false,
    },
});
