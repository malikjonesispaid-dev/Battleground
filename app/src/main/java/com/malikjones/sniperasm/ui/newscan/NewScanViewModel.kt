package com.malikjones.sniperasm.ui.newscan

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.malikjones.sniperasm.AppContainer
import com.malikjones.sniperasm.engine.PortLists
import com.malikjones.sniperasm.util.TargetParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class PortListChoice(val label: String) {
    QUICK("Quick (14 common ports)"),
    STANDARD("Standard (~150 ports)"),
    FULL("Full (all 65535 ports – slow)");

    fun resolvePorts(): List<Int> = when (this) {
        QUICK -> PortLists.QUICK
        STANDARD -> PortLists.STANDARD
        FULL -> PortLists.fullRange()
    }
}

class NewScanViewModel : ViewModel() {
    var target by mutableStateOf("")
        private set
    var portListChoice by mutableStateOf(PortListChoice.STANDARD)
        private set
    var isStarting by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var infoMessage by mutableStateOf<String?>(null)
        private set

    fun onTargetChange(value: String) {
        target = value
        errorMessage = null
        infoMessage = null
    }

    fun onPortListChange(choice: PortListChoice) {
        portListChoice = choice
    }

    fun startScan(onStarted: (Long) -> Unit) {
        val spec = target.trim()
        if (spec.isEmpty()) {
            errorMessage = "Enter a target IP, hostname, or CIDR range (e.g. 192.168.1.10 or 192.168.1.0/24)"
            return
        }
        val parsed = TargetParser.parse(spec)
        if (parsed.hosts.isEmpty()) {
            errorMessage = parsed.warning ?: "Invalid target"
            return
        }
        infoMessage = parsed.warning

        isStarting = true
        AppContainer.appScope.launch {
            val concurrency = AppContainer.preferences.concurrency.first()
            val timeoutMs = AppContainer.preferences.timeoutMs.first()
            AppContainer.orchestrator.runScan(
                targetSpec = spec,
                ports = portListChoice.resolvePorts(),
                portListLabel = portListChoice.label,
                concurrency = concurrency,
                timeoutMs = timeoutMs,
                onSessionCreated = { sessionId ->
                    withContext(Dispatchers.Main) {
                        isStarting = false
                        onStarted(sessionId)
                    }
                }
            ) { /* live progress observed via Room flows on the detail screen */ }
        }
    }
}
