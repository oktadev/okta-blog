const fs = require("fs");
const path = require("path");

// Path to the _posts directory
const postsDir = path.join(__dirname, "..", "_source", "_posts");

// Get date to remove files (e.g. 2019-08-26)
const dt = new Date();
dt.setDate( dt.getDate() - 14 );
const dtCompare = dt.toISOString().substr(0, 10);

// See if filename(s) passed in
const filenames = process.argv.slice(2);

// Get a list of all files in the _posts directory
fs.readdir( postsDir, (err, files) => {
    if ( err ) {
        console.log( err );
        return;
    }
    // If files passed in as a parameter, keep them
    const filesToKeep = (filenames.length) ? filenames.toString().split(',') : [];

    // Filter out the newest files and files to keep
    const filesToRemove = files.filter( f => f < dtCompare && !filesToKeep.includes(f));

    // Delete the filtered files
    filesToRemove.forEach( f => fs.unlink(path.join(postsDir, f), err => console.log));
    console.log(`Files removed: ${ filesToRemove.length }`);
});
