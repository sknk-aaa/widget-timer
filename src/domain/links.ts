// App Store 審査では、IAP のあるアプリにプライバシーポリシーと利用規約への
// 動作するリンクが必要。
//
// - 利用規約: Apple 標準 EULA（追加ホスティング不要・審査で受理される）。
// - プライバシーポリシー: `legal/privacy.html` を GitHub Pages 等でホストし、その URL を入れる。
//   公開後に下の PRIVACY_URL を実際の公開URLへ更新すること（docs/OPERATIONS.md 参照）。
// - 問い合わせ先: 連絡可能なメールに変更可（既定は開発者のアカウントメール）。

export const PRIVACY_URL = 'https://sknk-aaa.github.io/widget-timer/legal/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const CONTACT_URL = 'mailto:625.somq2525@gmail.com';
