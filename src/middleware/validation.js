import { body, validationResult, oneOf } from 'express-validator';

export const validateEvent = [
  // Title (support both Title/title)
  oneOf([
    body('Title').notEmpty(),
    body('title').notEmpty(),
  ], 'Title is required'),
  // Date (support both Date/date)
  oneOf([
    body('Date').isISO8601(),
    body('date').isISO8601(),
  ], 'Valid date is required'),
  // startTime is required (HH:mm)
  body('startTime')
    .notEmpty().withMessage('startTime is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('startTime must be HH:mm'),
  // Require either venue text or campus or legacy location
  oneOf([
    body('venue').notEmpty(),
    body('campus').notEmpty(),
    body('location').notEmpty(),
  ], 'venue or campus is required'),
  // Optional campus validation
  body('campus').optional().isIn(['Potchefstroom','Mahikeng','Vaal']).withMessage('Invalid campus'),
  // Status optional (controller defaults to Scheduled)
  body('Status').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }
    next();
  },
];

export const validateEventStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'cancelled', 'completed'])
    .withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array(),
      });
    }
    next();
  },
];
