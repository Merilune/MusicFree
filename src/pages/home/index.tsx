import React, { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";

import NavBar from "./components/navBar";
import MusicBar from "@/components/musicBar";
import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeDrawer from "./components/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBar from "@/components/base/statusBar";
import HorizontalSafeAreaView from "@/components/base/horizontalSafeAreaView.tsx";
import globalStyle from "@/constants/globalStyle";
import Theme from "@/core/theme";
import HomeBody from "./components/homeBody";
import HomeBodyHorizontal from "./components/homeBodyHorizontal";
import useOrientation from "@/hooks/useOrientation";
import { ROUTE_PATH, useNavigate } from "@/core/router";
import Config from "@/core/appConfig";
import rpx from "@/utils/rpx";

const PORTRAIT_DRAWER_MAX_WIDTH = 420;
const LANDSCAPE_DRAWER_MAX_WIDTH = 440;
const DRAWER_MIN_WIDTH = 320;

function Home() {
    const orientation = useOrientation();
    const navigate = useNavigate();
    
    useEffect(() => {
        // 检查是否需要在启动后打开播放详情页
        if (Config.getConfig("basic.openPlayDetailOnLaunch")) {
            // 延迟一下导航，确保页面已经渲染完成
            setTimeout(() => {
                navigate(ROUTE_PATH.MUSIC_DETAIL);
            }, 100);
        }
    }, [navigate]);

    return (
        <SafeAreaView edges={["top", "bottom"]} style={styles.appWrapper}>
            <HomeStatusBar />
            <HorizontalSafeAreaView style={globalStyle.flex1}>
                <>
                    <NavBar />
                    {orientation === "vertical" ? (
                        <HomeBody />
                    ) : (
                        <HomeBodyHorizontal />
                    )}
                </>
            </HorizontalSafeAreaView>
            <MusicBar />
        </SafeAreaView>
    );
}

function HomeStatusBar() {
    const theme = Theme.useTheme();

    return (
        <StatusBar
            backgroundColor="transparent"
            barStyle={theme.dark ? undefined : "dark-content"}
        />
    );
}

// function Body() {
//     const orientation = useOrientation();
//     return (
//         <ScrollView
//             style={[
//                 styles.appWrapper,
//                 orientation === 'horizontal' ? styles.flexRow : null,
//             ]}>
//             <Operations orientation={orientation} />
//         </ScrollView>
//     );
// }

const LeftDrawer = createDrawerNavigator();

// Extract drawer content component to avoid nested component warning
const DrawerContent = (props: any) => <HomeDrawer {...props} />;

export default function App() {
    const orientation = useOrientation();
    const { width } = useWindowDimensions();
    // 订阅主题，配色或「表面不透明度」变了要重算抽屉底色
    const theme = Theme.useTheme();
    const drawerWidth = useMemo(() => {
        if (orientation === "horizontal") {
            return Math.max(
                DRAWER_MIN_WIDTH,
                Math.min(width * 0.56, LANDSCAPE_DRAWER_MAX_WIDTH),
            );
        }

        return Math.max(
            DRAWER_MIN_WIDTH,
            Math.min(width * 0.82, PORTRAIT_DRAWER_MAX_WIDTH),
        );
    }, [orientation, width]);

    const drawerStyle = useMemo(
        () => ({
            width: drawerWidth,
            // 原先这里只设宽度，底色由导航库取 colors.card。设了壁纸时那是
            // rgba(0,0,0,0.22)，抽屉滑出的过程里右缘就是一条从 22% 黑突变到
            // 全透明的硬直线，看着不像一层面板。补足够不透明的底、右缘加圆角、
            // 再配一道向右的阴影，让边界有个软过渡。
            backgroundColor: Theme.getDrawerSurfaceColor(),
            borderTopRightRadius: rpx(28),
            borderBottomRightRadius: rpx(28),
            // Android 走 elevation，iOS 走 shadow*，两边都给
            elevation: 16,
            shadowColor: "#000000",
            shadowOffset: { width: rpx(8), height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: rpx(18),
        }),
        [drawerWidth, theme],
    );

    return (
        <LeftDrawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerStyle,
            }}
            initialRouteName="HOME-MAIN"
            drawerContent={DrawerContent}>
            <LeftDrawer.Screen name="HOME-MAIN" component={Home} />
        </LeftDrawer.Navigator>
    );
}

const styles = StyleSheet.create({
    appWrapper: {
        flexDirection: "column",
        flex: 1,
    },
    flexRow: {
        flexDirection: "row",
    },
});
