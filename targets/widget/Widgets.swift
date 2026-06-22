import WidgetKit
import SwiftUI
import AppIntents

// ホーム画面ウィジェット＋ロック画面ウィジェット（accessory）。
// 実行中タイマーがあれば残り時間をカウントダウン表示。ホームはプリセット起動ボタン、
// ロック画面はタップでアプリを開く（accessory はモノクロ寄りレンダリング）。

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
        let presets = Shared.widgetPresets()
        let now = Date()
        // 現在＋各タイマーの終了直後にエントリを置き、終了時に idle 表示へ確実に戻す。
        var dates: [Date] = [now]
        for r in running where r.state == "running" && r.endDate > now {
            dates.append(r.endDate.addingTimeInterval(1))
        }
        let entries = dates.sorted().map { PresetEntry(date: $0, presets: presets, running: running) }
        completion(Timeline(entries: entries, policy: .never))
    }
}

private func activeRunning(_ running: [SharedRunning], asOf: Date) -> [SharedRunning] {
    running.filter { $0.endDate > asOf || $0.state == "paused" }
}

struct PresetWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: PresetEntry

    var body: some View {
        switch family {
        case .accessoryRectangular, .accessoryCircular, .accessoryInline:
            // ロック画面：タップでアプリを開かず無音起動（ロック解除不要）。
            AccessoryView(entry: entry)
        default:
            HomeView(entry: entry, small: family == .systemSmall)
        }
    }
}

// MARK: - ホーム画面

private struct HomeView: View {
    let entry: PresetEntry
    let small: Bool
    var body: some View {
        let active = activeRunning(entry.running, asOf: entry.date)
        if !active.isEmpty {
            RunningView(running: active, small: small)
        } else {
            WaitingView(presets: entry.presets, small: small)
        }
    }
}

private struct RunningView: View {
    let running: [SharedRunning]
    let small: Bool
    var body: some View {
        VStack(spacing: 8) {
            ForEach(Array(running.prefix(small ? 2 : 4))) { r in
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
                        Text(Duration.seconds(Double(r.pausedRemainingSec ?? 0)).formatted(.time(pattern: .minuteSecond)))
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
                    // タップでアプリを開き、メイン画面のまま起動（別画面を挟まない）
                    Link(destination: URL(string: "imasugutimer://?start=\(p.id)")!) {
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
                }
            }
            .padding(4)
        }
    }
}

// MARK: - ロック画面（accessory）

private struct AccessoryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PresetEntry

    var body: some View {
        let soonest = activeRunning(entry.running, asOf: entry.date).first
        switch family {
        case .accessoryInline:
            if let r = soonest, r.state != "paused" {
                Text("残り ") + Text(timerInterval: Date.now...r.endDate, countsDown: true)
            } else {
                Text("今すぐタイマー")
            }
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                if let r = soonest, r.state != "paused" {
                    Text(timerInterval: Date.now...r.endDate, countsDown: true)
                        .font(.system(size: 12, weight: .bold))
                        .monospacedDigit()
                        .multilineTextAlignment(.center)
                } else if let p = entry.presets.first {
                    // タップで先頭プリセットを無音起動
                    Button(intent: StartPresetTimerIntent(presetID: p.id)) {
                        VStack(spacing: 0) {
                            Image(systemName: iconToSymbol(p.icon)).font(.caption)
                            Text(durationLabel(p.durationSec)).font(.system(size: 9, weight: .semibold))
                        }
                    }
                    .buttonStyle(.plain)
                } else {
                    Image(systemName: "timer").font(.title3)
                }
            }
        default: // accessoryRectangular
            if let r = soonest {
                HStack(spacing: 8) {
                    Image(systemName: iconToSymbol(r.icon)).font(.title3)
                    if r.state == "paused" {
                        Text("一時停止中").font(.headline)
                    } else {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(timerInterval: Date.now...r.endDate, countsDown: true)
                                .font(.headline).monospacedDigit()
                            Text("終了 \(r.endDate.formatted(date: .omitted, time: .shortened))")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                }
            } else if entry.presets.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "timer").font(.title3)
                    Text("今すぐタイマー").font(.headline)
                    Spacer()
                }
            } else {
                // アイドル時：先頭プリセットを「アイコン＋設定時間」のボタンで表示（無音起動）
                HStack(spacing: 16) {
                    ForEach(Array(entry.presets.prefix(3))) { p in
                        Button(intent: StartPresetTimerIntent(presetID: p.id)) {
                            VStack(spacing: 1) {
                                Image(systemName: iconToSymbol(p.icon)).font(.title3)
                                Text(durationLabel(p.durationSec))
                                    .font(.caption2)
                                    .monospacedDigit()
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    Spacer()
                }
            }
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
        .supportedFamilies([
            .systemSmall, .systemMedium,
            .accessoryRectangular, .accessoryCircular, .accessoryInline,
        ])
    }
}
