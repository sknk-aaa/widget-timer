const { withXcodeProject, IOSConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SOUNDS = ['bell.wav', 'chime.wav', 'marimba.wav'];

/**
 * assets/sounds/*.wav をアプリ本体ターゲットのバンドルリソースに追加する。
 * AlarmKit の AlertSound.named は実行プロセスのバンドルからファイルを探すため、
 * アプリ内起動（ImasuguNativeModule）のアラート音に必要。
 * 防御的：失敗しても prebuild を止めない（音はバンドルされなければ .default にフォールバック）。
 */
module.exports = function withAlarmSounds(config) {
  return withXcodeProject(config, (cfg) => {
    try {
      const project = cfg.modResults;
      const { projectRoot, platformProjectRoot, projectName } = cfg.modRequest;
      if (!projectName) return cfg;
      const srcDir = path.join(projectRoot, 'assets', 'sounds');
      const destDir = path.join(platformProjectRoot, projectName);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      for (const f of SOUNDS) {
        const src = path.join(srcDir, f);
        if (!fs.existsSync(src)) continue;
        fs.copyFileSync(src, path.join(destDir, f));
        const relPath = `${projectName}/${f}`;
        if (!project.hasFile(relPath)) {
          IOSConfig.XcodeUtils.addResourceFileToGroup({
            filepath: relPath,
            groupName: projectName,
            project,
            isBuildFile: true,
            verbose: false,
          });
        }
      }
    } catch (e) {
      console.warn('[withAlarmSounds] skipped:', e && e.message);
    }
    return cfg;
  });
};
