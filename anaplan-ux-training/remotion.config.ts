/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
// PNG (lossless) frame capture — the "jpeg" default introduces compression
// artifacts on crisp UI screenshot text before encoding even starts.
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);
// This sandboxed environment blocks downloads from remotion.media, so use
// the Chrome Headless Shell that already ships with the container instead
// of letting Remotion try to fetch its own.
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell");

// Final delivery quality: h264, CRF 16-18 (near-visually-lossless, keeps
// screenshot text sharp), yuv420p, slow x264 preset for best compression
// efficiency at that quality, capped so bitrate never exceeds ~30 Mbps.
// Note: CRF and an explicit target video-bitrate are mutually exclusive in
// ffmpeg/Remotion (you drive quality with one or the other). We use CRF
// (quality-targeted) with a maxrate/bufsize cap, which is the standard
// "capped CRF" pattern and satisfies "~20-25 Mbps target, ~30 Mbps max" as
// an outcome rather than a fixed encode.
Config.setCodec("h264");
Config.setCrf(17);
Config.setPixelFormat("yuv420p");
Config.setX264Preset("slow");
Config.setEncodingMaxRate("30M");
Config.setEncodingBufferSize("60M");
Config.setAudioCodec("aac");
Config.setAudioBitrate("320k");
