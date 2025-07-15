const fs = require("fs").promises;
const path = require("path");

/** @typedef {import('har-format').Har} Har */

class HarFileHandler {
  /** @type {string}*/
  #dataDir;
  /** @type {string[]}*/
  #fileList;
  /** @type {Har|null} */
  #json;

  /**
   * @param {string} dataDir
   */
  constructor(dataDir) {
    this.#dataDir = dataDir;
    this.#fileList = [];
    this.#json = null;
  }

  async listHarFiles() {
    const files = await fs.readdir(this.#dataDir);
    this.#fileList = files.filter((f) => f.endsWith(".har") || f.endsWith(".json"));
    return this.#fileList;
  }

  /** @returns {Har} */
  #guardEntries() {
    if (!this.#json?.log?.entries || !Array.isArray(this.#json.log.entries)) {
      throw new Error("Invalid HAR/JSON structure: missing 'log.entries' array.");
    }
    return this.#json;
  }

  /**
   * @param {number} index
   * @returns {Promise<string>}
   */
  async loadByIndex(index) {
    if (!this.#fileList.length) {
      await this.listHarFiles();
    }
    if (index < 0 || index >= this.#fileList.length) {
      throw new Error("Invalid file index");
    }

    const filePath = path.join(this.#dataDir, this.#fileList[index]);
    const content = await fs.readFile(filePath, "utf8");
    this.#json = JSON.parse(content);

    return this.#fileList[index];
  }

  /** @returns {string[]} */
  getResourceTypes() {
    const json = this.#guardEntries();
    return (
      json.log.entries
        .map((entry) => entry._resourceType)
        // _resourceType can be undefined|null:
        .filter((type) => typeof type === "string")
    );
  }

  /**
   * @returns {import('har-format').Entry[]}
   */
  getXhrEntries() {
    const json = this.#guardEntries();
    return json.log.entries.filter((entry) => entry._resourceType === "xhr");
  }
}

module.exports = HarFileHandler;
