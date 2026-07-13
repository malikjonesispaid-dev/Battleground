package com.malikjones.sniperasm.data.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "host_results",
    foreignKeys = [
        ForeignKey(
            entity = ScanSession::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("sessionId")]
)
data class HostResult(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sessionId: Long,
    val ip: String,
    val hostname: String? = null,
    val isUp: Boolean = false,
    val respondedAt: Long = 0
)
