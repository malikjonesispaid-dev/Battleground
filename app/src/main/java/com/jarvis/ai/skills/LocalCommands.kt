package com.jarvis.ai.skills

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.BatteryManager
import android.provider.MediaStore
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Offline command handling — works without any network access or API key,
 * so the assistant is never completely inert.
 */
object LocalCommands {

    private var flashlightOn = false

    /** Returns a spoken reply if [input] matched an offline command, else null. */
    fun tryHandle(context: Context, input: String): String? {
        val text = input.lowercase(Locale.getDefault()).trim()

        return when {
            "time" in text -> {
                val now = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
                "It is currently $now, sir."
            }
            "date" in text || "today" in text -> {
                val today = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault()).format(Date())
                "Today is $today."
            }
            "battery" in text -> {
                val bm = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                "Power reserves at $level percent."
            }
            "flashlight" in text || "torch" in text -> toggleFlashlight(context)
            "open camera" in text -> {
                context.startActivity(Intent(MediaStore.ACTION_IMAGE_CAPTURE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                "Camera systems online."
            }
            "open browser" in text || "search the web" in text -> {
                val query = text.substringAfter("search the web for", "").ifBlank { "" }.trim()
                val uri = if (query.isNotEmpty()) {
                    Uri.parse("https://www.google.com/search?q=" + Uri.encode(query))
                } else {
                    Uri.parse("https://www.google.com")
                }
                context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                "Bringing up the browser now."
            }
            "diagnostic" in text || "system status" in text -> {
                "All systems nominal. Reactor core stable. Standing by."
            }
            "who are you" in text || "your name" in text -> {
                "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System, at your service."
            }
            else -> null
        }
    }

    private fun toggleFlashlight(context: Context): String {
        return try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList.firstOrNull() ?: return "No flash unit detected."
            flashlightOn = !flashlightOn
            cameraManager.setTorchMode(cameraId, flashlightOn)
            if (flashlightOn) "Illumination engaged." else "Illumination disengaged."
        } catch (e: Exception) {
            "I could not access the flash unit."
        }
    }
}
