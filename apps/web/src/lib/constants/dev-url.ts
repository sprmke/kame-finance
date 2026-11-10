/** Dedicated local port (3005) so other local apps keep their usual ports. */
export const LOCAL_DEV_PORT = 3005;

/** Default local dev URL (matches `bun run dev` on port 3005). */
export const LOCAL_DEV_APP_URL = `http://localhost:${LOCAL_DEV_PORT}`;
