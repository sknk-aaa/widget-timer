const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// チュートリアル動画(mp4)を require() で同梱できるようアセット拡張子に追加。
if (!config.resolver.assetExts.includes('mp4')) {
  config.resolver.assetExts.push('mp4');
}

module.exports = config;
