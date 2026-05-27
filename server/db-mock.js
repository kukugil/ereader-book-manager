// In-memory mock for better-sqlite3 — used by tests when native binding unavailable
const books = new Map();

function getBooksBySn(sn) {
  const result = [];
  for (const [, b] of books) {
    if (b.sn === sn) result.push({ ...b });
  }
  result.sort((a, b) => a.sort_order - b.sort_order);
  return result;
}

function insertBook(data) {
  const id = data.book_id;
  books.set(id, {
    book_id: id,
    sn: data.sn,
    title: data.title || '',
    author: data.author || '',
    file_size: data.file_size || 0,
    format: data.format || 'txt',
    checksum: data.checksum || '',
    metadata_version: data.metadata_version || 1,
    sort_order: data.sort_order || 0,
    cover_url: `/dl/${data.sn}/covers/${id}.jpg`,
    download_url: `/dl/${data.sn}/books/${encodeURIComponent(data.title || '')}.${data.format || 'txt'}`,
    created_at: new Date().toISOString(),
  });
}

function getBook(bookId) {
  const b = books.get(bookId);
  return b ? { ...b } : undefined;
}

function deleteBook(bookId) {
  books.delete(bookId);
}

function updateSortOrder(bookId, order) {
  const b = books.get(bookId);
  if (b) b.sort_order = order;
}

function closeDb() {}

module.exports = { getBooksBySn, insertBook, getBook, deleteBook, updateSortOrder, closeDb };
