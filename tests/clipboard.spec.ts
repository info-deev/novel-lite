import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '@/core/clipboard';

/**
 * Восстанавливает оригинальные дескрипторы после каждого теста,
 * чтобы моки navigator.clipboard и document.execCommand не «протекали» между тестами.
 */
const originalClipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');
const originalExecCommand = Object.getOwnPropertyDescriptor(Document.prototype, 'execCommand');

afterEach(() => {
  vi.restoreAllMocks();
  if (originalClipboard) {
    Object.defineProperty(Navigator.prototype, 'clipboard', originalClipboard);
  } else {
    // В jsdom Clipboard API по умолчанию отсутствует — просто удаляем мок.
    delete (navigator as unknown as { clipboard?: unknown }).clipboard;
  }
  if (originalExecCommand) {
    Object.defineProperty(Document.prototype, 'execCommand', originalExecCommand);
  }
});

/** Подменяет document.execCommand (в jsdom метод отсутствует по умолчанию). */
function mockExecCommand(impl: () => boolean): void {
  Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: impl });
}

describe('copyToClipboard', () => {
  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await expect(copyToClipboard('привет')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('привет');
  });

  it('falls back to execCommand when Clipboard API rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const execCommand = vi.fn(() => true);
    mockExecCommand(execCommand);

    await expect(copyToClipboard('текст')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when Clipboard API is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    const execCommand = vi.fn(() => true);
    mockExecCommand(execCommand);

    await expect(copyToClipboard('legacy')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('returns false when both paths fail', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    mockExecCommand(() => {
      throw new Error('unsupported');
    });

    await expect(copyToClipboard('нет буфера')).resolves.toBe(false);
  });
});
