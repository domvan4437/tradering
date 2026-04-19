
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { runTemplate } from '../../../../../lib/screenerEngine';

// Assets to scan by class
const ASSET_LISTS = {
  commodities: ['GC=F','SI=F','HG=F','CL=F','NG=F','ZW=F','ZC=F','ZS=F','CT=F','KC=F','SB=F'],
  forex: ['EURUSD=X','GBPUSD=X','USDJPY=X','AUDUSD=X','USDCAD=X','NZDUSD=X','USDCHF=X'],
  futures: ['ES=F','NQ=F','YM=F','RTY=F','ZB=F','ZN=F','GC=F','CL=F'],
  stocks: ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM'],
  any: ['GC=F','SI=F','CL=F','NG=F','ES=F','NQ=F','EURUSD=X','GBPUSD=X','ZW=F','ZC=F'],
};

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const template = await prisma.screenerTemplate.findUnique({
    where: { id: params.id },
    include: { signals: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!template) return Response.json({ error: 'Template not found' }, { status: 404 });
  if (!template.signals.length) return Response.json({ error: 'No signals defined' }, { status: 400 });

  const assets = ASSET_LISTS[template.assetClass || 'any'];
  const results = [];

  // Fetch data for each asset and run signals
  for (const symbol of assets) {
    try {
      // Fetch live price
      const priceRes = await fetch(
        `${process.env.NEXTAUTH_URL}/api/prices?symbols=${symbol}`
      ).catch(() => null);
      const priceData = priceRes ? await priceRes.json().catch(() => ({})) : {};
      const pd = priceData?.prices?.[symbol] || {};

      // Fetch COT data
      const cotRes = await fetch(
        `${process.env.NEXTAUTH_URL}/api/cotindex?commodity=${symbol}`
      ).catch(() => null);
      const cotData = cotRes ? await cotRes.json().catch(() => ({})) : {};

      // Fetch seasonal data
      const seasRes = await fetch(
        `${process.env.NEXTAUTH_URL}/api/seasonal?commodity=${symbol}`
      ).catch(() => null);
      const seasData = seasRes ? await seasRes.json().catch(() => ({})) : {};

      // Build unified data object
      const dataObj = {
        price: pd.price || null,
        changePercent: pd.changePercent || null,
        cotIndex: cotData.index || cotData.score || null,
        cotCommercialPct: cotData.commercialPercentile || null,
        cotCommercialNet: cotData.commercialNet || null,
        cotSpecPct: cotData.specPercentile || null,
        cotSpecNet: cotData.specNet || null,
        cotWeekChange: cotData.weekChange || null,
        seasonalScore: seasData.score || null,
        seasonalWinRate: seasData.winRate || null,
        seasonalStreak: seasData.streak || null,
      };

      const result = runTemplate(template, template.signals, dataObj);
      results.push({
        symbol,
        ...result,
        price: pd.price,
        changePercent: pd.changePercent,
      });
    } catch (err) {
      results.push({ symbol, score: 0, passed: false, error: true, results: [] });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Save run record
  const flagged = results.filter(r => r.passed);
  await prisma.screenerRun.create({
    data: {
      templateId: template.id,
      userId: session.user.id,
      assets: JSON.stringify(assets),
      results: JSON.stringify(results.map(r => ({
        symbol: r.symbol,
        score: r.score,
        passed: r.passed,
      }))),
      flaggedCount: flagged.length,
    },
  }).catch(() => {});

  // Increment use count
  await prisma.screenerTemplate.update({
    where: { id: template.id },
    data: { useCount: { increment: 1 } },
  }).catch(() => {});

  return Response.json({ results, flagged: flagged.length, total: assets.length });
}
