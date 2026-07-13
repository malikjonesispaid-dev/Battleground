package com.malikjones.sniperasm.util

object TargetParser {

    private const val MAX_HOSTS = 4096

    data class ParsedTarget(val hosts: List<String>, val warning: String?)

    fun parse(spec: String): ParsedTarget {
        val trimmed = spec.trim()
        if (trimmed.isEmpty()) return ParsedTarget(emptyList(), "No target specified")
        return if (trimmed.contains("/")) {
            expandCidr(trimmed)
        } else {
            ParsedTarget(listOf(trimmed), publicRangeWarning(trimmed))
        }
    }

    private fun expandCidr(cidr: String): ParsedTarget {
        val parts = cidr.split("/")
        if (parts.size != 2) return ParsedTarget(emptyList(), "Invalid CIDR notation")
        val prefix = parts[1].toIntOrNull() ?: return ParsedTarget(emptyList(), "Invalid CIDR prefix")
        if (prefix < 16 || prefix > 32) {
            return ParsedTarget(emptyList(), "For safety, only /16 through /32 ranges are supported")
        }
        val octets = parts[0].split(".").mapNotNull { it.toIntOrNull() }
        if (octets.size != 4 || octets.any { it !in 0..255 }) {
            return ParsedTarget(emptyList(), "Invalid IPv4 base address")
        }

        var baseInt = 0L
        for (o in octets) baseInt = (baseInt shl 8) or o.toLong()

        val hostBits = 32 - prefix
        val rangeSize = 1L shl hostBits
        val networkInt = baseInt and (0xFFFFFFFFL shl hostBits)

        val usable = if (rangeSize > 2) rangeSize - 2 else rangeSize
        val startOffset = if (rangeSize > 2) 1L else 0L
        val limit = minOf(usable, MAX_HOSTS.toLong())

        val hosts = ArrayList<String>(limit.toInt())
        for (i in 0 until limit) {
            hosts.add(intToIp(networkInt + startOffset + i))
        }

        val warning = if (usable > MAX_HOSTS) "Range truncated to the first $MAX_HOSTS hosts for safety" else null
        return ParsedTarget(hosts, warning)
    }

    private fun intToIp(value: Long): String {
        return "${(value shr 24) and 0xFF}.${(value shr 16) and 0xFF}.${(value shr 8) and 0xFF}.${value and 0xFF}"
    }

    private fun publicRangeWarning(host: String): String? {
        val octets = host.split(".").mapNotNull { it.toIntOrNull() }
        if (octets.size != 4) return null // hostname, not an IP literal
        val isPrivateOrLocal = octets[0] == 10 ||
            (octets[0] == 172 && octets[1] in 16..31) ||
            (octets[0] == 192 && octets[1] == 168) ||
            octets[0] == 127
        return if (!isPrivateOrLocal) {
            "This target is not in a private/loopback range. Only continue if you are authorized to scan it."
        } else null
    }
}
