package com.malikjones.sniperasm.engine

import java.io.IOException
import java.net.Socket

object BannerGrabber {
    private val HTTP_PORTS = setOf(80, 81, 8000, 8008, 8080, 8081, 8443, 8888, 443, 3000)

    fun grab(socket: Socket, port: Int, timeoutMs: Int): String? {
        return try {
            socket.soTimeout = timeoutMs
            if (port in HTTP_PORTS) {
                val host = socket.inetAddress?.hostAddress ?: ""
                val request = "HEAD / HTTP/1.0\r\nHost: $host\r\nConnection: close\r\n\r\n"
                socket.getOutputStream().apply {
                    write(request.toByteArray(Charsets.US_ASCII))
                    flush()
                }
            }
            val buffer = ByteArray(2048)
            val read = socket.getInputStream().read(buffer)
            if (read <= 0) null else String(buffer, 0, read, Charsets.ISO_8859_1).trim()
        } catch (e: IOException) {
            null
        }
    }
}
