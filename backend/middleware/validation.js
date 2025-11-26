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

// Reusable validation chains
const validators = {
    wordField: (fieldName, message) =>
        body(fieldName)
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage(message)
            .escape(),

    wordId: () =>
        param('id')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Invalid word ID'),

    examples: () =>
        body('examples')
            .optional()
            .isArray()
            .withMessage('Examples must be an array'),

    exampleField: (fieldName, maxLength = 500) =>
        body(`examples.*.${fieldName}`)
            .optional()
            .trim()
            .isLength({ max: maxLength })
            .withMessage(`Example ${fieldName} text too long`)
            .escape(),

    speechFilename: () =>
        body('speech')
            .optional()
            .isString()
            .isLength({ max: 100 })
            .withMessage('Speech filename too long')
            .matches(/^[a-zA-Z0-9_\-\.]*$/)
            .withMessage('Invalid speech filename format'),

    text: (fieldName, minLength, maxLength) =>
        body(fieldName)
            .trim()
            .isLength({ min: minLength, max: maxLength })
            .withMessage(`${fieldName} must be ${minLength}-${maxLength} characters`)
            .escape(),

    languageCode: (fieldName) =>
        body(fieldName)
            .optional()
            .trim()
            .isLength({ min: 2, max: 5 })
            .withMessage('Invalid language code')
            .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
            .withMessage('Language code must be ISO format')
};

// Common validation rules
const validation = {
    // Word validation
    word: {
        create: [
            validators.wordField('original', 'Original word must be 1-200 characters'),
            validators.wordField('translation', 'Translation must be 1-200 characters'),
            validators.examples(),
            validators.exampleField('swedish'),
            validators.exampleField('english'),
            validators.speechFilename(),
            handleValidationErrors
        ],
        update: [
            validators.wordId(),
            validators.wordField('original', 'Original word must be 1-200 characters'),
            validators.wordField('translation', 'Translation must be 1-200 characters'),
            validators.examples(),
            body('speech')
                .optional()
                .isString()
                .isLength({ max: 100 })
                .withMessage('Speech filename too long'),
            handleValidationErrors
        ],
        patch: [
            validators.wordId(),
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
            validators.wordId(),
            handleValidationErrors
        ],
        getById: [
            validators.wordId(),
            handleValidationErrors
        ]
    },

    // AI validation
    ai: {
        generateExamples: [
            validators.wordField('swedishWord', 'Swedish word must be 1-200 characters'),
            validators.wordField('englishTranslation', 'English translation must be 1-200 characters'),
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
            validators.text('text', 1, 2000),
            validators.languageCode('sourceLang'),
            validators.languageCode('targetLang'),
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
    },

    // Speech validation
    speech: {
        tts: [
            validators.text('text', 1, 500),
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
