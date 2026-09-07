import { NativeModules, Platform } from "react-native";

interface IExternalMediaModule {
    isNotificationListenerEnabled: () => Promise<boolean>;
    openNotificationListenerSettings: () => void;
    setEnabled: (enabled: boolean) => void;
    getEnabled: () => Promise<boolean>;
    reconcile: () => void;
}

const nativeModule = NativeModules.ExternalMedia as
    | IExternalMediaModule
    | undefined;

const ExternalMedia: IExternalMediaModule = {
    async isNotificationListenerEnabled() {
        if (Platform.OS !== "android" || !nativeModule) return false;
        return nativeModule.isNotificationListenerEnabled();
    },
    openNotificationListenerSettings() {
        if (Platform.OS === "android") {
            nativeModule?.openNotificationListenerSettings();
        }
    },
    setEnabled(enabled) {
        if (Platform.OS === "android") nativeModule?.setEnabled(enabled);
    },
    async getEnabled() {
        if (Platform.OS !== "android" || !nativeModule) return false;
        return nativeModule.getEnabled();
    },
    reconcile() {
        if (Platform.OS === "android") nativeModule?.reconcile();
    },
};

export default ExternalMedia;
