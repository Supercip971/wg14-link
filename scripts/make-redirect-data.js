const assert = require("assert");
const fs = require("fs");
const path = require("path");
const process = require("process");
const yaml = require("yaml");

// Make things easy by always operating from the project root directory.
process.chdir(path.join(__dirname, "../"));

const readData = filename => {
  const file = fs.readFileSync(filename, { encoding: "utf8" });
  return yaml.parse(file, { schema: "failsafe" });
};

const docs = readData("data/documents.yml");
const alias = readData("data/alias.yml");

// Canonicalize document ID to n# without leading zeroes.
const canonicalDocumentId = id => {
  assert(id.match("^N[0-9]+$"));
  const n = Number.parseInt(id.substr(1), 10);
  return "n" + n;
};

const redirects = {};

// Add all of the document files.
for (let { id, url, mirror, status } of docs) {
  if (!(url || mirror) && status !== "unassigned") {
    assert(!status);
    status = "missing";
  }

  id = canonicalDocumentId(id);
  redirects[id] = { url, mirror, status };
}

// Add the aliases.
for (let [from, to] of Object.entries(alias)) {
  from = from.toLowerCase();
  to = canonicalDocumentId(to);
  const { url, mirror, status } = redirects[to];
  redirects[from] = { url, mirror, status };
}

// Write the redirect file.
fs.mkdirSync("build", { recursive: true });
fs.writeFileSync("build/redirect.json", JSON.stringify(redirects));
console.log("build/redirect.json has been written");
