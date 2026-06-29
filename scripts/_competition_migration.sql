-- Competition Paper Trading Engine — run this in your Supabase SQL editor
-- Safe to run multiple times (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS "CompetitionPortfolio" (
  "id"              TEXT NOT NULL,
  "competitionId"   TEXT NOT NULL,
  "competitionType" TEXT NOT NULL DEFAULT 'h2h',
  "userId"          TEXT NOT NULL,
  "startingCash"    DOUBLE PRECISION NOT NULL DEFAULT 10000,
  "cash"            DOUBLE PRECISION NOT NULL DEFAULT 10000,
  "isLiquidated"    BOOLEAN NOT NULL DEFAULT false,
  "endDate"         TIMESTAMP(3),
  "status"          TEXT NOT NULL DEFAULT 'active',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompetitionPortfolio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompetitionPortfolio_competitionId_userId_key"
  ON "CompetitionPortfolio"("competitionId", "userId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'CompetitionPortfolio_userId_fkey'
  ) THEN
    ALTER TABLE "CompetitionPortfolio"
      ADD CONSTRAINT "CompetitionPortfolio_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CompetitionPosition" (
  "id"           TEXT NOT NULL,
  "portfolioId"  TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "symbol"       TEXT NOT NULL,
  "symbolName"   TEXT NOT NULL DEFAULT '',
  "assetType"    TEXT NOT NULL DEFAULT 'stock',
  "direction"    TEXT NOT NULL,
  "quantity"     DOUBLE PRECISION NOT NULL,
  "leverage"     DOUBLE PRECISION NOT NULL DEFAULT 1,
  "entryPrice"   DOUBLE PRECISION NOT NULL,
  "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "openedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stopLoss"     DOUBLE PRECISION,
  "takeProfit"   DOUBLE PRECISION,
  CONSTRAINT "CompetitionPosition_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionPosition_portfolioId_fkey') THEN
    ALTER TABLE "CompetitionPosition" ADD CONSTRAINT "CompetitionPosition_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "CompetitionPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionPosition_userId_fkey') THEN
    ALTER TABLE "CompetitionPosition" ADD CONSTRAINT "CompetitionPosition_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CompetitionOrder" (
  "id"            TEXT NOT NULL,
  "portfolioId"   TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "symbol"        TEXT NOT NULL,
  "symbolName"    TEXT NOT NULL DEFAULT '',
  "assetType"     TEXT NOT NULL DEFAULT 'stock',
  "direction"     TEXT NOT NULL,
  "quantity"      DOUBLE PRECISION NOT NULL,
  "leverage"      DOUBLE PRECISION NOT NULL DEFAULT 1,
  "orderType"     TEXT NOT NULL,
  "limitPrice"    DOUBLE PRECISION,
  "stopLoss"      DOUBLE PRECISION,
  "takeProfit"    DOUBLE PRECISION,
  "status"        TEXT NOT NULL DEFAULT 'pending',
  "submittedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "canFillAfter"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "filledAt"      TIMESTAMP(3),
  "fillPrice"     DOUBLE PRECISION,
  "rejectReason"  TEXT,
  CONSTRAINT "CompetitionOrder_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionOrder_portfolioId_fkey') THEN
    ALTER TABLE "CompetitionOrder" ADD CONSTRAINT "CompetitionOrder_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "CompetitionPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionOrder_userId_fkey') THEN
    ALTER TABLE "CompetitionOrder" ADD CONSTRAINT "CompetitionOrder_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CompetitionTrade" (
  "id"            TEXT NOT NULL,
  "portfolioId"   TEXT NOT NULL,
  "competitionId" TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "positionId"    TEXT,
  "symbol"        TEXT NOT NULL,
  "symbolName"    TEXT NOT NULL DEFAULT '',
  "assetType"     TEXT NOT NULL DEFAULT 'stock',
  "direction"     TEXT NOT NULL,
  "quantity"      DOUBLE PRECISION NOT NULL,
  "leverage"      DOUBLE PRECISION NOT NULL DEFAULT 1,
  "entryPrice"    DOUBLE PRECISION NOT NULL,
  "exitPrice"     DOUBLE PRECISION NOT NULL,
  "openedAt"      TIMESTAMP(3) NOT NULL,
  "closedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closeReason"   TEXT NOT NULL DEFAULT 'manual',
  "pnl"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pnlPct"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "CompetitionTrade_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionTrade_portfolioId_fkey') THEN
    ALTER TABLE "CompetitionTrade" ADD CONSTRAINT "CompetitionTrade_portfolioId_fkey"
      FOREIGN KEY ("portfolioId") REFERENCES "CompetitionPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'CompetitionTrade_userId_fkey') THEN
    ALTER TABLE "CompetitionTrade" ADD CONSTRAINT "CompetitionTrade_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
