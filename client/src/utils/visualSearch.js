// On-device visual search: the photo never leaves the browser.
// MobileNet (TensorFlow.js) recognises the object and colorDetect finds its main colour;
// both are then turned into a normal product query.
import { detectColors } from './colorDetect';

const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MOBILENET_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';

// ImageNet label fragments -> catalog subcategories (first match wins, so specific labels go first)
const LABEL_MAP = [
  [['sunglass', 'dark glasses'], ['Sunglasses']],
  [['digital watch'], ['Smartwatches', 'Watches']],
  [['analog clock', 'stopwatch', 'wall clock', 'magnetic compass'], ['Watches']],
  [['jersey', 't-shirt', 'tee shirt', 'sweatshirt'], ['T-Shirts']],
  [['suit, suit of clothes', 'windsor tie', 'bow tie', 'bolo tie'], ['Formal Wear']],
  [['jean', 'denim'], ['Jeans']],
  [['cardigan', 'blouse'], ['Tops', 'Shirts']],
  [['gown', 'overskirt', 'hoopskirt', 'miniskirt', 'sarong'], ['Dresses']],
  [['kimono', 'abaya', 'vestment', 'stole', 'poncho'], ['Kurtis', 'Sarees', 'Kurtas']],
  [['trench coat', 'fur coat', 'bulletproof vest', 'lab coat', 'military uniform'], ['Jackets']],
  [['swimming trunks', 'maillot', 'bikini', 'brassiere'], ['Activewear']],
  [['running shoe'], ['Sneakers', 'Kids Footwear']],
  [['loafer', 'oxford', 'clog', 'cowboy boot', 'boot'], ['Formal Shoes']],
  [['sandal'], ['Heels & Flats']],
  [['necklace', 'chain', 'bead', 'hair slide'], ['Jewellery']],
  [['purse', 'handbag'], ['Handbags']],
  [['wallet', 'buckle'], ['Belts & Wallets']],
  [['backpack', 'mailbag', 'shopping basket', 'pencil box', 'envelope'], ['Bags & Pouches']],
  [['teddy', 'toyshop', 'jigsaw', 'puck', 'go-kart', 'racer', 'model t', 'balloon'], ['Toys']],
  [['candle'], ['Candles']],
  [['pillow'], ['Cushions & Pillows']],
  [['quilt', 'comforter', 'four-poster', 'studio couch'], ['Bedsheets']],
  [['pot, flowerpot', 'flowerpot', 'greenhouse'], ['Plants & Planters']],
  [['vase', 'picture frame', 'sculpture'], ['Decor']],
  [['lampshade', 'table lamp', 'spotlight', 'lamp'], ['Lamps & Lighting']],
  [['coffee mug', 'cup', 'beer glass', 'goblet', 'teapot', 'water jug', 'pitcher', 'coffeepot'], ['Mugs & Drinkware']],
  [['frying pan', 'wok', 'spatula', 'ladle', 'caldron', 'dutch oven', 'strainer', 'cleaver', 'can opener', 'corkscrew', 'measuring cup', 'mixing bowl', 'wooden spoon', 'toaster', 'crock pot'], ['Kitchen Accessories']],
  [['cellular telephone', 'cellular phone', 'hand-held computer', 'ipod'], ['Mobile Covers']],
  [['stethoscope', 'neck brace'], ['Headphones']],
  [['loudspeaker', 'radio'], ['Speakers']],
  [['hard disc', 'modem', 'cassette player'], ['Power Banks']],
  [['switch, electric switch', 'plug'], ['Chargers & Cables']],
  [['lipstick', 'face powder'], ['Makeup']],
  [['lotion', 'sunscreen'], ['Skincare']],
  [['perfume'], ['Fragrances']],
  [['hair spray'], ['Haircare']],
  [['dumbbell', 'barbell'], ['Gym Equipment']],
  [['tennis ball', 'racket', 'soccer ball', 'basketball', 'volleyball', 'football', 'golf ball', 'ping-pong', 'croquet ball'], ['Rackets & Balls']],
  [['water bottle', 'pop bottle', 'whiskey jug'], ['Bottles & Shakers']],
  [['prayer rug', 'doormat'], ['Yoga & Mats']],
  [['sock', 'bib', 'diaper', 'pajama'], ['Boys Wear', 'Girls Wear']],
];

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)?.dataset.loaded) return resolve();
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
  script.onerror = () => { script.remove(); reject(new Error(`Could not load ${src}`)); };
  document.head.appendChild(script);
});

let modelPromise = null;

export const loadModel = () => {
  if (!modelPromise) {
    modelPromise = (async () => {
      await loadScript(TFJS_URL);
      await loadScript(MOBILENET_URL);
      return window.mobilenet.load({ version: 2, alpha: 1.0 });
    })().catch(err => {
      modelPromise = null; // allow a retry later
      throw err;
    });
  }
  return modelPromise;
};

export const mapLabelsToSubcategories = (predictions) => {
  const matches = [];
  for (const { className, probability } of predictions) {
    const label = className.toLowerCase();
    const entry = LABEL_MAP.find(([keys]) => keys.some(k => label.includes(k)));
    if (!entry) continue;
    for (const subcategory of entry[1]) {
      if (!matches.some(m => m.subcategory === subcategory)) {
        matches.push({ subcategory, label: className.split(',')[0], confidence: probability });
      }
    }
  }
  return matches;
};

/**
 * Analyses an <img> element.
 * @returns {Promise<{ matches, colors, predictions, modelError }>}
 */
export const analyzeImage = async (img) => {
  const colors = detectColors(img).slice(0, 3);
  try {
    const model = await loadModel();
    const predictions = await model.classify(img, 6);
    return { matches: mapLabelsToSubcategories(predictions), colors, predictions, modelError: null };
  } catch (err) {
    console.error(err);
    return { matches: [], colors, predictions: [], modelError: err.message };
  }
};

// Downscale a picked/captured image so it fits comfortably in session storage
export const fileToDataUrl = (file, maxSize = 640) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image we can read')); };
  img.src = url;
});
