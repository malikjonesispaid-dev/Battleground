package com.malikjones.sniperasm.data.db.entities

import androidx.room.Embedded
import androidx.room.Relation

data class HostWithDetails(
    @Embedded val host: HostResult,
    @Relation(parentColumn = "id", entityColumn = "hostId")
    val ports: List<PortResult>,
    @Relation(parentColumn = "id", entityColumn = "hostId")
    val findings: List<Finding>
)
