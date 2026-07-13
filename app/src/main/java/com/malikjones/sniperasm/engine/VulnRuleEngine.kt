package com.malikjones.sniperasm.engine

import android.content.Context
import com.malikjones.sniperasm.data.db.entities.Severity
import org.json.JSONArray

data class VulnRule(
    val product: String,
    val versionBefore: String?,
    val cve: String,
    val severity: Severity,
    val description: String,
    val recommendation: String
)

object VulnRuleEngine {

    @Volatile private var rules: List<VulnRule> = emptyList()
    @Volatile private var loaded = false

    fun ensureLoaded(context: Context) {
        if (loaded) return
        synchronized(this) {
            if (loaded) return
            rules = try {
                val text = context.assets.open("vuln_rules.json").bufferedReader().use { it.readText() }
                parseRules(text)
            } catch (e: Exception) {
                emptyList()
            }
            loaded = true
        }
    }

    private fun parseRules(text: String): List<VulnRule> {
        val array = JSONArray(text)
        val result = mutableListOf<VulnRule>()
        for (i in 0 until array.length()) {
            val o = array.getJSONObject(i)
            val versionBefore = if (o.has("versionBefore") && !o.isNull("versionBefore")) {
                o.getString("versionBefore")
            } else null
            result.add(
                VulnRule(
                    product = o.getString("product"),
                    versionBefore = versionBefore,
                    cve = o.getString("cve"),
                    severity = Severity.valueOf(o.getString("severity")),
                    description = o.getString("description"),
                    recommendation = o.optString("recommendation", "")
                )
            )
        }
        return result
    }

    fun match(product: String?, version: String?): List<VulnRule> {
        if (product == null) return emptyList()
        return rules.filter { rule ->
            rule.product.equals(product, ignoreCase = true) &&
                (rule.versionBefore == null || (version != null && compareVersions(version, rule.versionBefore) < 0))
        }
    }

    private fun compareVersions(a: String, b: String): Int {
        val partsA = a.split(".", "-", "_", "p").mapNotNull { it.toIntOrNull() }
        val partsB = b.split(".", "-", "_", "p").mapNotNull { it.toIntOrNull() }
        val len = maxOf(partsA.size, partsB.size)
        for (i in 0 until len) {
            val x = partsA.getOrElse(i) { 0 }
            val y = partsB.getOrElse(i) { 0 }
            if (x != y) return x.compareTo(y)
        }
        return 0
    }
}
