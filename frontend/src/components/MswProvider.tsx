import { use } from "react";

// MSW ワーカーを初期化する非同期処理（Promise）
const mockingEnabledPromise =
  typeof window !== "undefined" &&
  import.meta.env.VITE_MOCKING_ENABLED === "true"
    ? import("@/mocks/browser").then(async ({ worker }) => {
        await worker.start({ onUnhandledRequest: "bypass" });
      })
    : Promise.resolve();

// MSW クライアントプロバイダー
export const MswProvider = ({ children }: { children: React.ReactNode }) => {
  // useでPromise（MSW の初期化完了）を待機 -> Promise が解決後子要素をレンダリング
  use(mockingEnabledPromise);
  return children;
};
