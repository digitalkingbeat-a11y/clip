import path from "path";

// The build copies ffmpeg/ffprobe next to the bundled function (bin/).
const binDir = path.join(__dirname, "bin");
process.env.FFMPEG_PATH = process.env.FFMPEG_PATH || path.join(binDir, "ffmpeg");
process.env.FFPROBE_PATH = process.env.FFPROBE_PATH || path.join(binDir, "ffprobe");
