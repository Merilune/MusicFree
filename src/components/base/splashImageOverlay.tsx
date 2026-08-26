import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet } from "react-native";
import { useAppConfig } from "@/core/appConfig";
import { getDefaultStore } from "jotai";
import bootstrapAtom from "@/entry/bootstrap/bootstrap.atom";

/**
 * 自定义启动图覆盖层。
 *
 * 原生开屏（styles.xml 里的纯色底）在 JS 起来之前就会结束，
 * 这里接棒：应用一渲染就全屏显示用户设置的启动图，
 * 等启动流程结束（或出错）后淡出。未设置启动图时不渲染。
 */
export default function SplashImageOverlay() {
    const splashImage = useAppConfig("theme.splashImage");
    const [bootstrapDone, setBootstrapDone] = useState(
        getDefaultStore().get(bootstrapAtom).state !== "Loading",
    );
    const [visible, setVisible] = useState(!!splashImage);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // 启动完成可能发生在这个组件挂载之前，直接读一次原子值兜底
    useEffect(() => {
        const store = getDefaultStore();
        const unsub = store.sub(bootstrapAtom, () => {
            if (store.get(bootstrapAtom).state !== "Loading") {
                setBootstrapDone(true);
            }
        });
        if (store.get(bootstrapAtom).state !== "Loading") {
            setBootstrapDone(true);
        }
        return () => {
            unsub();
        };
    }, []);

    useEffect(() => {
        if (!bootstrapDone || !splashImage) {
            return;
        }
        // 启动结束后淡出并卸载覆盖层
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
        });
    }, [bootstrapDone, fadeAnim, splashImage]);

    if (!visible || !splashImage) {
        return null;
    }

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Image
                source={{ uri: splashImage }}
                style={styles.image}
                resizeMode="cover"
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: "#000000",
    },
    image: {
        width: "100%",
        height: "100%",
    },
});
