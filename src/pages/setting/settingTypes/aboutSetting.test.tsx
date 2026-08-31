import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import AboutSetting from "./aboutSetting";

jest.mock("@/components/base/themeText", () => "ThemeText");
jest.mock("@/components/base/linkText", () => "LinkText");
jest.mock("@/constants/assetsConst", () => ({
    ImgAsset: { author: 1 },
}));
jest.mock("@/constants/buildInfo", () => ({
    buildTime: "2026-08-31",
}));
jest.mock("@/core/i18n", () => ({
    useI18N: () => ({
        t: (key: string, args?: Record<string, string>) => {
            if (key === "about.version") {
                return `Version ${args?.version}`;
            }
            if (key === "about.buildTime") {
                return `Build time: ${args?.buildTime}`;
            }
            return key;
        },
    }),
}));
jest.mock("@/core/theme", () => ({
    useTheme: () => ({ colors: { card: "white" } }),
}));
jest.mock("@/hooks/useHasCustomBackground", () => () => false);
jest.mock("@/hooks/useOrientation", () => () => "vertical");
jest.mock("@/utils/rpx", () => {
    const rpx = (value: number) => value;
    return {
        __esModule: true,
        default: rpx,
        fontRpx: rpx,
    };
});
jest.mock("react-native-device-info", () => ({
    getVersion: () => "0.1.0",
}));

describe("AboutSetting", () => {
    it("shows the project scope and responsibility boundary", () => {
        let renderer: TestRenderer.ReactTestRenderer;

        act(() => {
            renderer = TestRenderer.create(<AboutSetting />);
        });

        const text = renderer!.root
            .findAllByType("ThemeText")
            .map(node => node.props.children)
            .filter(Boolean);

        expect(text).toEqual(expect.arrayContaining([
            "Audiora",
            "Version 0.1.0",
            "Build time: 2026-08-31",
            "about.positioningTitle",
            "about.positioningContent",
            "about.responsibilityTitle",
            "about.responsibilityContent",
        ]));
    });
});
