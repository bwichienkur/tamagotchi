-- CreateEnum
CREATE TYPE "ConditionBadge" AS ENUM ('NONE', 'NIB', 'IOB');

-- CreateEnum
CREATE TYPE "WikiPageType" AS ENUM ('GENERAL', 'DEVICE', 'OWNED_DEVICE', 'CATEGORY');

-- CreateEnum
CREATE TYPE "WorkingStatus" AS ENUM ('WORKING', 'NOT_WORKING', 'UNTESTED', 'FOR_PARTS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "DeviceFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "familyId" TEXT NOT NULL,
    "manufacturer" TEXT,
    "releaseYear" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "heroImage" TEXT,
    "generation" TEXT,
    "predecessorId" TEXT,
    "successorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceProperty" (
    "id" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'Details',
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeviceProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shell" (
    "id" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "officialName" TEXT,
    "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryImage" TEXT,
    "additionalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "region" TEXT,
    "releaseDate" TIMESTAMP(3),
    "year" INTEGER,
    "wave" TEXT,
    "colorDescription" TEXT,
    "rarity" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "externalSourceId" TEXT,
    "importedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "shellId" TEXT,
    "customDeviceType" TEXT,
    "customShellName" TEXT,
    "slug" TEXT NOT NULL,
    "nickname" TEXT,
    "primaryPhoto" TEXT,
    "additionalPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditionBadge" "ConditionBadge" NOT NULL DEFAULT 'NONE',
    "conditionNotes" TEXT,
    "showMoreInfo" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "purchaseCurrency" TEXT DEFAULT 'USD',
    "purchasedFrom" TEXT,
    "serialNumber" TEXT,
    "workingStatus" "WorkingStatus" NOT NULL DEFAULT 'UNTESTED',
    "currentlyRunning" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentPageId" TEXT,
    "deviceModelId" TEXT,
    "ownedDeviceId" TEXT,
    "pageType" "WikiPageType" NOT NULL DEFAULT 'GENERAL',
    "summary" TEXT,
    "richContent" TEXT,
    "sections" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" TEXT NOT NULL,
    "wikiPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "richContent" TEXT,
    "sections" JSONB,
    "editedById" TEXT,
    "editSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagAssignment" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "wikiPageId" TEXT,

    CONSTRAINT "TagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceCitation" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "website" TEXT,
    "accessedAt" TIMESTAMP(3),
    "notes" TEXT,
    "wikiPageId" TEXT,
    "shellId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deviceModelId" TEXT,
    "ownedDeviceId" TEXT,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shellId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFamily_name_key" ON "DeviceFamily"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFamily_slug_key" ON "DeviceFamily"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModel_slug_key" ON "DeviceModel"("slug");

-- CreateIndex
CREATE INDEX "DeviceModel_familyId_idx" ON "DeviceModel"("familyId");

-- CreateIndex
CREATE INDEX "DeviceModel_name_idx" ON "DeviceModel"("name");

-- CreateIndex
CREATE INDEX "DeviceModel_releaseYear_idx" ON "DeviceModel"("releaseYear");

-- CreateIndex
CREATE INDEX "DeviceProperty_deviceModelId_idx" ON "DeviceProperty"("deviceModelId");

-- CreateIndex
CREATE INDEX "Shell_deviceModelId_idx" ON "Shell"("deviceModelId");

-- CreateIndex
CREATE INDEX "Shell_name_idx" ON "Shell"("name");

-- CreateIndex
CREATE INDEX "Shell_sourceUrl_idx" ON "Shell"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Shell_deviceModelId_slug_key" ON "Shell"("deviceModelId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "OwnedDevice_slug_key" ON "OwnedDevice"("slug");

-- CreateIndex
CREATE INDEX "OwnedDevice_userId_idx" ON "OwnedDevice"("userId");

-- CreateIndex
CREATE INDEX "OwnedDevice_deviceModelId_idx" ON "OwnedDevice"("deviceModelId");

-- CreateIndex
CREATE INDEX "OwnedDevice_shellId_idx" ON "OwnedDevice"("shellId");

-- CreateIndex
CREATE INDEX "OwnedDevice_favorite_idx" ON "OwnedDevice"("favorite");

-- CreateIndex
CREATE INDEX "OwnedDevice_currentlyRunning_idx" ON "OwnedDevice"("currentlyRunning");

-- CreateIndex
CREATE UNIQUE INDEX "WikiPage_slug_key" ON "WikiPage"("slug");

-- CreateIndex
CREATE INDEX "WikiPage_parentPageId_idx" ON "WikiPage"("parentPageId");

-- CreateIndex
CREATE INDEX "WikiPage_deviceModelId_idx" ON "WikiPage"("deviceModelId");

-- CreateIndex
CREATE INDEX "WikiPage_title_idx" ON "WikiPage"("title");

-- CreateIndex
CREATE INDEX "WikiRevision_wikiPageId_idx" ON "WikiRevision"("wikiPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TagAssignment_tagId_wikiPageId_key" ON "TagAssignment"("tagId", "wikiPageId");

-- CreateIndex
CREATE INDEX "GalleryImage_deviceModelId_idx" ON "GalleryImage"("deviceModelId");

-- CreateIndex
CREATE INDEX "GalleryImage_ownedDeviceId_idx" ON "GalleryImage"("ownedDeviceId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_shellId_key" ON "WishlistItem"("userId", "shellId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModel" ADD CONSTRAINT "DeviceModel_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "DeviceFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModel" ADD CONSTRAINT "DeviceModel_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "DeviceModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceProperty" ADD CONSTRAINT "DeviceProperty_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shell" ADD CONSTRAINT "Shell_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedDevice" ADD CONSTRAINT "OwnedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedDevice" ADD CONSTRAINT "OwnedDevice_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedDevice" ADD CONSTRAINT "OwnedDevice_shellId_fkey" FOREIGN KEY ("shellId") REFERENCES "Shell"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_parentPageId_fkey" FOREIGN KEY ("parentPageId") REFERENCES "WikiPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_ownedDeviceId_fkey" FOREIGN KEY ("ownedDeviceId") REFERENCES "OwnedDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiPage" ADD CONSTRAINT "WikiPage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiRevision" ADD CONSTRAINT "WikiRevision_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiRevision" ADD CONSTRAINT "WikiRevision_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_wikiPageId_fkey" FOREIGN KEY ("wikiPageId") REFERENCES "WikiPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_ownedDeviceId_fkey" FOREIGN KEY ("ownedDeviceId") REFERENCES "OwnedDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_shellId_fkey" FOREIGN KEY ("shellId") REFERENCES "Shell"("id") ON DELETE CASCADE ON UPDATE CASCADE;
