import ActivityKit
import WidgetKit
import SwiftUI
import AlarmKit

// AlarmKit が自動管理する Live Activity の表示テンプレート。
// 開始/更新/終了は OS が行う（Activity.request は呼ばない）。
// ※ AlarmPresentationState の正確なフィールドは iOS 26 実機で要確認（docs/NATIVE.md）。

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlarmAttributes<TimerMetadata>.self) { context in
            // ロック画面
            HStack(spacing: 12) {
                IconChip(icon: context.attributes.metadata.icon, colorID: context.attributes.metadata.colorID)
                CountdownText(context: context)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Spacer()
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.25))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    IconChip(icon: context.attributes.metadata.icon, colorID: context.attributes.metadata.colorID)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    CountdownText(context: context)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .monospacedDigit()
                }
            } compactLeading: {
                Image(systemName: iconToSymbol(context.attributes.metadata.icon))
                    .foregroundStyle(paletteColor(context.attributes.metadata.colorID))
            } compactTrailing: {
                CountdownText(context: context).monospacedDigit()
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(paletteColor(context.attributes.metadata.colorID))
            }
            .keylineTint(paletteColor(context.attributes.metadata.colorID))
        }
    }
}

/// AlarmKit のカウントダウンを OS 描画で表示する。
/// state から終了日時が取れる場合は Text(timerInterval:) を使う。
private struct CountdownText: View {
    let context: ActivityViewContext<AlarmAttributes<TimerMetadata>>

    var body: some View {
        // TODO(実機): context.state からカウントダウンの ClosedRange<Date> を取得して
        //   Text(timerInterval: range, countsDown: true) を使う。
        //   AlarmKit の state 構造が確定するまでは終了時刻ベースのフォールバック表示。
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
