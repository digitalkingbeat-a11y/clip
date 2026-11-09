// Vercel Function entry: the Express app, with ffmpeg/ffprobe from the function bundle.
// This import must stay first so the binaries are set before server/ffmpeg.ts loads.
import "./vercelEnv";
import { app } from "../server";

export default app;
