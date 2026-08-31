export const FINAL_TENTH_SECONDS = 0.1;

/**
 * 以絕對截止時間計算題目倒數，避免分頁進入背景後 setTimeout 被節流，
 * 造成畫面上的剩餘時間與實際經過時間不同步。
 */
export const getQuestionTimerSnapshot = (deadlineMs, nowMs, finalTenthShown) => {
    const remainingMs = deadlineMs - nowMs;

    if (remainingMs > 0) {
        const seconds = Math.max(
            FINAL_TENTH_SECONDS,
            Math.ceil(remainingMs / 100) / 10
        );

        return {
            seconds,
            shouldTimeout: false,
            finalTenthShown: finalTenthShown || seconds === FINAL_TENTH_SECONDS
        };
    }

    // 若瀏覽器在倒數途中凍結，恢復時先停在 0.1 秒，再進行逾時判定。
    if (!finalTenthShown) {
        return {
            seconds: FINAL_TENTH_SECONDS,
            shouldTimeout: false,
            finalTenthShown: true
        };
    }

    return {
        seconds: 0,
        shouldTimeout: true,
        finalTenthShown: true
    };
};
