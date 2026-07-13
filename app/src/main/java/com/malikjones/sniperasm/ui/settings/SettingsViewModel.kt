package com.malikjones.sniperasm.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.malikjones.sniperasm.AppContainer
import com.malikjones.sniperasm.data.prefs.UserPreferencesRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel : ViewModel() {
    val concurrency: StateFlow<Int> = AppContainer.preferences.concurrency
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserPreferencesRepository.DEFAULT_CONCURRENCY)

    val timeoutMs: StateFlow<Int> = AppContainer.preferences.timeoutMs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserPreferencesRepository.DEFAULT_TIMEOUT_MS)

    fun setConcurrency(value: Int) {
        viewModelScope.launch { AppContainer.preferences.setConcurrency(value) }
    }

    fun setTimeoutMs(value: Int) {
        viewModelScope.launch { AppContainer.preferences.setTimeoutMs(value) }
    }
}
