import AppIntents
import WidgetKit

// 設定可能ウィジェット用：ホームに置いた各ウィジェットが「どのウィジェット欄(ボード)」を
// 表示するかを、長押し →「ウィジェットを編集」で選べるようにする。
// 欄の一覧・名前は App Group（Shared.loadBoards）から取得する。

struct BoardEntity: AppEntity {
    let id: String
    let name: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation =
        LX.isJa ? "ウィジェット欄" : "Board"

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
    static var title: LocalizedStringResource =
        LX.isJa ? "ウィジェット欄を選択" : "Choose a board"

    static var description = IntentDescription(
        LX.isJa ? "このウィジェットに表示するウィジェット欄を選びます。" : "Pick which board this widget shows."
    )

    @Parameter(title: "Board")
    var board: BoardEntity?

    init() {}
}
