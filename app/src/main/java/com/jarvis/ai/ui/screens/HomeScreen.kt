package com.jarvis.ai.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.jarvis.ai.ui.components.ChatLog
import com.jarvis.ai.ui.components.HudBackground
import com.jarvis.ai.ui.components.MicButton
import com.jarvis.ai.ui.components.ReactorCore
import com.jarvis.ai.ui.theme.JarvisCyan
import com.jarvis.ai.ui.theme.JarvisTextDim
import com.jarvis.ai.viewmodel.JarvisState
import com.jarvis.ai.viewmodel.JarvisViewModel

@Composable
fun HomeScreen(
    viewModel: JarvisViewModel,
    onOpenSettings: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        HudBackground()

        Column(modifier = Modifier.fillMaxSize()) {
            TopBar(state = viewModel.state, onOpenSettings = onOpenSettings)

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp),
                contentAlignment = Alignment.Center
            ) {
                ReactorCore(state = viewModel.state, amplitude = viewModel.amplitude)
            }

            if (viewModel.partialTranscript.isNotBlank()) {
                Text(
                    text = viewModel.partialTranscript,
                    color = JarvisCyan.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                )
            }

            ChatLog(
                messages = viewModel.messages,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            )

            InputBar(
                onSend = { viewModel.submitTextInput(it) },
                onMicClick = { viewModel.toggleListening() },
                state = viewModel.state
            )
        }
    }
}

@Composable
private fun TopBar(state: JarvisState, onOpenSettings: () -> Unit) {
    Box(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Column {
            Text(
                text = "J . A . R . V . I . S .",
                style = MaterialTheme.typography.headlineMedium,
                color = JarvisCyan
            )
            Text(
                text = statusLabel(state),
                style = MaterialTheme.typography.labelSmall,
                color = JarvisTextDim
            )
        }
        IconButton(
            onClick = onOpenSettings,
            modifier = Modifier.align(Alignment.CenterEnd)
        ) {
            Icon(Icons.Filled.Settings, contentDescription = "Settings", tint = JarvisCyan)
        }
    }
}

private fun statusLabel(state: JarvisState): String = when (state) {
    JarvisState.IDLE -> "STANDING BY"
    JarvisState.LISTENING -> "LISTENING"
    JarvisState.THINKING -> "PROCESSING"
    JarvisState.SPEAKING -> "RESPONDING"
}

@Composable
private fun InputBar(
    onSend: (String) -> Unit,
    onMicClick: () -> Unit,
    state: JarvisState
) {
    var text by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp),
        contentAlignment = Alignment.CenterEnd
    ) {
        Column(horizontalAlignment = Alignment.End) {
            androidx.compose.foundation.layout.Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Speak or type a command...") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        onSend(text)
                        text = ""
                    }),
                    trailingIcon = {
                        IconButton(onClick = { onSend(text); text = "" }) {
                            Icon(Icons.Filled.Send, contentDescription = "Send", tint = JarvisCyan)
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = JarvisCyan,
                        unfocusedBorderColor = JarvisTextDim,
                        cursorColor = JarvisCyan
                    )
                )
                MicButton(state = state, onClick = onMicClick)
            }
        }
    }
}
