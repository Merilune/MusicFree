import AppBar from "@/components/base/appBar";
import ListItem from "@/components/base/listItem";
import StatusBar from "@/components/base/statusBar";
import ThemeSwitch from "@/components/base/switch";
import ThemeText from "@/components/base/themeText";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView";
import globalStyle from "@/constants/globalStyle";
import { useI18N } from "@/core/i18n";
import downloadNotificationManager from "@/core/downloadNotificationManager";
import rpx from "@/utils/rpx";
import React, { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet } from "react-native";

type IPermissionTypes = "notification";

export default function Permissions() {
    const appState = useRef(AppState.currentState);
    const [permissions, setPermissions] = useState<
        Record<IPermissionTypes, boolean>
    >({
        notification: false,
        // background: false,
    });
    const { t } = useI18N();

    async function checkPermission(type?: IPermissionTypes) {
        const newPermissions: Partial<Record<IPermissionTypes, boolean>> = {};
        
        if (!type || type === "notification") {
            const hasPermission = await downloadNotificationManager.checkNotificationPermission();
            newPermissions.notification = hasPermission;
        }
        // if (!type || type === 'background') {

        // }

        setPermissions(prevPermissions => ({
            ...prevPermissions,
            ...newPermissions,
        }));
    }

    useEffect(() => {
        checkPermission();
        const subscription = AppState.addEventListener(
            "change",
            nextAppState => {
                if (
                    appState.current.match(/inactive|background/) &&
                    nextAppState === "active"
                ) {
                    checkPermission();
                }

                appState.current = nextAppState;
            },
        );

        return () => {
            subscription.remove();
        };
    }, []);

    return (
        <VerticalSafeAreaView style={globalStyle.fwflex1}>
            <StatusBar />
            <AppBar>{t("permissionSetting.title")}</AppBar>
            <ThemeText style={styles.description}>
                {t("permissionSetting.description")}
            </ThemeText>
            <ListItem
                withHorizontalPadding
                heightType="big">
                <ListItem.Content
                    title={t("permissionSetting.notificationPermission")}
                    description={t("permissionSetting.notificationPermissionDescription")}
                />
                <ThemeSwitch 
                    value={permissions.notification} 
                    onValueChange={async (newValue) => {
                        if (newValue) {
                            // 请求开启权限
                            await downloadNotificationManager.requestNotificationPermission();
                            // 请求完成后立即更新状态
                            setTimeout(() => {
                                checkPermission("notification");
                            }, 500);
                        }
                        // 如果是关闭，Android 系统不支持应用直接关闭权限
                    }}
                />
            </ListItem>
            {/* <ListItem withHorizontalPadding heightType="big">
                <ListItem.Content
                    title="后台运行"
                    description="用以在后台播放音乐"></ListItem.Content>
                <ThemeSwitch value={permissions.background}></ThemeSwitch>
            </ListItem> */}
        </VerticalSafeAreaView>
    );
}

const styles = StyleSheet.create({
    description: {
        width: "100%",
        paddingHorizontal: rpx(24),
        marginVertical: rpx(36),
    },
});
