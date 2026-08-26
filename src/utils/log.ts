import { fileAsyncTransport, logger } from "react-native-logs";
import RNFS, { readDir, readFile } from "react-native-fs";
import pathConst from "@/constants/pathConst";
import Config from "../core/appConfig.ts";
import { addLog, traceLog } from "@/lib/react-native-vdebug/src/log";

// 初始化日志堆栈，防止 addLog 调用时出现 null 错误
traceLog();

const config = {
    transport: fileAsyncTransport,
    transportOptions: {
        FS: RNFS,
        filePath: pathConst.logPath,
        fileName: "error-log-{date-today}.log",
    },
    dateFormat: "local",
};

const traceConfig = {
    transport: fileAsyncTransport,
    transportOptions: {
        FS: RNFS,
        filePath: pathConst.logPath,
        fileName: "trace-log.log",
    },
    dateFormat: "local",
};

const log = logger.createLogger(config);
const traceLogger = logger.createLogger(traceConfig);
const startupBreadcrumbFile = `${pathConst.logPath}startup-breadcrumb.log`;

let startupSessionId = `${Date.now()}`;

function safeSerialize(value: any) {
    if (value === undefined) {
        return undefined;
    }

    try {
        return JSON.stringify(value);
    } catch {
        return JSON.stringify(String(value));
    }
}

// 启动面包屑只用于排查开屏卡死/崩溃，但启动关键路径上有十几处调用，
// 每次 mkdir + appendFile 都是两轮跨桥文件 IO，串起来能把开屏拖慢几百毫秒。
// 所以调用时只往内存队列里塞，真正落盘放到空闲时批量做一次。
const breadcrumbFlushDelay = 400;
let breadcrumbQueue: string[] = [];
let breadcrumbChain: Promise<void> = Promise.resolve();
let breadcrumbTimer: ReturnType<typeof setTimeout> | null = null;
let logDirEnsured = false;

/**
 * 把排队中的面包屑写入磁盘。返回的 promise 在这批写完后 resolve。
 * 崩溃路径（全局错误、bootstrap 致命错误）要显式调一次，
 * 否则延迟批量写会把最后几条、也就是最关键的几条丢掉。
 */
export function flushStartupBreadcrumbs(): Promise<void> {
    if (breadcrumbTimer != null) {
        clearTimeout(breadcrumbTimer);
        breadcrumbTimer = null;
    }
    if (!breadcrumbQueue.length) {
        return breadcrumbChain;
    }
    const batch = breadcrumbQueue.join("");
    breadcrumbQueue = [];
    // 串成链，保证多批之间的写入顺序
    breadcrumbChain = breadcrumbChain.then(async () => {
        try {
            if (!logDirEnsured) {
                await RNFS.mkdir(pathConst.logPath);
                logDirEnsured = true;
            }
            await RNFS.appendFile(startupBreadcrumbFile, batch, "utf8");
        } catch {
            // 落盘失败就丢掉，排查用的日志不值得重试
        }
    });
    return breadcrumbChain;
}

export function appendStartupBreadcrumb(step: string, details?: any) {
    const payload = {
        ts: new Date().toISOString(),
        sessionId: startupSessionId,
        step,
        details,
    };
    breadcrumbQueue.push(`${safeSerialize(payload)}\n`);
    if (breadcrumbTimer == null) {
        breadcrumbTimer = setTimeout(() => {
            breadcrumbTimer = null;
            void flushStartupBreadcrumbs();
        }, breadcrumbFlushDelay);
    }
    // 返回 promise 只为兼容既有的 await 调用点，这里不再等待任何 IO
    return Promise.resolve();
}

export function markStartupSession(label = "app-launch") {
    startupSessionId = `${Date.now()}`;
    return appendStartupBreadcrumb(label, {
        sessionId: startupSessionId,
    });
}

export async function getStartupBreadcrumbContent() {
    try {
        // 先把队列里的落盘，否则调试面板看不到最新几条
        await flushStartupBreadcrumbs();
        if (!(await RNFS.exists(startupBreadcrumbFile))) {
            return "";
        }
        return await readFile(startupBreadcrumbFile, "utf8");
    } catch {
        return "";
    }
}

export function trace(
    desc: string,
    message?: any,
    level: "info" | "error" = "info",
) {
    if (__DEV__) {
        console.log(desc, message);
    }
    // 特殊情况记录操作路径
    if (Config.getConfig("debug.traceLog")) {
        traceLogger[level]({
            desc,
            message,
        });
    }
}

export async function clearLog() {
    const files = await RNFS.readDir(pathConst.logPath);
    await Promise.all(
        files.map(async file => {
            if (file.isFile()) {
                try {
                    await RNFS.unlink(file.path);
                } catch {}
            }
        }),
    );
}

export async function getErrorLogContent() {
    try {
        const files = await readDir(pathConst.logPath);
        devLog("info", "📁[日志工具] 读取日志文件列表", { filesCount: files.length });
        const today = new Date();
        // 两天的错误日志
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const todayLog = files.find(
            _ =>
                _.isFile() &&
                _.path.endsWith(
                    `error-log-${today.getDate()}-${
                        today.getMonth() + 1
                    }-${today.getFullYear()}.log`,
                ),
        );
        const yesterdayLog = files.find(
            _ =>
                _.isFile() &&
                _.path.endsWith(
                    `error-log-${yesterday.getDate()}-${
                        yesterday.getMonth() + 1
                    }-${yesterday.getFullYear()}.log`,
                ),
        );
        let logContent = "";
        if (todayLog) {
            logContent += await readFile(todayLog.path, "utf8");
        }
        if (yesterdayLog) {
            logContent += await readFile(yesterdayLog.path, "utf8");
        }
        return logContent;
    } catch {
        return "";
    }
}

export function errorLog(desc: string, message: any) {
    if (Config.getConfig("debug.errorLog")) {
        log.error({
            desc,
            message,
        });
        trace(desc, message, "error");
    }
}

export function devLog(
    method: "log" | "error" | "warn" | "info",
    ...args: any[]
) {
    if (Config.getConfig("debug.devLog")) {
        addLog(method, args);
    }
}

export { log };
