package com.malikjones.sniperasm.data.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

enum class Severity { CRITICAL, HIGH, MEDIUM, LOW, INFO }

@Entity(
    tableName = "findings",
    foreignKeys = [
        ForeignKey(
            entity = HostResult::class,
            parentColumns = ["id"],
            childColumns = ["hostId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("hostId")]
)
data class Finding(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val hostId: Long,
    val portId: Long? = null,
    val severity: Severity,
    val title: String,
    val description: String,
    val cve: String? = null,
    val recommendation: String? = null
)
