import { installWhisperCpp } from "@remotion/install-whisper-cpp";
import path from "path";

const whisperPath = path.join(process.cwd(), "whisper.cpp");

await installWhisperCpp({
  to: whisperPath,
  version: "1.5.5",
});
console.log("whisper.cpp built at", whisperPath);
