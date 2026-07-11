package com.jarvis.ai.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.font.FontFamily
import androidx.compose.ui.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp

private val HudFont = FontFamily.Monospace

val JarvisTypography = Typography(
    headlineMedium = TextStyle(
        fontFamily = HudFont,
        fontWeight = FontWeight.Bold,
        fontSize = 26.sp,
        letterSpacing = 4.sp
    ),
    titleLarge = TextStyle(
        fontFamily = HudFont,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        letterSpacing = 2.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = HudFont,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = HudFont,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        letterSpacing = 0.4.sp
    ),
    labelSmall = TextStyle(
        fontFamily = HudFont,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 1.5.sp
    )
)
