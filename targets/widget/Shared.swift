import Foundation
import SwiftUI
import AlarmKit

// アプリと拡張で共有する定数・モデル。
// 注意: iOS 26 / AlarmKit は新しく、本ファイルは TestFlight 実機での
// コンパイル確認が前提（API 名は要検証。docs/NATIVE.md 参照）。

enum Shared {
    static let appGroup = "group.com.sknk.imasugutimer"
    static let presetsKey = "shared_presets_v1" // JSON 配列（アプリ側がミラー）
    static let runningMapKey = "running_alarm_map_v1" // alarmID -> presetID

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
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

/// AlarmKit のメタデータ（アプリ・拡張の両ターゲットに含める）。
struct TimerMetadata: AlarmMetadata {
    let presetID: String?
    let icon: String
    let colorID: String

    init(presetID: String?, icon: String, colorID: String) {
        self.presetID = presetID
        self.icon = icon
        self.colorID = colorID
    }
}
