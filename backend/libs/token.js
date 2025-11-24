const crypto = require('crypto');
const config = require('../config');

const SECRET = config.auth.sessionSecret;

if (!SECRET) {
    throw new Error('SESSION_SECRET is required for token generation');
}

function base64UrlEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlDecode(str) {
    const padLength = (4 - (str.length % 4)) % 4;
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
    return Buffer.from(padded, 'base64');
}

function sign(data) {
    return base64UrlEncode(
        crypto.createHmac('sha256', SECRET).update(data).digest()
    );
}

function generateToken(payload) {
    const json = JSON.stringify(payload);
    const encoded = base64UrlEncode(Buffer.from(json));
    const signature = sign(encoded);
    return `${encoded}.${signature}`;
}

function verifyToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
        return null;
    }

    const [encoded, signature] = token.split('.');
    const expectedSignature = sign(encoded);

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const payloadJson = base64UrlDecode(encoded).toString();
        return JSON.parse(payloadJson);
    } catch {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};

