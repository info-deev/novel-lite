/**
 * Утилита копирования текста в буфер обмена.
 *
 * Основной путь — современный Clipboard API (`navigator.clipboard.writeText`),
 * который доступен только в безопасном контексте (https / localhost).
 * Если он недоступен или отклонён (например, браузер не выдал разрешение),
 * используется совместимый запасной путь через временный <textarea> и
 * `document.execCommand('copy')`.
 */

/**
 * Копирует строку в системный буфер обмена.
 *
 * @param text Текст для копирования.
 * @returns `true`, если копирование удалось; `false` при недоступности буфера обмена.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard API может быть заблокирован политикой страницы или отсутствием
    // фокуса — падаем на legacy-реализацию вместо молчаливой ошибки.
  }
  return legacyCopy(text);
}

/**
 * Запасной способ копирования через скрытый <textarea> и execCommand.
 * Работает в небезопасных контекстах, где Clipboard API недоступен.
 *
 * @param text Текст для копирования.
 * @returns `true`, если команда копирования выполнилась успешно.
 */
function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-100vh';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}
