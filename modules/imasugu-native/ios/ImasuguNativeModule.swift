import ExpoModulesCore
import AlarmKit
import SwiftUI
import WidgetKit
import StoreKit

@MainActor
private func hasEntitlement(_ productId: String) async -> Bool {
  for await result in Transaction.currentEntitlements {
    if case .verified(let t) = result, t.productID == productId, t.revocationDate == nil {
      return true
    }
  }
  return false
}

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

    Function("setSharedRunning") { (json: String) in
      UserDefaults(suiteName: kAppGroup)?.set(json.data(using: .utf8), forKey: "shared_running_v1")
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
      NSLog("[Imasugu] scheduleTimer id=%@ dur=%d auth=%@", timerId, durationSec, "\(AlarmManager.shared.authorizationState)")
      let id = UUID(uuidString: timerId) ?? UUID()
      let stop = AlarmButton(text: "終了", textColor: .white, systemImageName: "stop.fill")
      let pause = AlarmButton(text: "一時停止", textColor: .white, systemImageName: "pause.fill")
      let resume = AlarmButton(text: "再開", textColor: .white, systemImageName: "play.fill")
      let alert = AlarmPresentation.Alert(title: "タイマー終了", stopButton: stop)
      let countdown = AlarmPresentation.Countdown(title: "カウントダウン", pauseButton: pause)
      let pausedP = AlarmPresentation.Paused(title: "一時停止中", resumeButton: resume)
      let presentation = AlarmPresentation(alert: alert, countdown: countdown, paused: pausedP)
      let metadata = AppTimerMetadata(presetID: presetId, icon: icon, colorID: colorID)
      let attributes = AlarmAttributes(presentation: presentation, metadata: metadata, tintColor: tint(colorID))
      let config = AlarmManager.AlarmConfiguration.timer(duration: TimeInterval(durationSec), attributes: attributes)
      do {
        _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
        NSLog("[Imasugu] scheduleTimer OK id=%@", id.uuidString)
      } catch {
        NSLog("[Imasugu] scheduleTimer ERROR: %@", "\(error)")
        throw error
      }
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

    // ---- StoreKit 2（買い切り非消耗型）----
    AsyncFunction("getProduct") { (productId: String) -> [String: Any]? in
      let products = try await Product.products(for: [productId])
      guard let p = products.first else { return nil }
      return ["id": p.id, "displayPrice": p.displayPrice, "displayName": p.displayName, "description": p.description]
    }

    AsyncFunction("purchaseProduct") { (productId: String) -> String in
      let products = try await Product.products(for: [productId])
      guard let product = products.first else { return "unavailable" }
      let result = try await product.purchase()
      switch result {
      case .success(let verification):
        if case .verified(let transaction) = verification {
          await transaction.finish()
          return "purchased"
        }
        return "unverified"
      case .userCancelled: return "cancelled"
      case .pending: return "pending"
      @unknown default: return "unknown"
      }
    }

    AsyncFunction("restorePurchases") { (productId: String) -> Bool in
      try? await AppStore.sync()
      return await hasEntitlement(productId)
    }

    AsyncFunction("isProPurchased") { (productId: String) -> Bool in
      await hasEntitlement(productId)
    }
  }
}
