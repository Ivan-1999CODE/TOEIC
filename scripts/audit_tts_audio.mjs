import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MPEGDecoder } from 'mpg123-decoder';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_AUDIO_BYTES = 500;
const MIN_DURATION_SECONDS = 0.18;
const MAX_DURATION_SECONDS = 15;
const SILENT_PEAK = 0.005;
const SILENT_RMS = 0.001;
const QUIET_PEAK = 0.02;
const QUIET_RMS = 0.003;
const ACTIVE_SAMPLE_THRESHOLD = 0.01;

function looksLikeMp3(buffer) {
    const hasId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3';
    const hasFrameSync =
        buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    return hasId3 || hasFrameSync;
}

async function main() {
    const manifestPath = path.join(
        ROOT_DIR,
        'public',
        'audio',
        'tts',
        'manifest.json',
    );
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const decoder = new MPEGDecoder();
    await decoder.ready;

    const issues = [];
    const clippingWarnings = [];
    let checked = 0;
    let totalBytes = 0;
    const metricsSummary = {
        minDuration: Number.POSITIVE_INFINITY,
        maxDuration: 0,
        minRms: Number.POSITIVE_INFINITY,
        maxPeak: 0,
        minActiveRatio: Number.POSITIVE_INFINITY,
    };

    try {
        for (const entry of manifest.entries) {
            for (const voiceKey of Object.keys(manifest.voices)) {
                const relativePath = entry.audio[voiceKey].replace(/^\//, '');
                const filePath = path.join(ROOT_DIR, 'public', relativePath);
                const context = {
                    day: entry.day,
                    order: entry.order,
                    word: entry.word,
                    voice: voiceKey,
                    path: relativePath,
                };

                try {
                    const fileStat = await stat(filePath);
                    const fileBuffer = await readFile(filePath);
                    checked += 1;
                    totalBytes += fileStat.size;

                    if (fileStat.size <= MIN_AUDIO_BYTES) {
                        issues.push({
                            ...context,
                            type: 'too-small',
                            bytes: fileStat.size,
                        });
                        continue;
                    }

                    if (!looksLikeMp3(fileBuffer)) {
                        issues.push({ ...context, type: 'invalid-mp3-signature' });
                        continue;
                    }

                    const decoded = decoder.decode(fileBuffer);
                    const samples = decoded.channelData[0];
                    if (
                        decoded.errors.length > 0 ||
                        !samples ||
                        decoded.samplesDecoded === 0 ||
                        !Number.isFinite(decoded.sampleRate) ||
                        decoded.sampleRate <= 0
                    ) {
                        issues.push({
                            ...context,
                            type: 'decode-failed',
                            decoderErrors: decoded.errors.map((error) => error.message),
                        });
                        await decoder.reset();
                        continue;
                    }

                    let sumSquares = 0;
                    let peak = 0;
                    let activeSamples = 0;

                    for (const sample of samples) {
                        const absoluteSample = Math.abs(sample);
                        sumSquares += sample * sample;
                        if (absoluteSample > peak) peak = absoluteSample;
                        if (absoluteSample >= ACTIVE_SAMPLE_THRESHOLD) activeSamples += 1;
                    }

                    const rms = Math.sqrt(sumSquares / samples.length);
                    const activeRatio = activeSamples / samples.length;
                    const duration = decoded.samplesDecoded / decoded.sampleRate;
                    const metrics = {
                        bytes: fileStat.size,
                        duration,
                        rms,
                        peak,
                        activeRatio,
                        sampleRate: decoded.sampleRate,
                    };

                    metricsSummary.minDuration = Math.min(
                        metricsSummary.minDuration,
                        duration,
                    );
                    metricsSummary.maxDuration = Math.max(
                        metricsSummary.maxDuration,
                        duration,
                    );
                    metricsSummary.minRms = Math.min(metricsSummary.minRms, rms);
                    metricsSummary.maxPeak = Math.max(metricsSummary.maxPeak, peak);
                    metricsSummary.minActiveRatio = Math.min(
                        metricsSummary.minActiveRatio,
                        activeRatio,
                    );

                    if (
                        duration < MIN_DURATION_SECONDS ||
                        duration > MAX_DURATION_SECONDS
                    ) {
                        issues.push({ ...context, type: 'invalid-duration', ...metrics });
                    } else if (peak < SILENT_PEAK || rms < SILENT_RMS) {
                        issues.push({ ...context, type: 'silent', ...metrics });
                    } else if (peak < QUIET_PEAK || rms < QUIET_RMS) {
                        issues.push({ ...context, type: 'too-quiet', ...metrics });
                    }

                    if (peak >= 0.999) {
                        clippingWarnings.push({
                            ...context,
                            type: 'possible-clipping',
                            ...metrics,
                        });
                    }

                    await decoder.reset();
                } catch (error) {
                    issues.push({
                        ...context,
                        type: 'read-or-decode-error',
                        error: error.code || error.message,
                    });
                    await decoder.reset();
                }

                if (checked > 0 && checked % 250 === 0) {
                    console.log(`Waveform progress: ${checked} files`);
                }
            }
        }
    } finally {
        decoder.free();
    }

    const expectedFiles =
        manifest.entries.length * Object.keys(manifest.voices).length;
    const report = {
        auditedAt: new Date().toISOString(),
        thresholds: {
            minAudioBytes: MIN_AUDIO_BYTES,
            minDurationSeconds: MIN_DURATION_SECONDS,
            maxDurationSeconds: MAX_DURATION_SECONDS,
            silentPeak: SILENT_PEAK,
            silentRms: SILENT_RMS,
            quietPeak: QUIET_PEAK,
            quietRms: QUIET_RMS,
            activeSampleThreshold: ACTIVE_SAMPLE_THRESHOLD,
        },
        summary: {
            expectedFiles,
            checkedFiles: checked,
            totalBytes,
            totalMegabytes: totalBytes / 1024 / 1024,
            issueCount: issues.length,
            clippingWarningCount: clippingWarnings.length,
            metrics: metricsSummary,
        },
        issues,
        clippingWarnings,
    };
    const reportPath = path.join(ROOT_DIR, 'reports', 'tts-waveform-audit.json');
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(
        `TTS waveform audit: ${checked}/${expectedFiles} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
        `Duration ${metricsSummary.minDuration.toFixed(3)}-${metricsSummary.maxDuration.toFixed(3)} sec; minimum RMS ${metricsSummary.minRms.toFixed(6)}; minimum active ratio ${metricsSummary.minActiveRatio.toFixed(4)}.`,
    );

    if (issues.length > 0 || checked !== expectedFiles) {
        console.error(
            `TTS waveform audit failed: ${issues.length} issue(s), ${checked}/${expectedFiles} files checked. See ${reportPath}.`,
        );
        process.exitCode = 1;
        return;
    }

    console.log(
        `TTS waveform audit passed with ${clippingWarnings.length} clipping warning(s).`,
    );
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
