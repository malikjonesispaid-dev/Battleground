package com.malikjones.sniperasm.engine

import android.content.Context
import com.malikjones.sniperasm.data.db.dao.ScanDao
import com.malikjones.sniperasm.data.db.entities.Finding
import com.malikjones.sniperasm.data.db.entities.HostResult
import com.malikjones.sniperasm.data.db.entities.PortResult
import com.malikjones.sniperasm.data.db.entities.ScanSession
import com.malikjones.sniperasm.data.db.entities.ScanStatus
import com.malikjones.sniperasm.util.TargetParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicInteger

sealed class ScanProgress {
    data class HostStarted(val ip: String, val index: Int, val total: Int) : ScanProgress()
    data class HostFinished(val ip: String, val isUp: Boolean) : ScanProgress()
    data class PortFound(val ip: String, val port: Int, val service: String?) : ScanProgress()
    data class Completed(val sessionId: Long, val openPorts: Int, val findings: Int) : ScanProgress()
    data class Failed(val reason: String) : ScanProgress()
}

class ScanOrchestrator(private val context: Context, private val dao: ScanDao) {

    companion object {
        private val HTTP_LIKE_PORTS = setOf(80, 81, 3000, 8000, 8008, 8080, 8081, 8888)
        private val HTTPS_LIKE_PORTS = setOf(443, 8443)
    }

    suspend fun runScan(
        targetSpec: String,
        ports: List<Int>,
        portListLabel: String,
        concurrency: Int,
        timeoutMs: Int,
        onSessionCreated: suspend (Long) -> Unit = {},
        onProgress: suspend (ScanProgress) -> Unit
    ): Long = withContext(Dispatchers.IO) {
        VulnRuleEngine.ensureLoaded(context)
        val parsed = TargetParser.parse(targetSpec)

        val sessionId = dao.insertSession(
            ScanSession(
                targetSpec = targetSpec,
                portListLabel = portListLabel,
                concurrency = concurrency,
                timeoutMs = timeoutMs,
                startedAt = System.currentTimeMillis()
            )
        )
        onSessionCreated(sessionId)

        if (parsed.hosts.isEmpty()) {
            markSessionFinished(sessionId, ScanStatus.FAILED)
            onProgress(ScanProgress.Failed(parsed.warning ?: "No valid hosts to scan"))
            return@withContext sessionId
        }

        val scanner = PortScanner(concurrency, timeoutMs)
        val totalOpenPorts = AtomicInteger(0)
        val totalFindings = AtomicInteger(0)

        parsed.hosts.forEachIndexed { index, ip ->
            onProgress(ScanProgress.HostStarted(ip, index + 1, parsed.hosts.size))
            val hostId = dao.insertHost(HostResult(sessionId = sessionId, ip = ip, isUp = false, respondedAt = 0))
            var hostIsUp = false

            scanner.scanHost(ip, ports) { result ->
                hostIsUp = true
                val identification = ServiceFingerprinter.identify(result.port, result.banner)

                val portId = dao.insertPort(
                    PortResult(
                        hostId = hostId,
                        port = result.port,
                        state = "open",
                        service = identification.service,
                        product = identification.product,
                        version = identification.version,
                        banner = result.banner?.take(500)
                    )
                )
                totalOpenPorts.incrementAndGet()

                GenericPortRules.findingsFor(result.port).forEach { info ->
                    dao.insertFinding(
                        Finding(
                            hostId = hostId,
                            portId = portId,
                            severity = info.severity,
                            title = info.title,
                            description = info.description,
                            recommendation = info.recommendation
                        )
                    )
                    totalFindings.incrementAndGet()
                }

                VulnRuleEngine.match(identification.product, identification.version).forEach { rule ->
                    dao.insertFinding(
                        Finding(
                            hostId = hostId,
                            portId = portId,
                            severity = rule.severity,
                            title = "${rule.product} ${identification.version.orEmpty()} – ${rule.cve}".trim(),
                            description = rule.description,
                            cve = rule.cve,
                            recommendation = rule.recommendation
                        )
                    )
                    totalFindings.incrementAndGet()
                }

                val isHttp = identification.service == "http" || result.port in HTTP_LIKE_PORTS
                val isHttps = identification.service == "https" || result.port in HTTPS_LIKE_PORTS
                if (isHttp || isHttps) {
                    HttpAnalyzer.analyze(result.port, isHttps, ip, timeoutMs).forEach { info ->
                        dao.insertFinding(
                            Finding(
                                hostId = hostId,
                                portId = portId,
                                severity = info.severity,
                                title = info.title,
                                description = info.description,
                                recommendation = info.recommendation
                            )
                        )
                        totalFindings.incrementAndGet()
                    }
                }

                onProgress(ScanProgress.PortFound(ip, result.port, identification.service))
            }

            dao.updateHost(HostResult(id = hostId, sessionId = sessionId, ip = ip, isUp = hostIsUp, respondedAt = System.currentTimeMillis()))
            onProgress(ScanProgress.HostFinished(ip, hostIsUp))
        }

        markSessionFinished(sessionId, ScanStatus.COMPLETED)
        onProgress(ScanProgress.Completed(sessionId, totalOpenPorts.get(), totalFindings.get()))
        sessionId
    }

    private suspend fun markSessionFinished(sessionId: Long, status: ScanStatus) {
        val session = dao.observeSession(sessionId).first() ?: return
        dao.updateSession(session.copy(status = status, finishedAt = System.currentTimeMillis()))
    }
}
