import WidgetKit
import SwiftUI
import AppIntents

// ホーム画面ウィジェット。
// 実行中タイマーがあれば残り時間をカウントダウン表示、無ければプリセットのボタンを表示。

struct PresetEntry: TimelineEntry {
    let date: Date
    let presets: [SharedPreset]
    let running: [SharedRunning]
}

struct PresetProvider: TimelineProvider {
    func placeholder(in context: Context) -> PresetEntry {
        PresetEntry(date: Date(), presets: [], running: [])
    }
    func getSnapshot(in context: Context, completion: @escaping (PresetEntry) -> Void) {
        completion(PresetEntry(date: Date(), presets: Shared.widgetPresets(), running: Shared.loadRunning()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PresetEntry>) -> Void) {
        let running = Shared.loadRunning()
        let entry = PresetEntry(date: Date(), presets: Shared.widgetPresets(), running: running)
        // 最も早い終了時刻でタイムラインを更新（終了後は待機表示に戻す）。
        if let soonest = running.map({ $0.endDate }).min(), soonest > Date() {
            completion(Timeline(entries: [entry], policy: .after(soonest)))
        } else {
            completion(Timeline(entries: [entry], policy: .never))
        }
    }
}

struct PresetWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PresetEntry

    var body: some View {
        let active = entry.running.filter { $0.endDate > Date() || $0.state == "paused" }
        if !active.isEmpty {
            RunningView(running: active, small: family == .systemSmall)
        } else {
            WaitingView(presets: entry.presets, small: family == .systemSmall)
        }
    }
}

private struct RunningView: View {
    let running: [SharedRunning]
    let small: Bool
    var body: some View {
        let items = Array(running.prefix(small ? 2 : 4))
        VStack(spacing: 8) {
            ForEach(items) { r in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(paletteColor(r.color))
                        .frame(width: 30, height: 30)
                        .overlay(
                            Image(systemName: iconToSymbol(r.icon))
                                .foregroundStyle(.white)
                                .font(.system(size: 14, weight: .semibold))
                        )
                    if r.state == "paused" {
                        Text(Duration.seconds(r.pausedRemainingSec ?? 0).formatted(.time(pattern: .minuteSecond)))
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    } else {
                        Text(timerInterval: Date.now...r.endDate, countsDown: true)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .monospacedDigit()
                    }
                    Spacer()
                }
            }
            Spacer(minLength: 0)
        }
        .padding(4)
    }
}

private struct WaitingView: View {
    let presets: [SharedPreset]
    let small: Bool

    var body: some View {
        let shown = Array(presets.prefix(small ? 4 : 8))
        if shown.isEmpty {
            VStack(spacing: 6) {
                Image(systemName: "timer").font(.title2).foregroundStyle(.secondary)
                Text("プリセットを追加").font(.caption).foregroundStyle(.secondary)
            }
        } else {
            let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: small ? 2 : 4)
            LazyVGrid(columns: columns, spacing: 10) {
                ForEach(shown) { p in
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
        .description("プリセット起動と実行中のカウントダウン")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
