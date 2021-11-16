/**
 * This script does image validation and processing.
 */
const fs = require("fs");
const chalk = require("chalk");
const readdir = require("recursive-readdir");
const sharp = require("sharp");

const maxFileSize = 500000; // 500kb
const gifMaxFileSize = 5000000; // 5MB
const maxWidth = 1800; // max width supported by the blog is 900px, so we take 2x for high density displays
const blogBgColor = "#ffffff";

function toMb(bytes) {
  return (bytes / 1000000).toFixed(2);
}

function daysBetweenDates(date1, date2) {
  const diff = date1 - date2;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getIgnoreList() {
  const rawdata = fs.readFileSync("scripts/image-validation-ignore.json");
  return JSON.parse(rawdata);
}

function validateImage(path) {
  readdir(path, (err, files) => {
    console.log(chalk.bold.green("\nValidating blog images...\n"));

    if (err) throw err;

    let valid = true;

    const ignored = getIgnoreList();

    files.forEach((file) => {
      if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
        const stat = fs.statSync(file);
        // fail in case or large sized jpeg/png
        if (stat.size > maxFileSize && !ignored.includes(file)) {
          console.warn(chalk.red(`${file} is too large (${toMb(stat.size)}MB)`));
          valid = false;
        }

        // check only for files modified within last 2 days
        const days = daysBetweenDates(new Date().getTime(), stat.mtime.getTime());
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
        const stat = fs.statSync(file);
        // For GIFs just warn as they are probably always bigger than normal images
        if (stat.size > gifMaxFileSize) {
          console.warn(chalk.yellow(`${file} is too large (${toMb(stat.size)}MB)`));
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
}

function processImages(path, replace) {
  readdir(path, (err, files) => {
    if (err) throw err;

    console.log(chalk.bold.green(`\nImages larger than (${toMb(maxFileSize)}MB) will be resized and/or compressed\n`));

    const ignored = getIgnoreList();

    files.forEach((file) => {
      if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
        // resize large sized jpeg/png and convert to jpeg
        const stat = fs.statSync(file);
        if (stat.size > maxFileSize && !ignored.includes(file)) {
          const sfile = sharp(file);
          sfile.metadata().then((metadata) => {
            const newFileName = file.replace(/\.[^/.]+$/, ".opt.jpg");
            let sizeConfig = { width: metadata.width, height: metadata.height };
            // resize images with width > 1800px
            if (metadata.width > maxWidth) {
              sizeConfig = { width: maxWidth };
            }
            sfile
              .flatten({ background: blogBgColor })
              .resize(sizeConfig)
              .jpeg({ quality: 90 })
              .toFile(newFileName)
              .then(() => {
                if (replace) {
                  fs.rename(newFileName, file, (err) => {
                    if (err) throw err;
                  });
                }
              });
          });
        }
      }
    });

    console.log(chalk.bold.green("\nOptimizing blog images...\n"));
  });
}

module.exports = {
  validateImage,
  processImages,
};
