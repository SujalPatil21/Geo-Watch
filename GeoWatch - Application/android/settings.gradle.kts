pluginManagement {
    val flutterSdkPath =
        run {
            val properties = java.util.Properties()
            val localProperties = file("local.properties")
            val rootLocalProperties = file("../local.properties")
            when {
                localProperties.exists() ->
                    localProperties.inputStream().use { properties.load(it) }
                rootLocalProperties.exists() ->
                    rootLocalProperties.inputStream().use { properties.load(it) }
            }
            val flutterSdkPath = properties.getProperty("flutter.sdk")
                ?: System.getenv("FLUTTER_ROOT")
            require(flutterSdkPath != null) {
                "flutter.sdk not set in local.properties and FLUTTER_ROOT is not set"
            }
            flutterSdkPath
        }

    includeBuild("$flutterSdkPath/packages/flutter_tools/gradle")

    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "8.11.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.20" apply false
}

include(":app")
