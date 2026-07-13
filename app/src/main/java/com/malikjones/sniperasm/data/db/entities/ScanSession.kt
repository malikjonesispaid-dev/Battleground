package com.malikjones.sniperasm.data.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class ScanStatus { RUNNING, COMPLETED, CANCELLED, FAILED }

@Entity(tableName = "scan_sessions")
data class ScanSession(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val targetSpec: String,
    val portListLabel: String,
    val concurrency: Int,
    val timeoutMs: Int,
    val startedAt: Long,
    val finishedAt: Long? = null,
    val status: ScanStatus = ScanStatus.RUNNING
)
