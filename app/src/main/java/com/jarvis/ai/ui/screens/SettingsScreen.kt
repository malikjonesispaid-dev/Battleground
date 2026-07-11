package com.jarvis.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.jarvis.ai.data.AiRepository
import com.jarvis.ai.data.SecurePrefs
import com.jarvis.ai.ui.theme.JarvisBlack
import com.jarvis.ai.ui.theme.JarvisCyan
import com.jarvis.ai.ui.theme.JarvisTextDim
import com.jarvis.ai.viewmodel.JarvisViewModel

@Composable
fun SettingsScreen(
    viewModel: JarvisViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val prefs = remember { SecurePrefs(context) }

    var apiKey by remember { mutableStateOf(prefs.apiKey.orEmpty()) }
    var voiceEnabled by remember { mutableStateOf(prefs.voiceEnabled) }
    var saved by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(JarvisBlack)
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = JarvisCyan)
            }
            Text("CONFIGURATION", style = MaterialTheme.typography.titleLarge, color = JarvisCyan)
        }

        Column(
            modifier = Modifier.padding(top = 24.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            SectionLabel("ANTHROPIC API KEY")
            Text(
                "Your key is encrypted on-device and only ever sent directly to " +
                    "api.anthropic.com. Without a key, offline commands still work.",
                style = MaterialTheme.typography.bodyMedium,
                color = JarvisTextDim
            )
            OutlinedTextField(
                value = apiKey,
                onValueChange = { apiKey = it; saved = false },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("sk-ant-...") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = JarvisCyan,
                    unfocusedBorderColor = JarvisTextDim,
                    cursorColor = JarvisCyan
                )
            )

            SectionLabel("MODEL")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ModelChip("Opus", AiRepository.MODEL_OPUS, viewModel.selectedModel) {
                    viewModel.selectedModel = it
                }
                ModelChip("Sonnet", AiRepository.MODEL_SONNET, viewModel.selectedModel) {
                    viewModel.selectedModel = it
                }
                ModelChip("Haiku", AiRepository.MODEL_HAIKU, viewModel.selectedModel) {
                    viewModel.selectedModel = it
                }
            }
            Text(
                "Opus: most capable. Sonnet: balanced. Haiku: fastest replies.",
                style = MaterialTheme.typography.bodyMedium,
                color = JarvisTextDim
            )

            SectionLabel("VOICE RESPONSES")
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(
                    checked = voiceEnabled,
                    onCheckedChange = { voiceEnabled = it },
                    colors = SwitchDefaults.colors(checkedThumbColor = JarvisCyan)
                )
                Text(
                    if (voiceEnabled) "Spoken replies enabled" else "Text-only replies",
                    color = JarvisTextDim,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            Button(
                onClick = {
                    prefs.apiKey = apiKey.trim().ifBlank { null }
                    prefs.voiceEnabled = voiceEnabled
                    saved = true
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = JarvisCyan,
                    contentColor = JarvisBlack
                )
            ) {
                Text(if (saved) "SAVED" else "SAVE")
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(text, style = MaterialTheme.typography.labelSmall, color = JarvisCyan)
}

@Composable
private fun ModelChip(label: String, value: String, selected: String, onSelect: (String) -> Unit) {
    FilterChip(
        selected = selected == value,
        onClick = { onSelect(value) },
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = JarvisCyan,
            selectedLabelColor = JarvisBlack
        )
    )
}
