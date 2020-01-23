const assert = require("assert");
const fs = require("fs");
const path = require("path");
const util = require("util");

const readFile = util.promisify(fs.readFile);

const dataPath = path.join(__dirname, "../build/redirect.json");
const redirectsPromise = readFile(dataPath).then(x => JSON.parse(x));

const documentRedirect = async (url, res) => {
  res.writeHead(303, {
    Location: url
  }).end();
};

const errorRewrite = async (url, res) => {
  const filepath = path.join(__dirname, "../public", url);
  const page = await readFile(filepath, { encoding: "utf8" });
  res.status(404).send(page);
};

module.exports = async (req, res) => {
  // We are accessed as /api/redirect?id=...
  // Note though this is done internally by rewriting. The *user* does not
  // use that URL.
  let { id } = req.query;
  assert(id !== undefined);
  id = id.toLowerCase();

  // Fixup numbered document ID by removing leading zeroes.
  if (id.match("^n[0-9]+$")) {
    id = "n" + Number.parseInt(id.substr(1), 10);
  }

  const redirects = await redirectsPromise;
  const redirect = redirects[id];

  if (redirect === undefined) {
    // Unknown ID.
    await errorRewrite("/404.html", res);
  } else if (redirect.error) {
    // Known ID but is marked as an error.
    await errorRewrite(redirect.url, res);
  } else {
    // Known ID for redirection.
    await documentRedirect(redirect.url, res);
  }
}
