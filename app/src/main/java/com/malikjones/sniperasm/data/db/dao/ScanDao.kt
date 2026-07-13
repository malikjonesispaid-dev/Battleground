package com.malikjones.sniperasm.data.db.dao

import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.malikjones.sniperasm.data.db.entities.Finding
import com.malikjones.sniperasm.data.db.entities.HostResult
import com.malikjones.sniperasm.data.db.entities.HostWithDetails
import com.malikjones.sniperasm.data.db.entities.PortResult
import com.malikjones.sniperasm.data.db.entities.ScanSession
import kotlinx.coroutines.flow.Flow

@androidx.room.Dao
interface ScanDao {

    @Insert
    suspend fun insertSession(session: ScanSession): Long

    @Update
    suspend fun updateSession(session: ScanSession)

    @Insert
    suspend fun insertHost(host: HostResult): Long

    @Update
    suspend fun updateHost(host: HostResult)

    @Insert
    suspend fun insertPort(port: PortResult): Long

    @Insert
    suspend fun insertFinding(finding: Finding): Long

    @Delete
    suspend fun deleteSession(session: ScanSession)

    @Query("SELECT * FROM scan_sessions ORDER BY startedAt DESC")
    fun observeSessions(): Flow<List<ScanSession>>

    @Query("SELECT * FROM scan_sessions WHERE id = :sessionId")
    fun observeSession(sessionId: Long): Flow<ScanSession?>

    @Query("SELECT * FROM host_results WHERE sessionId = :sessionId ORDER BY id")
    fun observeHostsForSession(sessionId: Long): Flow<List<HostResult>>

    @Transaction
    @Query("SELECT * FROM host_results WHERE id = :hostId")
    fun observeHostWithDetails(hostId: Long): Flow<HostWithDetails?>

    @Query(
        """
        SELECT findings.* FROM findings
        INNER JOIN host_results ON findings.hostId = host_results.id
        WHERE host_results.sessionId = :sessionId
        """
    )
    fun observeFindingsForSession(sessionId: Long): Flow<List<Finding>>
}
