type TimeUnit = "s" | "m" | "h" | "d";

export const getExpiryTime = (
  expiration: string
): number | null => {
  const match = expiration.match(/(\d+)([smhd])/);

  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2] as TimeUnit;

  const multipliers: Record<TimeUnit, number> = {
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };

  return Date.now() + value * multipliers[unit];
};