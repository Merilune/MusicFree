const fs = require("fs");
const path = require("path");

const root = process.env.RNTP_PATCH_ROOT
    ? path.resolve(process.env.RNTP_PATCH_ROOT)
    : path.join(__dirname, "..");
const servicePath = path.join(
    root,
    "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt",
);
const resPath = path.join(
    root,
    "node_modules/react-native-track-player/android/src/main/res",
);
const MARKER = "musicfree-compact-notification-v3";

function replaceExactly(source, oldSnippet, newSnippet, label) {
    const count = source.split(oldSnippet).length - 1;
    if (count !== 1) {
        throw new Error(`[compact-v2] ${label}: expected one anchor, found ${count}`);
    }
    return source.replace(oldSnippet, newSnippet);
}

function writeResources() {
    const layoutDir = path.join(resPath, "layout");
    const drawableDir = path.join(resPath, "drawable");
    fs.mkdirSync(layoutDir, { recursive: true });
    fs.mkdirSync(drawableDir, { recursive: true });

    const layout = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent" android:layout_height="64dp"
    android:orientation="horizontal" android:gravity="center_vertical"
    android:paddingStart="12dp" android:paddingEnd="4dp">
    <ImageView android:id="@+id/rntp_cover" android:layout_width="46dp"
        android:layout_height="46dp" android:scaleType="centerCrop"
        android:src="@drawable/rntp_ic_album" />
    <LinearLayout android:layout_width="0dp" android:layout_height="wrap_content"
        android:layout_weight="1" android:orientation="vertical"
        android:paddingStart="10dp" android:paddingEnd="4dp">
        <TextView android:id="@+id/rntp_title" android:layout_width="match_parent"
            android:layout_height="wrap_content" android:textColor="#FFFFFFFF"
            android:textSize="14sp" android:singleLine="true" android:ellipsize="end" />
        <TextView android:id="@+id/rntp_artist" android:layout_width="match_parent"
            android:layout_height="wrap_content" android:textColor="#B3FFFFFF"
            android:textSize="12sp" android:singleLine="true" android:ellipsize="end" />
    </LinearLayout>
    <ImageView android:id="@+id/rntp_favorite" android:layout_width="38dp"
        android:layout_height="38dp" android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_heart" />
    <ImageView android:id="@+id/rntp_previous" android:layout_width="38dp"
        android:layout_height="38dp" android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_previous" />
    <ImageView android:id="@+id/rntp_play_pause" android:layout_width="42dp"
        android:layout_height="42dp" android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_play" />
    <ImageView android:id="@+id/rntp_next" android:layout_width="38dp"
        android:layout_height="38dp" android:scaleType="centerInside"
        android:src="@drawable/rntp_ic_next" />
</LinearLayout>
`;
    const vector = (pathData, color = "#FFFFFFFF") => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp"
    android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="${color}" android:pathData="${pathData}" />
</vector>
`;
    const heart = "M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z";
    const icons = {
        rntp_ic_heart: vector(heart),
        rntp_ic_heart_filled: vector(heart, "#FFFF5A6E"),
        rntp_ic_previous: vector("M6,6h2v12L6,18zM9.5,12l8.5,6L18,6z"),
        rntp_ic_next: vector("M6,18l8.5,-6L6,6v12zM16,6v12h2L18,6h-2z"),
        rntp_ic_play: vector("M8,5v14l11,-7z"),
        rntp_ic_pause: vector("M6,19h4L10,5L6,5v14zM14,5v14h4L18,5h-4z"),
        rntp_ic_album: vector("M12,3a9,9 0,1 0,0 18a9,9 0,0 0,0 -18zM12,9.5a2.5,2.5 0,1 1,0 5a2.5,2.5 0,0 1,0 -5z", "#FF777777"),
    };
    fs.writeFileSync(path.join(layoutDir, "rntp_compact_notification.xml"), layout);
    for (const [name, content] of Object.entries(icons)) {
        fs.writeFileSync(path.join(drawableDir, `${name}.xml`), content);
    }
}

const kotlinImplementation = `    // ${MARKER}
    private var compactSmallIconRes = 0
    private var compactContentIntent: PendingIntent? = null
    private var compactFavorite = false
    private var compactNotificationId: Int? = null
    private var compactNotificationVisible = false
    private var compactNotificationBlocked = false
    private var compactGeneration = 0L
    private var compactTrackKey: String? = null
    private var compactArtworkJob: Job? = null
    private var externalMediaSuppressed = false
    private var externalMediaReceiver: android.content.BroadcastReceiver? = null
    private val compactArtworkCache = android.util.LruCache<String, android.graphics.Bitmap>(16)

    private fun compactResId(name: String, type: String): Int =
        resources.getIdentifier(name, type, packageName)

    private fun compactAction(action: String, requestCode: Int): PendingIntent =
        PendingIntent.getService(
            this,
            requestCode,
            Intent(this, MusicService::class.java).setAction(action),
            getPendingIntentFlags(),
        )

    private fun compactTrack(): TrackAudioItem? =
        if (this::player.isInitialized) player.currentItem as? TrackAudioItem else null

    private fun compactKey(item: TrackAudioItem): String =
        listOf(item.track.queueId, item.audioUrl, item.artwork).joinToString("|")

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
            "mf.compact.favstate" -> {
                compactFavorite = intent.getBooleanExtra("favorite", false)
                refreshCompactNotification()
            }
            else -> return false
        }
        return true
    }

    private fun compactMediaSession(): android.support.v4.media.session.MediaSessionCompat? {
        return try {
            var klass: Class<*>? = player.javaClass
            while (klass != null) {
                try {
                    val field = klass.getDeclaredField("mediaSession")
                    field.isAccessible = true
                    return field.get(player) as? android.support.v4.media.session.MediaSessionCompat
                } catch (_: NoSuchFieldException) {
                    klass = klass.superclass
                }
            }
            null
        } catch (error: Exception) {
            Timber.w(error, "Unable to access MediaSession")
            null
        }
    }

    private fun externalMediaBroadcast(action: String) {
        sendBroadcast(
            Intent(action).setPackage(packageName)
                .addFlags(Intent.FLAG_RECEIVER_REGISTERED_ONLY),
        )
    }

    private fun registerExternalMediaReceiver() {
        if (externalMediaReceiver != null) return
        externalMediaReceiver = object : android.content.BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    "fun.xwj.musicfree.externalmedia.SUPPRESS" -> suppressForExternalMedia()
                    "fun.xwj.musicfree.externalmedia.RESTORE" -> restoreFromExternalMedia()
                    "fun.xwj.musicfree.compact.FAVSTATE" -> {
                        compactFavorite = intent.getBooleanExtra("favorite", false)
                        refreshCompactNotification()
                    }
                }
            }
        }
        val filter = android.content.IntentFilter().apply {
            addAction("fun.xwj.musicfree.externalmedia.SUPPRESS")
            addAction("fun.xwj.musicfree.externalmedia.RESTORE")
            addAction("fun.xwj.musicfree.compact.FAVSTATE")
        }
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            registerReceiver(externalMediaReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(externalMediaReceiver, filter)
        }
    }

    private fun suppressForExternalMedia() {
        if (!this::player.isInitialized || player.isPlaying) {
            externalMediaBroadcast("fun.xwj.musicfree.externalmedia.SELF_PLAYING")
            restoreFromExternalMedia()
            return
        }
        if (externalMediaSuppressed) return
        externalMediaSuppressed = true
        invalidateCompactNotification(true)
        player.notificationManager.hideNotification()
        compactMediaSession()?.isActive = false
    }

    private fun restoreFromExternalMedia() {
        externalMediaSuppressed = false
        compactNotificationBlocked = false
        compactMediaSession()?.isActive = true
    }

    private fun notifyExternalMediaPlayRequested() {
        restoreFromExternalMedia()
        externalMediaBroadcast("fun.xwj.musicfree.externalmedia.USER_RESTORE")
    }

    private fun updateExternalMediaPlaybackState() {
        if (!this::player.isInitialized) return
        externalMediaBroadcast(
            if (player.isPlaying)
                "fun.xwj.musicfree.externalmedia.SELF_PLAYING"
            else "fun.xwj.musicfree.externalmedia.SELF_NOT_PLAYING",
        )
    }

    private fun buildCompactNotification(
        item: TrackAudioItem,
        artwork: android.graphics.Bitmap?,
    ): Notification {
        val views = android.widget.RemoteViews(
            packageName,
            compactResId("rntp_compact_notification", "layout"),
        )
        views.setTextViewText(compactResId("rntp_title", "id"), item.title ?: "MusicFree")
        views.setTextViewText(compactResId("rntp_artist", "id"), item.artist ?: "")
        if (artwork == null) {
            views.setImageViewResource(
                compactResId("rntp_cover", "id"),
                compactResId("rntp_ic_album", "drawable"),
            )
        } else {
            views.setImageViewBitmap(compactResId("rntp_cover", "id"), artwork)
        }
        views.setImageViewResource(
            compactResId("rntp_play_pause", "id"),
            compactResId(if (player.isPlaying) "rntp_ic_pause" else "rntp_ic_play", "drawable"),
        )
        views.setImageViewResource(
            compactResId("rntp_favorite", "id"),
            compactResId(if (compactFavorite) "rntp_ic_heart_filled" else "rntp_ic_heart", "drawable"),
        )
        views.setOnClickPendingIntent(compactResId("rntp_favorite", "id"), compactAction("mf.compact.favorite", 41))
        views.setOnClickPendingIntent(compactResId("rntp_previous", "id"), compactAction("mf.compact.prev", 42))
        views.setOnClickPendingIntent(compactResId("rntp_play_pause", "id"), compactAction("mf.compact.toggle", 43))
        views.setOnClickPendingIntent(compactResId("rntp_next", "id"), compactAction("mf.compact.next", 44))

        val builder = NotificationCompat.Builder(this, "kotlin_audio_player")
            .setSmallIcon(
                if (compactSmallIconRes != 0) compactSmallIconRes
                else ExoPlayerR.drawable.exo_notification_small_icon,
            )
            .setContentIntent(compactContentIntent)
            .setCustomContentView(views)
            .setOnlyAlertOnce(true)
            .setOngoing(player.isPlaying)
            .setContentTitle(item.title)
            .setContentText(item.artist)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
        compactMediaSession()?.let {
            builder.setStyle(
                androidx.media.app.NotificationCompat.MediaStyle()
                    .setMediaSession(it.sessionToken),
            )
        }
        return builder.build()
    }

    private fun publishCompactNotification(
        notificationId: Int,
        item: TrackAudioItem,
        artwork: android.graphics.Bitmap?,
    ): Notification {
        val compact = buildCompactNotification(item, artwork)
        androidx.core.app.NotificationManagerCompat.from(this).notify(notificationId, compact)
        return compact
    }

    private fun refreshCompactNotification() {
        val id = compactNotificationId ?: return
        if (!compactNotificationVisible) return
        val item = compactTrack() ?: return
        val artwork = item.artwork?.let { compactArtworkCache.get(it) }
        publishCompactNotification(id, item, artwork)
    }

    private fun invalidateCompactNotification(remove: Boolean, block: Boolean = remove) {
        compactGeneration++
        compactNotificationVisible = false
        if (block) compactNotificationBlocked = true
        compactArtworkJob?.cancel()
        compactArtworkJob = null
        compactTrackKey = null
        val id = compactNotificationId
        if (remove && id != null) {
            androidx.core.app.NotificationManagerCompat.from(this).cancel(id)
            compactNotificationId = null
        }
    }

    private fun loadCompactArtwork(
        artworkUri: String,
        notificationId: Int,
        item: TrackAudioItem,
        generation: Long,
        trackKey: String,
    ) {
        compactArtworkCache.get(artworkUri)?.let {
            publishCompactNotification(notificationId, item, it)
            return
        }
        compactArtworkJob?.cancel()
        compactArtworkJob = scope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                decodeCompactArtwork(artworkUri)
            } ?: return@launch
            if (generation != compactGeneration || !compactNotificationVisible ||
                compactNotificationId != notificationId || compactTrackKey != trackKey ||
                compactTrack()?.let { compactKey(it) } != trackKey
            ) return@launch
            compactArtworkCache.put(artworkUri, bitmap)
            publishCompactNotification(notificationId, item, bitmap)
        }
    }

    private fun openCompactArtwork(uriText: String): java.io.InputStream? {
        val uri = android.net.Uri.parse(uriText)
        return when (uri.scheme?.lowercase()) {
            "http", "https" -> {
                val connection = java.net.URL(uriText).openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 8000
                connection.readTimeout = 12000
                connection.instanceFollowRedirects = true
                connection.setRequestProperty("User-Agent", "MusicFree/Android")
                connection.setRequestProperty("Accept", "image/*")
                connection.connect()
                if (connection.responseCode !in 200..299 ||
                    connection.contentLengthLong > 20L * 1024L * 1024L
                ) {
                    connection.disconnect()
                    null
                } else {
                    object : java.io.FilterInputStream(connection.inputStream) {
                        override fun close() {
                            super.close()
                            connection.disconnect()
                        }
                    }
                }
            }
            "content", "android.resource" -> contentResolver.openInputStream(uri)
            "file" -> java.io.FileInputStream(java.io.File(requireNotNull(uri.path)))
            null -> java.io.FileInputStream(java.io.File(uriText))
            else -> null
        }
    }

    private fun decodeCompactArtwork(uriText: String): android.graphics.Bitmap? {
        return try {
            val bytes = openCompactArtwork(uriText)?.use { input ->
                val output = java.io.ByteArrayOutputStream()
                val buffer = ByteArray(8192)
                var total = 0
                while (true) {
                    val read = input.read(buffer)
                    if (read < 0) break
                    total += read
                    if (total > 20 * 1024 * 1024) return null
                    output.write(buffer, 0, read)
                }
                output.toByteArray()
            } ?: return null
            val bounds = android.graphics.BitmapFactory.Options().apply { inJustDecodeBounds = true }
            android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
            val target = (64f * resources.displayMetrics.density).toInt().coerceAtLeast(64)
            var sample = 1
            while (bounds.outWidth / (sample * 2) >= target &&
                bounds.outHeight / (sample * 2) >= target
            ) sample *= 2
            val decoded = android.graphics.BitmapFactory.decodeByteArray(
                bytes,
                0,
                bytes.size,
                android.graphics.BitmapFactory.Options().apply { inSampleSize = sample },
            ) ?: return null
            roundedCompactArtwork(decoded, target)
        } catch (error: Exception) {
            Timber.w(error, "Unable to load compact notification artwork")
            null
        }
    }

    private fun roundedCompactArtwork(
        source: android.graphics.Bitmap,
        size: Int,
    ): android.graphics.Bitmap {
        val result = android.graphics.Bitmap.createBitmap(
            size,
            size,
            android.graphics.Bitmap.Config.ARGB_8888,
        )
        val canvas = android.graphics.Canvas(result)
        val shader = android.graphics.BitmapShader(
            source,
            android.graphics.Shader.TileMode.CLAMP,
            android.graphics.Shader.TileMode.CLAMP,
        )
        val scale = maxOf(size.toFloat() / source.width, size.toFloat() / source.height)
        val matrix = android.graphics.Matrix()
        matrix.setScale(scale, scale)
        matrix.postTranslate(
            (size - source.width * scale) / 2f,
            (size - source.height * scale) / 2f,
        )
        shader.setLocalMatrix(matrix)
        val paint = android.graphics.Paint(
            android.graphics.Paint.ANTI_ALIAS_FLAG or android.graphics.Paint.FILTER_BITMAP_FLAG,
        ).apply { this.shader = shader }
        val radius = 8f * resources.displayMetrics.density
        canvas.drawRoundRect(0f, 0f, size.toFloat(), size.toFloat(), radius, radius, paint)
        return result
    }

    private fun prepareCompactNotificationForPlayback() {
        notifyExternalMediaPlayRequested()
        compactNotificationBlocked = false
    }

    private fun compactNotificationPosted(
        notificationId: Int,
        ongoing: Boolean,
    ): Notification? {
        if (compactNotificationBlocked) return null
        val item = compactTrack() ?: run {
            invalidateCompactNotification(ongoing.not(), false)
            return null
        }
        val key = compactKey(item)
        if (compactNotificationId != notificationId || compactTrackKey != key) {
            compactGeneration++
            compactArtworkJob?.cancel()
            compactArtworkJob = null
            compactFavorite = false
        }
        compactNotificationId = notificationId
        compactNotificationVisible = true
        compactTrackKey = key
        val artworkUri = item.artwork?.takeIf { it.isNotBlank() && it != "null" }
        val cached = artworkUri?.let { compactArtworkCache.get(it) }
        val compact = publishCompactNotification(notificationId, item, cached)
        if (cached == null && artworkUri != null) {
            loadCompactArtwork(artworkUri, notificationId, item, compactGeneration, key)
        }
        return compact
    }`;

function migrateOldPatch(source) {
    if (!source.includes("mf.compact.toggle") || source.includes(MARKER)) return source;
    let start = source.indexOf("    // musicfree-compact-notification-v2");
    if (start < 0) start = source.indexOf("    // ==== 紧凑媒体通知");
    const endAnchor = "    override fun onStartCommand";
    const end = source.indexOf(endAnchor, start);
    if (start < 0 || end < 0) {
        throw new Error("[compact-v2] cannot locate old compact implementation");
    }
    source = source.slice(0, start) + source.slice(end);
    source = source.replace("import android.widget.RemoteViews\n", "");
    source = source.replace("import androidx.core.app.NotificationManagerCompat\n", "");
    source = source.replace(
        `        if (handleCompactNotificationAction(intent)) {\n            return START_STICKY\n        }\n`,
        "",
    );
    source = source.replace(
        `        compactSmallIconRes = smallIcon ?: 0\n        compactContentIntent = pendingIntent\n`,
        "",
    );
    source = source.replace("\n                        scheduleCompactRepost();", "");
    source = source.replace("\n                scheduleCompactRepost()", "");
    source = source.replace(
        `                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))
                if (it in listOf(AudioPlayerState.IDLE, AudioPlayerState.STOPPED, AudioPlayerState.ERROR)) {
                    invalidateCompactNotification(true)
                } else {
                    if (it in listOf(AudioPlayerState.LOADING, AudioPlayerState.READY, AudioPlayerState.BUFFERING, AudioPlayerState.PLAYING)) {
                        prepareCompactNotificationForPlayback()
                    }
                    refreshCompactNotification()
                }`,
        `                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))`,
    );
    source = source.replace(
        `    fun load(track: Track) {
        prepareCompactNotificationForPlayback()
        player.load(track.toAudioItem())`,
        `    fun load(track: Track) {
        player.load(track.toAudioItem())`,
    );
    source = source.replace(
        `    fun play() {
        prepareCompactNotificationForPlayback()
        player.play()`,
        `    fun play() {
        player.play()`,
    );
    source = source.replace(
        `    fun clear() {
        invalidateCompactNotification(true)
        player.clear()`,
        `    fun clear() {
        player.clear()`,
    );
    source = source.replace(
        `    fun stop() {
        invalidateCompactNotification(true)
        player.stop()`,
        `    fun stop() {
        player.stop()`,
    );
    source = source.replace(
        `    fun clearNotificationMetadata() {
        invalidateCompactNotification(true)
        player.notificationManager.hideNotification()`,
        `    fun clearNotificationMetadata() {
        player.notificationManager.hideNotification()`,
    );
    source = source.replace(
        `            AppKilledPlaybackBehavior.STOP_PLAYBACK_AND_REMOVE_NOTIFICATION -> {
                invalidateCompactNotification(true)
                player.clear()`,
        `            AppKilledPlaybackBehavior.STOP_PLAYBACK_AND_REMOVE_NOTIFICATION -> {
                player.clear()`,
    );
    source = source.replace(
        `    override fun onDestroy() {
        invalidateCompactNotification(true)
        compactArtworkCache.evictAll()
        super.onDestroy()`,
        `    override fun onDestroy() {
        super.onDestroy()`,
    );
    return source;
}

function patchService() {
    if (!fs.existsSync(servicePath)) {
        throw new Error("[compact-v2] MusicService.kt not found");
    }
    let source = fs.readFileSync(servicePath, "utf8");
    source = migrateOldPatch(source);
    if (source.includes(MARKER)) {
        console.log("[compact-v2] already patched");
        return;
    }
    source = replaceExactly(
        source,
        "    private var compactCapabilities: List<Capability> = emptyList()",
        `    private var compactCapabilities: List<Capability> = emptyList()\n\n${kotlinImplementation}`,
        "implementation",
    );
    source = replaceExactly(
        source,
        `    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startTask(getTaskConfig(intent))`,
        `    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (handleCompactNotificationAction(intent)) {
            return START_STICKY
        }
        startTask(getTaskConfig(intent))`,
        "onStartCommand",
    );
    source = replaceExactly(
        source,
        "        player.notificationManager.createNotification(notificationConfig)",
        `        compactSmallIconRes = smallIcon ?: 0
        compactContentIntent = pendingIntent
        player.notificationManager.createNotification(notificationConfig)`,
        "notificationConfig",
    );
    source = replaceExactly(
        source,
        `                        notificationId = it.notificationId;
                        notification = it.notification;`,
        `                        notificationId = it.notificationId;
                        notification = it.notification;
                        val compact = compactNotificationPosted(it.notificationId, it.ongoing)
                        if (compact != null) {
                            notification = compact
                        }`,
        "POSTED",
    );
    source = replaceExactly(
        source,
        "                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))",
        `                emit(MusicEvents.PLAYBACK_STATE, getPlayerStateBundle(it))
                updateExternalMediaPlaybackState()
                if (it in listOf(AudioPlayerState.IDLE, AudioPlayerState.STOPPED, AudioPlayerState.ERROR)) {
                    invalidateCompactNotification(true)
                } else {
                    if (it in listOf(AudioPlayerState.LOADING, AudioPlayerState.READY, AudioPlayerState.BUFFERING, AudioPlayerState.PLAYING)) {
                        prepareCompactNotificationForPlayback()
                    }
                    refreshCompactNotification()
                }`,
        "stateChange",
    );
    source = replaceExactly(
        source,
        `    fun load(track: Track) {
        player.load(track.toAudioItem())`,
        `    fun load(track: Track) {
        prepareCompactNotificationForPlayback()
        player.load(track.toAudioItem())`,
        "load",
    );
    source = replaceExactly(
        source,
        `    fun play() {
        player.play()`,
        `    fun play() {
        prepareCompactNotificationForPlayback()
        player.play()`,
        "play",
    );
    source = replaceExactly(
        source,
        `    fun clear() {
        player.clear()`,
        `    fun clear() {
        invalidateCompactNotification(true)
        player.clear()`,
        "clear",
    );
    source = replaceExactly(
        source,
        `    fun stop() {
        player.stop()`,
        `    fun stop() {
        invalidateCompactNotification(true)
        player.stop()`,
        "stop",
    );
    source = replaceExactly(
        source,
        `    fun clearNotificationMetadata() {
        player.notificationManager.hideNotification()`,
        `    fun clearNotificationMetadata() {
        invalidateCompactNotification(true)
        player.notificationManager.hideNotification()`,
        "clearNotificationMetadata",
    );
    source = replaceExactly(
        source,
        `            AppKilledPlaybackBehavior.STOP_PLAYBACK_AND_REMOVE_NOTIFICATION -> {
                player.clear()`,
        `            AppKilledPlaybackBehavior.STOP_PLAYBACK_AND_REMOVE_NOTIFICATION -> {
                invalidateCompactNotification(true)
                player.clear()`,
        "onTaskRemoved",
    );
    source = replaceExactly(
        source,
        `        player = QueuedAudioPlayer(this@MusicService, playerConfig, bufferConfig, cacheConfig)
        player.automaticallyUpdateNotificationMetadata = automaticallyUpdateNotificationMetadata`,
        `        player = QueuedAudioPlayer(this@MusicService, playerConfig, bufferConfig, cacheConfig)
        registerExternalMediaReceiver()
        player.automaticallyUpdateNotificationMetadata = automaticallyUpdateNotificationMetadata`,
        "playerSetup",
    );
    source = replaceExactly(
        source,
        `    override fun onDestroy() {
        super.onDestroy()`,
        `    override fun onDestroy() {
        externalMediaReceiver?.let { unregisterReceiver(it) }
        externalMediaReceiver = null
        externalMediaBroadcast("fun.xwj.musicfree.externalmedia.SELF_NOT_PLAYING")
        invalidateCompactNotification(true)
        compactArtworkCache.evictAll()
        super.onDestroy()`,
        "onDestroy",
    );
    const forbidden = [
        "scheduleCompactRepost",
        "notify(1, ",
    ];
    for (const snippet of forbidden) {
        if (source.includes(snippet)) {
            throw new Error(`[compact-v2] stale snippet remains: ${snippet}`);
        }
    }
    fs.writeFileSync(servicePath, source);
    console.log("[compact-v2] patched MusicService with compact notification v2");
}

function main() {
    if (fs.existsSync(resPath) && fs.existsSync(servicePath)) {
        writeResources();
        patchService();
    } else {
        console.log("[compact-v2] node_modules not installed yet, skip");
    }
}

if (require.main === module) {
    main();
}

module.exports = { patchCompactNotificationV2: main };