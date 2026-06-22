import ExpoModulesCore
import AlarmKit
import SwiftUI
import WidgetKit

// アプリ内から呼ぶネイティブブリッジ。
// 1) App Group へプリセットをミラー（Control/ウィジェットが読む）
// 2) アプリ内 AlarmKit スケジューリング・権限
//
// ※ TimerMetadata は Widget 拡張側（targets/widget/Shared.swift）と
//   「同一の型」である必要がある（Live Activity 一致のため）。
//   実機ビルド時に共有ファイル化 or 同一定義をターゲット両所属にする
//   こと（docs/NATIVE.md のターゲット共有タスク参照）。ここではアプリ
//   ターゲット用に同名定義を置く。

private let kAppGroup = "group.com.sknk.imasugutimer"
private let kPresetsKey = "shared_presets_v1"
private let kRunningMapKey = "running_alarm_map_v1"

struct AppTimerMetadata: AlarmMetadata {
  let presetID: String?
  let icon: String
  let colorID: String
}

private func tint(_ id: String) -> Color {
  switch id {
  case "red": return Color(red: 0.898, green: 0.282, blue: 0.302)
  case "orange": return Color(red: 0.925, green: 0.416, blue: 0.035)
  case "amber": return Color(red: 0.737, green: 0.455, blue: 0.0)
  case "green": return Color(red: 0.118, green: 0.620, blue: 0.400)
  case "teal": return Color(red: 0.043, green: 0.557, blue: 0.557)
  case "blue": return Color(red: 0.231, green: 0.510, blue: 0.965)
  case "indigo": return Color(red: 0.388, green: 0.400, blue: 0.945)
  case "pink": return Color(red: 0.859, green: 0.310, blue: 0.592)
  default: return Color(red: 0.231, green: 0.510, blue: 0.965)
  }
}

private func authString(_ s: AlarmManager.AuthorizationState) -> String {
  switch s {
  case .authorized: return "granted"
  case .denied: return "denied"
  default: return "undetermined"
  }
}

public class ImasuguNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ImasuguNative")

    // ---- App Group ミラー ----
    Function("setSharedPresets") { (json: String) in
      UserDefaults(suiteName: kAppGroup)?.set(json.data(using: .utf8), forKey: kPresetsKey)
    }

    Function("runningAlarmIds") { () -> [String] in
      let map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      return Array(map.keys)
    }

    Function("reloadWidgets") {
      WidgetCenter.shared.reloadAllTimelines()
    }

    // ---- AlarmKit 権限 ----
    AsyncFunction("getAuthorization") { () -> String in
      authString(AlarmManager.shared.authorizationState)
    }

    AsyncFunction("requestAuthorization") { () -> String in
      let state = try await AlarmManager.shared.requestAuthorization()
      return authString(state)
    }

    // ---- アプリ内スケジューリング（※ AlarmKit API は実機要検証）----
    AsyncFunction("scheduleTimer") { (timerId: String, durationSec: Int, icon: String, colorID: String, presetId: String?) in
      let id = UUID(uuidString: timerId) ?? UUID()
      let stop = AlarmButton(text: "停止", textColor: .white, systemImageName: "stop.fill")
      let alert = AlarmPresentation.Alert(title: "タイマー終了", stopButton: stop)
      let presentation = AlarmPresentation(alert: alert)
      let metadata = AppTimerMetadata(presetID: presetId, icon: icon, colorID: colorID)
      let attributes = AlarmAttributes(presentation: presentation, metadata: metadata, tintColor: tint(colorID))
      let config = AlarmManager.AlarmConfiguration.timer(duration: TimeInterval(durationSec), attributes: attributes)
      _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
      var map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      map[id.uuidString] = presetId ?? ""
      UserDefaults(suiteName: kAppGroup)?.set(map, forKey: kRunningMapKey)
    }

    AsyncFunction("cancel") { (timerId: String) in
      guard let id = UUID(uuidString: timerId) else { return }
      try AlarmManager.shared.cancel(id: id)
      var map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      map.removeValue(forKey: id.uuidString)
      UserDefaults(suiteName: kAppGroup)?.set(map, forKey: kRunningMapKey)
    }

    AsyncFunction("stopAll") {
      let map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      for key in map.keys {
        if let id = UUID(uuidString: key) { try? AlarmManager.shared.cancel(id: id) }
      }
      UserDefaults(suiteName: kAppGroup)?.removeObject(forKey: kRunningMapKey)
    }
  }
}
