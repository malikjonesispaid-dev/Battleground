package com.malikjones.sniperasm

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.malikjones.sniperasm.ui.disclaimer.DisclaimerScreen
import com.malikjones.sniperasm.ui.nav.SniperAsmNavHost
import com.malikjones.sniperasm.ui.theme.SniperAsmTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SniperAsmTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val scope = rememberCoroutineScope()
                    val disclaimerAccepted by AppContainer.preferences.disclaimerAccepted
                        .collectAsStateWithLifecycle(initialValue = false)

                    if (disclaimerAccepted) {
                        SniperAsmNavHost()
                    } else {
                        DisclaimerScreen(onAccept = {
                            scope.launch { AppContainer.preferences.setDisclaimerAccepted(true) }
                        })
                    }
                }
            }
        }
    }
}
