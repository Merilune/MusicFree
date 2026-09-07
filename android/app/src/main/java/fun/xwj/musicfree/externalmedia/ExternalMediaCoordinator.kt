package `fun`.xwj.musicfree.externalmedia

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log

object ExternalMediaCoordinator {
    private const val PREFS = "external_media"
    private const val ENABLED = "enabled"
    private const val TAG = "ExternalMedia"
    private const val SUPPRESS_DELAY_MS = 400L
    private const val USER_RESTORE_GUARD_MS = 2000L

    const val ACTION_SUPPRESS = "fun.xwj.musicfree.externalmedia.SUPPRESS"
    const val ACTION_RESTORE = "fun.xwj.musicfree.externalmedia.RESTORE"
    const val ACTION_SELF_PLAYING = "fun.xwj.musicfree.externalmedia.SELF_PLAYING"
    const val ACTION_SELF_NOT_PLAYING = "fun.xwj.musicfree.externalmedia.SELF_NOT_PLAYING"
    const val ACTION_USER_RESTORE = "fun.xwj.musicfree.externalmedia.USER_RESTORE"

    private val targetPackages = setOf(
        "com.netease.cloudmusic",
        "com.tencent.qqmusic",
    )
    private val handler = Handler(Looper.getMainLooper())
    private val controllers = mutableMapOf<String, ControllerEntry>()
    private var appContext: Context? = null
    private var listenerComponent: ComponentName? = null
    private var mediaSessionManager: MediaSessionManager? = null
    private var listenerConnected = false
    private var selfPlaying: Boolean? = null
    private var userRestoreUntil = 0L
    private var commandedSuppressed = false
    private var generation = 0L

    private data class ControllerEntry(
        val controller: MediaController,
        val callback: MediaController.Callback,
    )

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(ENABLED, false)

    fun setEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(ENABLED, enabled).apply()
        handler.post {
            appContext = context.applicationContext
            if (!enabled) {
                restore()
            } else {
                refreshSessions()
            }
        }
    }

    fun connect(context: Context, component: ComponentName) {
        handler.post {
            appContext = context.applicationContext
            listenerComponent = component
            mediaSessionManager = context.getSystemService(MediaSessionManager::class.java)
            listenerConnected = true
            selfPlaying = null
            try {
                mediaSessionManager?.addOnActiveSessionsChangedListener(
                    activeSessionsListener,
                    component,
                    handler,
                )
                refreshSessions()
            } catch (error: SecurityException) {
                Log.w(TAG, "Unable to observe active media sessions", error)
                disconnectInternal()
            }
        }
    }

    fun disconnect() {
        handler.post { disconnectInternal() }
    }

    fun reconcile() {
        handler.post {
            if (listenerConnected) refreshSessions() else restore()
        }
    }

    fun onSelfAction(action: String?) {
        handler.post {
            when (action) {
                ACTION_SELF_PLAYING -> selfPlaying = true
                ACTION_SELF_NOT_PLAYING -> selfPlaying = false
                ACTION_USER_RESTORE -> {
                    selfPlaying = null
                    userRestoreUntil = SystemClock.elapsedRealtime() + USER_RESTORE_GUARD_MS
                }
                else -> return@post
            }
            evaluate()
        }
    }

    private val activeSessionsListener =
        MediaSessionManager.OnActiveSessionsChangedListener { refreshSessions(it) }

    private fun refreshSessions() {
        val manager = mediaSessionManager ?: return restore()
        val component = listenerComponent ?: return restore()
        try {
            refreshSessions(manager.getActiveSessions(component))
        } catch (error: SecurityException) {
            Log.w(TAG, "Notification-listener access is unavailable", error)
            disconnectInternal()
        }
    }

    private fun refreshSessions(activeControllers: List<MediaController>?) {
        val current = activeControllers.orEmpty()
            .filter { it.packageName in targetPackages }
            .associateBy { it.sessionToken.toString() }

        controllers.keys.filter { it !in current }.forEach { key ->
            controllers.remove(key)?.let {
                it.controller.unregisterCallback(it.callback)
            }
        }
        current.forEach { (key, controller) ->
            if (key !in controllers) {
                val callback = object : MediaController.Callback() {
                    override fun onPlaybackStateChanged(state: PlaybackState?) {
                        handler.post { evaluate() }
                    }
                    override fun onSessionDestroyed() {
                        handler.post { refreshSessions() }
                    }
                }
                controller.registerCallback(callback, handler)
                controllers[key] = ControllerEntry(controller, callback)
            }
        }
        evaluate()
    }

    private fun evaluate() {
        generation++
        val currentGeneration = generation
        val targetPlaying = controllers.values.any {
            it.controller.playbackState?.state == PlaybackState.STATE_PLAYING
        }
        val shouldSuppress = appContext?.let(::isEnabled) == true &&
            listenerConnected && targetPlaying && selfPlaying == false &&
            SystemClock.elapsedRealtime() >= userRestoreUntil

        if (!shouldSuppress) {
            restore()
            return
        }
        handler.postDelayed({
            if (currentGeneration == generation) suppress()
        }, SUPPRESS_DELAY_MS)
    }

    private fun suppress() {
        if (commandedSuppressed) return
        commandedSuppressed = true
        sendCommand(ACTION_SUPPRESS)
    }

    private fun restore() {
        generation++
        if (!commandedSuppressed) return
        commandedSuppressed = false
        sendCommand(ACTION_RESTORE)
    }

    private fun sendCommand(action: String) {
        val context = appContext ?: return
        context.sendBroadcast(
            Intent(action)
                .setPackage(context.packageName)
                .addFlags(Intent.FLAG_RECEIVER_REGISTERED_ONLY),
        )
    }

    private fun disconnectInternal() {
        try {
            mediaSessionManager?.removeOnActiveSessionsChangedListener(
                activeSessionsListener,
            )
        } catch (_: Exception) {
        }
        controllers.values.forEach {
            it.controller.unregisterCallback(it.callback)
        }
        controllers.clear()
        mediaSessionManager = null
        listenerComponent = null
        listenerConnected = false
        selfPlaying = null
        restore()
    }
}
