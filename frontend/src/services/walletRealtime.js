const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

export function subscribeToWallet(walletId, onTransactionChanged) {
  if (!walletId || typeof onTransactionChanged !== 'function') return () => {};

  let stopped = false;
  let controller;
  let retryDelay = 1000;

  const waitBeforeRetry = (milliseconds) => new Promise(resolve => {
    const timeout = window.setTimeout(resolve, milliseconds);
    controller?.signal.addEventListener('abort', () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });

  const readEvents = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!stopped) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        const eventName = block.split(/\r?\n/).find(line => line.startsWith('event:'))?.slice(6).trim();
        if (eventName !== 'transaction-changed') continue;
        onTransactionChanged();
      }
    }
  };

  const connect = async () => {
    while (!stopped) {
      try {
        const token = sessionStorage.getItem('accessToken');
        if (!token) return;
        controller = new AbortController();
        const url = new URL(`/api/v1/wallets/${encodeURIComponent(walletId)}/events`, apiBaseUrl);
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal
        });

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok || !response.body) throw new Error('SSE connection failed');

        onTransactionChanged();
        retryDelay = 1000;
        await readEvents(response);
      } catch {
        if (stopped) return;
      }

      if (!stopped) {
        await waitBeforeRetry(retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      }
    }
  };

  connect();
  return () => {
    stopped = true;
    controller?.abort();
  };
}
