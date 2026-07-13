package com.malikjones.sniperasm.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.malikjones.sniperasm.AppContainer
import com.malikjones.sniperasm.data.db.entities.ScanSession
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class DashboardViewModel : ViewModel() {
    val sessions: StateFlow<List<ScanSession>> = AppContainer.scanDao.observeSessions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
