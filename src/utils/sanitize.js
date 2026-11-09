// Removes HTML tags and control characters from user text. We sanitise on the
// way IN (strip) and rely on React's output encoding on the way OUT, instead
// of HTML-escaping before storage (which would show "&amp;" in the UI).
function stripHtml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>?/g, '')
    .replace(/[<>]/g, '')
    // eslint-disable-next-line no-control-regex -- removing control characters is the purpose
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

module.exports = { stripHtml };
