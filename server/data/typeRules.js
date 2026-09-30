// Maps each photo's description (Unsplash alt text) to a product type, so a product's
// name always describes what is actually in its photo. The first matching pattern wins;
// the last entry of each list is the default. data/catalog-meta.txt stores the chosen
// index per photo (see seed.js).
const TYPE_RULES = {
  'Men/T-Shirts': [['polo', 'Polo T-Shirt'], ['henley', 'Henley T-Shirt'], ['v-neck|v neck', 'V-Neck T-Shirt'], ['stripe', 'Striped T-Shirt'], ['long.?sleeve', 'Full Sleeve T-Shirt'], ['print|graphic|logo|text|design|slogan', 'Graphic Print T-Shirt'], ['', 'Crew Neck T-Shirt']],
  'Men/Shirts': [['denim', 'Denim Shirt'], ['linen', 'Linen Shirt'], ['check|plaid|flannel|tartan', 'Checked Shirt'], ['stripe', 'Striped Shirt'], ['print|floral|pattern|hawaiian', 'Printed Shirt'], ['formal|dress shirt|suit|tie|office', 'Formal Shirt'], ['', 'Casual Shirt']],
  'Men/Jeans': [['ripped|distressed|torn', 'Distressed Jeans'], ['skinny', 'Skinny Fit Jeans'], ['light|faded|washed', 'Light Wash Jeans'], ['short', 'Denim Shorts'], ['', 'Slim Fit Jeans']],
  'Men/Formal Wear': [['tuxedo|bow tie|bowtie', 'Tuxedo'], ['three.?piece|vest|waistcoat', 'Three-Piece Suit'], ['blazer|sport coat', 'Blazer'], ['trouser|pants', 'Formal Trousers'], ['', 'Two-Piece Suit']],
  'Men/Kurtas': [['sherwani|groom|wedding|bride', 'Sherwani'], ['jacket|nehru|waistcoat', 'Kurta with Nehru Jacket'], ['', 'Kurta Pyjama Set']],
  'Men/Jackets': [['leather', 'Leather Jacket'], ['denim|jean', 'Denim Jacket'], ['bomber', 'Bomber Jacket'], ['puffer|down|quilted|padded', 'Puffer Jacket'], ['hood', 'Hooded Jacket'], ['coat|trench|overcoat', 'Overcoat'], ['', 'Casual Jacket']],
  'Men/Sneakers': [['running|runner|jogging', 'Running Shoes'], ['high.?top|basketball|jordan', 'High-Top Sneakers'], ['canvas|converse|vans', 'Canvas Sneakers'], ['', 'Sneakers']],
  'Men/Formal Shoes': [['chelsea|boot', 'Chelsea Boots'], ['loafer|moccasin', 'Loafers'], ['brogue|wingtip', 'Brogues'], ['oxford', 'Oxford Shoes'], ['monk', 'Monk Strap Shoes'], ['', 'Leather Derby Shoes']],
  'Men/Watches': [['chronograph', 'Chronograph Watch'], ['smart|digital', 'Digital Watch'], ['skeleton|automatic|mechanical', 'Automatic Watch'], ['leather|strap', 'Leather Strap Watch'], ['steel|metal|bracelet|link', 'Stainless Steel Watch'], ['', 'Analog Watch']],
  'Men/Sunglasses': [['aviator|pilot', 'Aviator Sunglasses'], ['round', 'Round Sunglasses'], ['sport', 'Sports Sunglasses'], ['', 'Wayfarer Sunglasses']],
  'Men/Belts & Wallets': [['belt', 'Leather Belt'], ['card', 'Card Holder'], ['', 'Leather Wallet']],
  'Women/Kurtis': [['anarkali|gown|flared', 'Anarkali Kurta'], ['dupatta|scarf|stole|veil', 'Kurta Set with Dupatta'], ['lehenga|skirt', 'Lehenga Set'], ['', 'Printed Kurti']],
  'Women/Jeans': [['wide|flare|bell', 'Wide Leg Jeans'], ['skinny', 'Skinny Jeans'], ['ripped|distressed|torn', 'Distressed Jeans'], ['short', 'Denim Shorts'], ['mom|high.?waist|high.?rise', 'High-Rise Mom Jeans'], ['', 'Straight Fit Jeans']],
  'Women/Tops': [['blouse', 'Blouse'], ['crop', 'Crop Top'], ['tank|sleeveless|camisole|strap', 'Tank Top'], ['sweater|knit|cardigan|jumper', 'Knit Top'], ['t-shirt|tee', 'T-Shirt'], ['shirt|button', 'Shirt'], ['', 'Top']],
  'Women/Dresses': [['gown|evening|wedding|ball', 'Evening Gown'], ['floral|flower', 'Floral Dress'], ['maxi|long', 'Maxi Dress'], ['mini|short', 'Mini Dress'], ['', 'A-Line Dress']],
  'Women/Sarees': [['bride|bridal|wedding', 'Bridal Silk Saree'], ['silk', 'Silk Saree'], ['', 'Woven Saree']],
  'Women/Handbags': [['tote', 'Tote Bag'], ['clutch', 'Clutch'], ['backpack', 'Mini Backpack'], ['sling|crossbody|cross-body|shoulder', 'Sling Bag'], ['', 'Handbag']],
  'Women/Heels & Flats': [['sandal', 'Sandals'], ['boot', 'Ankle Boots'], ['sneaker|trainer', 'Sneakers'], ['flat|ballet|loafer', 'Ballet Flats'], ['', 'Heels']],
  'Women/Jewellery': [['earring', 'Earrings'], ['necklace|pendant|chain', 'Necklace'], ['bracelet|bangle', 'Bracelet'], ['ring', 'Ring'], ['', 'Jewellery Set']],
  'Women/Watches': [['smart|digital', 'Digital Watch'], ['bracelet|link|chain', 'Bracelet Watch'], ['leather|strap', 'Leather Strap Watch'], ['', 'Analog Watch']],
  'Women/Sunglasses': [['cat.?eye', 'Cat-Eye Sunglasses'], ['round', 'Round Sunglasses'], ['aviator', 'Aviator Sunglasses'], ['oversized|big|large', 'Oversized Sunglasses'], ['', 'Sunglasses']],
  'Women/Activewear': [['sports bra|bra\\b', 'Sports Bra'], ['legging|tights|pants', 'Leggings'], ['short', 'Running Shorts'], ['', 'Workout Set']],
  'Kids/Boys Wear': [['jacket|coat', 'Jacket'], ['hoodie|sweater|sweatshirt|jumper', 'Sweatshirt'], ['overall|dungaree', 'Dungarees'], ['t-shirt|tee', 'T-Shirt'], ['shirt', 'Shirt'], ['', 'Outfit Set']],
  'Kids/Girls Wear': [['dress|frock|gown', 'Dress'], ['skirt', 'Top & Skirt Set'], ['jacket|coat', 'Jacket'], ['sweater|cardigan|jumper', 'Sweater'], ['', 'Outfit Set']],
  'Kids/Toys': [['lego|brick|block', 'Building Blocks'], ['cars?\\b|truck|vehicle|bus\\b', 'Toy Car'], ['teddy|bear|plush|stuffed', 'Soft Toy'], ['doll', 'Doll'], ['robot', 'Robot Toy'], ['puzzle', 'Puzzle'], ['train', 'Toy Train'], ['', 'Play Set']],
  'Kids/Kids Footwear': [['sneaker|trainer', 'Sneakers'], ['sandal', 'Sandals'], ['boot', 'Boots'], ['baby|infant', 'Baby Shoes'], ['', 'Kids Shoes']],
  'Home & Living/Decor': [['vase', 'Vase'], ['frame|picture|art|painting|poster', 'Wall Art Frame'], ['mirror', 'Mirror'], ['clock', 'Wall Clock'], ['sculpture|statue|figurine|ornament', 'Showpiece'], ['', 'Decor Accent']],
  'Home & Living/Bedsheets': [['blanket|throw|duvet|comforter|quilt', 'Comforter'], ['', 'Bedsheet Set']],
  'Home & Living/Candles': [['jar|glass', 'Jar Candle'], ['tealight|tea light', 'Tealight Set'], ['pillar', 'Pillar Candle'], ['', 'Scented Candle']],
  'Home & Living/Cushions & Pillows': [['cushion', 'Cushion'], ['', 'Throw Pillow']],
  'Home & Living/Bags & Pouches': [['backpack', 'Backpack'], ['tote', 'Tote Bag'], ['pouch|clutch', 'Pouch'], ['duffel|duffle|travel', 'Duffle Bag'], ['', 'Canvas Bag']],
  'Home & Living/Kitchen Accessories': [['knife|knives', 'Knife Set'], ['pan|skillet|wok', 'Frying Pan'], ['pot|cookware|saucepan|kettle', 'Cookware'], ['board|chopping|cutting', 'Chopping Board'], ['spoon|spatula|ladle|utensil|whisk|fork', 'Utensil Set'], ['jar|container', 'Storage Jar'], ['', 'Kitchen Tool Set']],
  'Home & Living/Lamps & Lighting': [['pendant|hanging|ceiling|chandelier', 'Pendant Light'], ['floor', 'Floor Lamp'], ['string|fairy', 'String Lights'], ['bulb', 'Filament Bulb'], ['', 'Table Lamp']],
  'Home & Living/Mugs & Drinkware': [['teacup|tea cup|saucer', 'Tea Cup'], ['glass', 'Glass Tumbler'], ['bottle', 'Bottle'], ['', 'Coffee Mug']],
  'Home & Living/Plants & Planters': [['succulent|cactus', 'Succulent with Pot'], ['hanging', 'Hanging Planter'], ['', 'Indoor Plant with Planter']],
  'Electronics/Mobile Covers': [['clear|transparent', 'Clear Phone Case'], ['leather', 'Leather Phone Case'], ['', 'Phone Case']],
  'Electronics/Chargers & Cables': [['wireless|pad', 'Wireless Charger'], ['adapter|plug|brick|wall', 'Fast Charger'], ['', 'Charging Cable']],
  'Electronics/Earphones': [['wired|cable|cord', 'Wired Earphones'], ['', 'Wireless Earbuds']],
  'Electronics/Headphones': [['gaming|headset|mic', 'Gaming Headset'], ['', 'Wireless Headphones']],
  'Electronics/Smartwatches': [['fitness|band|tracker', 'Fitness Tracker'], ['', 'Smartwatch']],
  'Electronics/Computer Accessories': [['keyboard', 'Mechanical Keyboard'], ['mouse', 'Wireless Mouse'], ['webcam|camera', 'HD Webcam'], ['stand', 'Laptop Stand'], ['hub|dock', 'USB-C Hub'], ['', 'Desk Accessory']],
  'Electronics/Speakers': [['smart|echo|alexa|google', 'Smart Speaker'], ['soundbar', 'Soundbar'], ['', 'Bluetooth Speaker']],
  'Beauty/Makeup': [['lipstick|lip', 'Lipstick'], ['brush', 'Makeup Brush Set'], ['palette|eyeshadow|eye shadow', 'Eyeshadow Palette'], ['mascara', 'Mascara'], ['nail', 'Nail Polish'], ['foundation|powder|compact', 'Foundation'], ['', 'Makeup Kit']],
  'Beauty/Skincare': [['serum|dropper', 'Face Serum'], ['cream|jar|moisturi', 'Moisturiser'], ['soap|bar', 'Soap Bar'], ['tube', 'Face Wash'], ['', 'Skincare Set']],
  'Beauty/Fragrances': [['set|two|three|several|bottles', 'Perfume Gift Set'], ['', 'Eau de Parfum']],
  'Beauty/Haircare': [['brush|comb', 'Hair Brush'], ['dryer', 'Hair Dryer'], ['oil', 'Hair Oil'], ['shampoo|bottle', 'Shampoo'], ['', 'Hair Care Kit']],
  'Sports/Yoga & Mats': [['block', 'Yoga Block'], ['', 'Yoga Mat']],
  'Sports/Gym Equipment': [['kettlebell', 'Kettlebell'], ['band|resistance', 'Resistance Bands'], ['barbell|plate', 'Weight Plates'], ['rope', 'Skipping Rope'], ['', 'Dumbbell Set']],
  'Sports/Bottles & Shakers': [['shaker', 'Protein Shaker'], ['flask|thermos|insulated|steel|metal', 'Insulated Bottle'], ['', 'Water Bottle']],
  'Sports/Rackets & Balls': [['tennis ball', 'Tennis Balls'], ['badminton|shuttle', 'Badminton Racket'], ['racket|racquet|tennis', 'Tennis Racket'], ['basketball', 'Basketball'], ['football|soccer', 'Football'], ['volleyball', 'Volleyball'], ['cricket', 'Cricket Bat'], ['golf', 'Golf Balls'], ['', 'Sports Ball']],
};

// Colour words in a description -> catalog colour names (first match in the text wins)
const COLOR_WORDS = [
  ['rose gold', 'Gold'], ['gold', 'Gold'], ['silver', 'Silver'], ['black', 'Black'], ['white', 'White'],
  ['grey', 'Grey'], ['gray', 'Grey'], ['navy', 'Navy'], ['blue', 'Blue'], ['maroon', 'Maroon'],
  ['burgundy', 'Maroon'], ['red', 'Red'], ['pink', 'Pink'], ['purple', 'Purple'], ['violet', 'Purple'],
  ['olive', 'Olive'], ['green', 'Green'], ['yellow', 'Yellow'], ['orange', 'Orange'], ['brown', 'Brown'],
  ['tan', 'Brown'], ['beige', 'Beige'], ['cream', 'Beige'], ['khaki', 'Beige'], ['teal', 'Teal'], ['turquoise', 'Teal'],
];

// Patterns are matched from the start of a word: new RegExp(`\\b(?:${pattern})`, 'i')
const matchType = (key, text) => {
  const rules = TYPE_RULES[key];
  const idx = rules.findIndex(([pattern]) => !pattern || new RegExp(`\\b(?:${pattern})`, 'i').test(text));
  return idx === -1 ? rules.length - 1 : idx;
};

// One-letter codes used in catalog-meta.txt
const COLOR_CODES = {
  K: 'Black', W: 'White', G: 'Grey', N: 'Navy', B: 'Blue', R: 'Red', M: 'Maroon', P: 'Pink', U: 'Purple',
  E: 'Green', O: 'Olive', Y: 'Yellow', A: 'Orange', X: 'Brown', Z: 'Beige', T: 'Teal', D: 'Gold', S: 'Silver',
};

module.exports = { TYPE_RULES, COLOR_WORDS, COLOR_CODES, matchType };
