package com.malikjones.sniperasm.report

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.malikjones.sniperasm.data.db.entities.HostWithDetails
import com.malikjones.sniperasm.data.db.entities.ScanSession
import java.io.File

object ReportExporter {

    fun writeReport(context: Context, session: ScanSession, hosts: List<HostWithDetails>): Uri {
        val html = ReportGenerator.generateHtml(session, hosts)
        val reportsDir = File(context.filesDir, "reports").apply { mkdirs() }
        val file = File(reportsDir, "sniperasm-report-${session.id}.html")
        file.writeText(html)
        return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }

    fun shareIntent(uri: Uri): Intent =
        Intent(Intent.ACTION_SEND).apply {
            type = "text/html"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
}
