import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import SimpleSelect from "./simpleSelect";
import { hidePanel } from "../usePanel";

jest.mock("../base/panelBase", () => ({ renderBody }: {
    renderBody: () => React.ReactNode;
}) => renderBody());
jest.mock("../base/panelHeader", () => "PanelHeader");
jest.mock("../usePanel", () => ({ hidePanel: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
    useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock("@/utils/rpx", () => ({
    __esModule: true,
    default: (value: number) => value,
}));
jest.mock("@/components/base/listItem", () => {
    const ReactModule = require("react");
    const ListItem = ({ children, onPress }: {
        children: React.ReactNode;
        onPress: () => void;
    }) => ReactModule.createElement("ListItem", { onPress }, children);
    ListItem.Content = ({ title }: { title: React.ReactNode }) =>
        ReactModule.createElement("ListItemContent", null, title);

    return {
        __esModule: true,
        default: ListItem,
    };
});

describe("SimpleSelect", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("dismisses the panel before running the selected action", () => {
        const onPress = jest.fn();
        let renderer: TestRenderer.ReactTestRenderer;

        act(() => {
            renderer = TestRenderer.create(
                <SimpleSelect
                    candidates={[{
                        title: "Local",
                        value: "local",
                        invokeAfterDismiss: true,
                    }]}
                    onPress={onPress}
                />,
            );
        });

        const item = renderer!.root.findByType("ListItem" as any);
        act(() => {
            item.props.onPress();
            item.props.onPress();
        });

        expect(hidePanel).toHaveBeenCalledTimes(1);
        expect(onPress).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(350);
        });

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(onPress).toHaveBeenCalledWith({
            title: "Local",
            value: "local",
            invokeAfterDismiss: true,
        });

        act(() => {
            renderer!.unmount();
        });
    });

    it("keeps direct panel switching immediate by default", () => {
        const onPress = jest.fn();
        let renderer: TestRenderer.ReactTestRenderer;

        act(() => {
            renderer = TestRenderer.create(
                <SimpleSelect
                    candidates={[{ title: "Network", value: "network" }]}
                    onPress={onPress}
                />,
            );
        });

        const item = renderer!.root.findByType("ListItem" as any);
        act(() => {
            item.props.onPress();
        });

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(hidePanel).toHaveBeenCalledTimes(1);
        expect(onPress.mock.invocationCallOrder[0]).toBeLessThan(
            (hidePanel as jest.Mock).mock.invocationCallOrder[0],
        );

        act(() => {
            renderer!.unmount();
        });
    });
});
