/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'ImasuguWidget',
  deploymentTarget: '26.0',
  // ControlWidget / Live Activity / AlarmKit に必要なフレームワーク
  frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents', 'ActivityKit', 'AlarmKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.sknk.imasugutimer'],
  },
};
