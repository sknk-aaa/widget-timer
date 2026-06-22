import WidgetKit
import SwiftUI
import AppIntents

// ホーム画面ウィジェット（待機状態）。ウィジェット対象プリセットをボタン表示し、
// タップでアプリを開かず起動する（Button(intent:) / iOS 17+）。
// ※ 実行中状態（Text(timerInterval:)＋キャンセル）は実機検証後に追加（docs/NATIVE.md）。

struct PresetEntry: TimelineEntry {
    let date: Date
    let presets: [SharedPreset]
}

struct PresetProvider: TimelineProvider {
    func placeholder(in context: Context) -> PresetEntry {
        PresetEntry(date: Date(), presets: [])
    }
    func getSnapshot(in context: Context, completion: @escaping (PresetEntry) -> Void) {
        completion(PresetEntry(date: Date(), presets: Shared.widgetPresets()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PresetEntry>) -> Void) {
        let entry = PresetEntry(date: Date(), presets: Shared.widgetPresets())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

struct PresetWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PresetEntry

    var maxCount: Int { family == .systemSmall ? 4 : 8 }

    var body: some View {
        let presets = Array(entry.presets.prefix(maxCount))
        if presets.isEmpty {
            VStack(spacing: 6) {
                Image(systemName: "timer").font(.title2).foregroundStyle(.secondary)
                Text("プリセットを追加").font(.caption).foregroundStyle(.secondary)
            }
        } else {
            let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: family == .systemSmall ? 2 : 4)
            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(presets) { p in
                    Button(intent: StartPresetTimerIntent(presetID: p.id)) {
                        VStack(spacing: 3) {
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .fill(paletteColor(p.color))
                                .aspectRatio(1, contentMode: .fit)
                                .overlay(
                                    Image(systemName: iconToSymbol(p.icon))
                                        .foregroundStyle(.white)
                                        .font(.system(size: 18, weight: .semibold))
                                )
                            Text(durationLabel(p.durationSec))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(4)
        }
    }
}

struct PresetWidget: Widget {
    static let kind = "com.sknk.imasugutimer.PresetWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: Self.kind, provider: PresetProvider()) { entry in
            PresetWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("今すぐタイマー")
        .description("プリセットをワンタップで起動")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
