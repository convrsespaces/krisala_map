#!/usr/bin/env node

/**
 * generate-tiles.js — DZI Tile Generator for Ultra-High-Resolution Images
 *
 * Generates a Deep Zoom Image (DZI) tile pyramid from the masterplan image.
 * Output is 100% compatible with OpenSeadragon's inline DZI tile source.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  Source:   9933 × 14041 px  (~139 megapixels, ~687 MB webp)    ║
 * ║  Output:   ~760 tiles across 15 zoom levels                    ║
 * ║  Format:   512×512 px tiles, 1px overlap, webp Q=85            ║
 * ║  Total:    ~40–80 MB (vs 687 MB original)                      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ─── PREREQUISITES ──────────────────────────────────────────────────
 *
 * OPTION A — libvips CLI (RECOMMENDED for this image size)
 *
 *   Install libvips:
 *     • Windows:  Download from https://github.com/libvips/libvips/releases
 *                 Extract and add bin/ to PATH
 *     • macOS:    brew install vips
 *     • Ubuntu:   sudo apt-get install libvips-tools
 *
 * OPTION B — Node.js + sharp (uses libvips under the hood)
 *
 *     npm install sharp
 *
 * ─── USAGE ──────────────────────────────────────────────────────────
 *
 * STEP 1: Download the source image
 *
 *   curl -o masterplan.webp \
 *     "https://d1ovqzmursgzel.cloudfront.net/krisala-img/masterplan2.webp"
 *
 * STEP 2A: Generate tiles with vips (fastest, lowest memory)
 *
 *   vips dzsave masterplan.webp masterplan \
 *     --tile-size=512 \
 *     --overlap=1 \
 *     --suffix=".webp[Q=85]"
 *
 *   # For JPEG tiles (wider compatibility):
 *   vips dzsave masterplan.webp masterplan \
 *     --tile-size=512 \
 *     --overlap=1 \
 *     --suffix=".jpg[Q=90]"
 *
 * STEP 2B: OR generate tiles with this Node.js script:
 *
 *   node scripts/generate-tiles.js masterplan.webp
 *
 * STEP 3: Upload tiles to S3/CloudFront
 *
 *   # Upload the _files directory to your CDN
 *   aws s3 sync masterplan_files/ \
 *     s3://YOUR-BUCKET/krisala-img/masterplan-tiles/masterplan_files/ \
 *     --content-type "image/webp" \
 *     --cache-control "public, max-age=31536000, immutable"
 *
 *   # Note: The .dzi file is NOT needed on the server.
 *   # The React component uses inline DZI configuration.
 *
 * ─── OUTPUT STRUCTURE ───────────────────────────────────────────────
 *
 *   masterplan.dzi                  ← XML descriptor (for reference only)
 *   masterplan_files/
 *     0/  0_0.webp                  ← Level 0: 1×1 (single pixel thumbnail)
 *     1/  0_0.webp                  ← Level 1: 2×2
 *     ...
 *     9/  0_0.webp                  ← Level 9: ~512×512 (single tile)
 *     10/ 0_0.webp .. 1_1.webp      ← Level 10: ~1K (4 tiles)
 *     11/ 0_0.webp .. 2_3.webp      ← Level 11: ~2K (12 tiles)
 *     12/ 0_0.webp .. 4_6.webp      ← Level 12: ~4K (35 tiles)
 *     13/ 0_0.webp .. 9_13.webp     ← Level 13: ~8K (140 tiles)
 *     14/ 0_0.webp .. 19_27.webp    ← Level 14: full res (560 tiles)
 *
 * ─── TILE URL PATTERN (used by OpenSeadragon) ──────────────────────
 *
 *   {baseUrl}/{level}/{col}_{row}.{format}
 *
 *   Example:
 *   https://cdn.example.com/masterplan_files/14/5_10.webp
 *     → Column 5, Row 10 at zoom level 14 (full resolution)
 *
 * ────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const fs = require('fs');

// ─── Configuration ──────────────────────────────────────────────────
const CONFIG = {
  tileSize: 512,
  overlap: 1,
  format: 'webp', // 'webp' or 'jpeg'
  quality: 85,     // webp quality (0-100)
};

async function generateTilesWithSharp(inputPath, outputName) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error(
      '\n❌ sharp is not installed.\n\n' +
        'Install it with:\n' +
        '  npm install sharp\n\n' +
        'Or use vips CLI instead (recommended for large images):\n' +
        '  vips dzsave masterplan.webp masterplan --tile-size=512 --overlap=1 --suffix=".webp[Q=85]"\n',
    );
    process.exit(1);
  }

  const input = path.resolve(inputPath);
  const outputDir = path.resolve(outputName || 'masterplan');

  if (!fs.existsSync(input)) {
    console.error(`\n❌ Input file not found: ${input}\n`);
    process.exit(1);
  }

  console.log(`\n🏗️  Generating DZI tiles from: ${input}`);
  console.log(`   Tile size: ${CONFIG.tileSize}×${CONFIG.tileSize}`);
  console.log(`   Overlap: ${CONFIG.overlap}`);
  console.log(`   Format: ${CONFIG.format} (Q=${CONFIG.quality})`);
  console.log(`   Output: ${outputDir}_files/\n`);

  const startTime = Date.now();

  try {
    const image = sharp(input, {
      // Important for very large images: use sequential access
      // to avoid loading entire image into memory
      sequentialRead: true,
      limitInputPixels: false, // Allow 139MP input
    });

    const metadata = await image.metadata();
    console.log(`   Source: ${metadata.width}×${metadata.height} (${metadata.format})`);

    // Calculate zoom levels
    const maxDim = Math.max(metadata.width, metadata.height);
    const maxLevel = Math.ceil(Math.log2(maxDim));
    console.log(`   Zoom levels: 0–${maxLevel}`);

    // sharp's tile() method generates DZI-compatible tiles
    const tileOptions = {
      size: CONFIG.tileSize,
      overlap: CONFIG.overlap,
      layout: 'dz', // Deep Zoom layout
    };

    if (CONFIG.format === 'webp') {
      await image
        .webp({ quality: CONFIG.quality })
        .tile(tileOptions)
        .toFile(outputDir);
    } else {
      await image
        .jpeg({ quality: CONFIG.quality })
        .tile(tileOptions)
        .toFile(outputDir);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Count generated tiles
    const filesDir = `${outputDir}_files`;
    let totalTiles = 0;
    if (fs.existsSync(filesDir)) {
      const levels = fs.readdirSync(filesDir).filter((d) =>
        fs.statSync(path.join(filesDir, d)).isDirectory(),
      );
      for (const level of levels) {
        const tiles = fs.readdirSync(path.join(filesDir, level));
        totalTiles += tiles.length;
        console.log(`   Level ${level.padStart(2)}: ${tiles.length} tiles`);
      }
    }

    console.log(`\n✅ Done! Generated ${totalTiles} tiles in ${elapsed}s`);
    console.log(`   Output directory: ${filesDir}/`);
    console.log(`   DZI descriptor:   ${outputDir}.dzi\n`);
    console.log('📤 Next step: Upload tiles to your CDN:\n');
    console.log(
      `   aws s3 sync ${filesDir}/ \\`,
    );
    console.log(
      '     s3://YOUR-BUCKET/krisala-img/masterplan-tiles/masterplan_files/ \\',
    );
    console.log('     --content-type "image/webp" \\');
    console.log('     --cache-control "public, max-age=31536000, immutable"\n');
  } catch (err) {
    console.error('\n❌ Tile generation failed:', err.message);
    console.error(
      '\nFor very large images, vips CLI is more reliable:\n' +
        '  vips dzsave masterplan.webp masterplan --tile-size=512 --overlap=1 --suffix=".webp[Q=85]"\n',
    );
    process.exit(1);
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────
const args = process.argv.slice(2);
const inputFile = args[0] || 'masterplan.webp';
const outputName = args[1] || 'masterplan';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node generate-tiles.js [input-file] [output-name]

  input-file    Source image (default: masterplan.webp)
  output-name   Output base name (default: masterplan)

Examples:
  node generate-tiles.js masterplan.webp masterplan
  node generate-tiles.js ./images/plan.webp plan

The recommended approach for production is to use vips CLI:
  vips dzsave masterplan.webp masterplan --tile-size=512 --overlap=1 --suffix=".webp[Q=85]"
  `);
  process.exit(0);
}

generateTilesWithSharp(inputFile, outputName);
