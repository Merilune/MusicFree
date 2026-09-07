package `fun`.xwj.musicfree

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.os.Build

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

import `fun`.xwj.musicfree.cenc.CencPackage
import `fun`.xwj.musicfree.externalmedia.ExternalMediaCoordinator
import `fun`.xwj.musicfree.externalmedia.ExternalMediaPackage
import `fun`.xwj.musicfree.lyricUtil.LyricUtilPackage
import `fun`.xwj.musicfree.mp3Util.Mp3UtilPackage
import `fun`.xwj.musicfree.utils.UtilsPackage

class MainApplication : Application(), ReactApplication {

  private val externalMediaStateReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      ExternalMediaCoordinator.onSelfAction(intent?.action)
    }
  }

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here.
          add(UtilsPackage())
          add(Mp3UtilPackage())
          add(LyricUtilPackage())
          add(CencPackage())
          add(ExternalMediaPackage())
        }
    )
  }

  override fun onCreate() {
    super.onCreate()
    val externalMediaFilter = IntentFilter().apply {
      addAction(ExternalMediaCoordinator.ACTION_SELF_PLAYING)
      addAction(ExternalMediaCoordinator.ACTION_SELF_NOT_PLAYING)
      addAction(ExternalMediaCoordinator.ACTION_USER_RESTORE)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(
        externalMediaStateReceiver,
        externalMediaFilter,
        Context.RECEIVER_NOT_EXPORTED,
      )
    } else {
      registerReceiver(externalMediaStateReceiver, externalMediaFilter)
    }
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
