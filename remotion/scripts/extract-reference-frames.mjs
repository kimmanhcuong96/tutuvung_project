import path from "node:path";
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const entryPoint = path.join(projectRoot, "src", "index.tsx");

const compositionId = process.env.COMP_ID ?? "ReferenceSnaptik";
const count = Number(process.env.FRAME_COUNT ?? "30");
const outDir = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.join(repoRoot, "reference_frames");

const zeroPad = (n, len) => String(n).padStart(len, "0");

const main = async () => {
  const {bundle} = await import("@remotion/bundler");
  const {getCompositions, renderStill} = await import("@remotion/renderer");

  await fs.mkdir(outDir, {recursive: true});

  const serveUrl = await bundle({
    entryPoint,
    // Keep this stable; rendering stills does not require watching.
    webpackOverride: (config) => config,
  });

  const comps = await getCompositions(serveUrl, {
    inputProps: {},
  });

  const comp = comps.find((c) => c.id === compositionId);
  if (!comp) {
    const ids = comps.map((c) => c.id).sort();
    throw new Error(
      `Composition "${compositionId}" not found. Available: ${ids.join(", ")}`
    );
  }

  const duration = comp.durationInFrames;
  const frames =
    count <= 1
      ? [0]
      : Array.from({length: count}, (_, i) =>
          Math.round((i * (duration - 1)) / (count - 1))
        );

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const filename = `${compositionId.toLowerCase()}_${zeroPad(i + 1, 2)}_f${zeroPad(frame, 4)}.png`;
    const output = path.join(outDir, filename);

    // eslint-disable-next-line no-await-in-loop
    await renderStill({
      serveUrl,
      composition: comp,
      frame,
      output,
      imageFormat: "png",
    });
  }

  console.log(
    `Wrote ${frames.length} PNG frames for ${compositionId} to: ${outDir}`
  );
};

await main();

