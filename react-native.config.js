// 内置字体：gradle 打包时由 RN CLI 复制进 APK，JS 侧直接 fontFamily 引用
module.exports = {
    project: {
        ios: {},
        android: {},
    },
    assets: ["./assets/fonts/"],
};
