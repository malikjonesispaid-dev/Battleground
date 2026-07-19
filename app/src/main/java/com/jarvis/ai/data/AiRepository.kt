package com.jarvis.ai.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Talks to Claude over HTTPS from the device, either directly to Anthropic
 * using the user's own API key, or through a self-hosted proxy (see
 * `server/`) that holds the key server-side so most users need no key at
 * all. A dedicated JVM SDK is unnecessary for a single non-streaming chat
 * completion and would meaningfully bloat the APK, so this is a deliberately
 * thin OkHttp client rather than a full SDK.
 */
class AiRepository {

    sealed class Endpoint {
        data class Direct(val apiKey: String) : Endpoint()
        data class Proxy(val baseUrl: String, val sharedSecret: String?) : Endpoint()
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .build()

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    data class Turn(val text: String, val isUser: Boolean)

    sealed class Result {
        data class Success(val text: String) : Result()
        data class Failure(val message: String) : Result()
    }

    suspend fun sendMessage(
        endpoint: Endpoint,
        model: String,
        systemPrompt: String,
        history: List<Turn>
    ): Result = withContext(Dispatchers.IO) {
        try {
            val messages = JSONArray()
            for (turn in history) {
                messages.put(
                    JSONObject()
                        .put("role", if (turn.isUser) "user" else "assistant")
                        .put("content", turn.text)
                )
            }

            val body = JSONObject()
                .put("model", model)
                .put("max_tokens", 1024)
                .put("system", systemPrompt)
                .put("messages", messages)

            val requestBuilder = when (endpoint) {
                is Endpoint.Direct -> Request.Builder()
                    .url("https://api.anthropic.com/v1/messages")
                    .addHeader("x-api-key", endpoint.apiKey)
                    .addHeader("anthropic-version", "2023-06-01")

                is Endpoint.Proxy -> Request.Builder()
                    .url(endpoint.baseUrl.trimEnd('/') + "/v1/chat")
                    .apply {
                        if (!endpoint.sharedSecret.isNullOrBlank()) {
                            addHeader("x-proxy-secret", endpoint.sharedSecret)
                        }
                    }
            }

            val request = requestBuilder
                .addHeader("content-type", "application/json")
                .post(body.toString().toRequestBody(jsonMedia))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyString = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val message = runCatching {
                        JSONObject(bodyString).getJSONObject("error").getString("message")
                    }.getOrDefault("Request failed (HTTP ${response.code})")
                    return@withContext Result.Failure(message)
                }

                val json = JSONObject(bodyString)
                val content = json.getJSONArray("content")
                val text = StringBuilder()
                for (i in 0 until content.length()) {
                    val block = content.getJSONObject(i)
                    if (block.optString("type") == "text") {
                        text.append(block.optString("text"))
                    }
                }
                Result.Success(text.toString().trim())
            }
        } catch (e: IOException) {
            Result.Failure(e.message ?: "Network error")
        }
    }

    companion object {
        const val MODEL_OPUS = "claude-opus-4-8"
        const val MODEL_SONNET = "claude-sonnet-5"
        const val MODEL_HAIKU = "claude-haiku-4-5"
    }
}
