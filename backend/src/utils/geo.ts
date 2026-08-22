/**
 * Tinh khoang cach giua 2 toa do GPS (met) bang cong thuc Haversine.
 */
export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // ban kinh trai dat, met
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Lay dia chi IP that cua client, co xet header x-forwarded-for
 * (truong hop chay sau reverse proxy / load balancer).
 */
export function getClientIp(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  const remote = req.socket.remoteAddress ?? "";
  // chuan hoa dang IPv4-mapped IPv6 (::ffff:1.2.3.4) ve IPv4
  return remote.replace("::ffff:", "");
}
