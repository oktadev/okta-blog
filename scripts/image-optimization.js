/**
 * This script will resize and optimize images in _source/_assets/img
 */
const fs = require("fs");

const chalk = require("chalk");
const readdir = require("recursive-readdir");
const sharp = require("sharp");

const maxFileSize = 400000; // 400kb
const maxWidth = 1200; // max width supported by the blog + 300px
const blogBgColor = "#ffffff";

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
          let sizeConfig = { width: metadata.width, height: metadata.height };
          // resize images with width > 1200px
          if (metadata.width > maxWidth) {
            sizeConfig = { width: maxWidth };
          }
          sfile.flatten({ background: blogBgColor }).resize(sizeConfig).jpeg({ quality: 95 }).toFile(newFileName);
        });
      }
    }
  });

  console.log(chalk.bold.green("\nOptimizing blog images...\n"));
});
