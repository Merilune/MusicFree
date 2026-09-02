import { NativeModule, NativeModules } from "react-native";

interface INativeUtils extends NativeModule {
    exitApp: () => void;
    saveImageToAppStorage: (sourcePath: string, displayName: string) => Promise<string>;
    scanSafAudioFiles: (directoryUri: string) => Promise<Array<{
        uri: string;
        name: string;
        documentId?: string;
    }>>;
    safUriExists: (uri: string) => Promise<boolean>;
    copyFileToSafDirectory: (
        sourcePath: string,
        directoryUri: string,
        displayName: string,
        mimeType: string,
    ) => Promise<string>;
    deleteSafUri: (uri: string) => Promise<boolean>;
    getWindowDimensions: () => { width: number, height: number }; // Fix bug: https://github.com/facebook/react-native/issues/47080
    desDecrypt: (data: number[], key: string) => Promise<number[]>;
    desEncrypt: (data: number[], key: string) => Promise<number[]>;
    desEncryptZeroBlock: (key: string) => Promise<number[]>;
}

const NativeUtils = NativeModules.NativeUtils;

export default NativeUtils as INativeUtils;
