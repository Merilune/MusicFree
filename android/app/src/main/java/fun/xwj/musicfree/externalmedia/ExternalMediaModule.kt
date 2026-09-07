package `fun`.xwj.musicfree.externalmedia

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ExternalMediaModule(
    private val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    override fun getName() = "ExternalMedia"

    @ReactMethod
    fun isNotificationListenerEnabled(promise: Promise) {
        val component = ComponentName(context, ExternalMediaListenerService::class.java)
        val enabled = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners",
        ).orEmpty().split(":").any {
            ComponentName.unflattenFromString(it) == component
        }
        promise.resolve(enabled)
    }

    @ReactMethod
    fun openNotificationListenerSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    @ReactMethod
    fun setEnabled(enabled: Boolean) {
        ExternalMediaCoordinator.setEnabled(context, enabled)
    }

    @ReactMethod
    fun getEnabled(promise: Promise) {
        promise.resolve(ExternalMediaCoordinator.isEnabled(context))
    }

    @ReactMethod
    fun reconcile() {
        ExternalMediaCoordinator.reconcile()
    }
}
