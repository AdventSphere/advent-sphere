async function initMocks() {
  if (typeof window === "undefined") {
    return;
  } else {
    const { worker } = await import("./browser");
    worker.start();
  }
}

initMocks();

export {};
