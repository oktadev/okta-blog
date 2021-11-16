/**
 * This script will validate the size, width and filetype of all images under assets
 */
const { validateImage } = require("./image-processing");

validateImage("_source/_assets/img");
