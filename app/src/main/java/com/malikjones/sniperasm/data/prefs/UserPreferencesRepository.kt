package com.malikjones.sniperasm.data.prefs

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "sniperasm_prefs")

class UserPreferencesRepository(private val context: Context) {

    companion object {
        val DISCLAIMER_ACCEPTED = booleanPreferencesKey("disclaimer_accepted")
        val CONCURRENCY = intPreferencesKey("concurrency")
        val TIMEOUT_MS = intPreferencesKey("timeout_ms")

        const val DEFAULT_CONCURRENCY = 32
        const val DEFAULT_TIMEOUT_MS = 800
    }

    val disclaimerAccepted: Flow<Boolean> =
        context.dataStore.data.map { it[DISCLAIMER_ACCEPTED] ?: false }

    val concurrency: Flow<Int> =
        context.dataStore.data.map { it[CONCURRENCY] ?: DEFAULT_CONCURRENCY }

    val timeoutMs: Flow<Int> =
        context.dataStore.data.map { it[TIMEOUT_MS] ?: DEFAULT_TIMEOUT_MS }

    suspend fun setDisclaimerAccepted(accepted: Boolean) {
        context.dataStore.edit { it[DISCLAIMER_ACCEPTED] = accepted }
    }

    suspend fun setConcurrency(value: Int) {
        context.dataStore.edit { it[CONCURRENCY] = value.coerceIn(1, 128) }
    }

    suspend fun setTimeoutMs(value: Int) {
        context.dataStore.edit { it[TIMEOUT_MS] = value.coerceIn(100, 10_000) }
    }
}
