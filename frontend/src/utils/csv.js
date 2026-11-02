// Cells that start with = + - @ are executed as formulas by Excel and Google Sheets.
// A customer could type such text as their name, so those cells are prefixed with an apostrophe.
const cell = (value) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCsv(filename, header, rows) {
  const lines = [header, ...rows].map((row) => row.map(cell).join(','));
  // The byte-order mark makes Excel read accented characters correctly.
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([`${BOM}${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
