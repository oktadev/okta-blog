/**
 * This script will resize and optimize images in _source/_assets/img
 */
const { processImages } = require("./image-processing");

// set the second parameter to true to replace images
processImages("_source/_assets/img", false);
