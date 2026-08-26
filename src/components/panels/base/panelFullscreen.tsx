import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
    BackHandler,
    DeviceEventEmitter,
    Modal,
    NativeEventSubscription,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";

import Animated, {
    Easing,
    EasingFunction,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Theme from "@/core/theme";
import PageBackground from "@/components/base/pageBackground";
import { panelInfoStore } from "../usePanel";
import { vh } from "@/utils/rpx.ts";

const ANIMATION_EASING: EasingFunction = Easing.out(Easing.exp);
const ANIMATION_DURATION = 250;

const timingConfig = {
    duration: ANIMATION_DURATION,
    easing: ANIMATION_EASING,
};

interface IPanelFullScreenProps {
    hasMask?: boolean;
    children?: React.ReactNode;
    containerStyle?: ViewStyle;
    animationType?: "SlideToTop" | "Scale";
}

/**
 * Fullscreen panel rendered in its own Modal window.  Keeping the panel out of
 * the native-stack sibling tree is what makes native scrolling and controls
 * receive the same hit tests as the pixels drawn on screen on Android/Fabric.
 */
export default function (props: IPanelFullScreenProps) {
    const {
        hasMask,
        containerStyle,
        children,
        animationType = "SlideToTop",
    } = props;
    const snapPoint = useSharedValue(0);

    // 订阅主题：换主题 / 设清壁纸后面板底色要重算
    const theme = Theme.useTheme();
    const panelBackgroundColor = useMemo(
        () => Theme.getOpaquePageBackgroundColor(),
        [theme],
    );

    const backHandlerRef = useRef<NativeEventSubscription | null>(null);
    const hideCallbackRef = useRef<Function[]>([]);
    const closingRef = useRef(false);

    const windowHeight = useMemo(() => vh(100), []);

    const unmountPanel = useCallback(() => {
        closingRef.current = false;
        const callbacks = hideCallbackRef.current.slice();
        hideCallbackRef.current = [];
        if (callbacks.length > 0) {
            callbacks.forEach(cb => cb?.());
            return;
        }
        panelInfoStore.setValue({
            name: null,
            payload: null,
        });
    }, []);

    const closePanel = useCallback(() => {
        if (closingRef.current) {
            return;
        }
        closingRef.current = true;
        snapPoint.value = withTiming(0, timingConfig, finished => {
            if (finished) {
                runOnJS(unmountPanel)();
            } else {
                closingRef.current = false;
            }
        });
    }, [snapPoint, unmountPanel]);

    useEffect(() => {
        closingRef.current = false;
        snapPoint.value = withTiming(1, timingConfig);

        if (backHandlerRef.current) {
            backHandlerRef.current?.remove();
            backHandlerRef.current = null;
        }
        backHandlerRef.current = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                closePanel();
                return true;
            },
        );

        const listenerSubscription = DeviceEventEmitter.addListener(
            "hidePanel",
            (callback?: () => void) => {
                if (callback) {
                    hideCallbackRef.current.push(callback);
                }
                closePanel();
            },
        );

        return () => {
            if (backHandlerRef.current) {
                backHandlerRef.current?.remove();
                backHandlerRef.current = null;
            }
            listenerSubscription.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const panelAnimated = useAnimatedStyle(() => {
        if (animationType === "SlideToTop") {
            return {
                transform: [
                    {
                        translateY: (1 - snapPoint.value) * windowHeight,
                    },
                ],
            };
        }
        return {
            transform: [
                {
                    scale: 0.3 + snapPoint.value * 0.7,
                },
            ],
            opacity: snapPoint.value,
        };
    });

    const maskAnimated = useAnimatedStyle(() => ({
        opacity: snapPoint.value * 0.5,
    }));

    return (
        <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            navigationBarTranslucent
            presentationStyle="overFullScreen"
            onRequestClose={closePanel}>
            <View style={style.rootHost} collapsable={false}>
                {hasMask ? (
                    <TouchableWithoutFeedback
                        accessibilityRole="button"
                        accessibilityLabel="关闭面板"
                        onPress={closePanel}>
                        <Animated.View
                            collapsable={false}
                            style={[style.mask, maskAnimated]}
                        />
                    </TouchableWithoutFeedback>
                ) : null}
                <Animated.View
                    collapsable={false}
                    pointerEvents="auto"
                    style={[
                        style.wrapper,
                        !hasMask
                            ? {
                                // 全屏面板跑在自己的 Modal 窗口里，下面没有 App 那棵树的
                                // PageBackground 垫底。useColors 会把 background 映射成
                                // pageBackground，预设主题下那是实色所以没问题；但设了壁纸时
                                // 它被换成 rgba(0,0,0,0.12)，面板就成了一层 12% 的黑浮在
                                // 下层页面上，评论文字直接糊在别的界面像素里。
                                // 这里强制垫一层不透明底色。
                                backgroundColor: panelBackgroundColor,
                            }
                            : null,
                        panelAnimated,
                        containerStyle,
                    ]}>
                    {/* 垫完实色再叠一层和页面同一套的背景（壁纸 + 遮罩），
                        这样面板里的观感和主页一致，不会一进评论区壁纸就没了。
                        绝对定位铺满且不吃触摸，写在 children 前面才在底下。 */}
                    {!hasMask ? <PageBackground /> : null}
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const style = StyleSheet.create({
    rootHost: {
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
    },
    mask: {
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        zIndex: 0,
    },
    wrapper: {
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        elevation: 16,
        flexDirection: "column",
    },
});
