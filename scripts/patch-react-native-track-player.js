const fs = require("fs");
const path = require("path");

const servicePath = path.join(
    __dirname,
    "..",
    "node_modules",
    "react-native-track-player",
    "android",
    "src",
    "main",
    "java",
    "com",
    "doublesymmetry",
    "trackplayer",
    "service",
    "MusicService.kt",
);

const modulePath = path.join(
    __dirname,
    "..",
    "node_modules",
    "react-native-track-player",
    "android",
    "src",
    "main",
    "java",
    "com",
    "doublesymmetry",
    "trackplayer",
    "module",
    "MusicModule.kt",
);

function patchOnBind() {
    const candidates = [
        {
            oldSnippet: "override fun onBind(intent: Intent?): IBinder {",
            newSnippet: "override fun onBind(intent: Intent): IBinder? {",
        },
        {
            // RNTP 4.1.2+
            oldSnippet: "override fun onBind(intent: Intent): IBinder {",
            newSnippet: "override fun onBind(intent: Intent): IBinder? {",
        },
    ];

    if (!fs.existsSync(servicePath)) {
        console.log("[patch-track-player] MusicService.kt not found, skipping onBind");
        return;
    }

    const source = fs.readFileSync(servicePath, "utf8");
    if (source.includes("override fun onBind(intent: Intent): IBinder? {")) {
        console.log("[patch-track-player] onBind already patched");
        return;
    }

    const matched = candidates.find(item => source.includes(item.oldSnippet));
    if (!matched) {
        console.warn("[patch-track-player] expected onBind signature not found");
        return;
    }

    fs.writeFileSync(servicePath, source.replace(matched.oldSnippet, matched.newSnippet));
    console.log("[patch-track-player] patched MusicService.onBind signature");
}

/**
 * New Architecture / bridgeless: ReactApplication.reactNativeHost throws.
 * MusicService.emit() used reactNativeHost.reactInstanceManager.currentReactContext,
 * which crashes (or silently drops events). HeadlessJsTaskService already exposes
 * reactContext that branches correctly for bridgeless vs bridge.
 *
 * See: doublesymmetry/react-native-track-player#2593
 */
function patchReactContextEmit() {
    if (!fs.existsSync(servicePath)) {
        console.log("[patch-track-player] MusicService.kt not found, skipping emit patch");
        return;
    }

    let source = fs.readFileSync(servicePath, "utf8");
    const marker = "musicfree-react-context-emit";
    if (source.includes(marker)) {
        console.log("[patch-track-player] MusicService emit already uses reactContext");
        return;
    }

    if (!source.includes("reactNativeHost.reactInstanceManager.currentReactContext")) {
        console.log(
            "[patch-track-player] MusicService emit does not use reactNativeHost (already fixed upstream?)",
        );
        return;
    }

    const countBefore = (
        source.match(/reactNativeHost\.reactInstanceManager\.currentReactContext/g) || []
    ).length;
    source = source.replace(
        /reactNativeHost\.reactInstanceManager\.currentReactContext/g,
        "reactContext",
    );
    // Stamp marker above first emit method
    source = source.replace(
        /(@MainThread\r?\n\s*private fun emit\(event: String, data: Bundle\? = null\))/,
        `// ${marker}: New Arch / bridgeless-safe event emit\n    $1`,
    );

    fs.writeFileSync(servicePath, source);
    console.log(
        `[patch-track-player] patched MusicService emit/emitList to use reactContext (${countBefore} sites)`,
    );
}

function patchBundleNullability() {
    if (!fs.existsSync(modulePath)) {
        console.log("[patch-track-player] MusicModule.kt not found, skipping Bundle patch");
        return;
    }

    let source = fs.readFileSync(modulePath, "utf8");
    const marker = "/* musicfree-bundle-null-safe */";
    if (source.includes(marker)) {
        console.log("[patch-track-player] Bundle nullability already patched");
        return;
    }

    const replacements = [
        [
            "callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))",
            `${marker}\n            callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem!!))`,
        ],
        [
            "else Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            )",
            `else Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem!!\n            )`,
        ],
    ];

    let changed = false;
    for (const [from, to] of replacements) {
        if (source.includes(from)) {
            source = source.replace(from, to);
            changed = true;
        }
    }

    if (!changed) {
        console.warn("[patch-track-player] expected Bundle fromBundle call sites not found");
        return;
    }

    fs.writeFileSync(modulePath, source);
    console.log("[patch-track-player] patched MusicModule Bundle nullability for RN 0.86");
}

/**
 * RN New Arch / TurboModule interop requires async @ReactMethod methods to return void.
 * Kotlin expression-body `fun foo() = scope.launch { ... }` infers return type Job (non-void),
 * which crashes at runtime with:
 *   TurboModule system assumes returnType == void iff the method is synchronous
 *
 * Rewrite to block body with explicit Unit so the method returns void in bytecode:
 *   fun foo(...): Unit { scope.launch { ... } }
 *
 * See: doublesymmetry/react-native-track-player#2489, #2603
 */
function patchTurboModuleVoidReturn() {
    if (!fs.existsSync(modulePath)) {
        console.log("[patch-track-player] MusicModule.kt not found, skipping TurboModule void patch");
        return;
    }

    let source = fs.readFileSync(modulePath, "utf8");
    const marker = "/* musicfree-turbomodule-void-return */";
    const unitMarker = "/* musicfree-turbomodule-unit */";
    let changed = false;

    // Phase 1: convert expression-body `= scope.launch` to block body (idempotent via marker)
    if (!source.includes(marker)) {
        // Match: fun name(...) = scope.launch {
        //    or: fun name(...) =\n        scope.launch {
        const re =
            /(\n[ \t]*)(fun \w+\([^)]*\)\s*)=\s*(?:\r?\n[ \t]*)?scope\.launch\s*\{/g;

        let result = "";
        let lastIndex = 0;
        let match;
        let count = 0;

        while ((match = re.exec(source)) !== null) {
            const indent = match[1]; // includes leading newline + spaces
            const funSig = match[2]; // "fun name(...) "
            const openBraceIndex = match.index + match[0].length - 1; // position of '{'
            const bodyStart = openBraceIndex + 1;

            // Find matching closing brace of the launch lambda
            let depth = 1;
            let i = bodyStart;
            while (i < source.length && depth > 0) {
                const ch = source[i];
                // Skip string/char literals so braces inside them are ignored
                if (ch === '"' || ch === "'") {
                    const quote = ch;
                    i++;
                    while (i < source.length) {
                        if (source[i] === "\\") {
                            i += 2;
                            continue;
                        }
                        if (source[i] === quote) {
                            i++;
                            break;
                        }
                        i++;
                    }
                    continue;
                }
                if (ch === "{") depth++;
                else if (ch === "}") depth--;
                i++;
            }

            // Rebuild: fun name(...): Unit { scope.launch { ... } }
            result += source.slice(lastIndex, match.index);
            result += indent + funSig.replace(/\s*$/, "") + ": Unit {";
            result += indent + "    scope.launch {";
            result += source.slice(bodyStart, i); // body + closing '}' of launch
            result += indent + "}"; // close the method
            lastIndex = i;
            count++;
        }

        result += source.slice(lastIndex);

        if (count === 0) {
            console.warn(
                "[patch-track-player] no `= scope.launch` ReactMethods found for TurboModule void patch",
            );
        } else {
            result = result.replace(/^(package[^\n]*\n)/, `$1\n${marker}\n`);
            if (!result.includes(unitMarker)) {
                result = result.replace(marker, `${marker}\n${unitMarker}`);
            }
            source = result;
            changed = true;
            console.log(
                `[patch-track-player] patched ${count} MusicModule methods for TurboModule void return (RN New Arch)`,
            );
        }
    } else {
        console.log("[patch-track-player] TurboModule void return already patched");
    }

    // Phase 2: ensure explicit `: Unit` on already-converted block-body methods.
    // Block-body without `: Unit` should still compile to void, but explicit Unit
    // prevents any future inference footguns and is easy to verify in bytecode.
    if (!source.includes(unitMarker)) {
        let unitCount = 0;
        source = source.replace(
            /(\n[ \t]*fun \w+\([^)]*\))(?!\s*:\s*Unit)\s*\{\s*(\r?\n[ \t]*scope\.launch\s*\{)/g,
            (full, sig, rest) => {
                unitCount++;
                return `${sig}: Unit {${rest}`;
            },
        );
        if (unitCount > 0) {
            source = source.replace(
                /^(package[^\n]*\n(?:\n\/\* musicfree[^\n]*\*\/\n)*)/m,
                match =>
                    match.includes(unitMarker)
                        ? match
                        : match.replace(/\n$/, `\n${unitMarker}\n`),
            );
            if (!source.includes(unitMarker)) {
                source = source.replace(
                    /^(package[^\n]*\n)/,
                    `$1\n${unitMarker}\n`,
                );
            }
            changed = true;
            console.log(
                `[patch-track-player] added explicit : Unit to ${unitCount} MusicModule methods`,
            );
        } else {
            // Mark done even if nothing to change (methods may already have : Unit from phase 1)
            if (!source.includes(unitMarker)) {
                source = source.replace(
                    /^(package[^\n]*\n)/,
                    `$1\n${unitMarker}\n`,
                );
                changed = true;
            }
            console.log("[patch-track-player] explicit : Unit already present or N/A");
        }
    } else {
        console.log("[patch-track-player] explicit : Unit already applied");
    }

    if (changed) {
        fs.writeFileSync(modulePath, source);
    }
}

/**
 * Stale kotlin-classes under node_modules keep returning Job at runtime even after
 * source is patched. Delete the library build dir so the next Gradle run recompiles.
 */
function cleanTrackPlayerAndroidBuild() {
    const buildDir = path.join(
        __dirname,
        "..",
        "node_modules",
        "react-native-track-player",
        "android",
        "build",
    );
    if (!fs.existsSync(buildDir)) {
        return;
    }
    try {
        fs.rmSync(buildDir, { recursive: true, force: true });
        console.log("[patch-track-player] cleaned react-native-track-player/android/build");
    } catch (err) {
        console.warn(
            "[patch-track-player] failed to clean android/build (will rely on Gradle):",
            err && err.message ? err.message : err,
        );
    }
}

/**
 * 紧凑媒体通知（QQ音乐式矮高度）：
 * - 往库模块写入自定义 RemoteViews 布局 + 图标资源
 * - 在 MusicService 里注入同 ID(1) 的紧凑通知，在库每次刷新自己的
 *   高通知后 200ms 用矮通知顶掉；按钮走 onStartCommand 的 action 分发
 */
function writeCompactNotificationRes() {
    const resDir = path.join(
        __dirname,
        "..",
        "node_modules",
        "react-native-track-player",
        "android",
        "src",
        "main",
        "res",
    );
    const layoutDir = path.join(resDir, "layout");
    const drawableDir = path.join(resDir, "drawable");
    for (const dir of [layoutDir, drawableDir]) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const layout = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="64dp"
    android:orientation="horizontal"
    android:gravity="center_vertical"
    android:paddingStart="12dp"
    android:paddingEnd="4dp">
    <ImageView
        android:id="@+id/rntp_cover"
        android:layout_width="46dp"
        android:layout_height="46dp"
        android:scaleType="centerCrop" />
    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical"
        android:paddingStart="10dp"
        android:paddingEnd="4dp">
        <TextView
            android:id="@+id/rntp_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#FFFFFFFF"
            android:textSize="14sp"
            android:singleLine="true"
            android:ellipsize="end" />
        <TextView
            android:id="@+id/rntp_artist"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#B3FFFFFF"
            android:textSize="12sp"
            android:singleLine="true"
            android:ellipsize="end" />
    </LinearLayout>
    <ImageView
        android:id="@+id/rntp_favorite"
        android:layout_width="38dp"
        android:layout_height="38dp"
        android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_heart" />
    <ImageView
        android:id="@+id/rntp_previous"
        android:layout_width="38dp"
        android:layout_height="38dp"
        android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_previous" />
    <ImageView
        android:id="@+id/rntp_play_pause"
        android:layout_width="42dp"
        android:layout_height="42dp"
        android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_play" />
    <ImageView
        android:id="@+id/rntp_next"
        android:layout_width="38dp"
        android:layout_height="38dp"
        android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_next" />
</LinearLayout>
`;

    const icon = (name, pathData) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="#FFFFFFFF">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="${pathData}" />
</vector>
`;

    const icons = {
        "rntp_ic_heart": "M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z",
        "rntp_ic_previous": "M6,6h2v12L6,18zM9.5,12l8.5,6L18,6z",
        "rntp_ic_next": "M6,18l8.5,-6L6,6v12zM16,6v12h2L18,6h-2z",
        "rntp_ic_play": "M8,5v14l11,-7z",
        "rntp_ic_pause": "M6,19h4L10,5L6,5v14zM14,5v14h4L18,5h-4z",
    };

    fs.writeFileSync(path.join(layoutDir, "rntp_compact_notification.xml"), layout);
    for (const [name, pathData] of Object.entries(icons)) {
        fs.writeFileSync(path.join(drawableDir, `${name}.xml`), icon(name, pathData));
    }
    console.log("[patch-track-player] wrote compact notification res files");
}

function patchCompactNotification() {
    if (!fs.existsSync(servicePath)) {
        console.log("[patch-track-player] MusicService.kt not found, skipping compact notification");
        return;
    }
    let source = fs.readFileSync(servicePath, "utf8");
    if (source.includes("mf.compact.toggle")) {
        console.log("[patch-track-player] compact notification already patched");
        return;
    }

    const replacements = [
        {
            // imports
            oldSnippet: "import android.content.Intent",
            newSnippet: `import android.content.Intent
import android.widget.RemoteViews
import androidx.core.app.NotificationManagerCompat`,
        },
        {
            // 新成员 + 工具方法，挂在 compactCapabilities 字段后
            oldSnippet: "    private var compactCapabilities: List<Capability> = emptyList()",
            newSnippet: `    private var compactCapabilities: List<Capability> = emptyList()

    // ==== 紧凑媒体通知（自定义矮布局，同 ID 顶掉库自己的高通知） ====
    private val compactHandler = android.os.Handler(android.os.Looper.getMainLooper())
    private var compactSmallIconRes = 0
    private var compactContentIntent: PendingIntent? = null

    private fun compactResId(name: String, defType: String): Int =
        resources.getIdentifier(name, defType, packageName)

    private fun handleCompactNotificationAction(intent: Intent?): Boolean {
        when (intent?.action) {
            "mf.compact.prev" -> emit(MusicEvents.BUTTON_SKIP_PREVIOUS)
            "mf.compact.next" -> emit(MusicEvents.BUTTON_SKIP_NEXT)
            "mf.compact.toggle" -> {
                if (this::player.isInitialized && player.playWhenReady) {
                    emit(MusicEvents.BUTTON_PAUSE)
                } else {
                    emit(MusicEvents.BUTTON_PLAY)
                }
            }
            "mf.compact.favorite" -> emit("remote-favorite")
            else -> return false
        }
        scheduleCompactRepost()
        return true
    }

    private fun scheduleCompactRepost() {
        compactHandler.removeCallbacksAndMessages(null)
        compactHandler.postDelayed({ postCompactNotification() }, 200)
    }

    private fun postCompactNotification() {
        try {
            if (!this::player.isInitialized) return
            val item = player.currentItem ?: return
            val layoutId = compactResId("rntp_compact_notification", "layout")
            if (layoutId == 0) return
            val views = RemoteViews(packageName, layoutId)
            views.setTextViewText(compactResId("rntp_title", "id"), item.title ?: "MusicFree")
            views.setTextViewText(compactResId("rntp_artist", "id"), item.artist ?: "")
            views.setImageViewResource(compactResId("rntp_cover", "id"), applicationInfo.icon)
            views.setImageViewResource(
                compactResId("rntp_play_pause", "id"),
                compactResId(if (player.isPlaying) "rntp_ic_pause" else "rntp_ic_play", "drawable"),
            )
            fun actionPI(action: String, requestCode: Int): PendingIntent =
                PendingIntent.getService(
                    this,
                    requestCode,
                    Intent(this, MusicService::class.java).setAction(action),
                    getPendingIntentFlags(),
                )
            views.setOnClickPendingIntent(compactResId("rntp_favorite", "id"), actionPI("mf.compact.favorite", 1))
            views.setOnClickPendingIntent(compactResId("rntp_previous", "id"), actionPI("mf.compact.prev", 2))
            views.setOnClickPendingIntent(compactResId("rntp_play_pause", "id"), actionPI("mf.compact.toggle", 3))
            views.setOnClickPendingIntent(compactResId("rntp_next", "id"), actionPI("mf.compact.next", 4))

            val builder = NotificationCompat.Builder(this, "kotlin_audio_player")
                .setSmallIcon(if (compactSmallIconRes != 0) compactSmallIconRes else ExoPlayerR.drawable.exo_notification_small_icon)
                .setContentIntent(compactContentIntent)
                .setCustomContentView(views)
                .setOnlyAlertOnce(true)
                .setOngoing(player.isPlaying)
                .setContentTitle(item.title)
                .setContentText(item.artist)
                .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            // 挂上 MediaSession，锁屏/耳机控制不丢；kotlinaudio 把 session 藏在私有字段里，用反射取
            try {
                var klass: Class<*>? = player.javaClass
                while (klass != null) {
                    try {
                        val field = klass.getDeclaredField("mediaSession")
                        field.isAccessible = true
                        (field.get(player) as? android.support.v4.media.session.MediaSessionCompat)?.let { session ->
                            builder.setStyle(
                                androidx.media.app.NotificationCompat.MediaStyle()
                                    .setMediaSession(session.sessionToken)
                            )
                        }
                        break
                    } catch (_: NoSuchFieldException) {
                        klass = klass.superclass
                    }
                }
            } catch (_: Exception) {
            }
            NotificationManagerCompat.from(this).notify(1, builder.build())
        } catch (_: Exception) {
        }
    }`,
        },
        {
            // onStartCommand：紧凑通知按钮的 action 直接处理，不重启 headless task
            oldSnippet: `    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startTask(getTaskConfig(intent))`,
            newSnippet: `    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (handleCompactNotificationAction(intent)) {
            return START_STICKY
        }
        startTask(getTaskConfig(intent))`,
        },
        {
            // 记下 JS 传来的小图标和点击意图
            oldSnippet: "        player.notificationManager.createNotification(notificationConfig)",
            newSnippet: `        compactSmallIconRes = smallIcon ?: 0
        compactContentIntent = pendingIntent
        player.notificationManager.createNotification(notificationConfig)`,
        },
        {
            // 库每次刷新通知后，用紧凑通知顶掉（同 ID=1）
            oldSnippet: `                        notificationId = it.notificationId;
                        notification = it.notification;`,
            newSnippet: `                        notificationId = it.notificationId;
                        notification = it.notification;
                        scheduleCompactRepost();`,
        },
        {
            // 播放/暂停状态变化时刷新播放按钮图标
            oldSnippet: "                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))",
            newSnippet: `                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))
                scheduleCompactRepost()`,
        },
        {
            // 换歌时刷新标题/歌手
            oldSnippet: "                        emit(MusicEvents.PLAYBACK_METADATA, this)",
            newSnippet: `                        emit(MusicEvents.PLAYBACK_METADATA, this)
                        this@MusicService.scheduleCompactRepost()`,
        },
    ];

    let changed = false;
    for (const { oldSnippet, newSnippet } of replacements) {
        if (!source.includes(oldSnippet)) {
            console.warn("[patch-track-player] compact notification snippet not found:", JSON.stringify(oldSnippet.slice(0, 60)));
            continue;
        }
        source = source.replace(oldSnippet, newSnippet);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(servicePath, source);
        console.log("[patch-track-player] patched compact notification into MusicService");
    }
}

patchOnBind();
patchReactContextEmit();
patchBundleNullability();
patchTurboModuleVoidReturn();
writeCompactNotificationRes();
patchCompactNotification();
cleanTrackPlayerAndroidBuild();
