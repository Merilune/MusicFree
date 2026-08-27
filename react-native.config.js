// 内置字体：需要手动跑 npx react-native asset 拷进 android/app/src/main/assets/fonts
// （CI 已加该步骤；gradle 构建本身不会拷），JS 侧直接 fontFamily 引用
module.exports = {
    project: {
        ios: {},
        android: {},
    },
    assets: ["./assets/fonts/"],
};
