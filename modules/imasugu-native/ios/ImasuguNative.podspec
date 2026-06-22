Pod::Spec.new do |s|
  s.name           = 'ImasuguNative'
  s.version        = '1.0.0'
  s.summary        = 'AlarmKit + App Group bridge for 今すぐタイマー'
  s.description    = 'In-app AlarmKit scheduling and App Group shared store.'
  s.author         = ''
  s.homepage       = 'https://example.com'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
