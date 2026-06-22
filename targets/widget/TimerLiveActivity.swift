import ActivityKit
import WidgetKit
import SwiftUI
import AlarmKit

// AlarmKit が自動管理する Live Activity の表示テンプレート。
// context.state.mode（.countdown / .paused / .alert）で実カウントダウン・終了時刻・一時停止を出す。

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlarmAttributes<TimerMetadata>.self) { context in
            let icon = context.attributes.metadata?.icon ?? "timer"
            let colorID = context.attributes.metadata?.colorID ?? "blue"
            HStack(spacing: 12) {
                IconChip(icon: icon, colorID: colorID)
                VStack(alignment: .leading, spacing: 2) {
                    remaining(context.state)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .monospacedDigit()
                    endLabel(context.state)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
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
                    remaining(context.state)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .monospacedDigit()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    endLabel(context.state).font(.caption).foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: iconToSymbol(icon)).foregroundStyle(paletteColor(colorID))
            } compactTrailing: {
                remaining(context.state).monospacedDigit()
            } minimal: {
                Image(systemName: "timer").foregroundStyle(paletteColor(colorID))
            }
            .keylineTint(paletteColor(colorID))
        }
    }

    @ViewBuilder
    private func remaining(_ state: AlarmPresentationState) -> some View {
        switch state.mode {
        case .countdown(let countdown):
            // システムが毎秒自動更新するライブ表示。fireDate が終了時刻。
            Text(timerInterval: Date.now...countdown.fireDate, countsDown: true)
        case .paused(let paused):
            let left = max(0, paused.totalCountdownDuration - paused.previouslyElapsedDuration)
            Text(Duration.seconds(left).formatted(.time(pattern: .minuteSecond)))
        case .alert:
            Text("終了")
        }
    }

    @ViewBuilder
    private func endLabel(_ state: AlarmPresentationState) -> some View {
        switch state.mode {
        case .countdown(let countdown):
            Text("終了 \(countdown.fireDate.formatted(date: .omitted, time: .shortened))")
        case .paused:
            Text("一時停止中")
        case .alert:
            EmptyView()
        }
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
