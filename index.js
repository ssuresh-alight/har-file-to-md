const path = require("path");
const readline = require("readline");
const HarFileHandler = require("./harFileHandler");
const RequestMarkdownWriter = require("./RequestMarkdownWriter"); // <-- import the new class

const dataDir = path.join(__dirname, "data");
const handler = new HarFileHandler(dataDir);

/**
 * @param {string[]} files
 * @param {boolean} dontPromptIfOnlyOneFile
 * @returns {Promise<number|null>}
 */
async function promptFileSelection(files, dontPromptIfOnlyOneFile) {
  return new Promise((resolve) => {
    if (files.length === 1 && dontPromptIfOnlyOneFile) {
      resolve(0);
      return;
    }

    console.log("Available files:");
    files.forEach((file, idx) => {
      console.log(`${idx}: ${file}`);
    });
    console.log();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the index of the file to process: ", (answer) => {
      rl.close();
      const idx = parseInt(answer, 10);
      if (isNaN(idx) || idx < 0 || idx >= files.length) {
        console.log("Invalid index.");
        resolve(null);
      } else {
        resolve(idx);
      }
    });
  });
}

/**
 * @param {number} index
 */
async function printResourceTypesForFile(index) {
  try {
    await handler.loadByIndex(index);
    const resourceTypes = handler.getResourceTypes();

    const counts = resourceTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log("Resource type counts from given file:");
    Object.entries(counts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    console.log();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

/**
 * @param {number} index
 */
async function printXhrRequestUrls(index) {
  try {
    await handler.loadByIndex(index);

    const xhrEntries = handler.getXhrEntries();
    if (xhrEntries.length === 0) {
      console.log("No XHR requests found in this file.");
      return;
    }

    console.log("XHR request URLs:");
    xhrEntries.forEach((entry, i) => {
      console.log(`${i + 1}: ${entry.request.url}`);
    });
    console.log();
  } catch (/** @type {any} */ err) {
    console.error("Error:", err && err.message ? err.message : err);
  }
}

/**
 * Interactively prompt the user for each XHR request and ask if it should be written to markdown.
 * If yes, write the request details to a markdown file using RequestMarkdownWriter.
 * @param {number} index Index of the HAR/JSON file to process.
 * @param {string[]} excludeUrls Array of URL substrings to exclude from selection.
 */
async function interactiveSelectAndWriteXhrRequests(index, excludeUrls) {
  try {
    const dataFileName = await handler.loadByIndex(index);

    const xhrEntries = handler.getXhrEntries();
    if (xhrEntries.length === 0) {
      console.log("No XHR requests found in this file.");
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Output markdown file path
    const outputPath = path.join(__dirname, "output", `output_${getFormattedDateTime(new Date())}.md`);
    const writer = new RequestMarkdownWriter(outputPath, dataFileName);

    // Helper to ask Y/N for each entry
    const askYesNo = (question) =>
      new Promise((resolve) => {
        rl.question(question, (answer) => {
          resolve(answer.trim().toLowerCase() === "y");
        });
      });

    let anyWritten = false;
    for (let i = 0; i < xhrEntries.length; i++) {
      const entry = xhrEntries[i];
      console.log(`\n${i + 1}: ${entry.request.url}`);

      if (excludeUrls) {
        const shouldExclude = excludeUrls.some((domain) => entry.request.url.includes(domain));
        if (shouldExclude) {
          console.log("Excluded due to domain filter.");
          continue;
        }
      }

      const shouldWrite = await askYesNo("Write this request to markdown? (Y/N): ");
      if (shouldWrite) {
        writer.addEntry(entry);
        anyWritten = true;
        console.log("Marked for writing to markdown.");
      } else {
        console.log("Skipped.");
      }
    }

    rl.close();

    if (anyWritten) {
      await writer.write();
      console.log(`\nDone! Written selected requests to: ${outputPath}`);
    } else {
      console.log("\nNo requests were written to markdown.");
    }
  } catch (/** @type {any} */ err) {
    console.error("Error:", err && err.message ? err.message : err);
  }
}

/**
 * @param {Date} date
 * @returns {string} formatted as YYYY-MM-DD_HH-mm-SS in user's local time
 */
function getFormattedDateTime(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "_" +
    pad(date.getHours()) +
    "-" +
    pad(date.getMinutes()) +
    "-" +
    pad(date.getSeconds())
  );
}

async function main() {
  try {
    const files = await handler.listHarFiles();
    if (files.length === 0) {
      console.log("No .har or .json files found in the data folder.");
      process.exit(1);
    }

    const idx = await promptFileSelection(files, true);
    if (idx === null || idx < 0) return;

    // await printResourceTypesForFile(idx);

    await interactiveSelectAndWriteXhrRequests(idx, [
      "/api/channel/eventlog/",
      "https://data.pendo.io/data/",
      "https://bam.nr-data.net/",
    ]);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
