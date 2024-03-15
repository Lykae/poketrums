'use strict';

const PDFDocument = require('pdfkit');
const cheerio = require('cheerio');
const pr = require('path').resolve;
const fs = require('fs');

const BLEED = 3;
const WIDTH = 170 + 2 * BLEED;
const HEIGHT = 255 + 2 * BLEED;
const MARGIN = 10 + 2 * BLEED;
const LINE_HEIGHT = 14;

const VERKEHRSROT = [ 0, 100, 100, 10 ];
const LICHTGRAU = [ 0, 0, 0, 20 ];
const WHITE = [ 0, 0, 0, 0 ];
const BLACK = [ 0, 0, 0, 100 ];

const typeColors = {
  normal: [0, 0.6, 27.38, 34.12],
	fire: [0, 45.8, 79.83, 6.67],
	water: [58.75, 40, 0, 5.88],
	electric: [0, 15.79, 82.19, 3.14],
	grass: [38.69, 0, 61.81, 21.96],
	ice: [30.88, 0, 1.38, 14.9],
	fighting: [0, 76.29, 79.38, 23.92],
	poison: [0, 61.96, 1.23, 36.08],
	ground: [0, 15.49, 55.31, 11.37],
	flying: [30.45, 41.15, 0, 4.71],
	psychic: [0, 65.86, 45.78, 2.35],
	bug: [10.27, 0, 85.95, 27.45],
	rock: [0, 11.54, 70.33, 28.63],
	ghost: [23.84, 42.38, 0, 40.78],
	dragon: [55.95, 78.97, 0, 1.18],
	dark: [0, 22.32, 37.5, 56.08],
	steel: [11.17, 11.17, 0, 19.22],
	fairy: [0, 37.85, 19.16, 16.08],
};

function makePDF(card) {
  let doc = new PDFDocument({ size: 'b8', margin: 0});
  let i = 0;
  return {
    doc: doc,
    end: () => {
      return doc.end();
    },
    add: (card) => new Promise((resolve, reject) => {
      let pageX = 0;
      let pageY = 0;

      let temp = 2.4;
      let scaleMonImage = 0.7;

      console.log("found image!")
      let y = 0;
      doc.rect(pageX + 0, pageY + 0, WIDTH, HEIGHT / temp);
      y = HEIGHT / 2.2;
      // Declare fonts
      doc.font(pr(__dirname, '../../src/fonts/FiraSans-Light.ttf'), 'Light');
      //doc.font(pr(__dirname, '../../src/fonts/FiraSans-Book.ttf'), 'Regular');
      doc.font(pr(__dirname, '../../src/fonts/ponde___.ttf'), 'Regular'); // pixelfont
      let placeholderAspectRatio = WIDTH / (HEIGHT / temp);
      if (card.mon.image) {
        // Find out which dimension we need to pass to PDFKit to make sure
        // that the image covers its placeholder.
        let imageSize;
        let imageAspectRatio = card.mon.imageDimensions.width / card.mon.imageDimensions.height;
        if (imageAspectRatio > placeholderAspectRatio) {
          imageSize = { height: HEIGHT / temp  * scaleMonImage };
        } else {
          imageSize = { width: WIDTH * scaleMonImage };
        }
        doc.save()
          .clip()
          .image(card.mon.image, pageX + (WIDTH - (imageSize.height || imageSize.width))/2, pageY - HEIGHT/30, imageSize)
          .restore();
      } else {
        doc.fill(LICHTGRAU);
      }
      
      doc.moveTo(pageX + 0, pageY + HEIGHT / 2.5 + 4)
        .lineTo(pageX + WIDTH, pageY + HEIGHT / 2.5 + 4)
        .lineWidth(3)
        .strokeOpacity(1)
        .stroke(typeColors[card.mon.gameType]); // LINE
      doc.fill(BLACK);
      doc.circle(pageX + WIDTH - MARGIN - 5, pageY + MARGIN + 7, 10).fill(typeColors[card.mon.gameType]); // circle
      doc.fontSize(12);
      doc.font('Light').fill(WHITE).text(card.id, pageX - 2 * (MARGIN + BLEED) + WIDTH - 23, pageY + MARGIN, { width: 80, align: 'center' });
      doc.fontSize(9);
      doc.font('Regular').fill(BLACK).text(card.name, pageX + MARGIN, pageY + y);
      y += LINE_HEIGHT * 1.5;
      doc.fontSize(8);
      card.values.forEach(category => {
        doc.font('Light').text(category.name, pageX + MARGIN, pageY + y);
        doc.font('Regular').text(category.value, pageX + MARGIN, pageY + y, { width: WIDTH - 2 * MARGIN, align: 'right' });
        y += LINE_HEIGHT;
      });
      doc.fontSize(8);
      doc.lineWidth(0.5);
      i++;
      doc.addPage();
      resolve();
    }),
  }
}

module.exports = makePDF;
