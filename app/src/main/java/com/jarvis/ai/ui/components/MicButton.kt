package com.jarvis.ai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.jarvis.ai.ui.theme.JarvisBlack
import com.jarvis.ai.ui.theme.JarvisCyan
import com.jarvis.ai.ui.theme.JarvisRed
import com.jarvis.ai.viewmodel.JarvisState

@Composable
fun MicButton(
    state: JarvisState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val listening = state == JarvisState.LISTENING
    val accent = if (listening) JarvisRed else JarvisCyan
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = modifier
            .size(72.dp)
            .clip(CircleShape)
            .background(JarvisBlack)
            .border(2.dp, accent, CircleShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (listening) Icons.Filled.Stop else Icons.Filled.Mic,
            contentDescription = if (listening) "Stop listening" else "Start listening",
            tint = accent,
            modifier = Modifier.size(30.dp)
        )
    }
}
