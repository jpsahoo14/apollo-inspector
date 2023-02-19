const esbuild = require("esbuild");
const process = require("process");

function start(myProcess) {
  // console.log({ process, myProcess });
  if (require.main === module) {
    const isDevBuild = isDevlopmentBuild();
    (async () => {
      return [
        esbuild.buildSync({
          entryPoints: ["index.ts"],
          write: true,
          bundle: true,
          minify: isDevBuild ? false : true,
          sourcemap: true,
          outfile: "dist/main.js",
          format: "esm",
          platform: "browser",
        }),
      ];
    })();
  }
}

function isDevlopmentBuild() {
  let isDevBuild = false;
  process.argv.forEach((val) => {
    if (val === "--dev") {
      isDevBuild = true;
    }
  });

  return isDevBuild;
}
start();
