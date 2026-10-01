package com.tempapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import org.json.JSONObject

/**
 * Xiaomi HyperOS "Super Island" (focus notification). A notification carrying the
 * `miui.focus.param` extras is drawn by the system island. The system only honours it for
 * packages Xiaomi has authorised; [isSupported] asks the system, so callers can fall back to
 * their own UI whenever it answers no (any other brand, or an app that is not authorised).
 */
class FocusIslandModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {

  override fun getName() = "FocusIsland"

  private fun isXiaomiFamily(): Boolean {
    val maker = Build.MANUFACTURER.lowercase()
    return maker.contains("xiaomi") || maker.contains("redmi") || maker.contains("poco")
  }

  private fun canShowFocus(): Boolean =
    try {
      val extras = Bundle().apply { putString("package", ctx.packageName) }
      val result = ctx.contentResolver.call(Uri.parse(PROVIDER), "canShowFocus", null, extras)
      result?.getBoolean("canShowFocus", false) ?: false
    } catch (e: Exception) {
      false
    }

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(isXiaomiFamily() && canShowFocus())
  }

  @ReactMethod
  fun show(title: String, text: String, promise: Promise) {
    try {
      if (!isXiaomiFamily()) {
        promise.resolve(false)
        return
      }
      val manager = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        manager.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, "Avisos do estoque", NotificationManager.IMPORTANCE_HIGH)
        )
      }
      val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
      val open = PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val builder = Notification.Builder(ctx, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(text)
        .setAutoCancel(true)
        .setContentIntent(open)

      val icon = Icon.createWithResource(ctx, R.mipmap.ic_launcher)
      val pics = Bundle().apply {
        putParcelable("miui.focus.pic_ticker", icon)
        putParcelable("miui.focus.pic_aod", icon)
        putParcelable("miui.focus.pic_imageText", icon)
      }
      builder.addExtras(Bundle().apply { putBundle("miui.focus.pics", pics) })

      val notification = builder.build()
      notification.extras.putString("miui.focus.param", focusParam(title, text))
      manager.notify(NOTIFICATION_ID, notification)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  // Template shape from Xiaomi's Super Island guide: big island (image + text on the left,
  // image on the right), small island (image) and the notification body.
  private fun focusParam(title: String, text: String): String {
    val pic = { key: String -> JSONObject().put("type", 1).put("pic", key) }
    val island = JSONObject()
      .put("islandProperty", 1)
      .put(
        "bigIslandArea",
        JSONObject()
          .put(
            "imageTextInfoLeft",
            JSONObject()
              .put("type", 1)
              .put("picInfo", pic("miui.focus.pic_imageText"))
              .put("textInfo", JSONObject().put("title", title).put("content", text))
          )
          .put("picInfo", pic("miui.focus.pic_imageText"))
      )
      .put("smallIslandArea", JSONObject().put("picInfo", pic("miui.focus.pic_imageText")))
    val v2 = JSONObject()
      .put("protocol", 1)
      .put("business", "estoque")
      .put("enableFloat", true)
      .put("updatable", true)
      .put("ticker", text)
      .put("tickerPic", "miui.focus.pic_ticker")
      .put("aodTitle", title)
      .put("aodPic", "miui.focus.pic_aod")
      .put("param_island", island)
      .put("baseInfo", JSONObject().put("title", title).put("content", text).put("type", 2))
    return JSONObject().put("param_v2", v2).toString()
  }

  companion object {
    private const val PROVIDER = "content://miui.statusbar.notification.public"
    private const val CHANNEL_ID = "estoque_focus"
    private const val NOTIFICATION_ID = 4101
  }
}

class FocusIslandPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(FocusIslandModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
