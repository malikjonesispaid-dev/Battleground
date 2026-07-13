package com.malikjones.sniperasm.engine

import com.malikjones.sniperasm.data.db.entities.Severity
import java.net.HttpURLConnection
import java.net.URL

object HttpAnalyzer {

    data class HttpFindingInfo(
        val title: String,
        val description: String,
        val severity: Severity,
        val recommendation: String?
    )

    fun analyze(port: Int, isTls: Boolean, ip: String, timeoutMs: Int): List<HttpFindingInfo> {
        val findings = mutableListOf<HttpFindingInfo>()
        var connection: HttpURLConnection? = null
        try {
            val scheme = if (isTls) "https" else "http"
            val url = URL("$scheme://$ip:$port/")
            connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = timeoutMs
            connection.readTimeout = timeoutMs
            connection.requestMethod = "GET"
            connection.instanceFollowRedirects = false
            connection.connect()

            val server = connection.getHeaderField("Server")
            if (!server.isNullOrBlank()) {
                findings.add(
                    HttpFindingInfo(
                        "Server version disclosed",
                        "The Server response header reveals: $server",
                        Severity.LOW,
                        "Suppress or generalize the Server header in production configuration."
                    )
                )
            }

            if (isTls && connection.getHeaderField("Strict-Transport-Security") == null) {
                findings.add(
                    HttpFindingInfo(
                        "Missing HSTS header",
                        "Strict-Transport-Security is not set, leaving clients open to protocol-downgrade attacks.",
                        Severity.MEDIUM,
                        "Add Strict-Transport-Security: max-age=31536000; includeSubDomains"
                    )
                )
            }

            if (connection.getHeaderField("X-Frame-Options") == null &&
                connection.getHeaderField("Content-Security-Policy") == null
            ) {
                findings.add(
                    HttpFindingInfo(
                        "Missing clickjacking protection",
                        "Neither X-Frame-Options nor a CSP frame-ancestors directive is set.",
                        Severity.LOW,
                        "Add X-Frame-Options: DENY or a CSP frame-ancestors directive."
                    )
                )
            }

            if (connection.getHeaderField("X-Content-Type-Options") == null) {
                findings.add(
                    HttpFindingInfo(
                        "Missing X-Content-Type-Options",
                        "MIME-sniffing protection header is absent.",
                        Severity.INFO,
                        "Add X-Content-Type-Options: nosniff"
                    )
                )
            }

            if (!isTls) {
                findings.add(
                    HttpFindingInfo(
                        "Plaintext HTTP service",
                        "This service responds over unencrypted HTTP.",
                        Severity.INFO,
                        "Redirect to HTTPS and enable TLS if this service handles sensitive data."
                    )
                )
            }
        } catch (e: Exception) {
            // Not an HTTP service, or unreachable on this port/scheme; nothing to report.
        } finally {
            connection?.disconnect()
        }
        return findings
    }
}
