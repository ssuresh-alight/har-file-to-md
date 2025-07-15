# HAR file to MD

A Node.js tool for interactively extracting XHR requests from HAR/JSON files and exporting them to a Markdown file.

HAR files can be exported from browser network tools after recording network traffic.

> **Note:** Most of this project was created with GitHub Copilot.

## Features

- Lists available `.har` and `.json` files in the `data` directory.
- Lets you select a file to process.
- Shows resource types and counts in the selected HAR file.
- Interactively prompts you for each XHR request to decide if it should be written to a Markdown file.
- Outputs selected requests in a readable Markdown format.

## Usage

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Place your HAR/JSON files**  
   Put your `.har` or `.json` files in the `data` directory.

3. **Run the tool**

   ```bash
   npm start
   ```

   or

   ```bash
   node index.js
   ```

4. **Follow the prompts**

   - Select a file by index.
   - For each XHR request, answer `Y` or `N` to include it in the Markdown output.

5. **Output**
   - The selected requests will be written to a Markdown file in the `output` directory.

## Development

- Type checking is enabled via JSDoc and `jsconfig.json`.
- Formatting is handled by Prettier (see `.prettierrc`).
