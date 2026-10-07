/*
  Promote CuongNKCE161131@fpt.edu.vn to the active manager of one club.

  Before executing, use the discovery query below and replace @ClubCode.
  The script intentionally retires the club's current active manager. A user
  can have only one active manager assignment in the current schema.
*/

/* Discovery: select one Code to use as @ClubCode. */
SELECT
    c.Id,
    c.Code,
    c.Name,
    c.IsActive,
    currentManager.ManagerUserId AS CurrentManagerUserId,
    currentManager.ManagerName AS CurrentManagerName
FROM [ClubReportHub_Club].dbo.Clubs AS c
OUTER APPLY (
    SELECT TOP (1) ma.ManagerUserId, ma.ManagerName
    FROM [ClubReportHub_Club].dbo.ClubManagerAssignments AS ma
    WHERE ma.ClubId = c.Id AND ma.IsActive = 1
) AS currentManager
WHERE c.IsActive = 1 AND c.DeletedAtUtc IS NULL
ORDER BY c.Code;
GO

USE [ClubReportHub_Club];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Email nvarchar(200) = N'CuongNKCE161131@fpt.edu.vn';
DECLARE @ClubCode nvarchar(30) = N'REPLACE_WITH_CLUB_CODE';

IF @ClubCode = N'REPLACE_WITH_CLUB_CODE'
    THROW 50000, 'Set @ClubCode to an existing active club code before executing.', 1;

DECLARE @UserId int;
DECLARE @UserFullName nvarchar(200);
DECLARE @IsUserActive bit;

SELECT
    @UserId = u.Id,
    @UserFullName = NULLIF(LTRIM(RTRIM(u.FullName)), N''),
    @IsUserActive = u.IsActive
FROM [ClubReportHub_Auth].dbo.Users AS u
WHERE LOWER(u.Email) = LOWER(@Email);

IF @UserId IS NULL
    THROW 50001, 'The target email does not exist in ClubReportHub_Auth.dbo.Users.', 1;

IF @IsUserActive = 0
    THROW 50002, 'The target user is inactive.', 1;

SET @UserFullName = COALESCE(@UserFullName, @Email);

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ClubId int;
    DECLARE @PreviousManagerUserId int;
    DECLARE @Now datetimeoffset(7) = TODATETIMEOFFSET(SYSUTCDATETIME(), '+00:00');

    SELECT @ClubId = c.Id
    FROM dbo.Clubs AS c WITH (UPDLOCK, HOLDLOCK)
    WHERE c.Code = @ClubCode
      AND c.IsActive = 1
      AND c.DeletedAtUtc IS NULL;

    IF @ClubId IS NULL
        THROW 50003, 'The club code does not identify an active club.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.ClubManagerAssignments AS ma WITH (UPDLOCK, HOLDLOCK)
        WHERE ma.ManagerUserId = @UserId
          AND ma.ClubId <> @ClubId
          AND ma.IsActive = 1
    )
        THROW 50004, 'The user already manages another club.', 1;

    SELECT @PreviousManagerUserId = ma.ManagerUserId
    FROM dbo.ClubManagerAssignments AS ma WITH (UPDLOCK, HOLDLOCK)
    WHERE ma.ClubId = @ClubId AND ma.IsActive = 1;

    IF @PreviousManagerUserId IS NULL OR @PreviousManagerUserId <> @UserId
    BEGIN
        UPDATE dbo.ClubManagerAssignments
        SET IsActive = 0,
            EndedAtUtc = @Now
        WHERE ClubId = @ClubId AND IsActive = 1;

        INSERT INTO dbo.ClubManagerAssignments
            (ClubId, ManagerUserId, ManagerName, AssignedAtUtc, EndedAtUtc, IsActive)
        VALUES
            (@ClubId, @UserId, @UserFullName, @Now, NULL, 1);
    END;

    /* An active manager must also have an approved, non-treasurer membership. */
    IF EXISTS (
        SELECT 1
        FROM dbo.ClubMemberships WITH (UPDLOCK, HOLDLOCK)
        WHERE ClubId = @ClubId AND UserId = @UserId
    )
    BEGIN
        UPDATE dbo.ClubMemberships
        SET FullName = @UserFullName,
            Email = @Email,
            Role = N'MEMBER',
            TreasurerSlot = NULL,
            Status = N'Approved',
            ReviewedAtUtc = @Now,
            ReviewedByUserId = NULL,
            IsDeleted = 0,
            DeletedAtUtc = NULL,
            DeletedByUserId = NULL
        WHERE ClubId = @ClubId AND UserId = @UserId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.ClubMemberships
            (ClubId, UserId, FullName, DateOfBirth, Gender, Email, PhoneNumber,
             Address, Role, TreasurerSlot, Status, RequestMessage, PersonalInfo,
             Goals, Reason, Hobbies, Skills, Expectations, Contributions,
             AdditionalInfoJson, AcceptedClubRules, CommittedToParticipate,
             ReviewNote, RequestedAtUtc, ReviewedAtUtc, ReviewedByUserId,
             IsDeleted, DeletedAtUtc, DeletedByUserId)
        VALUES
            (@ClubId, @UserId, @UserFullName, NULL, N'', @Email, N'',
             N'', N'MEMBER', NULL, N'Approved', NULL, N'',
             N'', N'', N'', N'', N'', N'',
             N'{}', 0, 0,
             N'Assigned as club manager by database seed.', @Now, @Now, NULL,
             0, NULL, NULL);
    END;

    UPDATE dbo.Clubs
    SET ConcurrencyToken = NEWID()
    WHERE Id = @ClubId;

    /* Mirrors ManagerEndpoints: invalidate cached access in downstream services. */
    DECLARE @EventId uniqueidentifier = NEWID();
    DECLARE @AffectedUserIds nvarchar(100) = CASE
        WHEN @PreviousManagerUserId IS NOT NULL AND @PreviousManagerUserId <> @UserId
            THEN CONCAT(N'[', @PreviousManagerUserId, N',', @UserId, N']')
        ELSE CONCAT(N'[', @UserId, N']')
    END;
    DECLARE @Payload nvarchar(max) = CONCAT(
        N'{"eventId":"', CONVERT(nvarchar(36), @EventId),
        N'","occurredAtUtc":"', CONVERT(nvarchar(33), @Now, 127),
        N'","clubId":', @ClubId,
        N',"userIds":', @AffectedUserIds,
        N'}');

    INSERT INTO dbo.OutboxMessages
        (Id, OccurredAtUtc, EventType, EventTypeName, Payload, Status,
         RetryCount, ProcessedAtUtc, ErrorMessage, CorrelationId,
         ClaimedAtUtc, ClaimExpiresAtUtc, ClaimedByInstanceId, ConcurrencyToken)
    VALUES
        (@EventId, @Now, N'club.access.invalidated',
         N'ClubReportHub.Shared.Events.ClubAccessInvalidatedEvent', @Payload, N'Pending',
         0, NULL, NULL, NULL, NULL, NULL, NULL, NEWID());

    COMMIT TRANSACTION;

    SELECT
        c.Id AS ClubId,
        c.Code AS ClubCode,
        c.Name AS ClubName,
        u.Id AS ManagerUserId,
        u.Email AS ManagerEmail,
        ma.ManagerName,
        ma.AssignedAtUtc,
        membership.Status AS MembershipStatus,
        membership.Role AS MembershipRole,
        membership.IsDeleted AS MembershipIsDeleted
    FROM dbo.Clubs AS c
    INNER JOIN dbo.ClubManagerAssignments AS ma
        ON ma.ClubId = c.Id AND ma.IsActive = 1
    INNER JOIN [ClubReportHub_Auth].dbo.Users AS u
        ON u.Id = ma.ManagerUserId
    INNER JOIN dbo.ClubMemberships AS membership
        ON membership.ClubId = c.Id AND membership.UserId = ma.ManagerUserId
    WHERE c.Id = @ClubId;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
