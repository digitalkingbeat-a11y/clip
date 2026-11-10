// Builds ClipFlow Video for Vercel using the Build Output API (.vercel/output):
//  - static/            the Vite app
//  - functions/api.func the Express server as one Node.js function (+ ffmpeg/ffprobe)
//  - config.json        routes: /api/* and /storage/* -> function, everything else -> SPA
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const out = path.join(root, ".vercel", "output");
const func = path.join(out, "functions", "api.func");
const run = (cmd) => execSync(cmd, { stdio: "inherit", cwd: root });

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(func, "bin"), { recursive: true });

// 1. Frontend
run("npx vite build");
fs.cpSync(path.join(root, "dist"), path.join(out, "static"), { recursive: true });

// 2. Server bundle (all dependencies inlined; vite is only used by the local dev server)
await build({
  entryPoints: [path.join(root, "server", "vercelEntry.ts")],
  outfile: path.join(func, "index.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  sourcemap: false,
  minify: false,
  legalComments: "none",
  external: ["vite", "fsevents", "lightningcss", "@tailwindcss/vite", "@vitejs/plugin-react", "vite-plugin-pwa"],
  logLevel: "warning",
});

// 3. ffmpeg + ffprobe (linux x64 static builds)
let ffmpegBin = path.join(root, "node_modules", "ffmpeg-static", "ffmpeg");
if (!fs.existsSync(ffmpegBin)) {
  // npm may skip install scripts; fetch the binary explicitly.
  run("node node_modules/ffmpeg-static/install.js");
}
if (!fs.existsSync(ffmpegBin)) throw new Error("ffmpeg binary missing (ffmpeg-static install failed)");
const ffprobeBin = path.join(root, "node_modules", "ffprobe-static", "bin", "linux", "x64", "ffprobe");
if (!fs.existsSync(ffprobeBin)) throw new Error("ffprobe binary missing (ffprobe-static)");
for (const [src, name] of [[ffmpegBin, "ffmpeg"], [ffprobeBin, "ffprobe"]]) {
  const dest = path.join(func, "bin", name);
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, 0o755);
}

fs.writeFileSync(
  path.join(func, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.cjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 300,
    },
    null,
    2
  )
);

// 4. Routes
fs.writeFileSync(
  path.join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/(api|storage)(/.*)?$", dest: "/api" },
        { handle: "filesystem" },
        { src: "^/(.*)$", dest: "/index.html" },
      ],
    },
    null,
    2
  )
);

const size = (p) => fs.readdirSync(p, { recursive: true }).reduce((n, f) => {
  const fp = path.join(p, String(f));
  return n + (fs.statSync(fp).isFile() ? fs.statSync(fp).size : 0);
}, 0);
console.log(`[build-vercel] function bundle: ${(size(func) / 1024 / 1024).toFixed(1)} MB`);
