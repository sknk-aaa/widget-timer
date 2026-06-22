import ActivityKit
import WidgetKit
import SwiftUI
import AlarmKit

// AlarmKit が自動管理する Live Activity の表示テンプレート。
// 注意: AlarmAttributes.metadata は Optional（TimerMetadata?）なので安全にアンラップする。

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlarmAttributes<TimerMetadata>.self) { context in
            let icon = context.attributes.metadata?.icon ?? "timer"
            let colorID = context.attributes.metadata?.colorID ?? "blue"
            // ロック画面
            HStack(spacing: 12) {
                IconChip(icon: icon, colorID: colorID)
                CountdownText(context: context)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Spacer()
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.25))
        } dynamicIsland: { context in
            let icon = context.attributes.metadata?.icon ?? "timer"
            let colorID = context.attributes.metadata?.colorID ?? "blue"
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    IconChip(icon: icon, colorID: colorID)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    CountdownText(context: context)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .monospacedDigit()
                }
            } compactLeading: {
                Image(systemName: iconToSymbol(icon))
                    .foregroundStyle(paletteColor(colorID))
            } compactTrailing: {
                CountdownText(context: context).monospacedDigit()
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(paletteColor(colorID))
            }
            .keylineTint(paletteColor(colorID))
        }
    }
}

/// AlarmKit のカウントダウンを OS 描画で表示する。
private struct CountdownText: View {
    let context: ActivityViewContext<AlarmAttributes<TimerMetadata>>

    var body: some View {
        // TODO(実機): context.state からカウントダウンの終了日時を取り Text(timerInterval:) を使う。
        Text(timerInterval: Date.now...Date.now.addingTimeInterval(60), countsDown: true)
    }
}

private struct IconChip: View {
    let icon: String
    let colorID: String
    var body: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(paletteColor(colorID))
            .frame(width: 40, height: 40)
            .overlay(
                Image(systemName: iconToSymbol(icon))
                    .foregroundStyle(.white)
                    .font(.system(size: 18, weight: .semibold))
            )
    }
}
