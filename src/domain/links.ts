// App Store 審査では、IAP のあるアプリにプライバシーポリシーと利用規約への
// 動作するリンクが必要。
//
// - 利用規約: Apple 標準 EULA（追加ホスティング不要・審査で受理される）。
// - プライバシーポリシー: `docs/privacy.html`。GitHub Pages（main / `/docs`）で公開。
//   Pages の公開元を変えた場合は下の PRIVACY_URL を実URLへ更新（docs/OPERATIONS.md 参照）。

export const PRIVACY_URL = 'https://sknk-aaa.github.io/widget-timer/privacy.html';
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// ご意見・ご要望フォーム（Tally）。
export const CONTACT_URL = 'https://tally.so/r/rjgJYL';

// ★ App Store でアプリを作成後、数字の App Store ID に置き換えること（ASCのアプリ情報に表示）。
//   未設定のままだと「レビューして応援」はApp Storeを開けない。
export const APP_STORE_ID = '0000000000';

// レビュー作成画面（文章を書ける）を直接開く。
export const REVIEW_URL = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
