package com.malikjones.sniperasm.engine

import com.malikjones.sniperasm.data.db.entities.Severity

object GenericPortRules {

    data class RiskInfo(
        val title: String,
        val description: String,
        val severity: Severity,
        val recommendation: String?
    )

    private val riskyPorts: Map<Int, RiskInfo> = mapOf(
        23 to RiskInfo(
            "Telnet service exposed",
            "Telnet transmits credentials and session data in plaintext.",
            Severity.HIGH, "Disable Telnet and use SSH instead."
        ),
        21 to RiskInfo(
            "FTP service exposed",
            "FTP transmits credentials in plaintext and is frequently misconfigured for anonymous access.",
            Severity.MEDIUM, "Use SFTP/FTPS, or disable anonymous login and require encryption."
        ),
        3389 to RiskInfo(
            "RDP exposed",
            "Remote Desktop Protocol is a common ransomware entry point when reachable from untrusted networks.",
            Severity.HIGH, "Restrict RDP to a VPN or bastion host and enforce NLA/MFA."
        ),
        5900 to RiskInfo(
            "VNC exposed",
            "VNC is frequently deployed with weak or no authentication.",
            Severity.HIGH, "Restrict network access and require strong authentication or tunnel over SSH/VPN."
        ),
        6379 to RiskInfo(
            "Redis exposed",
            "Redis has no authentication by default; internet-facing instances have led to full data loss or remote code execution.",
            Severity.CRITICAL, "Bind Redis to localhost/private network only and set a strong 'requirepass'."
        ),
        27017 to RiskInfo(
            "MongoDB exposed",
            "MongoDB instances are frequently found on the network without authentication enabled.",
            Severity.HIGH, "Enable authentication (--auth) and bind to internal interfaces only."
        ),
        9200 to RiskInfo(
            "Elasticsearch exposed",
            "Elasticsearch often ships without authentication and can leak or allow modification of indexed data.",
            Severity.HIGH, "Enable Elastic security features (auth/TLS) and restrict network exposure."
        ),
        139 to RiskInfo(
            "NetBIOS/SMB exposed",
            "Legacy SMB/NetBIOS services are a common lateral-movement and worm-propagation vector.",
            Severity.MEDIUM, "Restrict SMB to trusted internal segments and keep patched."
        ),
        445 to RiskInfo(
            "SMB exposed",
            "SMB has been the vector for major worms (e.g. WannaCry/EternalBlue) when exposed externally.",
            Severity.HIGH, "Do not expose SMB to untrusted networks; restrict to trusted internal segments."
        ),
        11211 to RiskInfo(
            "Memcached exposed",
            "Memcached has no authentication by default and has been abused for data exposure and reflection attacks.",
            Severity.HIGH, "Bind to localhost/private network only and disable UDP if unused."
        )
    )

    fun findingsFor(port: Int): List<RiskInfo> = listOfNotNull(riskyPorts[port])
}
