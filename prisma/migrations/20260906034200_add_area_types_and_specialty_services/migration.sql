-- CreateTable
CREATE TABLE "AreaType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "productionRate" DOUBLE PRECISION NOT NULL,
    "rateRange" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialtyService" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "defaultRate" DOUBLE PRECISION NOT NULL,
    "rateRange" DOUBLE PRECISION[],
    "unitLabel" TEXT NOT NULL,
    "minCharge" DOUBLE PRECISION NOT NULL,
    "productionRate" DOUBLE PRECISION,
    "benchmarkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecialtyService_pkey" PRIMARY KEY ("id")
);
