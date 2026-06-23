'use client';
import { useState, useEffect } from 'react';

const PURPLE = '#4f46e5';

function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  const color = colors[(name||'T').charCodeAt(0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:size*0.35, fontWeight:800, color:'#fff', flexShrink:0 }}>
      {initials}
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', textAlign:'center', flex:1 }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:color||'var(--text)', marginBottom:2 }}>{value||'--'}</div>
      {sub && <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{sub}</div>}
      <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
    </div>
  );
}

function FollowListModal({ title, users, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:400, maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:22 }}>{String.fromCharCode(215)}</button>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {users.length === 0 ? (
            <div style={{ padding:'40px 20px', textAlign:'center', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No users yet</div>
          ) : users.map(u => (
            <div key={u.id}
              onClick={() => { if (window.__goToProfile) window.__goToProfile(u.profileSlug||u.id); onClose(); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Avatar name={u.displayName||u.name} size={38}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:10, color:PURPLE, fontWeight:700 }}>{'\u2713'}</span>}
                </div>
                {u.tradingStyle && <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</div>}
              </div>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>{'\u2192'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function PublicProfileView({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    fetch('/api/profile/'+slug)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else { setData(d); setFollowing(d.isFollowing); }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load profile'); setLoading(false); });
  }, [slug]);

  const handleFollow = async () => {
    if (!data) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/social/follow', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId: data.profile.id }) });
      const d = await res.json();
      setFollowing(d.following);
      setData(prev => ({ ...prev, profile: { ...prev.profile, followerCount: prev.profile.followerCount + (d.following ? 1 : -1) } }));
    } catch {}
    setFollowLoading(false);
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:'var(--font)', color:'var(--text-muted)' }}>Loading profile...</div>;

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', fontFamily:'var(--font)', textAlign:'center', padding:24 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>\uD83D\uDC64</div>
      <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Profile Not Found</div>
      <div style={{ fontSize:14, color:'var(--text-muted)' }}>{error}</div>
    </div>
  );

  const { profile, stats, posts, tradeCalls, competitionResults, ownedGroups, memberGroups, followers, following: followingList, leaderboardPositions, isPrivate } = data;
  const assets = profile.primaryAssets || [];
  const allGroups = [...(ownedGroups||[]), ...(memberGroups||[])];

  const TABS = isPrivate ? [] : [
    { id:'posts',       label:'Posts ('+(posts?.length||0)+')' },
    { id:'trades',      label:'Trade Record ('+(stats?.totalVerifiedTrades||0)+')' },
    { id:'tournaments', label:'Tournaments ('+(competitionResults?.length||0)+')' },
    { id:'groups',      label:'Groups ('+(allGroups.length)+')' },
    { id:'screeners',   label:'Screeners ('+(profile.publicScreeners?.length||0)+')' },
  ];
  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:860, margin:'0 auto' }}>
      {showFollowers && <FollowListModal title={'Followers ('+profile.followerCount+')'} users={followers||[]} onClose={()=>setShowFollowers(false)}/>}
      {showFollowing && <FollowListModal title={'Following ('+profile.followingCount+')'} users={followingList||[]} onClose={()=>setShowFollowing(false)}/>}

      {/* Header Card */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:110, background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #0891b2 100%)', position:'relative' }}>
          {profile.verifiedBadge && (
            <div style={{ position:'absolute', top:12, right:16, padding:'4px 14px', background:'rgba(255,255,255,0.18)', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)', fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'#fff' }}>
              {'\u2713 VERIFIED TRADER'}
            </div>
          )}
        </div>
        <div style={{ padding:'0 24px 24px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:-38, marginBottom:14 }}>
            <div style={{ border:'4px solid var(--surface)', borderRadius:'50%' }}>
              <Avatar name={profile.displayName} size={76}/>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', paddingBottom:4 }}>
              {profile.twitterHandle && <a href={'https://twitter.com/'+profile.twitterHandle} target='_blank' rel='noreferrer' style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, textDecoration:'none', color:'var(--text-muted)' }}>{'\u{1D54F}'}</a>}
              {profile.instagramHandle && <a href={'https://instagram.com/'+profile.instagramHandle} target='_blank' rel='noreferrer' style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, textDecoration:'none', color:'var(--text-muted)' }}>IG</a>}
              {profile.tradingviewHandle && <a href={'https://tradingview.com/u/'+profile.tradingviewHandle} target='_blank' rel='noreferrer' style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, textDecoration:'none', color:'var(--text-muted)' }}>TV</a>}
              <button onClick={handleFollow} disabled={followLoading} style={{ padding:'8px 22px', borderRadius:20, border:'1px solid '+(following?'var(--border)':PURPLE), background:following?'var(--surface2)':PURPLE, color:following?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                {followLoading ? '...' : following ? 'Following' : '+ Follow'}
              </button>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3, flexWrap:'wrap' }}>
              <h1 style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>{profile.displayName||'Trader'}</h1>
              {profile.verifiedBadge && <span style={{ fontSize:11, fontWeight:700, color:PURPLE, background:'rgba(79,70,229,0.1)', padding:'2px 10px', borderRadius:20, border:'1px solid rgba(79,70,229,0.25)' }}>{'\u2713 Verified'}</span>}
              {profile.tradingStyle && <span style={{ fontSize:11, color:'var(--text-muted)', background:'var(--surface2)', padding:'2px 10px', borderRadius:20, border:'1px solid var(--border)', textTransform:'capitalize' }}>{profile.tradingStyle}</span>}
            </div>
            {profile.profileSlug && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{'tradezar.com/p/'+profile.profileSlug}</div>}
            {profile.bio && <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', lineHeight:1.7, margin:'0 0 10px', maxWidth:560 }}>{profile.bio}</p>}
          </div>
          {assets.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {assets.map(a => <span key={a} style={{ fontSize:11, fontWeight:600, color:PURPLE, background:'rgba(79,70,229,0.08)', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(79,70,229,0.2)' }}>{a}</span>)}
            </div>
          )}
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={()=>setShowFollowers(true)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', gap:4, alignItems:'center', padding:0 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:800, color:'var(--text)' }}>{profile.followerCount||0}</span>
              <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Followers</span>
            </button>
            <button onClick={()=>setShowFollowing(true)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', gap:4, alignItems:'center', padding:0 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:800, color:'var(--text)' }}>{profile.followingCount||0}</span>
              <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Following</span>
            </button>
            {profile.joinedAt && <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{'Joined '+new Date(profile.joinedAt).toLocaleDateString([],{month:'long',year:'numeric'})}</span>}
          </div>
        </div>
      </div>
      {/* Private account wall */}
      {isPrivate ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'64px 24px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>&#x1F512;</div>
          <div style={{ fontFamily:'var(--font)', fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:8 }}>This account is private</div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Follow to see their trades and posts</div>
        </div>
      ) : (
      <>
      {/* Stats Bar */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <StatBox label='Verified Trades' value={stats.totalVerifiedTrades||'--'} color='var(--text)'/>
        <StatBox label='Win Rate' value={stats.winRate ? stats.winRate+'%' : '--'} color={stats.winRate>=50?'var(--green)':'var(--red)'} sub={stats.wins+'W / '+stats.losses+'L'}/>
        <StatBox label='Avg R:R' value={stats.avgRR||'--'} color={stats.avgRR>=1.5?'var(--green)':'var(--text-muted)'}/>
        <StatBox label='Consistency' value={profile.consistency?.consistencyScore ? profile.consistency.consistencyScore+'/100' : '--'} color={PURPLE}/>
        {leaderboardPositions?.length > 0 && <StatBox label='Best Rank' value={'#'+Math.min(...leaderboardPositions.map(l=>l.rank))} color='#f59e0b'/>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ background:'none', border:'none', borderBottom:activeTab===t.id?'2px solid '+PURPLE:'2px solid transparent', padding:'10px 16px', marginBottom:-1, fontFamily:'var(--font)', fontSize:13, fontWeight:activeTab===t.id?700:400, color:activeTab===t.id?PURPLE:'var(--text-muted)', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* POSTS TAB */}
      {activeTab === 'posts' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {!posts?.length ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>{'\uD83D\uDCDD'}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No posts yet</div>
            </div>
          ) : posts.map(post => (
            <div key={post.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <Avatar name={profile.displayName} size={36}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{profile.displayName}</span>
                    {profile.verifiedBadge && <span style={{ fontSize:10, color:PURPLE, fontWeight:700 }}>{'\u2713'}</span>}
                  </div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}</div>
                </div>
                {post.assetTag && <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', background:'var(--surface2)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--border)' }}>{post.assetTag}</span>}
                {post.direction && <span style={{ fontSize:11, fontWeight:700, color:post.direction==='LONG'?'var(--green)':'var(--red)', background:post.direction==='LONG'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', padding:'2px 8px', borderRadius:20 }}>{post.direction==='LONG'?'\u25B2 LONG':'\u25BC SHORT'}</span>}
              </div>
              <p style={{ fontFamily:'var(--font)', fontSize:14, color:'var(--text)', lineHeight:1.7, margin:'0 0 10px', whiteSpace:'pre-wrap' }}>{post.content}</p>
              {post.imageUrl && <img src={post.imageUrl} alt='' style={{ width:'100%', borderRadius:8, marginBottom:10, maxHeight:400, objectFit:'cover' }}/>}
              <div style={{ display:'flex', gap:16, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{'\u2764\uFE0F '+(post._count?.postLikes||0)}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{'\uD83D\uDCAC '+(post._count?.comments||0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* TRADE RECORD TAB */}
      {activeTab === 'trades' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          {!tradeCalls?.length ? (
            <div style={{ padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>{'\uD83D\uDCCA'}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No verified trades yet</div>
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Trades appear here once verified.</div>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1.2fr 80px 90px 90px 70px 90px', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                {['Asset','Dir','Entry','Target','R:R','Result'].map(h => (
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
                ))}
              </div>
              <div style={{ maxHeight:500, overflowY:'auto' }}>
                {tradeCalls.map((call,i) => (
                  <div key={call.id} style={{ display:'grid', gridTemplateColumns:'1.2fr 80px 90px 90px 70px 90px', padding:'10px 16px', borderBottom:i<tradeCalls.length-1?'1px solid var(--border)':'none', alignItems:'center', borderLeft:call.status==='won'?'2px solid rgba(34,197,94,0.4)':'2px solid rgba(239,68,68,0.4)' }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{call.asset||call.symbol}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:call.direction==='LONG'?'var(--green)':'var(--red)' }}>{call.direction==='LONG'?'\u25B2 L':'\u25BC S'}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{call.entryPrice?.toFixed(2)||'--'}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{call.targetPrice?.toFixed(2)||'--'}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{call.rMultiple?call.rMultiple.toFixed(1)+'R':'--'}</div>
                    <div style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:call.status==='won'?'rgba(34,197,94,0.1)':call.status==='lost'?'rgba(239,68,68,0.1)':'rgba(107,114,128,0.1)', color:call.status==='won'?'var(--green)':call.status==='lost'?'var(--red)':'var(--text-muted)', width:'fit-content' }}>
                      {call.status==='won'?'\u2713 WIN':call.status==='lost'?'\u2717 LOSS':'\u23F3 OPEN'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TOURNAMENTS TAB */}
      {activeTab === 'tournaments' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {!competitionResults?.length ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>{'\uD83C\uDFC6'}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No tournaments entered yet</div>
            </div>
          ) : competitionResults.map(entry => (
            <div key={entry.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{entry.tournament?.name}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', display:'flex', gap:10 }}>
                  {entry.tournament?.traderStyle && <span style={{ textTransform:'capitalize' }}>{entry.tournament.traderStyle}</span>}
                  {entry.tournament?.endDate && <span>{new Date(entry.tournament.endDate).toLocaleDateString()}</span>}
                  {entry.tournament?.prizePool > 0 && <span style={{ color:'#f59e0b', fontWeight:600 }}>{'$'+entry.tournament.prizePool.toLocaleString()+' pool'}</span>}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:26, fontWeight:800 }}>{entry.rank===1?'\uD83E\uDD47':entry.rank===2?'\uD83E\uDD48':entry.rank===3?'\uD83E\uDD49':entry.rank?'#'+entry.rank:'--'}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>{(entry.score||0).toFixed(1)+' pts'}</div>
                {entry.paidOut && entry.totalDollarPnL > 0 && <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--green)', fontWeight:700 }}>{'$'+entry.totalDollarPnL.toFixed(0)+' won'}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GROUPS TAB */}
      {activeTab === 'groups' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {ownedGroups?.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Runs</div>
              {ownedGroups.map(g => (
                <div key={g.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{g.name}</span>
                      {g.price > 0 && <span style={{ fontSize:11, fontWeight:700, color:'#f59e0b', background:'rgba(245,158,11,0.1)', padding:'2px 8px', borderRadius:20 }}>{'$'+g.price+'/mo'}</span>}
                      {g.price === 0 && <span style={{ fontSize:11, fontWeight:600, color:'var(--green)', background:'rgba(34,197,94,0.1)', padding:'2px 8px', borderRadius:20 }}>Free</span>}
                    </div>
                    {g.description && <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{g.description}</div>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color:'var(--text)' }}>{g._count?.members||0}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' }}>members</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {memberGroups?.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Member Of</div>
              {memberGroups.map(g => (
                <div key={g.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{g.name}</div>
                    {g.owner && <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{'by '+g.owner.name}</div>}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-muted)' }}>{(g._count?.members||0)+' members'}</div>
                </div>
              ))}
            </div>
          )}
          {!ownedGroups?.length && !memberGroups?.length && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>{'\uD83D\uDC65'}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No groups yet</div>
            </div>
          )}
        </div>
      )}

      {/* SCREENERS TAB */}
      {activeTab === 'screeners' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {!profile.publicScreeners?.length ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>{'\uD83D\uDD0D'}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No public screeners</div>
            </div>
          ) : profile.publicScreeners.map(s => (
            <div key={s.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{s.name}</div>
                  {s.description && <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{s.description}</div>}
                </div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textAlign:'right', flexShrink:0, marginLeft:12 }}>
                  <div>{(s.signals?.length||0)+' conditions'}</div>
                  <div>{'Used '+s.useCount+'x'}</div>
                </div>
              </div>
              {s.signals?.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {s.signals.slice(0,4).map((sig,i) => <span key={i} style={{ fontFamily:'var(--font-mono)', fontSize:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'2px 8px', borderRadius:4 }}>{sig.metric+' '+sig.operator+' '+sig.valueA}</span>)}
                  {s.signals.length > 4 && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{'+'+(s.signals.length-4)}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}