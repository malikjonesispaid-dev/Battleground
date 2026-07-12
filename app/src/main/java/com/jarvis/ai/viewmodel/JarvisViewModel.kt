package com.jarvis.ai.viewmodel

import android.app.Application
import android.content.Intent
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateListOf
import com.jarvis.ai.data.AiRepository
import com.jarvis.ai.data.SecurePrefs
import com.jarvis.ai.skills.LocalCommands
import kotlinx.coroutines.launch
import java.util.Locale

class JarvisViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = SecurePrefs(application)
    private val aiRepository = AiRepository()
    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false

    var state by mutableStateOf(JarvisState.IDLE)
        private set
    var amplitude by mutableStateOf(0f)
        private set
    var partialTranscript by mutableStateOf("")
        private set
    val messages = mutableStateListOf<ChatMessage>()

    var selectedModel by mutableStateOf(AiRepository.MODEL_OPUS)

    init {
        tts = TextToSpeech(application) { status ->
            ttsReady = status == TextToSpeech.SUCCESS
            tts?.language = Locale.US
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    state = JarvisState.SPEAKING
                }
                override fun onDone(utteranceId: String?) {
                    state = JarvisState.IDLE
                }
                override fun onError(utteranceId: String?) {
                    state = JarvisState.IDLE
                }
            })
        }
        messages.add(
            ChatMessage(
                text = "J.A.R.V.I.S. online. All systems nominal.",
                isUser = false
            )
        )
    }

    fun toggleListening() {
        if (state == JarvisState.LISTENING) {
            stopListening()
        } else {
            startListening()
        }
    }

    private fun startListening() {
        val context = getApplication<Application>()
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            addMessage("Speech recognition is not available on this device.", isUser = false)
            return
        }

        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: android.os.Bundle?) {
                    state = JarvisState.LISTENING
                }

                override fun onRmsChanged(rmsdB: Float) {
                    amplitude = (rmsdB / 10f).coerceIn(0f, 1f)
                }

                override fun onPartialResults(partialResults: android.os.Bundle?) {
                    val text = partialResults
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                    if (text != null) partialTranscript = text
                }

                override fun onResults(results: android.os.Bundle?) {
                    val text = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                    partialTranscript = ""
                    if (!text.isNullOrBlank()) {
                        handleUserInput(text)
                    } else {
                        state = JarvisState.IDLE
                    }
                }

                override fun onError(error: Int) {
                    partialTranscript = ""
                    state = JarvisState.IDLE
                }

                override fun onEndOfSpeech() {
                    state = JarvisState.THINKING
                }

                override fun onBeginningOfSpeech() = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEvent(eventType: Int, params: android.os.Bundle?) = Unit
            })

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toLanguageTag())
            }
            startListening(intent)
        }
    }

    private fun stopListening() {
        speechRecognizer?.stopListening()
        state = JarvisState.IDLE
    }

    fun submitTextInput(text: String) {
        if (text.isBlank()) return
        handleUserInput(text)
    }

    private fun handleUserInput(text: String) {
        addMessage(text, isUser = true)
        state = JarvisState.THINKING

        val context = getApplication<Application>()
        val localReply = LocalCommands.tryHandle(context, text)
        if (localReply != null) {
            respond(localReply)
            return
        }

        val apiKey = prefs.apiKey
        val proxyBaseUrl = prefs.proxyBaseUrl
        val endpoint = when {
            !apiKey.isNullOrBlank() -> AiRepository.Endpoint.Direct(apiKey)
            !proxyBaseUrl.isNullOrBlank() -> AiRepository.Endpoint.Proxy(proxyBaseUrl, prefs.proxySharedSecret)
            else -> null
        }
        if (endpoint == null) {
            respond("I don't have a server or API key configured yet. Add one in Settings to unlock full conversation.")
            return
        }

        viewModelScope.launch {
            val history = messages.takeLast(12).map { AiRepository.Turn(it.text, it.isUser) }
            when (val result = aiRepository.sendMessage(
                endpoint = endpoint,
                model = selectedModel,
                systemPrompt = JARVIS_SYSTEM_PROMPT,
                history = history
            )) {
                is AiRepository.Result.Success -> respond(result.text)
                is AiRepository.Result.Failure -> respond("I ran into a problem: ${result.message}")
            }
        }
    }

    private fun respond(text: String) {
        addMessage(text, isUser = false)
        if (prefs.voiceEnabled && ttsReady) {
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis_reply")
        } else {
            state = JarvisState.IDLE
        }
    }

    private fun addMessage(text: String, isUser: Boolean) {
        messages.add(ChatMessage(text = text, isUser = isUser))
    }

    override fun onCleared() {
        speechRecognizer?.destroy()
        tts?.stop()
        tts?.shutdown()
        super.onCleared()
    }

    companion object {
        private const val JARVIS_SYSTEM_PROMPT = """
            You are J.A.R.V.I.S., a witty, composed AI assistant running on the user's
            Android device, inspired by the Iron Man assistant. Address the user as
            "sir" or "ma'am" only occasionally, not every line. Keep replies short and
            spoken-friendly (1-3 sentences) since they are read aloud by text-to-speech.
            Be helpful, precise, and slightly dry-humored. Avoid markdown formatting
            since responses are spoken, not read.
        """
    }
}
