const fs = require("fs");
const path = require("path");
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the _posts directory
const postsDir = path.join(__dirname, "..", "_source", "_posts");

// Get a list of all files in the _posts directory
fs.readdir( postsDir, (err, files) => {
    if ( err ) {
        console.log( err );
        return;
    }

    const fn = files[files.length-1];

    var contents = fs.readFileSync(postsDir+'/'+fn, 'utf8');

    // Count matches to report
    var count_quotes = (contents.match(/[‘’“”…]/g) || []).length;

    var count_urls = (contents.match(/\(https:\/\/developer\.okta\.com\/blog\/(.+)\)/g) || []).length;

    console.log("Reading latest post "+fn);
    console.log("Found "+count_quotes+" curly quotes and "+count_urls+" absolute blog URLs");

    rl.question("Replace characters? [Y/n] ", (answer) => {

        if(answer.toLowerCase() == 'yes' || answer.toLowerCase() == 'y' || answer == '') {

            contents = contents.replace(/‘/g, "'")
                .replace(/’/g, "'")
                .replace(/“/g, '"')
                .replace(/”/g, '"')
                .replace(/…/g, '...');

            console.log("");
            console.log("Replaced "+count_quotes+" characters");

            contents = contents.replace(/\(https:\/\/developer\.okta\.com\/blog\/(.+)\)/g, '(/blog/$1)')

            console.log("Replaced "+count_urls+" instances of absolute blog URLs");

            fs.writeFileSync(postsDir+'/'+fn, contents);

        }

        rl.close();
    });

});
