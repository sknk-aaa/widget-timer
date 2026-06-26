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

// App Store ID（ASC → App情報 → Apple ID）。
export const APP_STORE_ID = '6782746504';

// 共有・「友だちにすすめる」用の公開URL。
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

// レビュー作成画面（文章を書ける）を直接開く。
export const REVIEW_URL = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
