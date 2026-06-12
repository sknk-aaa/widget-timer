import { Linking } from 'react-native';

/** OS の設定アプリ（本アプリの権限画面）を開く。 */
export function openAppSettings(): void {
  void Linking.openSettings();
}
