import WidgetKit
import SwiftUI

@main
struct ImasuguWidgetBundle: WidgetBundle {
    var body: some Widget {
        PresetWidget()
        TimerLiveActivity()
    }
}
