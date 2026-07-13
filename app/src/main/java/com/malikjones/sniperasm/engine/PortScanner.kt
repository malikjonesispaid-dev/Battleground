package com.malikjones.sniperasm.engine

import java.io.IOException
import java.net.InetSocketAddress
import java.net.Socket
import java.net.SocketTimeoutException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext

enum class PortState { OPEN, CLOSED, FILTERED }

data class PortScanResult(val port: Int, val state: PortState, val banner: String?)

class PortScanner(concurrency: Int, private val timeoutMs: Int) {

    private val semaphore = Semaphore(concurrency.coerceIn(1, 256))

    suspend fun scanHost(ip: String, ports: List<Int>, onOpenPort: suspend (PortScanResult) -> Unit) = coroutineScope {
        ports.map { port ->
            async {
                val result = probePort(ip, port)
                if (result.state == PortState.OPEN) onOpenPort(result)
            }
        }.awaitAll()
    }

    private suspend fun probePort(ip: String, port: Int): PortScanResult = withContext(Dispatchers.IO) {
        semaphore.withPermit {
            try {
                Socket().use { socket ->
                    socket.connect(InetSocketAddress(ip, port), timeoutMs)
                    val banner = BannerGrabber.grab(socket, port, timeoutMs)
                    PortScanResult(port, PortState.OPEN, banner)
                }
            } catch (e: SocketTimeoutException) {
                PortScanResult(port, PortState.FILTERED, null)
            } catch (e: IOException) {
                PortScanResult(port, PortState.CLOSED, null)
            } catch (e: SecurityException) {
                PortScanResult(port, PortState.CLOSED, null)
            }
        }
    }
}
