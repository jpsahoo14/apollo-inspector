const esbuild = require("esbuild");

if (require.main === module) {
  (async () => {
    return [
      esbuild.buildSync({
        entryPoints: ["index.ts"],
        write: true,
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: "dist/main.js",
        format: "esm",
        platform: "browser",
      }),
    ];
  })();
}
