import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Slider from "@react-native-community/slider";
import ThemeText from "./themeText";
import useColors from "@/hooks/useColors";
import rpx from "@/utils/rpx";

interface IProps {
    title: string;
    value: number;
    minimumValue: number;
    maximumValue: number;
    step: number;
    /** 数值展示格式，默认直接显示数字 */
    format?: (value: number) => string;
    /** 拖动结束后提交 */
    onChange: (value: number) => void;
    /** 拖动过程中的实时回调，用于即时预览 */
    onLiveChange?: (value: number) => void;
}

/** 带实时数值显示的滑块行 */
export default function SliderRow(props: IProps) {
    const {
        title,
        value,
        minimumValue,
        maximumValue,
        step,
        format,
        onChange,
        onLiveChange,
    } = props;
    const colors = useColors();
    // 拖动时先更新本地状态，数值读数才能跟着手指走
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    return (
        <View style={styles.wrapper}>
            <View style={styles.titleRow}>
                <ThemeText fontSize="subTitle">{title}</ThemeText>
                <ThemeText fontSize="subTitle" fontColor="textSecondary">
                    {format ? format(displayValue) : `${displayValue}`}
                </ThemeText>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={minimumValue}
                maximumValue={maximumValue}
                step={step}
                value={value}
                onValueChange={val => {
                    setDisplayValue(val);
                    onLiveChange?.(val);
                }}
                onSlidingComplete={onChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.textSecondary}
                thumbTintColor={colors.primary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        paddingHorizontal: rpx(24),
        marginTop: rpx(20),
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    slider: {
        width: "100%",
        height: rpx(60),
    },
});
