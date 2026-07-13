package com.malikjones.sniperasm.ui.newscan

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.malikjones.sniperasm.ui.theme.SeverityHigh

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewScanScreen(
    onScanStarted: (Long) -> Unit,
    onBack: () -> Unit,
    viewModel: NewScanViewModel = viewModel()
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New scan") },
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
            OutlinedTextField(
                value = viewModel.target,
                onValueChange = viewModel::onTargetChange,
                label = { Text("Target (IP, hostname, or CIDR)") },
                placeholder = { Text("192.168.1.10 or 192.168.1.0/24") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Text(
                "Only scan systems and networks you own or are explicitly authorized to test.",
                style = MaterialTheme.typography.bodySmall,
                color = SeverityHigh,
                modifier = Modifier.padding(top = 8.dp)
            )

            Text(
                "Port list",
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.padding(top = 24.dp, bottom = 4.dp)
            )
            Column(modifier = Modifier.selectableGroup()) {
                PortListChoice.entries.forEach { choice ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .selectable(
                                selected = viewModel.portListChoice == choice,
                                onClick = { viewModel.onPortListChange(choice) }
                            )
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = viewModel.portListChoice == choice,
                            onClick = { viewModel.onPortListChange(choice) }
                        )
                        Text(choice.label, modifier = Modifier.padding(start = 8.dp))
                    }
                }
            }

            viewModel.errorMessage?.let { message ->
                Text(
                    message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            viewModel.infoMessage?.let { message ->
                Text(
                    message,
                    color = SeverityHigh,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Button(
                onClick = { viewModel.startScan(onScanStarted) },
                enabled = !viewModel.isStarting,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 24.dp)
            ) {
                if (viewModel.isStarting) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .height(18.dp)
                            .width(18.dp),
                        strokeWidth = 2.dp
                    )
                }
                Text(if (viewModel.isStarting) "Starting…" else "Start scan")
            }
        }
    }
}
