const { parseDataFile } = require("../util");
const path = require("path");
const process = require("process");

// Ensure we are running from project root.
process.chdir(path.join(__dirname, "../"));

//
// Matchers
//

expect.extend(require("jest-json-schema").matchers);

expect.extend({
  toBeContainedInObject(received, ...argument) {
    const expected = argument[0];
    const objectName = argument[1];

    const expectedText = objectName
      ? this.utils.EXPECTED_COLOR(objectName)
      : this.utils.printExpected(expected);

    const pass = this.equals(
      expected,
      expect.arrayContaining([expect.objectContaining(received)])
    );

    if (pass) {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} not to be ` +
          `contained in object ${expectedText}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${this.utils.printReceived(received)} to be ` +
          `contained in object ${expectedText}`,
        pass: false,
      };
    }
  },
});

//
// Utilities.
//

const dataFileCache = {};

const readDataFile = async dataPath => {
  const cached = dataFileCache[dataPath];
  if (cached !== undefined) return cached;

  const data = await parseDataFile(dataPath);
  dataFileCache[dataPath] = data;
  return data;
};

const itShouldValidateAgainstSchema = (dataPath, schemaPath) => {
  it("should validate against schema", async () => {
    const [schema, data] = await Promise.all([
      readDataFile(schemaPath),
      readDataFile(dataPath),
    ]);
    expect(data).toMatchSchema(schema);
  });
};

//
// Tests.
//

// Limits certain tests because we know that documents past that haven't been
// reviewed and will definitely cause test failures.
const lastReviewedDocument = 500;

describe("build/routes.json", () => {
  itShouldValidateAgainstSchema("build/routes.json", "schema/routes.json");
});

describe("data/alias.yml", () => {
  const aliasP = readDataFile("data/alias.yml");
  const docsP = readDataFile("data/documents.yml");

  itShouldValidateAgainstSchema("data/alias.yml", "schema/alias.json");

  it("should redirect to existing document ID", async () => {
    for (let id of Object.values(await aliasP)) {
      expect({ id }).toBeContainedInObject(await docsP, "data/documents.yml");
    }
  });
});

describe("data/authors.yml", () => {
  itShouldValidateAgainstSchema("data/authors.yml", "schema/authors.json");
});

describe("data/documents.yml", () => {
  const authorsP = readDataFile("data/authors.yml");
  const docsP = readDataFile("data/documents.yml");

  itShouldValidateAgainstSchema("data/documents.yml", "schema/documents.json");

  it("has unique IDs", async () => {
    const seen = new Set();
    const duplicates = new Set();

    for (let { id } of await docsP) {
      if (seen.has(id)) {
        duplicates.add(id);
      }
      seen.add(id);
    }

    expect(Array.from(duplicates)).toEqual([]);
  });

  // Note this test also validates authors.yml
  it("has a 1:1 mapping to authors in authors.yml", async () => {
    const allAuthors = new Set();

    for (let { id, author } of await docsP) {
      const n = Number.parseInt(id.substring(1), 10);
      if (n > lastReviewedDocument) continue;

      if (typeof author === "string") {
        allAuthors.add(author);
      } else {
        author.forEach(x => allAuthors.add(x));
      }
    }

    expect(Array.from(allAuthors).sort()).toEqual(
      Object.keys(await authorsP).sort()
    );
  });
});
