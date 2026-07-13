package com.malikjones.sniperasm

import android.app.Application

class SniperAsmApp : Application() {
    override fun onCreate() {
        super.onCreate()
        AppContainer.init(this)
    }
}
