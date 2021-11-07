/**
 * This script will resize and optimize images in _source/_assets/img
 */
const { processImages } = require("./image-processing");

processImages("_source/_assets/img");
