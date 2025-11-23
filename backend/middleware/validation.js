const { body, param, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    next();
};

// Common validation rules
const validation = {
    // Word validation
    word: {
        create: [
            body('original')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Original word must be 1-200 characters')
                .escape(),
            body('translation')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Translation must be 1-200 characters')
                .escape(),
            body('examples')
                .optional()
                .isArray()
                .withMessage('Examples must be an array'),
            body('examples.*.swedish')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Example Swedish text too long')
                .escape(),
            body('examples.*.english')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Example English text too long')
                .escape(),
            body('speech')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Speech filename too long')
                .matches(/^[a-zA-Z0-9_\-\.]*$/)
                .withMessage('Invalid speech filename format'),
            handleValidationErrors
        ],
        update: [
            param('id')
                .trim()
                .isLength({ min: 1, max: 100 })
                .withMessage('Invalid word ID'),
            body('original')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Original word must be 1-200 characters')
                .escape(),
            body('translation')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Translation must be 1-200 characters')
                .escape(),
            body('examples')
                .optional()
                .isArray()
                .withMessage('Examples must be an array'),
            body('speech')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Speech filename too long'),
            handleValidationErrors
        ],
        patch: [
            param('id')
                .trim()
                .isLength({ min: 1, max: 100 })
                .withMessage('Invalid word ID'),
            body('incrementReadCount')
                .optional()
                .isBoolean()
                .withMessage('incrementReadCount must be boolean'),
            body('speech')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Speech filename too long'),
            handleValidationErrors
        ],
        delete: [
            param('id')
                .trim()
                .isLength({ min: 1, max: 100 })
                .withMessage('Invalid word ID'),
            handleValidationErrors
        ],
        getById: [
            param('id')
                .trim()
                .isLength({ min: 1, max: 100 })
                .withMessage('Invalid word ID'),
            handleValidationErrors
        ]
    },

    // AI validation
    ai: {
        generateExamples: [
            body('swedishWord')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Swedish word must be 1-200 characters')
                .escape(),
            body('englishTranslation')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('English translation must be 1-200 characters')
                .escape(),
            body('existingExamples')
                .optional()
                .isArray()
                .withMessage('Existing examples must be an array'),
            body('wordId')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Invalid word ID'),
            handleValidationErrors
        ],
        translate: [
            body('text')
                .trim()
                .isLength({ min: 1, max: 2000 })
                .withMessage('Text must be 1-2000 characters')
                .escape(),
            body('sourceLang')
                .optional()
                .trim()
                .isLength({ min: 2, max: 5 })
                .withMessage('Invalid source language code')
                .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
                .withMessage('Language code must be ISO format'),
            body('targetLang')
                .optional()
                .trim()
                .isLength({ min: 2, max: 5 })
                .withMessage('Invalid target language code')
                .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
                .withMessage('Language code must be ISO format'),
            handleValidationErrors
        ]
    },

    // Auth validation
    auth: {
        login: [
            body('pin')
                .trim()
                .isLength({ min: 1, max: 50 })
                .withMessage('PIN is required')
                .matches(/^[0-9]+$/)
                .withMessage('PIN must contain only numbers'),
            handleValidationErrors
        ],
        verifyToken: [
            body('token')
                .trim()
                .isLength({ min: 1, max: 200 })
                .withMessage('Token is required')
                .matches(/^[a-f0-9]+$/)
                .withMessage('Invalid token format'),
            handleValidationErrors
        ]
    },

    // Speech validation
    speech: {
        tts: [
            body('text')
                .trim()
                .isLength({ min: 1, max: 500 })
                .withMessage('Text must be 1-500 characters')
                .escape(),
            handleValidationErrors
        ],
        getFile: [
            param('filename')
                .trim()
                .matches(/^[a-f0-9]{64}\.mp3$/)
                .withMessage('Invalid filename format'),
            handleValidationErrors
        ]
    }
};

module.exports = validation;
