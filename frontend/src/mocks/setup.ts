// 開発環境でMSWを起動する関数
export async function enableMocking() {
  if (import.meta.env.PROD) {
    return
  }

  const { worker } = await import('./browser')
  
  // Start the worker
  return worker.start({
    onUnhandledRequest: 'bypass',
  })
}