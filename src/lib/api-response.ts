export function jsonError(
  code: string,
  messageEn: string,
  messageVi: string,
  status: number,
) {
  return Response.json(
    { ok: false, error: { code, message_en: messageEn, message_vi: messageVi } },
    { status },
  );
}

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}
