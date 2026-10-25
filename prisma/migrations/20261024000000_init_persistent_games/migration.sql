CREATE TABLE `GameSession` (
  `id` VARCHAR(64) NOT NULL,
  `ownerSessionId` CHAR(64) NOT NULL,
  `status` ENUM('ACTIVE', 'FINISHED', 'ABANDONED', 'RESTARTED') NOT NULL DEFAULT 'ACTIVE',
  `revision` INTEGER NOT NULL DEFAULT 0,
  `stateJson` JSON NOT NULL,
  `schemaVersion` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `finishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `GameSession_ownerSessionId_status_updatedAt_idx` (`ownerSessionId`, `status`, `updatedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `GameActionLog` (
  `id` VARCHAR(64) NOT NULL,
  `gameSessionId` VARCHAR(64) NOT NULL,
  `actionId` VARCHAR(191) NOT NULL,
  `playerId` VARCHAR(64) NOT NULL,
  `revision` INTEGER NOT NULL,
  `actionType` VARCHAR(64) NOT NULL,
  `payload` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `GameActionLog_gameSessionId_actionId_key` (`gameSessionId`, `actionId`),
  INDEX `GameActionLog_gameSessionId_revision_idx` (`gameSessionId`, `revision`),
  CONSTRAINT `GameActionLog_gameSessionId_fkey` FOREIGN KEY (`gameSessionId`) REFERENCES `GameSession` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
