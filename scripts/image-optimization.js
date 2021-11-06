/**
 * This script will validate the size, width and filetype of all images under assets
 */
const fs = require("fs");

const chalk = require("chalk");
const readdir = require("recursive-readdir");
const sharp = require("sharp");

const maxFileSize = 300000; // 300kb
const maxWidth = 1200; // max width supported by the blog + 300px

readdir("_source/_assets/img", (err, files) => {
  if (err) throw err;

  console.log(chalk.bold.green(`\nImages larger than (${(maxFileSize / 1000000).toFixed(2)}MB) will be resized and/or compressed\n`));

  files.forEach((file) => {
    if (file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".png")) {
      // resize large sized jpeg/png and convert to jpeg
      const stat = fs.statSync(file);
      if (stat.size > maxFileSize) {
        const sfile = sharp(file);
        sfile.metadata().then((metadata) => {
          const newFileName = file.replace(/\.[^/.]+$/, ".opt.jpg");
          // resize images with width > 1200px
          if (metadata.width > maxWidth) {
            sfile.resize({ width: maxWidth }).jpeg({ quality: 95 }).toFile(newFileName);
          } else {
            sfile.resize({ width: metadata.width, height: metadata.height }).jpeg({ quality: 95 }).toFile(newFileName);
          }
        });
      }
    }
  });

  console.log(chalk.bold.green("\nOptimizing blog images...\n"));
});
