package com.jarvis.ai.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.jarvis.ai.BuildConfig

/**
 * Stores per-device settings, encrypted with a hardware-backed key via the
 * Android Keystore: an optional user-supplied Anthropic API key (sent only
 * to api.anthropic.com), and/or the shared proxy server's URL + secret
 * (see `server/`), which most users can just leave at the built-in default.
 */
class SecurePrefs(context: Context) {

    private val prefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "jarvis_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    var apiKey: String?
        get() = prefs.getString(KEY_API_KEY, null)
        set(value) = prefs.edit().putString(KEY_API_KEY, value).apply()

    var proxyBaseUrl: String?
        get() = prefs.getString(KEY_PROXY_BASE_URL, null) ?: BuildConfig.DEFAULT_PROXY_BASE_URL.ifBlank { null }
        set(value) = prefs.edit().putString(KEY_PROXY_BASE_URL, value).apply()

    var proxySharedSecret: String?
        get() = prefs.getString(KEY_PROXY_SHARED_SECRET, null) ?: BuildConfig.DEFAULT_PROXY_SHARED_SECRET.ifBlank { null }
        set(value) = prefs.edit().putString(KEY_PROXY_SHARED_SECRET, value).apply()

    var voiceEnabled: Boolean
        get() = prefs.getBoolean(KEY_VOICE_ENABLED, true)
        set(value) = prefs.edit().putBoolean(KEY_VOICE_ENABLED, value).apply()

    companion object {
        private const val KEY_API_KEY = "anthropic_api_key"
        private const val KEY_PROXY_BASE_URL = "proxy_base_url"
        private const val KEY_PROXY_SHARED_SECRET = "proxy_shared_secret"
        private const val KEY_VOICE_ENABLED = "voice_enabled"
    }
}
