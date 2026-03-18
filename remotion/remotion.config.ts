import {Config} from "@remotion/cli/config";
import {existsSync} from "node:fs";

const browserCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];

const browserExecutable = browserCandidates.find((candidate) =>
  existsSync(candidate)
);

if (browserExecutable) {
  Config.setBrowserExecutable(browserExecutable);
}
