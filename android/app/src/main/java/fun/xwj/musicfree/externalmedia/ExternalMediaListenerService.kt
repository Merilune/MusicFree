package `fun`.xwj.musicfree.externalmedia

import android.content.ComponentName
import android.service.notification.NotificationListenerService

class ExternalMediaListenerService : NotificationListenerService() {
    override fun onListenerConnected() {
        super.onListenerConnected()
        ExternalMediaCoordinator.connect(
            applicationContext,
            ComponentName(this, ExternalMediaListenerService::class.java),
        )
    }

    override fun onListenerDisconnected() {
        ExternalMediaCoordinator.disconnect()
        super.onListenerDisconnected()
    }

    override fun onDestroy() {
        ExternalMediaCoordinator.disconnect()
        super.onDestroy()
    }
}
