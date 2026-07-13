package com.malikjones.sniperasm.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = viewModel()
) {
    val concurrency by viewModel.concurrency.collectAsStateWithLifecycle()
    val timeoutMs by viewModel.timeoutMs.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            Text("Concurrency: $concurrency simultaneous connections", style = MaterialTheme.typography.titleSmall)
            Slider(
                value = concurrency.toFloat(),
                onValueChange = { viewModel.setConcurrency(it.toInt()) },
                valueRange = 1f..128f,
                steps = 30,
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                "Per-port timeout: ${timeoutMs} ms",
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(top = 16.dp)
            )
            Slider(
                value = timeoutMs.toFloat(),
                onValueChange = { viewModel.setTimeoutMs(it.toInt()) },
                valueRange = 100f..5000f,
                steps = 48,
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                "Higher concurrency and lower timeouts finish scans faster but are more likely to miss slow-to-respond hosts and generate more noticeable network traffic.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}
