package com.malikjones.sniperasm

import android.content.Context
import com.malikjones.sniperasm.data.db.AppDatabase
import com.malikjones.sniperasm.data.db.dao.ScanDao
import com.malikjones.sniperasm.data.prefs.UserPreferencesRepository
import com.malikjones.sniperasm.engine.ScanOrchestrator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

object AppContainer {
    // Long-lived scope so an in-progress scan survives navigating away from the
    // screen that started it; cancelled only when the process dies.
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    lateinit var scanDao: ScanDao
        private set
    lateinit var orchestrator: ScanOrchestrator
        private set
    lateinit var preferences: UserPreferencesRepository
        private set

    fun init(context: Context) {
        if (::scanDao.isInitialized) return
        val appContext = context.applicationContext
        val database = AppDatabase.getInstance(appContext)
        scanDao = database.scanDao()
        orchestrator = ScanOrchestrator(appContext, scanDao)
        preferences = UserPreferencesRepository(appContext)
    }
}
