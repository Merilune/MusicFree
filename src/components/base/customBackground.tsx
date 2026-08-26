import React from "react";
import { StyleSheet, View } from "react-native";
import Image from "./image";
import { useAppConfig } from "@/core/appConfig";
import {
    DEFAULT_BACKGROUND_BLUR,
    DEFAULT_BACKGROUND_OPACITY,
} from "@/core/theme";

interface IProps {
    /** 背景图地址，为空时只渲染底色 */
    url?: string | null;
    blur?: number;
    opacity?: number;
    /** 底色；不传则只渲染图片，让下层背景透出来 */
    backgroundColor?: string;
}

/**
 * 受控的背景层：底色 + 模糊图片 + 暗化遮罩。
 * 全局壁纸和歌单壁纸都用它渲染，绝对定位铺满父容器且不吃触摸事件。
 */
export default function CustomBackground(props: IProps) {
    const { url, blur, opacity, backgroundColor } = props;
    const mask = useAppConfig("theme.backgroundMask") ?? 0;

    return (
        <>
            {backgroundColor ? (
                <View
                    style={[style.wrapper, { backgroundColor }]}
                    pointerEvents="none"
                />
            ) : null}
            {url ? (
                <Image
                    uri={url}
                    style={[
                        style.wrapper,
                        { opacity: opacity ?? DEFAULT_BACKGROUND_OPACITY },
                    ]}
                    resizeMethod="resize"
                    resizeMode="cover"
                    fadeDuration={0}
                    blurRadius={blur ?? DEFAULT_BACKGROUND_BLUR}
                />
            ) : null}
            {url && mask > 0 ? (
                <View
                    style={[
                        style.wrapper,
                        { backgroundColor: `rgba(0,0,0,${mask})` },
                    ]}
                    pointerEvents="none"
                />
            ) : null}
        </>
    );
}

const style = StyleSheet.create({
    wrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
    },
});
