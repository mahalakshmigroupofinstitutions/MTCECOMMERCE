/** Builds a wa.me deep link — the Phase 3 stopgap for supplier chat, upgraded to a
 * full in-app thread + WhatsApp Business API in Phase 6. */
export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
