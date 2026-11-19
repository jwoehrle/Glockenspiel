/** Element by id; throws if the markup and the code got out of sync. */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

export const button = (id: string): HTMLButtonElement => $<HTMLButtonElement>(id);
export const input = (id: string): HTMLInputElement => $<HTMLInputElement>(id);
