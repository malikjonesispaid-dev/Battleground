package com.jarvis.ai.viewmodel

enum class JarvisState {
    IDLE,
    LISTENING,
    THINKING,
    SPEAKING
}

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val timestampMillis: Long = System.currentTimeMillis()
)
