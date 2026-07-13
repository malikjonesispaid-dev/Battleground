package com.malikjones.sniperasm.ui.scandetail

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.malikjones.sniperasm.data.db.entities.Finding
import com.malikjones.sniperasm.data.db.entities.HostWithDetails
import com.malikjones.sniperasm.data.db.entities.ScanStatus
import com.malikjones.sniperasm.data.db.entities.Severity
import com.malikjones.sniperasm.report.ReportExporter
import com.malikjones.sniperasm.ui.theme.SeverityCritical
import com.malikjones.sniperasm.ui.theme.SeverityHigh
import com.malikjones.sniperasm.ui.theme.SeverityInfo
import com.malikjones.sniperasm.ui.theme.SeverityLow
import com.malikjones.sniperasm.ui.theme.SeverityMedium

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanDetailScreen(
    sessionId: Long,
    onBack: () -> Unit,
    viewModel: ScanDetailViewModel = viewModel()
) {
    LaunchedEffect(sessionId) { viewModel.setSessionId(sessionId) }

    val session by viewModel.session.collectAsStateWithLifecycle()
    val hostDetails by viewModel.hostDetails.collectAsStateWithLifecycle()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(session?.targetSpec ?: "Scan") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        viewModel.exportReport(context) { uri ->
                            context.startActivity(
                                android.content.Intent.createChooser(ReportExporter.shareIntent(uri), "Share report")
                            )
                        }
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Export report")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (session?.status == ScanStatus.RUNNING) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            val upHosts = hostDetails.filter { it.host.isUp }

            if (upHosts.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                    Text(
                        if (session?.status == ScanStatus.RUNNING) "Scanning…" else "No open ports found.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(upHosts, key = { it.host.id }) { detail ->
                        HostSection(detail)
                    }
                }
            }
        }
    }
}

@Composable
private fun HostSection(detail: HostWithDetails) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp)) {
            Text(detail.host.ip, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            Column(modifier = Modifier.padding(top = 8.dp)) {
                detail.ports.sortedBy { it.port }.forEach { port ->
                    Text(
                        "${port.port}/${port.protocol}  ${port.service ?: ""}  ${port.product ?: ""} ${port.version ?: ""}".trim(),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            if (detail.findings.isNotEmpty()) {
                Text(
                    "Findings",
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
                )
                detail.findings.sortedBy { severityRank(it.severity) }.forEach { finding ->
                    FindingRow(finding)
                }
            }
        }
    }
}

@Composable
private fun FindingRow(finding: Finding) {
    Surface(
        color = severityColor(finding.severity).copy(alpha = 0.12f),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Column(Modifier.padding(10.dp)) {
            Row {
                Text(
                    finding.severity.name,
                    color = severityColor(finding.severity),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(finding.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text(finding.description, style = MaterialTheme.typography.bodySmall)
            finding.recommendation?.let {
                Text("Fix: $it", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

private fun severityRank(s: Severity) = when (s) {
    Severity.CRITICAL -> 0
    Severity.HIGH -> 1
    Severity.MEDIUM -> 2
    Severity.LOW -> 3
    Severity.INFO -> 4
}

private fun severityColor(s: Severity): Color = when (s) {
    Severity.CRITICAL -> SeverityCritical
    Severity.HIGH -> SeverityHigh
    Severity.MEDIUM -> SeverityMedium
    Severity.LOW -> SeverityLow
    Severity.INFO -> SeverityInfo
}
