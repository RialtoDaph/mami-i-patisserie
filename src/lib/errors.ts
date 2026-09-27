// Maps Postgres/PostgREST errors to messages Mami can understand.

interface PgError {
  code?: string;
  message: string;
}

/** Turns a Postgres/PostgREST error into a message Mami can understand. */
export function friendlyError(e: PgError): string {
  switch (e.code) {
    case "23505":
      return "Data ini sudah ada (duplikat).";
    case "23503":
      return "Data ini masih dipakai (di resep, paket, produk, campaign, atau order), jadi tidak bisa dihapus.";
    case "42501":
      return e.message.startsWith("Role") ? e.message : "Anda tidak punya akses untuk aksi ini.";
    case "23514":
      // Our own trigger messages are already in Indonesian.
      return /^[A-Z]/.test(e.message) && !e.message.includes("violates") ? e.message : "Isian tidak valid. Periksa lagi angkanya.";
    case "P0001":
      return e.message;
    default:
      return `Gagal menyimpan: ${e.message}`;
  }
}
