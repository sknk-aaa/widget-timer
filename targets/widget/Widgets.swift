import WidgetKit
import SwiftUI
import AppIntents

// ホーム画面ウィジェット＋ロック画面ウィジェット（accessory）。どちらもプリセット起動の
// ランチャー専用。実行中の表示/操作は通知（Live Activity）とアプリ側に集約する
// （ウィジェットへの状態反映は WidgetKit のリロードに遅延があり、即時性を担保できないため）。

struct PresetEntry: TimelineEntry {
    let date: Date
    let presets: [SharedPreset]
}

// 設定可能ウィジェット：選択された欄(ボード)のプリセットを表示する。
struct PresetProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> PresetEntry {
        makeEntry(nil)
    }

    func snapshot(for configuration: SelectBoardIntent, in context: Context) async -> PresetEntry {
        makeEntry(configuration)
    }

    func timeline(for configuration: SelectBoardIntent, in context: Context) async -> Timeline<PresetEntry> {
        Timeline(entries: [makeEntry(configuration)], policy: .never)
    }

    // 欄が未選択（設置直後）なら先頭の欄にフォールバック。
    private func makeEntry(_ configuration: SelectBoardIntent?) -> PresetEntry {
        let allBoards = Shared.loadBoards()
        let boardId = configuration?.board?.id ?? allBoards.first?.id
        let presets = boardId.map { Shared.presets(forBoard: $0) } ?? []
        return PresetEntry(date: Date(), presets: presets)
    }
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
            WaitingView(presets: entry.presets, small: family == .systemSmall)
        }
    }
}

// MARK: - ホーム画面（起動ランチャー）

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
            // タイルは列幅いっぱいにせず固定サイズに収め、medium で2段でもはみ出さないようにする。
            let tile: CGFloat = small ? 54 : 48
            let iconSize: CGFloat = small ? 20 : 17
            let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: small ? 2 : 4)
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(shown) { p in
                    // タップでアプリを開き、メイン画面のまま起動（別画面を挟まない）
                    Link(destination: URL(string: "imasugutimer://?start=\(p.id)")!) {
                        VStack(spacing: 3) {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(paletteColor(p.color))
                                .frame(width: tile, height: tile)
                                .overlay(
                                    Image(systemName: iconToSymbol(p.icon))
                                        .foregroundStyle(.white)
                                        .font(.system(size: iconSize, weight: .semibold))
                                )
                            Text(durationLabel(p.durationSec))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
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

    // ロック画面は常に「起動ランチャー」。実行中カウントは通知（Live Activity）に出るため
    // 重複を避けて表示しない（押しても表示は変わらない）。
    var body: some View {
        switch family {
        case .accessoryInline:
            Text("今すぐタイマー")
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                if let p = entry.presets.first {
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
            if entry.presets.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "timer").font(.title3)
                    Text("今すぐタイマー").font(.headline)
                    Spacer()
                }
            } else {
                // 先頭プリセットを角丸チップのボタンで表示（無音起動）。
                HStack(spacing: 6) {
                    ForEach(Array(entry.presets.prefix(3))) { p in
                        Button(intent: StartPresetTimerIntent(presetID: p.id)) {
                            VStack(spacing: 2) {
                                Image(systemName: iconToSymbol(p.icon))
                                    .font(.system(size: 15, weight: .semibold))
                                Text(durationLabel(p.durationSec))
                                    .font(.system(size: 9, weight: .semibold))
                                    .monospacedDigit()
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 5)
                            .background(
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .fill(.white.opacity(0.18))
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .strokeBorder(.white.opacity(0.25), lineWidth: 0.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

struct PresetWidget: Widget {
    static let kind = "com.sknk.imasugutimer.PresetWidget"
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: Self.kind, intent: SelectBoardIntent.self, provider: PresetProvider()) { entry in
            PresetWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName(LX.isJa ? "今すぐタイマー" : "Tappri")
        .description(LX.isJa ? "ウィジェット欄のプリセットをワンタップで起動" : "Start a board's presets in one tap")
        .supportedFamilies([
            .systemSmall, .systemMedium,
            .accessoryRectangular, .accessoryCircular, .accessoryInline,
        ])
    }
}
