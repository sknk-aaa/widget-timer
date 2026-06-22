import ActivityKit
import WidgetKit
import SwiftUI
import AlarmKit

// AlarmKit の Live Activity（カスタム）。カスタムUIを出すと AlarmKit の自動ボタンは
// 出ないため、終了/一時停止/再開ボタンは自前で Button(intent:) として配置する。

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AlarmAttributes<TimerMetadata>.self) { context in
            HStack(spacing: 12) {
                IconChip(
                    icon: context.attributes.metadata?.icon ?? "timer",
                    colorID: context.attributes.metadata?.colorID ?? "blue"
                )
                VStack(alignment: .leading, spacing: 2) {
                    remaining(context.state)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .monospacedDigit()
                    endLabel(context.state)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                ControlButtons(state: context.state)
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.25))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    IconChip(
                        icon: context.attributes.metadata?.icon ?? "timer",
                        colorID: context.attributes.metadata?.colorID ?? "blue"
                    )
                }
                DynamicIslandExpandedRegion(.trailing) {
                    remaining(context.state)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .monospacedDigit()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ControlButtons(state: context.state)
                }
            } compactLeading: {
                Image(systemName: iconToSymbol(context.attributes.metadata?.icon ?? "timer"))
                    .foregroundStyle(paletteColor(context.attributes.metadata?.colorID ?? "blue"))
            } compactTrailing: {
                remaining(context.state).monospacedDigit()
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(paletteColor(context.attributes.metadata?.colorID ?? "blue"))
            }
            .keylineTint(paletteColor(context.attributes.metadata?.colorID ?? "blue"))
        }
    }

    @ViewBuilder
    private func remaining(_ state: AlarmPresentationState) -> some View {
        switch state.mode {
        case .countdown(let countdown):
            Text(timerInterval: Date.now...countdown.fireDate, countsDown: true)
        case .paused(let paused):
            Text(Duration.seconds(max(0, paused.totalCountdownDuration - paused.previouslyElapsedDuration))
                .formatted(.time(pattern: .minuteSecond)))
        case .alert:
            Text("終了")
        @unknown default:
            Text("")
        }
    }

    @ViewBuilder
    private func endLabel(_ state: AlarmPresentationState) -> some View {
        switch state.mode {
        case .countdown(let countdown):
            Text("終了 \(countdown.fireDate.formatted(date: .omitted, time: .shortened))")
        case .paused:
            Text("一時停止中")
        default:
            EmptyView()
        }
    }
}

private struct ControlButtons: View {
    let state: AlarmPresentationState
    var body: some View {
        let id = state.alarmID.uuidString
        HStack(spacing: 10) {
            switch state.mode {
            case .countdown:
                Button(intent: PauseAlarmIntent(alarmID: id)) {
                    GlyphCircle(systemName: "pause.fill")
                }
            case .paused:
                Button(intent: ResumeAlarmIntent(alarmID: id)) {
                    GlyphCircle(systemName: "play.fill")
                }
            default:
                EmptyView()
            }
            Button(intent: CancelAlarmIntent(alarmID: id)) {
                GlyphCircle(systemName: "xmark")
            }
        }
        .buttonStyle(.plain)
    }
}

private struct GlyphCircle: View {
    let systemName: String
    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 34, height: 34)
            .background(Circle().fill(.white.opacity(0.22)))
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
