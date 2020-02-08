const execa = require("execa");
const path = require("path");

const main = async () => {
  const indexPath = path.join(__dirname, "../", "build", "public", "index.bib");

  const result = await execa(
    "pandoc-citeproc",
    ["--bib2json", "--format=bibtex", indexPath],
    {
      reject: false,
      timeout: 10000,
    }
  );

  const pass = !/Error reading bibliography/.test(result.stderr);

  if (result instanceof Error && pass) {
    throw result;
  }

  if (pass) return;

  const re = /^Error reading bibliography \(line (\d+), column (\d+)\):/;
  const match = result.stderr.match(re);
  const allLines = result.stderr.split("\n").map(x => x.trim());
  const lines = allLines.slice(1);
  const file = "build/public/index.bib";

  if (!match) {
    if (lines.length === 0) {
      console.log(`${file}: error: unknown error`);
    } else {
      for (const line of lines) {
        console.log(`${file}: ${line}`);
      }
    }
    return;
  }

  if (lines.length === 0) {
    console.log(`${file}:${match[1]}:${match[2]}: error: unknown error`);
    return;
  }

  for (const line of lines) {
    console.log(`${file}:${match[1]}:${match[2]}: error: ${line}`);
  }
};

main().catch(e => {
  console.log("validate-bibtex.js: error: uncaught exception\n");
  console.log(e);
});
