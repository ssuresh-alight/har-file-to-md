const fs = require("fs").promises;
const path = require("path");

/**
 * Handles writing selected HAR XHR requests to a markdown file in a specific format.
 */
class RequestMarkdownWriter {
  /**
   * @param {string} outputPath - Path to the markdown file to write.
   * @param {string} dataFileName - Name of the HAR/JSON data file.
   */
  constructor(outputPath, dataFileName) {
    this.outputPath = outputPath;
    this.dataFileName = dataFileName;
    this.entries = [];
  }

  /**
   * Add a HAR entry to be written to markdown.
   * @param {import('har-format').Entry} entry
   */
  addEntry(entry) {
    this.entries.push(entry);
  }

  /**
   * Write all added entries to the markdown file in the specified format.
   * @returns {Promise<void>}
   */
  async write() {
    let md = `## Flow - TODO

data file name: \`${this.dataFileName}\`
`;

    this.entries.forEach((entry, idx) => {
      // Request
      const method = entry.request?.method || "";
      const url = entry.request?.url || "";

      // Request body
      let reqBody = "";
      if (entry.request?.postData?.text) {
        reqBody = entry.request.postData.text;
      }

      // Request headers
      const reqHeaders = (entry.request?.headers || []).map((h) => `${h.name}: ${h.value}`).join("\n");

      // Response status
      const status = entry.response?.status
        ? `${entry.response.status} ${entry.response.statusText || ""}`.trim()
        : "";

      // Response body
      let resBody = "";
      if (entry.response?.content?.text) {
        resBody = entry.response.content.text;
      }

      // Response headers
      const resHeaders = (entry.response?.headers || []).map((h) => `${h.name}: ${h.value}`).join("\n");

      md += `
### ${idx + 1} 
Request:
\`\`\`
${method} ${url}
\`\`\`
Request body:
\`\`\`
${reqBody}
\`\`\`
Request headers:
\`\`\`
${reqHeaders}
\`\`\`
Response status:
\`\`\`
${status}
\`\`\`
Response body:
\`\`\`
${resBody}
\`\`\`
Response headers:
\`\`\`
${resHeaders}
\`\`\`
`;
    });

    await fs.writeFile(this.outputPath, md, { encoding: "utf8" });
  }
}

module.exports = RequestMarkdownWriter;
