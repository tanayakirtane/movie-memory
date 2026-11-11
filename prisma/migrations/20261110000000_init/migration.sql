CREATE TABLE "User" (
 "id" TEXT NOT NULL,
 "name" TEXT,
 "email" TEXT,
 "emailVerified" TIMESTAMP(3),
 "image" TEXT,
 "favoriteMovie" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Account" (
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
 CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);
CREATE TABLE "Session" (
 "sessionToken" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "expires" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionToken")
);
CREATE TABLE "VerificationToken" (
 "identifier" TEXT NOT NULL,
 "token" TEXT NOT NULL,
 "expires" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);
CREATE TABLE "MovieFact" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "movie" TEXT NOT NULL,
 "text" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MovieFact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "MovieFact_userId_movie_createdAt_idx" ON "MovieFact"("userId", "movie", "createdAt" DESC);
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieFact" ADD CONSTRAINT "MovieFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
