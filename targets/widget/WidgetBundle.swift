import WidgetKit
import SwiftUI

@main
struct ImasuguWidgetBundle: WidgetBundle {
    var body: some Widget {
        PresetWidget()
        if #available(iOS 18.0, *) {
            StartTimerControl()
        }
    }
}
