'use strict';

const sizeOf = require('image-size');
const request = require('request');
const cheerio = require('cheerio');
const YAML = require('js-yaml');
const slug = require('slug');
const pr = require('path').resolve;
const fs = require('fs');

const DATA_DIR = pr(__dirname, '../../src/data');

const CACHE_DIR = pr(__dirname, '../../.cache');
try {
  fs.mkdirSync(CACHE_DIR);
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
}


function getDataUrl(pokeName) {
  return "https://pokeapi.co/api/v2/pokemon/" + pokeName;
}

function getSpeciesUrl(pokeName) {
  return "https://pokeapi.co/api/v2/pokemon-species/" + pokeName;
}

function findPokemon(name) {
  return new Promise((resolve, reject) => {

    console.log("looking up data for " + name);

    let metadataPath = pr(CACHE_DIR, slug(name) + '.json');
    let imagePath = pr(CACHE_DIR, slug(name) + '.png');

    // See if we have stuff in the cache
    try {
      let imageBuffer = fs.readFileSync(imagePath);
      let metadataBuffer = fs.readFileSync(metadataPath);
      if (imageBuffer && metadataBuffer) {
        resolve({
          image: imageBuffer,
          metadata: JSON.parse(metadataBuffer),
          dimensions: sizeOf(imageBuffer),
        });
        return;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') return reject(e);
      console.log('Image or Data not found in cache');
    }

    let url = getDataUrl(name);
    let options = {
      headers: {
        'User-Agent': 'Node/20.10.0'
      },
      encoding: null
    }

    request(url, options, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        return reject(error);
      }
      let data = JSON.parse(body);
      let metadata = {name: name, sprites: data.sprites, species: data.species.name};

      for (let index = 0; index < data.stats.length; index++) {
        const element = data.stats[index];
        switch (element.stat.name) {
          case "hp": metadata.hp = element.base_stat; break;
          case "attack": metadata.atk = element.base_stat; break;
          case "defense": metadata.def = element.base_stat; break;
          case "special-attack": metadata.spatk = element.base_stat; break;
          case "special-defense": metadata.spdef = element.base_stat; break;
          case "speed": metadata.spe = element.base_stat; break;
        }
      }
      
    request(getSpeciesUrl(metadata.species), options, function (error, responseSpecies, bodySpecies) {
      if (error || responseSpecies.statusCode !== 200) {
        return reject(error);
      }
        let dataSpecies = JSON.parse(bodySpecies);

        for (let index = 0; index < dataSpecies.names.length; index++) {
          const element = dataSpecies.names[index];
          if (element.language.name === "en") {
            metadata.displayName = element.name;
          }
        }

        fs.writeFileSync(metadataPath, JSON.stringify(metadata));

        // get sprite url
        //let imageUrl = metadata.sprites.other.home.front_default;
        let imageUrl = metadata.sprites.other['official-artwork'].front_default;
        //let imageUrl = metadata.sprites.other.dream_world.front_default;
        console.log("imageUrl: %s", imageUrl);
        request(imageUrl, options, function (error, res, buffer) {
          if (error || res.statusCode !== 200) {
            console.log("err: %s", error);
            console.log("statusCode: %s", res.statusCode);
            return reject(error);
          }
          console.log('Fetched image from %s', imageUrl);
          let imageBuffer = buffer;
          fs.writeFileSync(imagePath, buffer);
          resolve({
            image: imageBuffer,
            metadata: metadata,
            dimensions: sizeOf(imageBuffer),
          });
        });
      });
    });
  }).catch(err => console.error(err));
}

module.exports = findPokemon;
