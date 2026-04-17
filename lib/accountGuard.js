
/**
 * Account age and anti-abuse checks for competitions
 */

const MIN_ACCOUNT_AGE_DAYS = 30;

export async function checkAccountEligibility(user, prisma) {
  const errors = [];

  // 1. Account age check
  const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAge < MIN_ACCOUNT_AGE_DAYS) {
    const daysLeft = Math.ceil(MIN_ACCOUNT_AGE_DAYS - accountAge);
    errors.push(`Your account must be at least ${MIN_ACCOUNT_AGE_DAYS} days old to enter competitions. ${daysLeft} days to go.`);
  }

  // 2. Email verified check (if field exists)
  if (user.emailVerified === false || user.emailVerified === null) {
    errors.push('Please verify your email before entering competitions.');
  }

  return { eligible: errors.length === 0, errors };
}

/**
 * Prevent same-device / same-IP H2H matching (basic check via recent signups)
 * In production, pair this with IP logging middleware.
 */
export async function isSuspiciousH2HPair(challengerId, opponentId, prisma) {
  // Check if both accounts were created within 24h of each other
  const [challenger, opponent] = await Promise.all([
    prisma.user.findUnique({ where: { id: challengerId }, select: { createdAt: true, email: true } }),
    prisma.user.findUnique({ where: { id: opponentId }, select: { createdAt: true, email: true } }),
  ]);
  if (!challenger || !opponent) return false;

  const timeDiff = Math.abs(new Date(challenger.createdAt) - new Date(opponent.createdAt));
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // Both accounts created within 2 hours of each other = suspicious
  return hoursDiff < 2;
}
