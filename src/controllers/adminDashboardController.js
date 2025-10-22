import sequelize from '../config/db.js';

export const getDashboardMetrics = async (_req, res) => {
  try {
    const [totalUsersRows] = await sequelize.query(`SELECT COUNT(*) AS total FROM [User]`);
    const [totalEventsRows] = await sequelize.query(`SELECT COUNT(*) AS total FROM [Event]`);
    const [activeEventsRows] = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM [Event]
       WHERE [Date] >= CONVERT(date, GETDATE()) AND ISNULL([Status],'Scheduled') <> 'Cancelled'`
    );

    // Optional table; guard with try/catch
    let pendingHostApplications = 0;
    try {
      const [appRows] = await sequelize.query(
        `SELECT COUNT(*) AS total FROM [Host_Applications] WHERE ISNULL([Status],'') = 'Pending'`
      );
      pendingHostApplications = Number(appRows?.[0]?.total || 0);
    } catch {
      pendingHostApplications = 0;
    }

    const [totalReviewsRows] = await sequelize.query(`SELECT COUNT(*) AS total FROM [Review]`);
    const [rsvpsLast7Rows] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM [Event_Attendees] WHERE [Timestamp] >= DATEADD(day, -7, GETDATE())`
    );

    // Engagement stats
    const [attendedTotalRows] = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM [Event_Attendees] EA
       INNER JOIN [Event] E ON E.Event_ID = EA.Event_ID
       WHERE CAST(E.[Date] AS date) < CAST(GETDATE() AS date)`
    );
    const [attendedThisMonthRows] = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM [Event_Attendees] EA
       INNER JOIN [Event] E ON E.Event_ID = EA.Event_ID
       WHERE YEAR(E.[Date]) = YEAR(GETDATE()) AND MONTH(E.[Date]) = MONTH(GETDATE())
         AND CAST(E.[Date] AS date) < CAST(GETDATE() AS date)`
    );
    const [avgAttendanceRows] = await sequelize.query(
      `WITH counts AS (
         SELECT E.Event_ID, COUNT(EA.User_ID) AS cnt
         FROM [Event] E
         LEFT JOIN [Event_Attendees] EA ON EA.Event_ID = E.Event_ID
         GROUP BY E.Event_ID
       )
       SELECT AVG(CAST(cnt AS FLOAT)) AS avgCnt FROM counts`
    );
    const [popularEventRows] = await sequelize.query(
      `SELECT TOP 1 E.Event_ID AS eventId, E.Title AS title, COUNT(EA.User_ID) AS attendees
       FROM [Event] E
       LEFT JOIN [Event_Attendees] EA ON EA.Event_ID = E.Event_ID
       GROUP BY E.Event_ID, E.Title
       ORDER BY COUNT(EA.User_ID) DESC, E.Title ASC`
    );
    const [activeUsers7Rows] = await sequelize.query(
      `SELECT COUNT(DISTINCT User_ID) AS total
       FROM (
         SELECT EA.User_ID, EA.[Timestamp] AS t
         FROM [Event_Attendees] EA
         WHERE EA.[Timestamp] >= DATEADD(day, -7, GETDATE())
         UNION ALL
         SELECT R.Reviewer_User_ID AS User_ID, R.[Date] AS t
         FROM [Review] R WHERE R.[Date] >= DATEADD(day, -7, GETDATE())
       ) x`
    );

    // Event analytics
    const [upcomingEventsRows] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM [Event]
       WHERE [Date] >= CONVERT(date, GETDATE()) AND ISNULL([Status],'Scheduled') <> 'Cancelled'`
    );
    const [cancelledEventsRows] = await sequelize.query(
      `SELECT COUNT(*) AS total FROM [Event] WHERE ISNULL([Status],'') = 'Cancelled'`
    );
    const [categoryBreakdown] = await sequelize.query(
      `SELECT ISNULL(NULLIF(LTRIM(RTRIM([category])), ''), 'Unspecified') AS category, COUNT(*) AS count
       FROM [Event]
       GROUP BY ISNULL(NULLIF(LTRIM(RTRIM([category])), ''), 'Unspecified')
       ORDER BY count DESC`
    );
    const [topVenues] = await sequelize.query(
      `SELECT TOP 3 ISNULL(NULLIF(LTRIM(RTRIM([venue])), ''), 'Unspecified') AS venue, COUNT(*) AS count
       FROM [Event]
       GROUP BY ISNULL(NULLIF(LTRIM(RTRIM([venue])), ''), 'Unspecified')
       ORDER BY count DESC, venue ASC`
    );

    // User insights (best effort if created date exists)
    let newUsersThisMonth = 0;
    try {
      const [rows] = await sequelize.query(
        `SELECT COUNT(*) AS total FROM [User]
         WHERE (YEAR([Created_At]) = YEAR(GETDATE()) AND MONTH([Created_At]) = MONTH(GETDATE()))
            OR (YEAR([CreatedAt]) = YEAR(GETDATE()) AND MONTH([CreatedAt]) = MONTH(GETDATE()))
            OR (YEAR([Registration_Date]) = YEAR(GETDATE()) AND MONTH([Registration_Date]) = MONTH(GETDATE()))`
      );
      newUsersThisMonth = Number(rows?.[0]?.total || 0);
    } catch { newUsersThisMonth = 0; }

    // Hosts: verified vs pending (best effort)
    let hostsActive = 0;
    try {
      const [h] = await sequelize.query(`SELECT COUNT(*) AS total FROM [Host_Profile] WHERE Is_Active = 1`);
      hostsActive = Number(h?.[0]?.total || 0);
    } catch { hostsActive = 0; }

    // Most active user (by RSVPs + Reviews)
    let mostActiveUser = null;
    try {
      const [ma] = await sequelize.query(
        `WITH attend AS (
           SELECT EA.User_ID, COUNT(*) AS c1 FROM [Event_Attendees] EA GROUP BY EA.User_ID
         ),
         reviews AS (
           SELECT R.Reviewer_User_ID AS User_ID, COUNT(*) AS c2 FROM [Review] R GROUP BY R.Reviewer_User_ID
         ),
         combined AS (
           SELECT COALESCE(a.User_ID, r.User_ID) AS User_ID, COALESCE(a.c1,0)+COALESCE(r.c2,0) AS score
           FROM attend a
           FULL OUTER JOIN reviews r ON r.User_ID = a.User_ID
         )
         SELECT TOP 1 U.User_ID AS userId, U.Name AS name, score
         FROM combined c
         LEFT JOIN [User] U ON U.User_ID = c.User_ID
         ORDER BY score DESC, U.Name ASC`
      );
      mostActiveUser = ma?.[0] || null;
    } catch { mostActiveUser = null; }

    // Reviews metrics
    const [avgEventRatingRows] = await sequelize.query(`SELECT AVG(CAST([Rating] AS FLOAT)) AS avg FROM [Review]`);
    const [mostReviewedRows] = await sequelize.query(
      `SELECT TOP 1 E.Event_ID AS eventId, E.Title AS title, COUNT(R.Review_ID) AS reviews
       FROM [Event] E LEFT JOIN [Review] R ON R.Event_ID = E.Event_ID
       GROUP BY E.Event_ID, E.Title
       ORDER BY COUNT(R.Review_ID) DESC, E.Title ASC`
    );

    // Charts: events per month (last 12), users per month (best effort)
    const [eventsPerMonth] = await sequelize.query(
      `SELECT FORMAT([Date], 'yyyy-MM') AS ym, COUNT(*) AS count
       FROM [Event]
       WHERE [Date] >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
       GROUP BY FORMAT([Date], 'yyyy-MM')
       ORDER BY ym ASC`
    );
    let usersPerMonth = [];
    try {
      const [rows] = await sequelize.query(
        `SELECT TOP 12 FORMAT(COALESCE([Created_At],[CreatedAt],[Registration_Date]), 'yyyy-MM') AS ym, COUNT(*) AS count
         FROM [User]
         WHERE COALESCE([Created_At],[CreatedAt],[Registration_Date]) IS NOT NULL
         GROUP BY FORMAT(COALESCE([Created_At],[CreatedAt],[Registration_Date]), 'yyyy-MM')
         ORDER BY ym DESC`
      );
      usersPerMonth = (rows || []).reverse();
    } catch { usersPerMonth = []; }

    // System health
    const dbConnected = true; // If we got here, a bunch of queries succeeded
    let lastBackup = null;
    try {
      const [b] = await sequelize.query(`SELECT CONVERT(varchar(19), MAX(backup_finish_date), 120) AS dt FROM msdb..backupset`);
      lastBackup = b?.[0]?.dt || null;
    } catch {}
    const apiUptimeSec = Math.floor(process.uptime());
    const storageUsed = null; // hook to S3/Blob later
    // Recent reviews (top 5)
    const [recentReviews] = await sequelize.query(
      `SELECT TOP 5 R.Review_ID   AS id,
                     R.Rating      AS rating,
                     R.[Date]      AS createdAt,
                     E.Event_ID    AS eventId,
                     E.Title       AS eventTitle,
                     U.Name        AS reviewerName
       FROM [Review] R
       LEFT JOIN [Event] E ON E.Event_ID = R.Event_ID
       LEFT JOIN [User]  U ON U.User_ID = R.Reviewer_User_ID
       ORDER BY R.[Date] DESC, R.Review_ID DESC`
    );

    // Recent RSVPs (top 5)
    const [recentRsvps] = await sequelize.query(
      `SELECT TOP 5 EA.Event_ID   AS eventId,
                     E.Title      AS eventTitle,
                     EA.User_ID   AS userId,
                     U.Name       AS userName,
                     EA.[Timestamp] AS createdAt
       FROM [Event_Attendees] EA
       LEFT JOIN [Event] E ON E.Event_ID = EA.Event_ID
       LEFT JOIN [User]  U ON U.User_ID = EA.User_ID
       ORDER BY EA.[Timestamp] DESC`
    );

    res.json({
      status: 'success',
      data: {
        counts: {
          totalUsers: Number(totalUsersRows?.[0]?.total || 0),
          totalEvents: Number(totalEventsRows?.[0]?.total || 0),
          activeEvents: Number(activeEventsRows?.[0]?.total || 0),
          pendingHostApplications,
          totalReviews: Number(totalReviewsRows?.[0]?.total || 0),
          rsvpsLast7: Number(rsvpsLast7Rows?.[0]?.total || 0),
        },
        recent: {
          reviews: recentReviews || [],
          rsvps: recentRsvps || [],
        },
        engagement: {
          attendedTotal: Number(attendedTotalRows?.[0]?.total || 0),
          attendedThisMonth: Number(attendedThisMonthRows?.[0]?.total || 0),
          avgAttendancePerEvent: Number(avgAttendanceRows?.[0]?.avgCnt || 0),
          mostPopularEvent: popularEventRows?.[0] || null,
          activeUsers7d: Number(activeUsers7Rows?.[0]?.total || 0),
        },
        events: {
          upcomingCount: Number(upcomingEventsRows?.[0]?.total || 0),
          cancelledCount: Number(cancelledEventsRows?.[0]?.total || 0),
          categoryBreakdown: categoryBreakdown || [],
          topVenues: topVenues || [],
          perMonth: eventsPerMonth || [],
        },
        users: {
          newThisMonth: newUsersThisMonth,
          perMonth: usersPerMonth,
          hostsActive,
          mostActiveUser,
        },
        reviews: {
          averageRating: Number(avgEventRatingRows?.[0]?.avg || 0),
          mostReviewedEvent: mostReviewedRows?.[0] || null,
        },
        system: {
          dbConnected,
          lastBackup,
          apiUptimeSec,
          storageUsed,
        }
      },
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'Failed to load admin metrics', details: e.message });
  }
};
