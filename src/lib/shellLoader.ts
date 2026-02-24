type LoaderToken = string;

const DEFAULT_MESSAGE = "Loading data...";

const activeTokens = new Set<LoaderToken>();

const createToken = () =>
  `shell-loader-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function canNotifyShell() {
  return (
    typeof window !== "undefined" &&
    typeof window.parent !== "undefined" &&
    window.parent !== window
  );
}

function emitShellLoader(active: boolean, message?: string) {
  if (!canNotifyShell()) return;
  window.parent.postMessage(
    {
      type: "shell:loader",
      active,
      message: (message?.trim() || DEFAULT_MESSAGE),
    },
    "*",
  );
}

export function startShellLoader(message?: string): LoaderToken {
  const token = createToken();
  activeTokens.add(token);
  emitShellLoader(true, message);
  return token;
}

export function stopShellLoader(token: LoaderToken) {
  if (!activeTokens.has(token)) return;
  activeTokens.delete(token);
  if (activeTokens.size === 0) {
    emitShellLoader(false);
  }
}

export async function withShellLoader<T>(
  work: () => Promise<T>,
  message?: string,
): Promise<T> {
  const token = startShellLoader(message);
  try {
    return await work();
  } finally {
    stopShellLoader(token);
  }
}

export async function fetchWithShellLoader(
  input: RequestInfo | URL,
  init?: RequestInit,
  message?: string,
) {
  return withShellLoader(async () => fetch(input, init), message);
}
