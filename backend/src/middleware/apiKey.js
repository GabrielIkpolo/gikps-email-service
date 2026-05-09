import AppError from '../utils/errors.js';

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  console.log('Checking API Key:', apiKey);
  console.log('Expected API Key:', process.env.MASTER_API_KEY);

  if (!apiKey || apiKey !== process.env.MASTER_API_KEY) {
    return next(new AppError('Invalid or missing API Key', 403));
  }

  next();
};
