package com.jarvis.ai.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.withTransform
import com.jarvis.ai.ui.theme.JarvisBlack
import com.jarvis.ai.ui.theme.JarvisCyan
import com.jarvis.ai.ui.theme.JarvisCyanFaint
import kotlin.math.min

/**
 * Full-screen sci-fi HUD backdrop: subtle grid, slow radar sweep, vignette.
 */
@Composable
fun HudBackground(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "hud")
    val sweepAngle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(9000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sweep"
    )

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(JarvisCyanFaint.copy(alpha = 0.18f), JarvisBlack),
                    radius = 1400f
                )
            )
    ) {
        val center = Offset(size.width / 2f, size.height / 2f)
        val radius = min(size.width, size.height) * 0.72f

        // concentric rings
        for (i in 1..4) {
            drawCircle(
                color = JarvisCyan.copy(alpha = 0.06f),
                radius = radius * (i / 4f),
                center = center,
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1f)
            )
        }

        // grid lines
        val step = 64f
        var x = 0f
        while (x < size.width) {
            drawLine(
                JarvisCyan.copy(alpha = 0.035f),
                Offset(x, 0f),
                Offset(x, size.height),
                strokeWidth = 1f
            )
            x += step
        }
        var y = 0f
        while (y < size.height) {
            drawLine(
                JarvisCyan.copy(alpha = 0.035f),
                Offset(0f, y),
                Offset(size.width, y),
                strokeWidth = 1f
            )
            y += step
        }

        // rotating radar sweep wedge
        withTransform({ rotate(sweepAngle, pivot = center) }) {
            drawArc(
                brush = Brush.sweepGradient(
                    colors = listOf(
                        JarvisCyan.copy(alpha = 0f),
                        JarvisCyan.copy(alpha = 0.16f)
                    ),
                    center = center
                ),
                startAngle = 0f,
                sweepAngle = 70f,
                useCenter = true,
                topLeft = Offset(center.x - radius, center.y - radius),
                size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2)
            )
        }
    }
}
