package com.malikjones.sniperasm.data.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "port_results",
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
data class PortResult(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val hostId: Long,
    val port: Int,
    val protocol: String = "tcp",
    val state: String = "open",
    val service: String? = null,
    val product: String? = null,
    val version: String? = null,
    val banner: String? = null
)
