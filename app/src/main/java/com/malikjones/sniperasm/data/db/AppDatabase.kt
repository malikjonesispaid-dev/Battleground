package com.malikjones.sniperasm.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters
import com.malikjones.sniperasm.data.db.dao.ScanDao
import com.malikjones.sniperasm.data.db.entities.Finding
import com.malikjones.sniperasm.data.db.entities.HostResult
import com.malikjones.sniperasm.data.db.entities.PortResult
import com.malikjones.sniperasm.data.db.entities.ScanSession
import com.malikjones.sniperasm.data.db.entities.ScanStatus
import com.malikjones.sniperasm.data.db.entities.Severity

class Converters {
    @TypeConverter
    fun fromScanStatus(value: ScanStatus): String = value.name

    @TypeConverter
    fun toScanStatus(value: String): ScanStatus = ScanStatus.valueOf(value)

    @TypeConverter
    fun fromSeverity(value: Severity): String = value.name

    @TypeConverter
    fun toSeverity(value: String): Severity = Severity.valueOf(value)
}

@Database(
    entities = [ScanSession::class, HostResult::class, PortResult::class, Finding::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun scanDao(): ScanDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "sniperasm.db"
                ).build().also { INSTANCE = it }
            }
    }
}
