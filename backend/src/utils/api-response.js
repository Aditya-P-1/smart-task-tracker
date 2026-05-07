function sendSuccessResponse(res, { code = 'OK', data, message, statusCode = 200 }) {
  return res.status(statusCode).json({
    code,
    data,
    message,
    success: true,
  });
}

module.exports = { sendSuccessResponse };
