-- CreateTable
CREATE TABLE "ops_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "entityPluginId" TEXT,
    "entityId" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "source" TEXT,
    "entityPluginId" TEXT,
    "entityId" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ops_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ops_tasks_userId_status_idx" ON "ops_tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "ops_alerts_userId_dismissedAt_idx" ON "ops_alerts"("userId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "ops_tasks" ADD CONSTRAINT "ops_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ops_alerts" ADD CONSTRAINT "ops_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
