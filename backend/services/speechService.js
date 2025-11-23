const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class SpeechService {
    constructor() {
        this.cacheDir = config.speech.cacheDir;
        this.voiceName = config.speech.defaultVoice;
        this.languageCode = config.speech.languageCode;
        
        this._ensureCacheDirectory();
    }

    _ensureCacheDirectory() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    generateFilename(text, voiceName = this.voiceName) {
        const hash = crypto
            .createHash('sha256')
            .update(`${text}_${voiceName}`)
            .digest('hex');
        return `${hash}.mp3`;
    }

    getCachePath(filename) {
        return path.join(this.cacheDir, filename);
    }

    isCached(filename) {
        return fs.existsSync(this.getCachePath(filename));
    }

    readCached(filename) {
        return fs.readFileSync(this.getCachePath(filename));
    }

    async generateSpeech(text) {
        if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.region) {
            throw new Error('AWS credentials not configured');
        }

        const pollyClient = new PollyClient({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey
            }
        });

        const params = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: this.voiceName,
            LanguageCode: this.languageCode
        };

        const command = new SynthesizeSpeechCommand(params);
        const response = await pollyClient.send(command);

        const chunks = [];
        for await (const chunk of response.AudioStream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    cacheSpeech(filename, audioBuffer) {
        fs.writeFileSync(this.getCachePath(filename), audioBuffer);
    }

    async synthesize(text) {
        const filename = this.generateFilename(text);
        const cachePath = this.getCachePath(filename);

        if (this.isCached(filename)) {
            return {
                audio: this.readCached(filename),
                cached: true,
                filename
            };
        }

        const audioBuffer = await this.generateSpeech(text);
        this.cacheSpeech(filename, audioBuffer);

        return {
            audio: audioBuffer,
            cached: false,
            filename
        };
    }
}

module.exports = new SpeechService();
