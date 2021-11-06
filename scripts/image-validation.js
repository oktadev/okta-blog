/**
 * This script will validate the size, width and filetype of all images under assets
 */
const fs = require("fs");

const chalk = require("chalk");
const readdir = require("recursive-readdir");
const sharp = require("sharp");

function validateFileSize(file, maxSize) {
  const stat = fs.statSync(file);

  if (stat.size > maxSize) {
    console.warn(chalk.red(`${file} is too large (${(stat.size / 1000000).toFixed(2)}MB)`));
    return false;
  }
  return true;
}

const maxFileSize = 400000; // 400kb
const gifMaxFileSize = 5000000; // 5MB
const maxWidth = 1200; // max width supported by the blog + 300px

readdir("_source/_assets/img", (err, files) => {
  if (err) throw err;

  let valid = true;

  files.forEach((file) => {
    const stat = fs.statSync(file);
    if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
      // fail in case or large sized jpeg/png
      if (stat.size > maxFileSize) {
        console.warn(chalk.red(`${file} is too large (${(stat.size / 1000000).toFixed(2)}MB)`));
        valid = false;
      }

      // check only for files modified within last 2 days
      const modifiedTime = stat.mtime.getTime();
      const now = new Date().getTime();
      const diff = now - modifiedTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days <= 2) {
        let image = sharp(file);
        image
          .metadata()
          .then((metadata) => {
            if (metadata.format === "png") {
              console.warn(chalk.yellow(`${file} is of PNG format. Consider using JPEG or WebP for optimal performance`));
            }
            if (metadata.width > maxWidth) {
              // for now just a warning, but we should probably throw an error
              console.warn(chalk.yellow(`${file} is wider than blog contents maxWidth (${metadata.width}px)`));
            }
          })
          .catch((err) => {
            console.warn(`${file}: Error ${err}`);
          });
      }
    } else if (file.endsWith(".gif")) {
      // For GIFs just warn as they are probably always bigger than normal images
      if (stat.size > gifMaxFileSize) {
        console.warn(chalk.yellow(`${file} is too large (${(stat.size / 1000000).toFixed(2)}MB)`));
      }
    }
  });

  // fail if there are validation errors
  if (!valid) {
    console.log(chalk.bold.red("\nValidating blog images. There are some large files!\n"));
    process.exit(1);
  } else {
    console.log(chalk.bold.green("\nValidating blog images. No file size issues found!\n"));
  }
});
