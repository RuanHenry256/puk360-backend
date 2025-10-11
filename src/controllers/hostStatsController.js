import sequelize from '../config/db.js';

export const getHostStats = async (req, res) => {
  try {
    const hostUserId = Number(req.params.hostUserId || req.query.hostUserId);
    if (!hostUserId) return res.status(400).json({ status: 'error', error: 'hostUserId is required' });

    const [avgRatingRows] = await sequelize.query(
      `SELECT AVG(CAST(R.Rating AS FLOAT)) AS avgRating
       FROM Review R
       INNER JOIN Event E ON E.Event_ID = R.Event_ID
       WHERE E.Host_User_ID = :hostUserId`,
      { replacements: { hostUserId } }
    );

    const [upcomingRows] = await sequelize.query(
      `SELECT COUNT_BIG(1) AS totalUpcoming
       FROM [Event] E
       WHERE E.[Host_User_ID] = :hostUserId
         AND E.[Date] >= CONVERT(date, GETDATE())`,
      { replacements: { hostUserId } }
    );

    const [avgRsvpRows] = await sequelize.query(
      `WITH counts AS (
         SELECT E.Event_ID, COUNT(A.User_ID) AS cnt
         FROM Event E
         LEFT JOIN Event_Attendees A ON A.Event_ID = E.Event_ID
         WHERE E.Host_User_ID = :hostUserId
         GROUP BY E.Event_ID
       )
       SELECT AVG(CAST(cnt AS FLOAT)) AS avgRsvpPerEvent
       FROM counts`,
      { replacements: { hostUserId } }
    );

    res.json({
      status: 'success',
      data: {
        avgRating: Number(avgRatingRows?.[0]?.avgRating ?? avgRatingRows?.avgRating ?? 0) || 0,
        totalUpcoming: Number(upcomingRows?.[0]?.totalUpcoming ?? upcomingRows?.totalUpcoming ?? 0) || 0,
        avgRsvpPerEvent: Number(avgRsvpRows?.[0]?.avgRsvpPerEvent ?? avgRsvpRows?.avgRsvpPerEvent ?? 0) || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'Failed to compute host stats', details: e.message });
  }
};

export const getHostTopEvents = async (req, res) => {
  try {
    const hostUserId = Number(req.params.hostUserId || req.query.hostUserId);
    const metric = String(req.query.metric || 'rsvps').toLowerCase(); // 'rsvps' | 'reviews'
    const limit = Math.max(1, Math.min(10, Number(req.query.limit || 2)));
    if (!hostUserId) return res.status(400).json({ status: 'error', error: 'hostUserId is required' });

    let sql;
    if (metric === 'reviews') {
      sql = `SELECT TOP (:limit) E.Event_ID AS id, E.Title AS title, COUNT(R.Review_ID) AS count
             FROM [Event] E
             LEFT JOIN [Review] R ON R.Event_ID = E.Event_ID
             WHERE E.Host_User_ID = :hostUserId
             GROUP BY E.Event_ID, E.Title
             ORDER BY COUNT(R.Review_ID) DESC, E.Title ASC`;
    } else {
      sql = `SELECT TOP (:limit) E.Event_ID AS id, E.Title AS title, COUNT(A.User_ID) AS count
             FROM [Event] E
             LEFT JOIN [Event_Attendees] A ON A.Event_ID = E.Event_ID
             WHERE E.Host_User_ID = :hostUserId
             GROUP BY E.Event_ID, E.Title
             ORDER BY COUNT(A.User_ID) DESC, E.Title ASC`;
    }

    const [rows] = await sequelize.query(sql, { replacements: { hostUserId, limit } });
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'Failed to fetch top events', details: e.message });
  }
};

export const getHostCategoryMix = async (req, res) => {
  try {
    const hostUserId = Number(req.params.hostUserId || req.query.hostUserId);
    if (!hostUserId) return res.status(400).json({ status: 'error', error: 'hostUserId is required' });

    const [rows] = await sequelize.query(
      `SELECT ISNULL(NULLIF(LTRIM(RTRIM(category)), ''), 'Unspecified') AS category, COUNT(*) AS count
       FROM [Event]
       WHERE Host_User_ID = :hostUserId
       GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(category)), ''), 'Unspecified')
       ORDER BY count DESC` , { replacements: { hostUserId } }
    );
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'Failed to fetch category mix', details: e.message });
  }
};

export const getHostRsvpTrend = async (req, res) => {
  try {
    const hostUserId = Number(req.params.hostUserId || req.query.hostUserId);
    const days = Math.max(1, Math.min(90, Number(req.query.days || 30)));
    if (!hostUserId) return res.status(400).json({ status: 'error', error: 'hostUserId is required' });

    const [rows] = await sequelize.query(
      `WITH d AS (
         SELECT CAST(DATEADD(day, -n, CONVERT(date, GETDATE())) AS date) AS day
         FROM (SELECT TOP (:days) ROW_NUMBER() OVER (ORDER BY (SELECT 1)) - 1 AS n FROM sys.all_objects) AS t
       )
       SELECT d.day AS day, COUNT(A.User_ID) AS rsvps
       FROM d
       LEFT JOIN [Event_Attendees] A ON CAST(A.Timestamp AS date) = d.day
       LEFT JOIN [Event] E ON E.Event_ID = A.Event_ID AND E.Host_User_ID = :hostUserId
       GROUP BY d.day
       ORDER BY d.day ASC`,
       { replacements: { hostUserId, days } }
    );
    res.json({ status: 'success', data: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'Failed to fetch RSVP trend', details: e.message });
  }
};
