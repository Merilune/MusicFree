import React from "react";
import { InteractionManager } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import useEnterTransitionEnd from "./useEnterTransitionEnd";

let mockTransitionEndListener:
    | ((event?: { data?: { closing?: boolean } }) => void)
    | null = null;
const mockUnsubscribe = jest.fn();
let mockTransitionListenerActive = false;

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({
        addListener: (
            _event: string,
            listener: (event?: { data?: { closing?: boolean } }) => void,
        ) => {
            mockTransitionEndListener = listener;
            mockTransitionListenerActive = true;
            return () => {
                mockTransitionListenerActive = false;
                mockUnsubscribe();
            };
        },
    }),
}));

describe("useEnterTransitionEnd", () => {
    let pendingTasks: (() => void)[];
    let cancelTask: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockTransitionEndListener = null;
        mockTransitionListenerActive = false;
        pendingTasks = [];
        cancelTask = jest.fn();
        jest.spyOn(InteractionManager, "runAfterInteractions").mockImplementation(
            callback => {
                pendingTasks.push(callback);
                return { cancel: cancelTask } as any;
            },
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    function renderProbe() {
        let ready = false;

        function Probe() {
            ready = useEnterTransitionEnd();
            return null;
        }

        let renderer!: TestRenderer.ReactTestRenderer;
        act(() => {
            renderer = TestRenderer.create(<Probe />);
        });

        return {
            isReady: () => ready,
            fireTransitionEnd: (closing = false) =>
                act(() => {
                    if (mockTransitionListenerActive) {
                        mockTransitionEndListener?.({ data: { closing } });
                    }
                }),
            flushInteractions: () =>
                act(() => {
                    const tasks = pendingTasks;
                    pendingTasks = [];
                    tasks.forEach(task => task());
                }),
            runFallback: () =>
                act(() => {
                    jest.advanceTimersByTime(600);
                }),
            unmount: () =>
                act(() => {
                    renderer.unmount();
                }),
        };
    }

    it("waits for transitionEnd before scheduling heavy content", () => {
        const probe = renderProbe();

        probe.flushInteractions();
        expect(probe.isReady()).toBe(false);
        expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();

        probe.fireTransitionEnd();
        expect(probe.isReady()).toBe(false);
        expect(InteractionManager.runAfterInteractions).toHaveBeenCalledTimes(1);

        probe.flushInteractions();
        expect(probe.isReady()).toBe(true);
    });

    it("ignores closing transitionEnd events", () => {
        const probe = renderProbe();

        probe.fireTransitionEnd(true);
        probe.flushInteractions();

        expect(probe.isReady()).toBe(false);
        expect(InteractionManager.runAfterInteractions).not.toHaveBeenCalled();
    });

    it("uses the fallback when transitionEnd is missing", () => {
        const probe = renderProbe();

        probe.runFallback();

        expect(probe.isReady()).toBe(true);
    });

    it("can become ready after remounting", () => {
        const firstProbe = renderProbe();
        firstProbe.unmount();

        const secondProbe = renderProbe();
        secondProbe.fireTransitionEnd();
        secondProbe.flushInteractions();

        expect(secondProbe.isReady()).toBe(true);
    });

    it("cleans up navigation and pending interactions on unmount", () => {
        const probe = renderProbe();
        probe.fireTransitionEnd();

        probe.unmount();

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
        expect(cancelTask).toHaveBeenCalledTimes(1);
    });
});
