package com.jarvis.ai.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.dp
import com.jarvis.ai.ui.theme.JarvisAmber
import com.jarvis.ai.ui.theme.JarvisCyan
import com.jarvis.ai.viewmodel.JarvisState
import kotlin.math.sin

/**
 * The animated arc-reactor style core at the heart of the app. Its motion
 * language communicates state: slow breathing when idle, tight fast pulse
 * while listening, spinning rings while thinking, rippling while speaking.
 */
@Composable
fun ReactorCore(
    state: JarvisState,
    amplitude: Float,
    modifier: Modifier = Modifier
) {
    val infinite = rememberInfiniteTransition(label = "reactor")

    val breathe by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2600, easing = LinearEasing), RepeatMode.Reverse),
        label = "breathe"
    )

    val spin by infinite.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            tween(if (state == JarvisState.THINKING) 900 else 6000, easing = LinearEasing),
            RepeatMode.Restart
        ),
        label = "spin"
    )

    val counterSpin by infinite.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(tween(4200, easing = LinearEasing), RepeatMode.Restart),
        label = "counterSpin"
    )

    val color = when (state) {
        JarvisState.IDLE -> JarvisCyan
        JarvisState.LISTENING -> JarvisCyan
        JarvisState.THINKING -> JarvisAmber
        JarvisState.SPEAKING -> JarvisCyan
    }

    Canvas(modifier = modifier.size(240.dp)) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val baseRadius = size.minDimension / 2f * 0.9f

        val pulse = when (state) {
            JarvisState.IDLE -> 0.94f + breathe * 0.06f
            JarvisState.LISTENING -> 0.9f + amplitude.coerceIn(0f, 1f) * 0.22f
            JarvisState.THINKING -> 0.96f + breathe * 0.04f
            JarvisState.SPEAKING -> 0.92f + (sin(breathe * Math.PI).toFloat()) * 0.14f
        }

        // outer glow
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(color.copy(alpha = 0.32f), color.copy(alpha = 0f)),
                center = center,
                radius = baseRadius * pulse * 1.7f
            ),
            radius = baseRadius * pulse * 1.7f,
            center = center
        )

        // outer HUD ring with tick marks, slowly rotating
        rotate(spin, pivot = center) {
            drawCircle(
                color = color.copy(alpha = 0.5f),
                radius = baseRadius * pulse,
                center = center,
                style = Stroke(width = 2.5f)
            )
            for (i in 0 until 24) {
                val angle = (i * 15f) * (Math.PI / 180f)
                val r1 = baseRadius * pulse
                val r2 = r1 + if (i % 3 == 0) 10f else 5f
                val x1 = center.x + (r1 * kotlin.math.cos(angle)).toFloat()
                val y1 = center.y + (r1 * kotlin.math.sin(angle)).toFloat()
                val x2 = center.x + (r2 * kotlin.math.cos(angle)).toFloat()
                val y2 = center.y + (r2 * kotlin.math.sin(angle)).toFloat()
                drawLine(color.copy(alpha = 0.65f), Offset(x1, y1), Offset(x2, y2), strokeWidth = 2f)
            }
        }

        // middle ring, counter-rotating
        rotate(counterSpin, pivot = center) {
            drawCircle(
                color = color.copy(alpha = 0.8f),
                radius = baseRadius * pulse * 0.68f,
                center = center,
                style = Stroke(width = 2f, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(18f, 14f)))
            )
        }

        // inner core
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(color.copy(alpha = 1f), color.copy(alpha = 0.25f)),
                center = center,
                radius = baseRadius * pulse * 0.34f
            ),
            radius = baseRadius * pulse * 0.34f,
            center = center
        )

        drawCircle(
            color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.9f),
            radius = baseRadius * pulse * 0.12f,
            center = center
        )
    }
}
