import AppIntents
import AlarmKit
import SwiftUI
import Foundation
import WidgetKit

// タイマー起動のコア。Control / ホームウィジェット / アプリ内のすべてが
// この AlarmKit 呼び出しに集約される。
//
// 重要(設計): StartPresetTimerIntent は LiveActivityIntent に準拠させ、
// かつソースをアプリ本体ターゲットにも含める。これで「アプリを前面に出さず
// バックグラウンドのアプリプロセスで実行」され、AlarmKit/共有ストアに
// アクセスできる。Live Activity は AlarmKit が自動生成するため
// Activity.request は呼ばない。
// ※ AlarmKit は iOS 26 の新API。シグネチャは実機(TestFlight)で要確認。

enum AlarmScheduler {
    static func schedule(durationSec: Int, metadata: TimerMetadata, tint: Color) async throws -> UUID {
        let id = UUID()
        let attributes = makeAttributes(metadata: metadata, tint: tint)
        let configuration = AlarmManager.AlarmConfiguration.timer(
            duration: TimeInterval(durationSec),
            attributes: attributes
        )
        _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
        recordRunning(alarmID: id, presetID: metadata.presetID)
        // ウィジェットがカウントダウン表示できるよう実行中モデルを App Group に追記＋再読込
        let endAt = Date().addingTimeInterval(TimeInterval(durationSec)).timeIntervalSince1970 * 1000
        appendRunning(id: id, endAt: endAt, icon: metadata.icon, colorID: metadata.colorID, durationSec: durationSec)
        WidgetCenter.shared.reloadAllTimelines()
        return id
    }

    private static func appendRunning(id: UUID, endAt: Double, icon: String, colorID: String, durationSec: Int) {
        var list = Shared.loadRunning()
        list.removeAll { $0.id == id.uuidString }
        list.append(SharedRunning(
            id: id.uuidString, endAt: endAt, icon: icon, color: colorID,
            state: "running", durationSec: durationSec, pausedRemainingSec: nil
        ))
        if let data = try? JSONEncoder().encode(list) {
            Shared.defaults?.set(data, forKey: Shared.runningKey)
        }
    }

    // alert(終了)＋countdown(一時停止)＋paused(再開) を宣言すると AlarmKit が
    // ロック画面/Live Activity/Dynamic Island にボタンを自動描画する。
    static func makeAttributes(metadata: TimerMetadata, tint: Color) -> AlarmAttributes<TimerMetadata> {
        let stop = AlarmButton(text: "終了", textColor: .white, systemImageName: "stop.fill")
        let pause = AlarmButton(text: "一時停止", textColor: .white, systemImageName: "pause.fill")
        let resume = AlarmButton(text: "再開", textColor: .white, systemImageName: "play.fill")
        let alert = AlarmPresentation.Alert(title: "タイマー終了", stopButton: stop)
        let countdown = AlarmPresentation.Countdown(title: "カウントダウン", pauseButton: pause)
        let paused = AlarmPresentation.Paused(title: "一時停止中", resumeButton: resume)
        let presentation = AlarmPresentation(alert: alert, countdown: countdown, paused: paused)
        return AlarmAttributes(presentation: presentation, metadata: metadata, tintColor: tint)
    }

    static func cancel(id: UUID) throws {
        try AlarmManager.shared.cancel(id: id)
        removeRunning(alarmID: id)
    }

    static func stopAll() throws {
        for id in runningAlarmIDs() {
            try? AlarmManager.shared.cancel(id: id)
        }
        Shared.defaults?.removeObject(forKey: Shared.runningMapKey)
    }

    // alarmID -> presetID マップを App Group に保持
    private static func recordRunning(alarmID: UUID, presetID: String?) {
        var map = (Shared.defaults?.dictionary(forKey: Shared.runningMapKey) as? [String: String]) ?? [:]
        map[alarmID.uuidString] = presetID ?? ""
        Shared.defaults?.set(map, forKey: Shared.runningMapKey)
    }

    private static func removeRunning(alarmID: UUID) {
        var map = (Shared.defaults?.dictionary(forKey: Shared.runningMapKey) as? [String: String]) ?? [:]
        map.removeValue(forKey: alarmID.uuidString)
        Shared.defaults?.set(map, forKey: Shared.runningMapKey)
    }

    /// キャンセル時の後始末：App Group の実行中モデルから除去しウィジェット再読込。
    static func cleanupRunning(id: UUID) {
        removeRunning(alarmID: id)
        var list = Shared.loadRunning()
        list.removeAll { $0.id == id.uuidString }
        if let data = try? JSONEncoder().encode(list) {
            Shared.defaults?.set(data, forKey: Shared.runningKey)
        }
        WidgetCenter.shared.reloadAllTimelines()
    }

    static func runningAlarmIDs() -> [UUID] {
        let map = (Shared.defaults?.dictionary(forKey: Shared.runningMapKey) as? [String: String]) ?? [:]
        return map.keys.compactMap { UUID(uuidString: $0) }
    }
}

/// プリセット起動 Intent（Control・ウィジェット・アプリ内で共用）。
struct StartPresetTimerIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "タイマーを開始"
    static var description = IntentDescription("プリセットのタイマーを開始します")
    // アプリを前面に出さない
    static var openAppWhenRun = false

    @Parameter(title: "プリセットID")
    var presetID: String

    init() {}
    init(presetID: String) { self.presetID = presetID }

    @MainActor
    func perform() async throws -> some IntentResult {
        NSLog("[ImasuguWidget] StartPresetTimerIntent preset=%@", presetID)
        guard let preset = Shared.preset(id: presetID) else {
            NSLog("[ImasuguWidget] preset not found (presets=%d)", Shared.loadPresets().count)
            return .result()
        }
        let metadata = TimerMetadata(presetID: preset.id, icon: preset.icon, colorID: preset.color)
        do {
            let id = try await AlarmScheduler.schedule(
                durationSec: preset.durationSec,
                metadata: metadata,
                tint: paletteColor(preset.color)
            )
            NSLog("[ImasuguWidget] scheduled OK id=%@", id.uuidString)
        } catch {
            NSLog("[ImasuguWidget] schedule ERROR: %@", "\(error)")
        }
        return .result()
    }
}

// Live Activity / Dynamic Island のボタン用（アプリプロセスで実行）。
struct CancelAlarmIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "タイマーを終了"
    @Parameter(title: "Alarm ID") var alarmID: String
    init() {}
    init(alarmID: String) { self.alarmID = alarmID }
    func perform() async throws -> some IntentResult {
        if let id = UUID(uuidString: alarmID) {
            try? AlarmManager.shared.cancel(id: id)
            AlarmScheduler.cleanupRunning(id: id)
        }
        return .result()
    }
}

struct PauseAlarmIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "一時停止"
    @Parameter(title: "Alarm ID") var alarmID: String
    init() {}
    init(alarmID: String) { self.alarmID = alarmID }
    func perform() async throws -> some IntentResult {
        if let id = UUID(uuidString: alarmID) { try? AlarmManager.shared.pause(id: id) }
        return .result()
    }
}

struct ResumeAlarmIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "再開"
    @Parameter(title: "Alarm ID") var alarmID: String
    init() {}
    init(alarmID: String) { self.alarmID = alarmID }
    func perform() async throws -> some IntentResult {
        if let id = UUID(uuidString: alarmID) { try? AlarmManager.shared.resume(id: id) }
        return .result()
    }
}
