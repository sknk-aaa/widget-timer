const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * expo-notifications が付与する aps-environment（Push Notifications）を除去する。
 * 本アプリはリモートプッシュ未使用（通知は Expo Go のローカルモックのみ、本番は AlarmKit）。
 * これを残すと App ID 側で Push 未有効のプロビジョニングと不一致になりアーカイブが失敗する。
 */
module.exports = function withoutApsEnvironment(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
