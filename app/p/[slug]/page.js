
import { prisma } from '../../../lib/prisma';

export async function generateMetadata({ params }) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ profileSlug: params.slug }, { id: params.slug }] },
  });
  if (!user) return { title: 'Trader Not Found — TradeRing' };
  return {
    title: `${user.displayName || user.name || 'Trader'} — TradeRing Verified Profile`,
    description: user.bio || `Verified trader profile on TradeRing. ${user.tradingStyle || ''} trader.`,
  };
}

export default function PublicProfilePage({ params }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
        <div id="profile-root" data-slug={params.slug} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Profile data loaded by PublicProfileView component
          window.__PROFILE_SLUG__ = "${params.slug}";
        `}} />
      </div>
    </div>
  );
}
