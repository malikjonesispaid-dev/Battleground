package com.malikjones.sniperasm.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val SniperGreen = Color(0xFF39FF88)
val SniperBlack = Color(0xFF0D1117)
val SniperSurfaceDark = Color(0xFF161B22)
val SniperWhite = Color(0xFFF5F7FA)

val SeverityCritical = Color(0xFF7A0916)
val SeverityHigh = Color(0xFFC1121F)
val SeverityMedium = Color(0xFFE07A00)
val SeverityLow = Color(0xFF2A7DE1)
val SeverityInfo = Color(0xFF6C757D)

private val DarkColors = darkColorScheme(
    primary = SniperGreen,
    onPrimary = SniperBlack,
    background = SniperBlack,
    surface = SniperSurfaceDark,
    onBackground = SniperWhite,
    onSurface = SniperWhite
)

private val LightColors = lightColorScheme(
    primary = SniperBlack,
    onPrimary = SniperWhite,
    background = SniperWhite,
    surface = Color.White
)

@Composable
fun SniperAsmTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(colorScheme = colors, content = content)
}
