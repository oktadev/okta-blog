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

    rl.question("Replace funny characters in "+fn+"? [Y/n] ", (answer) => {
    	console.log(answer);

    	if(answer.toLowerCase() == 'yes' || answer.toLowerCase() == 'y' || answer == '') {
    			
			var contents = fs.readFileSync(postsDir+'/'+fn, 'utf8');

			// Count matches to report
			var count = (contents.match(/[‘’“”…]/g) || []).length

			contents = contents.replace(/‘/g, "'")
				.replace(/’/g, "'")
				.replace(/“/g, '"')
				.replace(/”/g, '"')
				.replace(/…/g, '...');

			fs.writeFileSync(postsDir+'/'+fn, contents);
			console.log("Replaced "+count+" characters");

    	}

    	rl.close();
    });

});
