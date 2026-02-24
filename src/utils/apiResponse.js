export const ok = (res, data, meta = {}, status = 200) => res.status(status).json({ success: true, data, meta });
export const fail = (res, status, code, message, details = [], meta = {}) =>
  res.status(status).json({ success: false, error: { code, message, details }, meta });
