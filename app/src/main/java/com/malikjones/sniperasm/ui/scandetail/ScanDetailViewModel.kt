package com.malikjones.sniperasm.ui.scandetail

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.malikjones.sniperasm.AppContainer
import com.malikjones.sniperasm.data.db.entities.HostWithDetails
import com.malikjones.sniperasm.data.db.entities.ScanSession
import com.malikjones.sniperasm.report.ReportExporter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ScanDetailViewModel : ViewModel() {

    private val sessionIdFlow = MutableStateFlow<Long?>(null)

    fun setSessionId(id: Long) {
        if (sessionIdFlow.value == id) return
        sessionIdFlow.value = id
    }

    val session: StateFlow<ScanSession?> = sessionIdFlow.filterNotNull()
        .flatMapLatest { id -> AppContainer.scanDao.observeSession(id) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val hostDetails: StateFlow<List<HostWithDetails>> = sessionIdFlow.filterNotNull()
        .flatMapLatest { id ->
            AppContainer.scanDao.observeHostsForSession(id).flatMapLatest { hosts ->
                if (hosts.isEmpty()) {
                    flowOf(emptyList<HostWithDetails>())
                } else {
                    combine(hosts.map { host -> AppContainer.scanDao.observeHostWithDetails(host.id) }) { array ->
                        array.filterNotNull().toList()
                    }
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun exportReport(context: Context, onReady: (Uri) -> Unit) {
        val sess = session.value ?: return
        viewModelScope.launch {
            val uri = withContext(Dispatchers.IO) {
                ReportExporter.writeReport(context.applicationContext, sess, hostDetails.value)
            }
            onReady(uri)
        }
    }
}
