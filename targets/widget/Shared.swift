import Foundation
import SwiftUI
import AlarmKit

// アプリと拡張で共有する定数・モデル。
// 注意: iOS 26 / AlarmKit は新しく、本ファイルは TestFlight 実機での
// コンパイル確認が前提（API 名は要検証。docs/NATIVE.md 参照）。

// アプリ(JS)のタイマーIDは小文字UUID。Swift の uuidString は大文字なので、
// App Group 上のID比較/書き込みは必ず小文字に正規化して一致させる。
extension UUID {
    var lower: String { uuidString.lowercased() }
}

enum Shared {
    static let appGroup = "group.com.sknk.imasugutimer"
    static let presetsKey = "shared_presets_v1" // JSON 配列（アプリ側がミラー）
    static let runningKey = "shared_running_v1" // 実行中タイマー JSON 配列
    static let runningMapKey = "running_alarm_map_v1" // alarmID -> presetID
    static let cancelledKey = "cancelled_ids_v1" // ウィジェット/通知で終了したID（アプリが取り込んでドックから消す）
    static let soundKey = "alert_sound_v1" // アラート音ID（default / bell / chime / marimba）

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    static func alertSound() -> String {
        defaults?.string(forKey: soundKey) ?? "default"
    }
}

// 端末ロケールに応じた文言（ja / それ以外=en）。AlarmKit/Live Activity 用。
enum LX {
    static var isJa: Bool { Locale.current.language.languageCode?.identifier == "ja" }
    static var stop: String { isJa ? "終了" : "Stop" }
    static var pause: String { isJa ? "一時停止" : "Pause" }
    static var resume: String { isJa ? "再開" : "Resume" }
    static var alertTitle: String { isJa ? "タイマー終了" : "Time's up" }
    static var countdownTitle: String { isJa ? "カウントダウン" : "Timer" }
    static var pausedTitle: String { isJa ? "一時停止中" : "Paused" }
    static var finished: String { isJa ? "終了" : "Done" }
    static func endsAt(_ time: String) -> String { isJa ? "終了 \(time)" : "Ends \(time)" }
}

func lsr(_ s: String) -> LocalizedStringResource { LocalizedStringResource(stringLiteral: s) }

/// 指定音IDがバンドルに存在するか（無ければ .default を使う側で判定）。
func hasBundledSound(_ name: String) -> Bool {
    name != "default" && !name.isEmpty &&
        Bundle.main.url(forResource: name, withExtension: "mp3") != nil
}

/// 実行中タイマーの読み取りモデル（ホームウィジェットのカウントダウン用）。
struct SharedRunning: Codable, Identifiable {
    let id: String
    let endAt: Double // epoch ms
    let icon: String
    let color: String
    let state: String // running | paused | finished
    let durationSec: Int
    let pausedRemainingSec: Int?

    var endDate: Date { Date(timeIntervalSince1970: endAt / 1000) }
}

extension Shared {
    static func loadRunning() -> [SharedRunning] {
        guard let data = defaults?.data(forKey: runningKey) else { return [] }
        let all = (try? JSONDecoder().decode([SharedRunning].self, from: data)) ?? []
        return all.filter { $0.state != "finished" }.sorted { $0.endAt < $1.endAt }
    }
}

/// App Group にミラーされるプリセットの読み取りモデル。
struct SharedPreset: Codable, Identifiable, Hashable {
    let id: String
    let icon: String
    let color: String // パレットID
    let durationSec: Int
    let inWidget: Bool
    let sortOrder: Int
}

extension Shared {
    static func loadPresets() -> [SharedPreset] {
        guard let data = defaults?.data(forKey: presetsKey) else { return [] }
        return (try? JSONDecoder().decode([SharedPreset].self, from: data)) ?? []
    }

    static func widgetPresets() -> [SharedPreset] {
        loadPresets().filter { $0.inWidget }.sorted { $0.sortOrder < $1.sortOrder }
    }

    static func preset(id: String) -> SharedPreset? {
        loadPresets().first { $0.id == id }
    }
}

/// パレットID → 表示色（アプリの domain/colors.ts と一致させる）。
func paletteColor(_ id: String) -> Color {
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

/// AlarmKit のメタデータ。
/// ★ Expoモジュール側（modules/imasugu-native/ios/ImasuguNativeModule.swift）の
///   TimerMetadata と「同名・同フィールド・同順」で完全一致させること。
///   ActivityKit は型名＋構造で Live Activity を照合するため、ズレると一致しない。
struct TimerMetadata: AlarmMetadata {
    let presetID: String?
    let icon: String
    let colorID: String
    let alarmID: String
}

func durationLabel(_ sec: Int) -> String {
    let d = sec / 86400, h = (sec % 86400) / 3600, m = (sec % 3600) / 60, s = sec % 60
    if d > 0 { return "\(d)日" }
    if h > 0 { return m > 0 ? "\(h)時間\(m)分" : "\(h)時間" }
    if m > 0 { return "\(m)分" }
    return "\(s)秒"
}

/// 自作の白アイコンID → ウィジェット/Live Activity で使える SF Symbol の近似。
func iconToSymbol(_ icon: String) -> String {
    switch icon {
    case "ramen", "pot", "rice": return "fork.knife"
    case "coffee", "tea", "kettle": return "cup.and.saucer.fill"
    case "egg", "toast": return "frying.pan.fill"
    case "bed", "moon", "nap": return "bed.double.fill"
    case "alarm": return "alarm.fill"
    case "book", "pencil": return "book.fill"
    case "laptop": return "laptopcomputer"
    case "hourglass": return "hourglass"
    case "briefcase": return "briefcase.fill"
    case "dumbbell", "run", "yoga", "bike": return "figure.run"
    case "washer", "broom", "dishes", "iron": return "washer.fill"
    case "plant": return "leaf.fill"
    case "bath": return "shower.fill"
    case "pill": return "pills.fill"
    case "dog": return "pawprint.fill"
    case "car": return "car.fill"
    case "music": return "music.note"
    case "bell": return "bell.fill"
    default: return "timer"
    }
}
