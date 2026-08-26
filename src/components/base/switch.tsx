import React, { useEffect } from "react";
import {
    StyleSheet,
    SwitchProps,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Color from "color";
import useColors from "@/hooks/useColors";
import rpx from "@/utils/rpx";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { timingConfig } from "@/constants/commonConst";

interface ISwitchProps extends SwitchProps {
    disabled?: boolean;
}

const fixedWidth = rpx(40);

export default function ThemeSwitch(props: ISwitchProps) {
    const { value, onValueChange, disabled } = props;
    const colors = useColors();

    const sharedValue = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        sharedValue.value = value ? 1 : 0;
    }, [value, sharedValue]);

    // 圆点颜色按轨道底色取对比色：主色偏浅（如白色）时
    // 白色圆点会跟轨道糊成一团，改用深色圆点
    const trackColor = value ? colors.primary : colors.textSecondary;
    let thumbColor = "#FFFFFF";
    try {
        thumbColor = Color(trackColor).isDark() ? "#FFFFFF" : "#1B1B1B";
    } catch {
        // 非法色值保持白点
    }

    const thumbStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: withTiming(
                        sharedValue.value * fixedWidth,
                        timingConfig.animationNormal,
                    ),
                },
            ],
        };
    });

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                if (!disabled) {
                    onValueChange?.(!value);
                }
            }}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: trackColor,
                    },
                    props?.style,
                ]}>
                <Animated.View
                    style={[styles.thumb, thumbStyle, { backgroundColor: thumbColor }]}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        width: rpx(80),
        height: rpx(40),
        borderRadius: rpx(40),
        justifyContent: "center",
    },
    thumb: {
        width: rpx(34),
        height: rpx(34),
        borderRadius: rpx(17),
        left: rpx(3),
    },
});
