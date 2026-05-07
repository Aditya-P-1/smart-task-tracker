function getHealth(_req, res) {
  res.status(200).json({
    message: 'Smart Task & Habit Tracker API is running',
    status: 'ok',
  });
}

module.exports = { getHealth };
