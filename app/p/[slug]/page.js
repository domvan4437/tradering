import PublicProfileView from '../../../components/PublicProfileView';
import { prisma } from '../../../lib/prisma';

export async function generateMetadata({ params }) {
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ profileSlug: params.slug }, { id: params.slug }] },
    });
    if (!user) return { title: 'Trader Not Found — TradeZar' };
    return {
      title: (user.displayName || user.name || 'Trader') + ' — TradeZar',
      description: user.bio || 'Verified trader profile on TradeZar.',
    };
  } catch {
    return { title: 'TradeZar Profile' };
  }
}

export default function PublicProfilePage({ params }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      {/* Top nav bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 48, background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', paddingLeft: 20, paddingRight: 20, zIndex: 100, backdropFilter: 'blur(20px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4f46e5' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>TradeZar</span>
        </a>
        <div style={{ flex: 1 }} />
        <a href="/login" style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #4f46e5', color: '#4f46e5', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
          Sign In
        </a>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '68px 24px 40px' }}>
        <PublicProfileView slug={params.slug} />
      </div>
    </div>
  );
}
