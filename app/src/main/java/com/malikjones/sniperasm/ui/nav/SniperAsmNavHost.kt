package com.malikjones.sniperasm.ui.nav

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.malikjones.sniperasm.ui.dashboard.DashboardScreen
import com.malikjones.sniperasm.ui.newscan.NewScanScreen
import com.malikjones.sniperasm.ui.scandetail.ScanDetailScreen
import com.malikjones.sniperasm.ui.settings.SettingsScreen

private const val ROUTE_DASHBOARD = "dashboard"
private const val ROUTE_NEW_SCAN = "new_scan"
private const val ROUTE_SETTINGS = "settings"
private const val ROUTE_SCAN_DETAIL = "scan_detail/{sessionId}"

@Composable
fun SniperAsmNavHost(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = ROUTE_DASHBOARD) {
        composable(ROUTE_DASHBOARD) {
            DashboardScreen(
                onNewScan = { navController.navigate(ROUTE_NEW_SCAN) },
                onOpenScan = { id -> navController.navigate("scan_detail/$id") },
                onSettings = { navController.navigate(ROUTE_SETTINGS) }
            )
        }
        composable(ROUTE_NEW_SCAN) {
            NewScanScreen(
                onScanStarted = { id ->
                    navController.navigate("scan_detail/$id") {
                        popUpTo(ROUTE_NEW_SCAN) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }
        composable(
            ROUTE_SCAN_DETAIL,
            arguments = listOf(navArgument("sessionId") { type = NavType.LongType })
        ) { backStackEntry ->
            val sessionId = backStackEntry.arguments?.getLong("sessionId") ?: -1L
            ScanDetailScreen(sessionId = sessionId, onBack = { navController.popBackStack() })
        }
        composable(ROUTE_SETTINGS) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
