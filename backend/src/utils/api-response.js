function sendSuccessResponse(res, { data, message, statusCode = 200 }) {
  return res.status(statusCode).json({
    data,
    message,
    success: true,
  });
}

module.exports = { sendSuccessResponse };
