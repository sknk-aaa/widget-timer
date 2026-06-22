import AppIntents
import SwiftUI
import WidgetKit

// iOS 18+ コントロール（コントロールセンター / ロック画面 / アクションボタン）。
// 設定で「どのプリセットを起動するか」を選び、タップでアプリを開かず起動する。

/// 設定ピッカー用のプリセットエンティティ。
struct PresetEntity: AppEntity {
    let id: String
    let label: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "プリセット"
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(label)") }

    static var defaultQuery = PresetQuery()
}

struct PresetQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [PresetEntity] {
        Shared.loadPresets()
            .filter { identifiers.contains($0.id) }
            .map { PresetEntity(id: $0.id, label: durationLabel($0.durationSec)) }
    }

    func suggestedEntities() async throws -> [PresetEntity] {
        Shared.widgetPresets().map { PresetEntity(id: $0.id, label: durationLabel($0.durationSec)) }
    }
}

/// コントロールの設定 Intent（起動するプリセットを選ぶ）。
struct SelectPresetConfiguration: ControlConfigurationIntent {
    static var title: LocalizedStringResource = "起動するタイマー"

    @Parameter(title: "プリセット")
    var preset: PresetEntity?
}

struct StartTimerControl: ControlWidget {
    static let kind = "com.sknk.imasugutimer.StartTimerControl"

    var body: some ControlWidgetConfiguration {
        AppIntentControlConfiguration(kind: Self.kind, provider: Provider()) { value in
            ControlWidgetButton(action: StartPresetTimerIntent(presetID: value.presetID)) {
                Label(value.label, systemImage: value.symbol)
            }
            .tint(paletteColor(value.colorID))
        }
        .displayName("タイマーを開始")
        .description("プリセットをワンタップで起動")
    }

    struct Value {
        var presetID: String
        var label: String
        var symbol: String
        var colorID: String
    }

    struct Provider: AppIntentControlValueProvider {
        func previewValue(configuration: SelectPresetConfiguration) -> Value {
            Value(presetID: "", label: "3分", symbol: "timer", colorID: "orange")
        }

        func currentValue(configuration: SelectPresetConfiguration) async throws -> Value {
            // 設定で選ばれたプリセット。無ければ先頭のウィジェット対象を既定に。
            let chosen = configuration.preset?.id
            let preset = (chosen.flatMap { Shared.preset(id: $0) }) ?? Shared.widgetPresets().first
            if let p = preset {
                return Value(
                    presetID: p.id,
                    label: durationLabel(p.durationSec),
                    symbol: iconToSymbol(p.icon),
                    colorID: p.color
                )
            }
            return Value(presetID: "", label: "タイマー", symbol: "timer", colorID: "blue")
        }
    }
}

func durationLabel(_ sec: Int) -> String {
    let d = sec / 86400, h = (sec % 86400) / 3600, m = (sec % 3600) / 60, s = sec % 60
    if d > 0 { return "\(d)日" }
    if h > 0 { return m > 0 ? "\(h)時間\(m)分" : "\(h)時間" }
    if m > 0 { return "\(m)分" }
    return "\(s)秒"
}

/// 自作の白アイコンID → コントロール/ウィジェットで使える SF Symbol の近似。
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
