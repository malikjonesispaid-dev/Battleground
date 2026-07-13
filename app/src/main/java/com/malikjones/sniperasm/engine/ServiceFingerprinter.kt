package com.malikjones.sniperasm.engine

object ServiceFingerprinter {

    data class Identification(val service: String?, val product: String?, val version: String?)

    private val wellKnownPorts = mapOf(
        21 to "ftp", 22 to "ssh", 23 to "telnet", 25 to "smtp", 53 to "dns", 80 to "http",
        110 to "pop3", 111 to "rpcbind", 135 to "msrpc", 139 to "netbios-ssn", 143 to "imap",
        443 to "https", 445 to "microsoft-ds", 465 to "smtps", 587 to "smtp-submission",
        993 to "imaps", 995 to "pop3s", 1433 to "mssql", 1723 to "pptp", 2049 to "nfs",
        3306 to "mysql", 3389 to "rdp", 5432 to "postgresql", 5900 to "vnc", 6379 to "redis",
        8080 to "http", 8443 to "https", 9200 to "elasticsearch", 27017 to "mongodb"
    )

    private class Signature(val pattern: Regex, val build: (MatchResult) -> Identification)

    private val signatures = listOf(
        Signature(Regex("SSH-[\\d.]+-OpenSSH_([\\w.]+)")) { m -> Identification("ssh", "OpenSSH", m.groupValues[1]) },
        Signature(Regex("220.*ProFTPD ([\\w.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("ftp", "ProFTPD", m.groupValues[1]) },
        Signature(Regex("220.*vsFTPd ([\\w.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("ftp", "vsftpd", m.groupValues[1]) },
        Signature(Regex("220.*Pure-FTPd", RegexOption.IGNORE_CASE)) { _ -> Identification("ftp", "Pure-FTPd", null) },
        Signature(Regex("Server:\\s*Apache/([\\d.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("http", "Apache", m.groupValues[1]) },
        Signature(Regex("Server:\\s*nginx/([\\d.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("http", "nginx", m.groupValues[1]) },
        Signature(Regex("Server:\\s*Microsoft-IIS/([\\d.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("http", "Microsoft-IIS", m.groupValues[1]) },
        Signature(Regex("Server:\\s*lighttpd/([\\d.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("http", "lighttpd", m.groupValues[1]) },
        Signature(Regex("^([\\d.]+).*mysql", RegexOption.IGNORE_CASE)) { m -> Identification("mysql", "MySQL", m.groupValues[1]) },
        Signature(Regex("220.*Postfix", RegexOption.IGNORE_CASE)) { _ -> Identification("smtp", "Postfix", null) },
        Signature(Regex("220.*Exim ([\\w.]+)", RegexOption.IGNORE_CASE)) { m -> Identification("smtp", "Exim", m.groupValues[1]) },
        Signature(Regex("REDIS", RegexOption.IGNORE_CASE)) { _ -> Identification("redis", "Redis", null) }
    )

    fun identify(port: Int, banner: String?): Identification {
        if (!banner.isNullOrBlank()) {
            for (sig in signatures) {
                val match = sig.pattern.find(banner)
                if (match != null) return sig.build(match)
            }
        }
        return Identification(wellKnownPorts[port], null, null)
    }
}
