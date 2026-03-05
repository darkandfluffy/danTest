const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { URL } = require("url");

const INPUT_FILE = "./scratch.txt";
const OUTPUT_DIR = "./offline-copy";

async function downloadFile(fileUrl) {
  try {
    const parsedUrl = new URL(fileUrl);

    let filePath = parsedUrl.pathname;

    // Handle query strings (like ?attachment_id=241)
    if (parsedUrl.search) {
      filePath += parsedUrl.search.replace(/[^\w]/g, "_");
    }

    // If it's a directory path, save as index.html
    if (filePath.endsWith("/")) {
      filePath += "index.html";
    }

    const localPath = path.join(OUTPUT_DIR, filePath);

    await fs.ensureDir(path.dirname(localPath));

    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
      timeout: 60000,
    });

    const writer = fs.createWriteStream(localPath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`Saved: ${localPath}`);
  } catch (error) {
    console.error(`Failed: ${fileUrl}`);
    console.error(error.message);
  }
}

async function run() {
  await fs.ensureDir(OUTPUT_DIR);

  const urls = (await fs.readFile(INPUT_FILE, "utf8"))
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  console.log(`Found ${urls.length} URLs`);

  for (const url of urls) {
    console.log(`Downloading: ${url}`);
    await downloadFile(url); // sequential
  }

  console.log("All downloads complete.");
}

run();
