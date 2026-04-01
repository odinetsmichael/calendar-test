export function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown as T) : null;
  } catch {
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

export function makeDebouncedSave<T>(
  key: string,
  delayMs = 300,
): (data: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (data: T) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => saveToStorage(key, data), delayMs);
  };
}
