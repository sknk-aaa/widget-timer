import AppIntents
import WidgetKit

// 設定可能ウィジェット用：ホームに置いた各ウィジェットが「どのウィジェット欄(ボード)」を
// 表示するかを、長押し →「ウィジェットを編集」で選べるようにする。
// 欄の一覧・名前は App Group（Shared.loadBoards）から取得する。
//
// 注意: App Intents のメタデータ（typeDisplayRepresentation / title / description /
//   @Parameter(title:)）はビルド時に抽出されるため、コンパイル時の文字列リテラル必須。
//   実行時の分岐（ロケール）は使えない。欄名そのものは displayRepresentation で
//   App Group の値（ja: 枠N / en: Board N。ミラー側でローカライズ済み）を表示する。

struct BoardEntity: AppEntity {
    let id: String
    let name: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Board"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    static var defaultQuery = BoardQuery()
}

struct BoardQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [BoardEntity] {
        boards().filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [BoardEntity] {
        boards()
    }

    func defaultResult() async -> BoardEntity? {
        boards().first
    }

    private func boards() -> [BoardEntity] {
        Shared.loadBoards().map { BoardEntity(id: $0.id, name: $0.name) }
    }
}

struct SelectBoardIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Choose board"
    static var description = IntentDescription("Pick which board this widget shows.")

    @Parameter(title: "Board")
    var board: BoardEntity?

    init() {}
}
