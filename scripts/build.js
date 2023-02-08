const esbuild = require("esbuild");

if (require.main === module) {
  (async () => {
    return [
      esbuild.buildSync({
        entryPoints: ["index.ts"],
        write: true,
        bundle: true,
        minify: false,
        sourcemap: true,
        outfile: "dist/main.js",
        format: "cjs",
        platform: "browser",
      }),
    ];
  })();
}
