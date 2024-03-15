'use strict';

async function main() {

const async = require('async');
const pr = require('path').resolve;
const fs = require('fs');
const _ = require('lodash');


const YAML = require('js-yaml');

const pdf = require('./lib/card-generator')();
const findPokemon = require('./lib/find-pokemon');

const SRC_DIR = pr(__dirname, '../src');
const DATA_DIR = pr(SRC_DIR, 'data');
const DEST_DIR = pr(__dirname, '../dist');

const ALPHABET = 'ABCDEFGHIJKMNOPQRSTUVWXYZ';

try {
  fs.mkdirSync(DEST_DIR);
} catch (e) {
  if (e.code !== 'EEXIST') throw e;
}

let pokemonYaml = YAML.safeLoad(fs.readFileSync(pr(DATA_DIR, 'pokemon.yaml')));
let pokeList = [];

async function fillPokeList() {
  for (const [pokeName, pokeType] of Object.entries(pokemonYaml)) {
    await new Promise((resolve, reject) => {
      findPokemon(pokeName).then(data => {
        let pokemon = data.metadata;
        pokemon.image = data.image;
        pokemon.imageDimensions = data.dimensions;
        pokemon.gameType = pokeType;
        pokeList.push(pokemon);
        resolve();
      }).catch(err => { throw err });
   }).catch(error => console.error(error));
  }
}
await fillPokeList();

console.log("length -> " + pokeList.length);

let categories = [
  {
    name: 'HP',
    find: mon => mon.hp,
  },
  {
    name: 'Attack',
    find: mon => mon.atk,
  },
  {
    name: 'Defense',
    find: mon => mon.def,
  },
  {
    name: 'Special Attack',
    find: mon => mon.spatk,
  },
  {
    name: 'Special Defense',
    find: mon => mon.spdef,
  },
  {
    name: 'Speed',
    find: mon => mon.spe,
  }
];

let cards = _(Array.from(pokeList)).sortBy(mon => mon.gameType).value();

let i = 0;
async.eachLimit(cards, 1, (mon, cardDone) => {
  let cardID = ALPHABET[i / 4 | 0] + (i % 4 + 1);
  console.log(cardID, mon.name);
  let card = {
    name: mon.displayName,
    id: cardID,
    values: [],
    mon: mon
  };
  categories.forEach(category => {
    let format = category.format || _.identity;
    card.values.push({ name: category.name, value: format(category.find(mon)) });
  });

  pdf.add(card).then(cardDone)
  .catch((err) => {
    console.error(err);
    cardDone(err);
  });
  i++;
}, function () {
  pdf.end();
  pdf.doc.pipe(fs.createWriteStream(pr(DEST_DIR, 'output.pdf')));
});

}

main();