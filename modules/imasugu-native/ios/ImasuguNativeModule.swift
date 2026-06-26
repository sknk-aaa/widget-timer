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

// ★ 拡張側（targets/widget/Shared.swift）の TimerMetadata と完全一致させること。
//   ActivityKit は型名＋構造で Live Activity を照合するため、ズレると一致しない。
struct TimerMetadata: AlarmMetadata {
  let presetID: String?
  let icon: String
  let colorID: String
  let alarmID: String
}

private func tint(_ id: String) -> Color {
  switch id {
  case "red": return Color(red: 0.898, green: 0.282, blue: 0.302)
  case "orange": return Color(red: 0.925, green: 0.416, blue: 0.035)
  case "amber": return Color(red: 0.737, green: 0.455, blue: 0.0)
  case "lime": return Color(red: 0.435, green: 0.659, blue: 0.059)
  case "green": return Color(red: 0.118, green: 0.620, blue: 0.400)
  case "teal": return Color(red: 0.043, green: 0.557, blue: 0.557)
  case "cyan": return Color(red: 0.082, green: 0.576, blue: 0.753)
  case "blue": return Color(red: 0.231, green: 0.510, blue: 0.965)
  case "indigo": return Color(red: 0.388, green: 0.400, blue: 0.945)
  case "violet": return Color(red: 0.545, green: 0.361, blue: 0.965)
  case "fuchsia": return Color(red: 0.788, green: 0.169, blue: 0.808)
  case "pink": return Color(red: 0.859, green: 0.310, blue: 0.592)
  case "brown": return Color(red: 0.541, green: 0.353, blue: 0.169)
  default: return Color(red: 0.231, green: 0.510, blue: 0.965)
  }
}

// 端末ロケール（ja / それ以外=en）に応じた文言。AlarmKit 用。
private var isJaLocale: Bool { Locale.current.language.languageCode?.identifier == "ja" }
private func tx(_ ja: String, _ en: String) -> String { isJaLocale ? ja : en }
private func mlsr(_ s: String) -> LocalizedStringResource { LocalizedStringResource(stringLiteral: s) }
private func moduleHasBundledSound(_ name: String) -> Bool {
  name != "default" && !name.isEmpty &&
    Bundle.main.url(forResource: name, withExtension: "mp3") != nil
}

private func authString(_ s: AlarmManager.AuthorizationState) -> String {
  switch s {
  case .authorized: return "granted"
  case .denied: return "denied"
  default: return "undetermined"
  }
}

public class ImasuguNativeModule: Module {
  private var updatesTask: Task<Void, Never>?

  // StoreKit2: 直接の購入フロー外で届くトランザクション（中断・Ask to Buy 承認・
  // 別端末・ファミリー共有）を監視して finish する。起動時に開始すること（審査要件）。
  private func startTransactionListener() {
    updatesTask?.cancel()
    updatesTask = Task.detached {
      for await update in Transaction.updates {
        if case .verified(let transaction) = update {
          await transaction.finish()
        }
      }
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ImasuguNative")

    OnCreate { [weak self] in
      self?.startTransactionListener()
    }

    OnDestroy { [weak self] in
      self?.updatesTask?.cancel()
    }

    // ---- App Group ミラー ----
    Function("setSharedPresets") { (json: String) in
      UserDefaults(suiteName: kAppGroup)?.set(json.data(using: .utf8), forKey: kPresetsKey)
    }

    Function("setSharedRunning") { (json: String) in
      UserDefaults(suiteName: kAppGroup)?.set(json.data(using: .utf8), forKey: "shared_running_v1")
    }

    // ウィジェット/ロック画面から無音起動したぶんをアプリに取り込むため、
    // App Group の実行中モデルJSONをそのまま返す。
    Function("getSharedRunning") { () -> String in
      guard let data = UserDefaults(suiteName: kAppGroup)?.data(forKey: "shared_running_v1"),
            let json = String(data: data, encoding: .utf8) else { return "[]" }
      return json
    }

    Function("runningAlarmIds") { () -> [String] in
      let map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      return Array(map.keys)
    }

    // ウィジェット/通知で終了されたIDを取り出してクリア（アプリがドックから消す）。
    Function("takeCancelledIds") { () -> [String] in
      let ids = (UserDefaults(suiteName: kAppGroup)?.array(forKey: "cancelled_ids_v1") as? [String]) ?? []
      UserDefaults(suiteName: kAppGroup)?.removeObject(forKey: "cancelled_ids_v1")
      return ids
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
    AsyncFunction("scheduleTimer") { (timerId: String, durationSec: Int, icon: String, colorID: String, presetId: String?, sound: String) in
      NSLog("[Imasugu] scheduleTimer id=%@ dur=%d auth=%@", timerId, durationSec, "\(AlarmManager.shared.authorizationState)")
      let id = UUID(uuidString: timerId) ?? UUID()
      let stop = AlarmButton(text: mlsr(tx("終了", "Stop")), textColor: .white, systemImageName: "stop.fill")
      let pause = AlarmButton(text: mlsr(tx("一時停止", "Pause")), textColor: .white, systemImageName: "pause.fill")
      let resume = AlarmButton(text: mlsr(tx("再開", "Resume")), textColor: .white, systemImageName: "play.fill")
      let alert = AlarmPresentation.Alert(title: mlsr(tx("タイマー終了", "Time's up")), stopButton: stop)
      let countdown = AlarmPresentation.Countdown(title: mlsr(tx("カウントダウン", "Timer")), pauseButton: pause)
      let pausedP = AlarmPresentation.Paused(title: mlsr(tx("一時停止中", "Paused")), resumeButton: resume)
      let presentation = AlarmPresentation(alert: alert, countdown: countdown, paused: pausedP)
      let metadata = TimerMetadata(presetID: presetId, icon: icon, colorID: colorID, alarmID: id.uuidString.lowercased())
      let attributes = AlarmAttributes(presentation: presentation, metadata: metadata, tintColor: tint(colorID))
      let config = AlarmManager.AlarmConfiguration.timer(
        duration: TimeInterval(durationSec),
        attributes: attributes,
        sound: moduleHasBundledSound(sound) ? .named("\(sound).mp3") : .default
      )
      do {
        _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
        NSLog("[Imasugu] scheduleTimer OK id=%@", id.uuidString)
      } catch {
        NSLog("[Imasugu] scheduleTimer ERROR: %@", "\(error)")
        throw error
      }
      var map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      map[id.uuidString.lowercased()] = presetId ?? ""
      UserDefaults(suiteName: kAppGroup)?.set(map, forKey: kRunningMapKey)
    }

    AsyncFunction("pauseTimer") { (timerId: String) in
      guard let id = UUID(uuidString: timerId) else { return }
      try AlarmManager.shared.pause(id: id)
    }

    AsyncFunction("resumeTimer") { (timerId: String) in
      guard let id = UUID(uuidString: timerId) else { return }
      try AlarmManager.shared.resume(id: id)
    }

    AsyncFunction("cancel") { (timerId: String) in
      guard let id = UUID(uuidString: timerId) else { return }
      try AlarmManager.shared.cancel(id: id)
      var map = (UserDefaults(suiteName: kAppGroup)?.dictionary(forKey: kRunningMapKey) as? [String: String]) ?? [:]
      map.removeValue(forKey: id.uuidString.lowercased())
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
