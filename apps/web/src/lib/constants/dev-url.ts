/** Dedicated local port — avoids kame-homes (:5173), kame-desk (:3100), kame-lends (:3200). */
export const LOCAL_DEV_PORT = 3005;

/** Default local dev URL (matches `bun run dev` on port 3005). */
export const LOCAL_DEV_APP_URL = `http://localhost:${LOCAL_DEV_PORT}`;
