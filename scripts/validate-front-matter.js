/**
 * This script will validate the legitimacy of each blog post's YAML
 * front matter. Specifically, it will look at the "communities" and "type"
 * front matter variable and ensure:
 *
 *   - It is an array
 *   - It contains only valid "communities" or "types"
 *
 * This is incredibly important because these definitions are what we use to
 * track metrics on our site.
 */
const fs = require("fs");

const chalk = require("chalk");
const fm = require("front-matter");
const readdir = require("recursive-readdir");

const frontMatter = require("../_source/_data/front-matter.json");

function isValidCommunity(community) {
  return frontMatter.communities.includes(community);
}

function validateBy(file, by) {
  if (by && !frontMatter.bys.includes(by)) {
    let validBys = chalk.green(frontMatter.bys.join(", "));
    let invalidBy = chalk.red(by);

    throw new Error(file +
      " contains an invalid by in the YAML front matter. Valid bys are: " +
      validBys + ". You supplied: " + invalidBy + "."
    );
  }
}

function validateComms(file, comms) {
  let err, invalidCommunities, validCommunities;

  if (!comms) return;

  validCommunities = chalk.green(frontMatter.communities.join(", "));
  invalidCommunities = chalk.red(Array.isArray(comms) ? comms.join(", ") : comms);

  if (Array.isArray(comms)) {
    if (!comms.every(isValidCommunity)) {
      err = true;
    }
  } else {
    if (!frontMatter.communities.includes(comms)) {
      err = true;
    }
  }

  if (err) {
    throw new Error(file +
      " contains an invalid community in the YAML front matter. Valid communities are: " +
      validCommunities + ". You supplied: " + invalidCommunities + "."
    );
  }
}

function validateTypes(file, type) {
  if (type && !frontMatter.types.includes(type)) {
    let invalidType = chalk.red(type);
    let validTypes = chalk.green(frontMatter.types.join(", "));

    throw new Error(file +
      " contains an invalid type in the YAML front matter. Valid types are: " +
      validTypes + ". You supplied: " + invalidType + "."
    );
  }
}

function validateTags(file, tags) {
  var invalidTags = [];
  for(var i = 0; i < tags.length; i++) {
    if(!tags[i].match(/^[a-z0-9-]+$/) || tags[i].match(/--/)) {
      invalidTags.push(tags[i]);
    }
  }
  if(invalidTags.length > 0) {
    throw new Error(file +
      " contains invalid tags: " +
      chalk.red(invalidTags.join(", ")) +
      " Only lowercase letters, numbers, and hyphens are allowed in tags.");
  }
}

function validateDescription(file, description) {
  if (!description || description.trim().length === 0) {
    console.warn(`${file} is missing a description in its front matter.`);
  } else {
    // https://blog.spotibo.com/meta-description-length/
    if (description.length > 120) {
      console.warn(`${file} has a description that's more than 120 characters (${description.length}).`);
    }
  }
}

readdir("_source/_posts", (err, files) => {
  if (err) throw err;

  for (let i = 0; i < files.length; i++) {
    let content;

    try {
      content = fm(fs.readFileSync(files[i], "utf8"));
    } catch(err){
      console.error("ERROR: Could not parse YAML front matter for file:", files[i]);
      throw err;
    }

    validateDescription(files[i], content.attributes.description)
    validateBy(files[i], content.attributes.by);
    validateComms(files[i], content.attributes.communities);
    validateTypes(files[i], content.attributes.type);
    validateTags(files[i], content.attributes.tags);
  }

  for (let i = 0; i < Object.keys(frontMatter).length; i++) {
    console.log(`Finished validating all YAML front matter for ${chalk.green(Object.keys(frontMatter)[i])}.`);
  }
});
