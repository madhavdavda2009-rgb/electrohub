const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { TYPE_RULES, COLOR_CODES } = require('./data/typeRules');

// ---------------------------------------------------------------------------
// Catalog definition. Photos (and each photo's main colour) come from
// data/catalog-images.txt: one line per "Category/Subcategory", 24 Unsplash photos each.
// ---------------------------------------------------------------------------

const APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const WAIST = ['28', '30', '32', '34', '36', '38'];
const MEN_SHOES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
const WOMEN_SHOES = ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'];
const KIDS_WEAR = ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'];
const KIDS_SHOES = ['UK 10C', 'UK 11C', 'UK 12C', 'UK 13C', 'UK 1', 'UK 2'];
const PHONES = ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'Galaxy S24', 'OnePlus 12', 'Pixel 8'];
const FREE = [];

const CATALOG = {
  Men: {
    gender: 'Men',
    subs: {
      'T-Shirts': { brands: ['Roadster', 'H&M', 'Puma', 'Nike', 'HRX', 'Bewakoof', 'U.S. Polo Assn.', 'Levis'], styles: ['Oversized', 'Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Muscle Fit'], types: ['Crew Neck T-Shirt', 'Polo T-Shirt', 'Graphic Print T-Shirt', 'Henley T-Shirt', 'V-Neck T-Shirt', 'Striped T-Shirt'], materials: ['Pure Cotton', 'Cotton Blend', 'Organic Cotton', 'Dri-FIT'], price: [399, 1999], sizes: APPAREL, about: 'Soft, breathable and easy to style with jeans, chinos or joggers.' },
      Shirts: { brands: ['Allen Solly', 'Louis Philippe', 'Van Heusen', 'Peter England', 'H&M', 'Roadster', 'Levis', 'Arrow'], styles: ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit'], types: ['Casual Shirt', 'Formal Shirt', 'Checked Shirt', 'Oxford Shirt', 'Linen Shirt', 'Denim Shirt', 'Printed Shirt'], materials: ['Pure Cotton', 'Linen Blend', 'Cotton Twill', 'Poplin'], price: [699, 2999], sizes: APPAREL, about: 'A smart button-down that moves from office hours to weekend plans.' },
      Jeans: { brands: ['Levis', 'Wrangler', 'Lee', 'Pepe Jeans', 'Roadster', 'Jack & Jones', 'Spykar', 'H&M'], styles: ['Slim Fit', 'Skinny Fit', 'Straight Fit', 'Tapered Fit', 'Relaxed Fit', 'Bootcut'], types: ['Stretchable Jeans', 'Mid-Rise Jeans', 'Distressed Jeans', 'Clean Look Jeans', 'Light Fade Jeans'], materials: ['Stretch Denim', 'Rigid Denim', 'Cotton Denim'], price: [999, 3999], sizes: WAIST, about: 'Everyday denim with a comfortable stretch and a fit that holds its shape.' },
      'Formal Wear': { brands: ['Raymond', 'Louis Philippe', 'Van Heusen', 'Blackberrys', 'Arrow', 'Park Avenue', 'Allen Solly'], styles: ['Slim Fit', 'Regular Fit', 'Tailored Fit'], types: ['Two-Piece Suit', 'Three-Piece Suit', 'Single-Breasted Blazer', 'Double-Breasted Blazer', 'Formal Trousers', 'Tuxedo'], materials: ['Wool Blend', 'Poly Viscose', 'Linen Blend', 'Terry Rayon'], price: [1999, 14999], sizes: APPAREL, about: 'Sharp tailoring for weddings, interviews and big meetings.' },
      Kurtas: { brands: ['Manyavar', 'Fabindia', 'Sojanya', 'Jompers', 'House of Pataudi', 'Anouk', 'Vastramay'], styles: ['Straight', 'A-Line', 'Short', 'Pathani', 'Mandarin Collar'], types: ['Kurta', 'Kurta Pyjama Set', 'Nehru Jacket Set', 'Sherwani', 'Embroidered Kurta'], materials: ['Pure Cotton', 'Silk Blend', 'Linen', 'Chanderi', 'Jacquard'], price: [799, 7999], sizes: APPAREL, about: 'Festive-ready ethnic wear with fine detailing and a comfortable fit.' },
      Jackets: { brands: ['Roadster', 'Puma', 'Nike', 'Adidas', 'Levis', 'Wildcraft', 'The North Face', 'H&M'], styles: ['Slim Fit', 'Regular Fit', 'Oversized', 'Cropped'], types: ['Bomber Jacket', 'Denim Jacket', 'Biker Jacket', 'Puffer Jacket', 'Windcheater', 'Hooded Jacket'], materials: ['Faux Leather', 'Denim', 'Nylon', 'Polyester', 'Suede'], price: [1499, 7999], sizes: APPAREL, about: 'A layer-up essential with a wind-resistant shell and roomy pockets.' },
      Sneakers: { brands: ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Skechers', 'ASICS', 'Red Tape'], styles: ['Low-Top', 'Mid-Top', 'Chunky', 'Minimal', 'Retro'], types: ['Sneakers', 'Running Shoes', 'Court Sneakers', 'Training Shoes', 'Slip-On Sneakers'], materials: ['Leather', 'Mesh', 'Knit', 'Suede', 'Canvas'], price: [1499, 9999], sizes: MEN_SHOES, about: 'Cushioned midsole and grippy outsole for all-day comfort.' },
      'Formal Shoes': { brands: ['Clarks', 'Bata', 'Red Tape', 'Hush Puppies', 'Louis Philippe', 'Woodland', 'Allen Solly'], styles: ['Classic', 'Handcrafted', 'Polished', 'Lace-Up', 'Slip-On'], types: ['Oxford Shoes', 'Derby Shoes', 'Brogues', 'Loafers', 'Monk Straps', 'Chelsea Boots'], materials: ['Genuine Leather', 'Patent Leather', 'Suede', 'Nubuck'], price: [1999, 7999], sizes: MEN_SHOES, about: 'Refined leather shoes with a cushioned footbed for long days.' },
      Watches: { brands: ['Titan', 'Fossil', 'Casio', 'Timex', 'Tommy Hilfiger', 'Seiko', 'Daniel Wellington', 'Fastrack'], styles: ['Analogue', 'Chronograph', 'Automatic', 'Minimalist', 'Dive-Style'], types: ['Watch', 'Chronograph Watch', 'Dress Watch', 'Field Watch', 'Multifunction Watch'], materials: ['Stainless Steel', 'Leather Strap', 'Mesh Strap', 'Silicone Strap'], price: [1499, 24999], sizes: FREE, about: 'Precise quartz movement, scratch-resistant glass and 50m water resistance.' },
      Sunglasses: { brands: ['Ray-Ban', 'Oakley', 'Fastrack', 'Vincent Chase', 'Carrera', 'IDEE', 'Polaroid'], styles: ['Aviator', 'Wayfarer', 'Round', 'Square', 'Sports', 'Clubmaster'], types: ['Sunglasses', 'Polarised Sunglasses', 'UV-Protected Sunglasses'], materials: ['Metal Frame', 'Acetate Frame', 'TR90 Frame'], price: [699, 8999], sizes: FREE, about: '100% UV400 protection with lightweight, durable frames.' },
      'Belts & Wallets': { brands: ['Tommy Hilfiger', 'WildHorn', 'Woodland', 'Allen Solly', 'Hidesign', 'Levis', 'Fossil'], styles: ['Classic', 'Slim', 'Textured', 'Reversible', 'RFID-Protected'], types: ['Bi-Fold Wallet', 'Card Holder', 'Leather Belt', 'Formal Belt', 'Casual Belt', 'Tri-Fold Wallet'], materials: ['Genuine Leather', 'Vegan Leather', 'Crocodile-Texture Leather'], price: [399, 2999], sizes: FREE, about: 'Hand-finished leather accessories that age beautifully.' },
    },
  },
  Women: {
    gender: 'Women',
    subs: {
      Kurtis: { brands: ['Biba', 'W', 'Aurelia', 'Libas', 'Anouk', 'Global Desi', 'Sangria', 'Fabindia'], styles: ['Straight', 'A-Line', 'Anarkali', 'Flared', 'Angrakha', 'Kaftan'], types: ['Kurti', 'Kurta with Palazzos', 'Kurta Set with Dupatta', 'Printed Kurti', 'Embroidered Kurti', 'Tunic'], materials: ['Pure Cotton', 'Rayon', 'Chanderi Silk', 'Georgette', 'Viscose'], price: [499, 4499], sizes: APPAREL, about: 'Graceful everyday ethnic wear with thoughtful prints and a flattering fall.' },
      Jeans: { brands: ['Levis', 'Only', 'Vero Moda', 'Roadster', 'H&M', 'Pepe Jeans', 'Lee', 'Mango'], styles: ['Skinny Fit', 'Mom Fit', 'Wide Leg', 'Bootcut', 'Straight Fit', 'Flared', 'Boyfriend Fit', 'Barrel Leg'], types: ['High-Rise Jeans', 'Mid-Rise Jeans', 'Stretchable Jeans', 'Distressed Jeans', 'Cropped Jeans'], materials: ['Stretch Denim', 'Rigid Denim', 'Cotton Denim'], price: [899, 3499], sizes: WAIST, about: 'Figure-flattering denim in the season’s most-wanted fits.' },
      Tops: { brands: ['H&M', 'Zara', 'Only', 'Vero Moda', 'Mango', 'Forever 21', 'SASSAFRAS', 'Tokyo Talkies'], styles: ['Fitted', 'Oversized', 'Cropped', 'Peplum', 'Wrap', 'Puff Sleeve'], types: ['Top', 'Blouse', 'Crop Top', 'Shirt', 'Tank Top', 'Bodysuit', 'Knit Top'], materials: ['Cotton', 'Satin', 'Georgette', 'Crepe', 'Ribbed Knit'], price: [349, 1999], sizes: APPAREL, about: 'An easy-to-style top that pairs with jeans, skirts and trousers.' },
      Dresses: { brands: ['Zara', 'H&M', 'Mango', 'Berrylush', 'SASSAFRAS', 'Label Ritu Kumar', 'Only', 'AND'], styles: ['A-Line', 'Bodycon', 'Maxi', 'Midi', 'Wrap', 'Fit & Flare', 'Slip'], types: ['Dress', 'Floral Dress', 'Party Dress', 'Shirt Dress', 'Evening Gown', 'Sundress'], materials: ['Georgette', 'Satin', 'Crepe', 'Cotton', 'Chiffon', 'Linen'], price: [799, 5999], sizes: APPAREL, about: 'Effortless silhouettes for brunches, date nights and everything between.' },
      Sarees: { brands: ['Sabyasachi Edit', 'Kalini', 'Mitera', 'Saree Mall', 'Kanjivaram House', 'Banarasi Weaves', 'Ishin'], styles: ['Banarasi', 'Kanjivaram', 'Chiffon', 'Organza', 'Bandhani', 'Chanderi', 'Paithani'], types: ['Saree', 'Silk Saree', 'Woven Saree', 'Zari Saree', 'Embellished Saree'], materials: ['Pure Silk', 'Art Silk', 'Georgette', 'Cotton Silk', 'Organza'], price: [999, 14999], sizes: FREE, about: 'Comes with an unstitched blouse piece; handcrafted by artisan weavers.' },
      Handbags: { brands: ['Caprese', 'Lavie', 'Hidesign', 'Baggit', 'Accessorize', 'Guess', 'Michael Kors', 'Charles & Keith'], styles: ['Structured', 'Quilted', 'Mini', 'Oversized', 'Textured', 'Chain-Strap'], types: ['Tote Bag', 'Sling Bag', 'Shoulder Bag', 'Satchel', 'Clutch', 'Hobo Bag'], materials: ['Vegan Leather', 'Genuine Leather', 'Canvas', 'Suede'], price: [999, 12999], sizes: FREE, about: 'Roomy compartments, a secure zip and hardware that won’t tarnish.' },
      'Heels & Flats': { brands: ['Metro', 'Mochi', 'Catwalk', 'Inc.5', 'Bata', 'Steve Madden', 'Aldo', 'Charles & Keith'], styles: ['Block Heel', 'Stiletto', 'Kitten Heel', 'Wedge', 'Platform', 'Flat'], types: ['Sandals', 'Pumps', 'Mules', 'Ballerinas', 'Slingbacks', 'Kolhapuris'], materials: ['Vegan Leather', 'Satin', 'Suede', 'Patent'], price: [799, 5999], sizes: WOMEN_SHOES, about: 'Padded insoles and a secure fit so you can dance all night.' },
      Jewellery: { brands: ['Tanishq Mia', 'Zaveri Pearls', 'Giva', 'Accessorize', 'Voylla', 'Pipa Bella', 'Swarovski', 'Caratlane'], styles: ['Gold-Plated', 'Silver', 'Kundan', 'Pearl', 'Oxidised', 'Rose Gold', 'Diamond-Look'], types: ['Necklace Set', 'Jhumkas', 'Stud Earrings', 'Hoop Earrings', 'Bracelet', 'Ring', 'Pendant Necklace', 'Anklet'], materials: ['925 Sterling Silver', 'Brass', 'Alloy', '18K Gold Plating'], price: [299, 9999], sizes: FREE, about: 'Skin-friendly, nickel-free and gift-ready in a signature box.' },
      Watches: { brands: ['Titan Raga', 'Fossil', 'Daniel Wellington', 'Michael Kors', 'Casio', 'Anne Klein', 'Guess', 'Fastrack'], styles: ['Analogue', 'Minimalist', 'Bracelet', 'Crystal-Studded', 'Mesh'], types: ['Watch', 'Dress Watch', 'Bracelet Watch', 'Chronograph Watch'], materials: ['Rose Gold-Tone', 'Stainless Steel', 'Leather Strap', 'Ceramic'], price: [1499, 19999], sizes: FREE, about: 'Elegant dial, precise quartz movement and a strap made to last.' },
      Sunglasses: { brands: ['Ray-Ban', 'Vincent Chase', 'Fastrack', 'Carrera', 'Gucci', 'Prada', 'IDEE'], styles: ['Cat-Eye', 'Oversized', 'Butterfly', 'Round', 'Square', 'Rimless'], types: ['Sunglasses', 'Polarised Sunglasses', 'Gradient Sunglasses'], materials: ['Acetate Frame', 'Metal Frame', 'TR90 Frame'], price: [599, 7999], sizes: FREE, about: 'Full UV400 protection with a statement silhouette.' },
      Activewear: { brands: ['Nike', 'Adidas', 'Puma', 'HRX', 'Reebok', 'Under Armour', 'Decathlon Kalenji', 'Lululemon'], styles: ['High-Waist', 'Seamless', 'Compression', 'Relaxed', 'Racerback'], types: ['Tights', 'Sports Bra', 'Track Pants', 'Training T-Shirt', 'Yoga Set', 'Running Shorts'], materials: ['Dri-FIT', 'Spandex Blend', 'Quick-Dry Polyester', 'Recycled Nylon'], price: [499, 3499], sizes: APPAREL, about: 'Sweat-wicking, four-way stretch fabric that moves with you.' },
    },
  },
  Kids: {
    gender: 'Kids',
    subs: {
      'Boys Wear': { brands: ['H&M Kids', 'Allen Solly Junior', 'UCB Kids', 'Gini & Jony', 'Babyhug', 'Marks & Spencer', 'Max Kids'], styles: ['Printed', 'Solid', 'Striped', 'Colourblocked', 'Graphic'], types: ['T-Shirt', 'Shirt & Shorts Set', 'Joggers', 'Hoodie', 'Denim Jacket', 'Kurta Set', 'Dungarees'], materials: ['Pure Cotton', 'Organic Cotton', 'Fleece', 'Denim'], price: [299, 1999], sizes: KIDS_WEAR, about: 'Tag-free, skin-friendly fabric built for play.' },
      'Girls Wear': { brands: ['H&M Kids', 'Hopscotch', 'UCB Kids', 'Gini & Jony', 'Babyhug', 'Cherry Crumble', 'Max Kids'], styles: ['Floral', 'Tiered', 'Printed', 'Smocked', 'Embroidered'], types: ['Dress', 'Frock', 'Top & Skirt Set', 'Leggings', 'Lehenga Choli', 'Jumpsuit', 'Party Dress'], materials: ['Pure Cotton', 'Organic Cotton', 'Tulle', 'Rayon'], price: [299, 2499], sizes: KIDS_WEAR, about: 'Twirl-worthy styles in soft, breathable fabric.' },
      Toys: { brands: ['LEGO', 'Hot Wheels', 'Funskool', 'Fisher-Price', 'Barbie', 'Hasbro', 'Mattel', 'Skillmatics'], styles: ['Educational', 'Wooden', 'Classic', 'STEM', 'Plush', 'Remote-Control'], types: ['Building Set', 'Toy Car', 'Board Game', 'Soft Toy', 'Puzzle', 'Action Figure', 'Doll Set', 'Activity Kit'], materials: ['BPA-Free Plastic', 'Sustainable Wood', 'Soft Fabric'], price: [199, 4999], sizes: FREE, about: 'Safety-tested, non-toxic and designed to spark imagination.' },
      'Kids Footwear': { brands: ['Nike Kids', 'Adidas Kids', 'Crocs', 'Bata Kids', 'Skechers Kids', 'Puma Kids', 'Hopscotch'], styles: ['Light-Up', 'Velcro', 'Slip-On', 'Lace-Up', 'Cushioned'], types: ['Sneakers', 'Sandals', 'School Shoes', 'Clogs', 'Boots', 'Sports Shoes'], materials: ['Mesh', 'Synthetic Leather', 'Canvas', 'EVA'], price: [499, 2999], sizes: KIDS_SHOES, about: 'Flexible soles and easy fastening for little feet on the move.' },
    },
  },
  'Home & Living': {
    gender: 'Unisex',
    subs: {
      Decor: { brands: ['Home Centre', 'Chumbak', 'Ellementry', 'Nestasia', 'The Decor Kart', 'IKEA', 'Pure Home + Living'], styles: ['Ceramic', 'Handcrafted', 'Minimal', 'Boho', 'Vintage', 'Nordic'], types: ['Vase', 'Wall Art', 'Photo Frame', 'Table Showpiece', 'Wall Mirror', 'Decorative Tray', 'Bookends'], materials: ['Ceramic', 'Metal', 'Mango Wood', 'Glass', 'Resin'], price: [299, 4999], sizes: FREE, about: 'A statement accent that brings warmth and character to any room.' },
      Bedsheets: { brands: ['Bombay Dyeing', 'Spaces', 'D’Decor', 'Raymond Home', 'Portico', 'Story@Home', 'Welspun'], styles: ['Solid', 'Floral', 'Striped', 'Geometric', 'Ikat', 'Jaipuri'], types: ['Double Bedsheet Set', 'King Bedsheet Set', 'Fitted Sheet', 'Duvet Cover', 'Comforter', 'Dohar'], materials: ['300 TC Cotton', '400 TC Sateen', 'Organic Cotton', 'Microfibre', 'Linen'], price: [699, 4999], sizes: ['Single', 'Double', 'Queen', 'King'], about: 'Includes pillow covers; soft, breathable and fade-resistant.' },
      Candles: { brands: ['Iris', 'Bath & Body Works', 'The Man Company', 'Pure Source', 'Nestasia', 'Bella Vita', 'Home Centre'], styles: ['Scented', 'Soy Wax', 'Pillar', 'Jar', 'Tealight', 'Aromatherapy'], types: ['Candle', 'Candle Set', 'Votive Candle', 'Diffuser & Candle Gift Set'], materials: ['Soy Wax', 'Beeswax', 'Paraffin-Free Wax'], price: [199, 1999], sizes: FREE, about: 'Clean-burning wax with notes of vanilla, sandalwood and jasmine.' },
      'Cushions & Pillows': { brands: ['Home Centre', 'Spaces', 'Chumbak', 'IKEA', 'Story@Home', 'The Sleep Company', 'Swayam'], styles: ['Solid', 'Textured', 'Printed', 'Boho', 'Velvet', 'Embroidered'], types: ['Cushion Cover Set', 'Throw Pillow', 'Sleeping Pillow', 'Memory Foam Pillow', 'Floor Cushion'], materials: ['Cotton', 'Velvet', 'Jute Blend', 'Memory Foam', 'Microfibre'], price: [299, 2499], sizes: FREE, about: 'Plush, supportive and easy to care for.' },
      'Bags & Pouches': { brands: ['Wildcraft', 'Chumbak', 'Baggit', 'Skybags', 'American Tourister', 'Nestasia', 'Zouk'], styles: ['Printed', 'Quilted', 'Minimal', 'Handwoven', 'Water-Resistant'], types: ['Tote Bag', 'Laptop Backpack', 'Travel Pouch', 'Toiletry Kit', 'Duffle Bag', 'Makeup Pouch', 'Jute Shopping Bag'], materials: ['Canvas', 'Jute', 'Polyester', 'Vegan Leather', 'Recycled Fabric'], price: [299, 3499], sizes: FREE, about: 'Smart compartments and sturdy zips for everyday carry and travel.' },
      'Kitchen Accessories': { brands: ['Prestige', 'Borosil', 'Milton', 'Wonderchef', 'Pigeon', 'Hawkins', 'Tupperware'], styles: ['Non-Stick', 'Stainless Steel', 'Bamboo', 'Silicone', 'Cast Iron'], types: ['Cookware Set', 'Frying Pan', 'Knife Set', 'Chopping Board', 'Utensil Set', 'Storage Containers', 'Spice Rack'], materials: ['Stainless Steel', 'Hard Anodised Aluminium', 'Bamboo', 'Food-Grade Silicone'], price: [199, 4999], sizes: FREE, about: 'Food-safe, dishwasher-friendly essentials for a better kitchen.' },
      'Lamps & Lighting': { brands: ['Philips', 'Wipro', 'Home Centre', 'IKEA', 'Syska', 'Ellementry', 'Nestasia'], styles: ['Modern', 'Rattan', 'Industrial', 'Ceramic', 'Smart', 'Vintage'], types: ['Table Lamp', 'Floor Lamp', 'Pendant Light', 'Study Lamp', 'Fairy Lights', 'Wall Sconce'], materials: ['Metal', 'Rattan', 'Ceramic', 'Glass', 'Wood'], price: [499, 6999], sizes: FREE, about: 'Warm, glare-free light that sets the mood; bulb included.' },
      'Mugs & Drinkware': { brands: ['Chumbak', 'Borosil', 'Milton', 'Nestasia', 'Ellementry', 'Cello', 'Home Centre'], styles: ['Ceramic', 'Hand-Painted', 'Double-Walled', 'Insulated', 'Stoneware', 'Glass'], types: ['Coffee Mug', 'Mug Set', 'Tumbler', 'Tea Cup Set', 'Glass Set', 'Travel Mug'], materials: ['Ceramic', 'Borosilicate Glass', 'Stainless Steel', 'Stoneware'], price: [199, 1999], sizes: FREE, about: 'Microwave-safe and lovely to hold, from the first sip to the last.' },
      'Plants & Planters': { brands: ['Ugaoo', 'Nurturing Green', 'Chumbak', 'Trust Basket', 'Ellementry', 'Home Centre'], styles: ['Ceramic', 'Self-Watering', 'Hanging', 'Terracotta', 'Metal', 'Concrete'], types: ['Planter', 'Plant with Pot', 'Succulent Set', 'Hanging Planter', 'Planter Stand', 'Money Plant'], materials: ['Ceramic', 'Terracotta', 'Metal', 'Recycled Plastic'], price: [299, 2999], sizes: FREE, about: 'Bring the outdoors in; drainage hole and saucer included.' },
    },
  },
  Electronics: {
    gender: 'Unisex',
    subs: {
      'Mobile Covers': { brands: ['Spigen', 'Casetify', 'OtterBox', 'Ringke', 'DailyObjects', 'Apple', 'Nillkin'], styles: ['Clear', 'Rugged', 'Silicone', 'Leather', 'MagSafe', 'Printed'], types: ['Phone Case', 'Back Cover', 'Flip Cover', 'Wallet Case'], materials: ['TPU', 'Polycarbonate', 'Liquid Silicone', 'Vegan Leather'], price: [199, 2499], sizes: PHONES, about: 'Raised edges protect the screen and camera; drop-tested to 2 metres.' },
      'Chargers & Cables': { brands: ['Anker', 'Belkin', 'Samsung', 'Apple', 'Portronics', 'boAt', 'Ambrane'], styles: ['Fast', 'Braided', 'GaN', 'Dual-Port', 'Wireless', '65W'], types: ['USB-C Charger', 'Charging Cable', 'Wireless Charger', 'Car Charger', 'Multi-Port Adapter', 'Charging Dock'], materials: ['Nylon Braided', 'PD 3.0', 'Qi-Certified'], price: [299, 3999], sizes: FREE, about: 'Smart chip protection against overheating and overcharging.' },
      Earphones: { brands: ['boAt', 'JBL', 'Sony', 'Apple', 'Samsung', 'OnePlus', 'Noise', 'Nothing'], styles: ['True Wireless', 'Noise-Cancelling', 'Neckband', 'Open-Ear', 'Gaming'], types: ['Earbuds', 'Earphones', 'In-Ear Headphones'], materials: ['ANC', 'IPX5 Water-Resistant', 'Bluetooth 5.3'], price: [799, 24999], sizes: FREE, about: 'Deep bass, crisp calls with ENC mics and up to 40 hours of playback.' },
      Headphones: { brands: ['Sony', 'Bose', 'JBL', 'Sennheiser', 'boAt', 'Marshall', 'Skullcandy', 'Apple'], styles: ['Over-Ear', 'On-Ear', 'Noise-Cancelling', 'Studio', 'Gaming', 'Foldable'], types: ['Wireless Headphones', 'Bluetooth Headphones', 'Headset'], materials: ['Active Noise Cancellation', 'Hi-Res Audio', 'Memory Foam Cushions'], price: [1499, 34999], sizes: FREE, about: 'Immersive sound, plush ear cushions and all-day battery life.' },
      Smartwatches: { brands: ['Apple', 'Samsung', 'Noise', 'boAt', 'Fire-Boltt', 'Amazfit', 'Garmin', 'Fitbit'], styles: ['AMOLED', 'Rugged', 'Round-Dial', 'Slim', 'GPS'], types: ['Smartwatch', 'Fitness Tracker', 'Bluetooth Calling Smartwatch'], materials: ['Aluminium Case', 'Stainless Steel Case', 'Silicone Strap'], price: [1999, 44999], sizes: FREE, about: 'Heart-rate, SpO2 and sleep tracking with 100+ sports modes.' },
      'Computer Accessories': { brands: ['Logitech', 'Razer', 'HP', 'Dell', 'Keychron', 'Zebronics', 'Portronics', 'Lenovo'], styles: [], types: [], materials: [], price: [399, 12999], sizes: FREE, about: 'Plug-and-play setup with a sturdy build made for long work and gaming sessions.' },
      Speakers: { brands: ['JBL', 'Sony', 'Marshall', 'boAt', 'Bose', 'Ultimate Ears', 'Amazon Echo'], styles: ['Portable', 'Waterproof', 'Party', 'Smart', 'Mini', 'Retro'], types: ['Bluetooth Speaker', 'Smart Speaker', 'Soundbar', 'Party Speaker'], materials: ['IPX7', 'Bluetooth 5.3', 'Dolby Audio'], price: [999, 24999], sizes: FREE, about: 'Room-filling 360° sound with punchy bass and long battery life.' },
    },
  },
  Beauty: {
    gender: 'Unisex',
    subs: {
      Makeup: { brands: ['MAC', 'Maybelline', 'Lakme', 'Huda Beauty', 'Nykaa Cosmetics', 'Sugar', 'L’Oreal', 'Swiss Beauty'], styles: ['Matte', 'Long-Wear', 'Satin', 'Shimmer', 'Transfer-Proof', 'Hydrating'], types: ['Lipstick', 'Eyeshadow Palette', 'Foundation', 'Kajal', 'Mascara', 'Makeup Brush Set', 'Compact Powder', 'Blush'], materials: ['Vegan', 'Cruelty-Free', 'Paraben-Free'], price: [199, 3999], sizes: FREE, about: 'Highly pigmented, blendable and made to last all day.' },
      Skincare: { brands: ['Minimalist', 'The Ordinary', 'Cetaphil', 'Plum', 'Mamaearth', 'Neutrogena', 'Clinique', 'Dot & Key'], styles: ['Hydrating', 'Brightening', 'Oil-Free', 'Fragrance-Free', 'Barrier Repair', 'Anti-Ageing'], types: ['Face Serum', 'Moisturiser', 'Sunscreen SPF 50', 'Face Wash', 'Night Cream', 'Toner', 'Face Mask'], materials: ['Niacinamide', 'Hyaluronic Acid', 'Vitamin C', 'Ceramides', 'Retinol'], price: [249, 3499], sizes: FREE, about: 'Dermatologically tested and suitable for all skin types.' },
      Fragrances: { brands: ['Bella Vita', 'Davidoff', 'Calvin Klein', 'Hugo Boss', 'Versace', 'Skinn by Titan', 'The Man Company', 'Chanel'], styles: ['Woody', 'Floral', 'Citrus', 'Oud', 'Fresh', 'Musky'], types: ['Eau de Parfum', 'Eau de Toilette', 'Perfume Gift Set', 'Body Mist', 'Attar'], materials: ['100 ml', '50 ml', 'Long-Lasting'], price: [499, 9999], sizes: FREE, about: 'A signature scent with top, heart and base notes that linger for hours.' },
      Haircare: { brands: ['L’Oreal Paris', 'Dove', 'Tresemme', 'WOW Skin Science', 'Mamaearth', 'Philips', 'Dyson', 'Kama Ayurveda'], styles: ['Sulphate-Free', 'Anti-Frizz', 'Volumising', 'Repairing', 'Ayurvedic'], types: ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Mask', 'Hair Serum', 'Hair Dryer', 'Straightener', 'Detangling Brush'], materials: ['Argan Oil', 'Keratin', 'Onion Oil', 'Biotin'], price: [199, 29999], sizes: FREE, about: 'Nourishes from root to tip for smooth, shiny, healthy hair.' },
    },
  },
  Sports: {
    gender: 'Unisex',
    subs: {
      'Yoga & Mats': { brands: ['Decathlon Domyos', 'Boldfit', 'Lululemon', 'Nivia', 'Strauss', 'Liforme'], styles: ['Anti-Slip', 'Extra-Thick', 'Eco-Friendly', 'Travel', 'Alignment'], types: ['Yoga Mat', 'Yoga Block Set', 'Yoga Strap', 'Yoga Wheel', 'Meditation Cushion'], materials: ['TPE', 'Natural Rubber', 'NBR Foam', 'Cork'], price: [399, 4999], sizes: FREE, about: 'Cushioned support and a grippy surface for every pose.' },
      'Gym Equipment': { brands: ['Kore', 'Boldfit', 'Decathlon Domyos', 'Cockatoo', 'Nivia', 'PowerMax'], styles: ['Adjustable', 'Rubber-Coated', 'Hex', 'Home Gym', 'Heavy-Duty'], types: ['Dumbbell Set', 'Kettlebell', 'Resistance Bands', 'Skipping Rope', 'Ab Roller', 'Push-Up Bars', 'Weight Plates'], materials: ['Cast Iron', 'Neoprene', 'Latex', 'Steel'], price: [299, 9999], sizes: FREE, about: 'Built tough for home workouts, with a secure, comfortable grip.' },
      'Bottles & Shakers': { brands: ['Milton', 'Cello', 'Boldfit', 'Borosil', 'Hydro Flask', 'Nike', 'Decathlon'], styles: ['Insulated', 'Leak-Proof', 'Motivational', 'Stainless Steel', 'BPA-Free'], types: ['Water Bottle', 'Protein Shaker', 'Sipper', 'Flask', 'Gym Bottle'], materials: ['Stainless Steel', 'Tritan', 'Borosilicate Glass', 'BPA-Free Plastic'], price: [249, 2999], sizes: ['500 ml', '750 ml', '1 L'], about: 'Keeps drinks cold for 24 hours and hot for 12.' },
      'Rackets & Balls': { brands: ['Yonex', 'Wilson', 'Nivia', 'Cosco', 'Head', 'Adidas', 'Spalding', 'SG'], styles: ['Pro', 'Training', 'Match', 'Lightweight', 'All-Court'], types: ['Badminton Racket', 'Tennis Racket', 'Football', 'Basketball', 'Cricket Bat', 'Shuttlecock Pack', 'Volleyball'], materials: ['Carbon Graphite', 'Aluminium', 'PU Leather', 'Kashmir Willow'], price: [299, 8999], sizes: FREE, about: 'Match-grade performance and durability for practice and play.' },
    },
  },
};

const REVIEWERS = ['Aarav Mehta', 'Priya Sharma', 'Rohan Iyer', 'Ananya Gupta', 'Vikram Singh', 'Sneha Reddy', 'Kabir Khan', 'Isha Patel', 'Arjun Nair', 'Meera Joshi', 'Aditya Rao', 'Diya Kapoor', 'Nikhil Verma', 'Tara Menon', 'Karan Malhotra', 'Zoya Ali'];

const REVIEW_TEXT = {
  5: ['Absolutely love it! The quality is excellent for the price.', 'Exactly as shown in the pictures. Highly recommend.', 'Superb quality and super fast delivery.', 'Worth every rupee. Will definitely buy again.', 'Premium feel and great finish. Very happy with this purchase.', 'Got so many compliments already!'],
  4: ['Good product and fits well. Packaging could be better.', 'Really nice, colour is slightly different from the photo but I like it.', 'Great value for money. Delivery took a day longer than expected.', 'Comfortable and well made. Would recommend.', 'Very good quality, just wish there were more colour options.'],
  3: ['Decent for the price, nothing extraordinary.', 'Okay product. Quality is average but it does the job.', 'Looks good but the size runs a little small.', 'Average. Expected slightly better finishing.'],
  2: ['Quality was not what I expected from this brand.', 'Colour faded after a few uses. Not great.', 'Material feels cheap for the price.'],
  1: ['Did not like it at all, had to return it.', 'Received a different shade than shown. Disappointed.'],
};

// ---------------------------------------------------------------------------
// Helpers (a seeded random generator keeps the catalog identical on every run)
// ---------------------------------------------------------------------------

let seed = 20260930;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(random() * arr.length)];
const between = (min, max) => min + random() * (max - min);
const chance = (p) => random() < p;
const toPrice = (value) => Math.max(99, Math.round(value / 100) * 100 - 1);
const sqlDate = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().replace('T', ' ').slice(0, 19);
const imageUrl = (id, width = 800) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
// Extra gallery views are zoomed-in crops of the SAME photo, so every image shows this product
const closeUp = (id, zoom, y) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&q=80&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=${y}&fp-z=${zoom}`;

// data/catalog-meta.txt: per photo, a type index (base 36) + colour code, derived from the photo's description
const loadMeta = () => {
  const map = {};
  fs.readFileSync(path.join(__dirname, 'data', 'catalog-meta.txt'), 'utf8').split(/\r?\n/).filter(Boolean).forEach(line => {
    const [key, codes] = line.split('=');
    map[key] = codes.match(/../g).map(pair => ({ type: parseInt(pair[0], 36), color: COLOR_CODES[pair[1]] }));
  });
  return map;
};

const loadImages = () => {
  const file = path.join(__dirname, 'data', 'catalog-images.txt');
  const map = {};
  fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).forEach(line => {
    const [key, list] = line.split('=');
    map[key] = list.split(',').map(entry => {
      const [id, color] = entry.split(':');
      return { id, color };
    });
  });
  return map;
};

const sizeSubset = (sizes) => {
  if (sizes.length <= 3) return sizes;
  // Most products come in most sizes; a few are missing the ends of the range
  const start = chance(0.25) ? 1 : 0;
  const end = sizes.length - (chance(0.25) ? 1 : 0);
  return sizes.slice(start, end);
};

const skewedDiscount = () => {
  const r = random();
  if (r < 0.15) return Math.round(between(5, 15));
  if (r < 0.55) return Math.round(between(15, 40));
  if (r < 0.9) return Math.round(between(40, 60));
  return Math.round(between(60, 75));
};

const generateProducts = (images, meta) => {
  const products = [];
  for (const [category, { gender, subs }] of Object.entries(CATALOG)) {
    for (const [subcategory, spec] of Object.entries(subs)) {
      const photos = images[`${category}/${subcategory}`];
      const key = `${category}/${subcategory}`;
      if (!photos || photos.length < 20) throw new Error(`Not enough photos for ${key}`);
      if (!meta[key] || meta[key].length !== photos.length) throw new Error(`Missing photo details for ${key}`);

      photos.forEach((photo, i) => {
        const brand = spec.brands[i % spec.brands.length];
        // Type and colour come from what is actually in the photo, so the name matches the picture
        const type = TYPE_RULES[key][meta[key][i].type][1];
        const color = meta[key][i].color || photo.color;
        const name = `${brand} ${color} ${type}`;
        const gallery = [imageUrl(photo.id), closeUp(photo.id, 1.6, 0.5), closeUp(photo.id, 2.2, 0.4)];

        const rating = Math.round(between(3.2, 4.9) * 10) / 10;
        const ratingCount = Math.round(Math.exp(between(Math.log(12), Math.log(9000))));
        const stockRoll = random();
        const stock = stockRoll < 0.03 ? 0 : stockRoll < 0.1 ? Math.round(between(1, 5)) : Math.round(between(12, 180));

        products.push({
          name,
          brand,
          description: `${color} ${type.toLowerCase()} by ${brand}. ${spec.about}`,
          category,
          subcategory,
          gender,
          price: toPrice(between(spec.price[0], spec.price[1])),
          discount_percent: skewedDiscount(),
          rating,
          rating_count: ratingCount,
          stock,
          colors: JSON.stringify([color]),
          sizes: JSON.stringify(sizeSubset(spec.sizes)),
          images: JSON.stringify(gallery),
          created_at: sqlDate(between(0, 120)),
        });
      });
    }
  }
  return products;
};

const reviewRating = (productRating) => {
  // Mostly close to the product's average rating
  const r = Math.round(productRating + between(-1.4, 1.1));
  return Math.min(5, Math.max(1, r));
};

// ---------------------------------------------------------------------------

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    db.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM addresses;
      DELETE FROM wishlist_items;
      DELETE FROM cart_items;
      DELETE FROM reviews;
      DELETE FROM coupons;
      DELETE FROM offers;
      DELETE FROM products;
      DELETE FROM users;
      UPDATE sqlite_sequence SET seq = 0;
    `);

    // 1. Users: the demo account plus a few reviewers (their passwords are random and unusable)
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, phone, gender) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('Demo User', 'demo@stylehub.com', await bcrypt.hash('Demo@123', 10), '9876543210', 'Unisex');
    const insertAdmin = db.prepare("INSERT INTO users (name, email, password_hash, phone, gender, role) VALUES (?, ?, ?, ?, ?, 'admin')");
    insertAdmin.run('Store Admin', 'admin@stylehub.com', await bcrypt.hash('Admin@123', 10), null, null);
    const reviewerHash = await bcrypt.hash(`${Date.now()}-${Math.random()}`, 4);
    const reviewerIds = REVIEWERS.map((name, i) =>
      insertUser.run(name, `reviewer${i + 1}@example.com`, reviewerHash, null, null).lastInsertRowid
    );
    console.log(`Seeded demo user and ${reviewerIds.length} reviewers.`);

    // 2. Coupons
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+1 year'))
    `);
    insertCoupon.run('WELCOME10', 'PERCENTAGE', 10, 500);
    insertCoupon.run('FLAT200', 'FLAT', 200, 1000);
    insertCoupon.run('STYLE20', 'PERCENTAGE', 20, 1500);
    insertCoupon.run('GADGET15', 'PERCENTAGE', 15, 2000);
    insertCoupon.run('MEGA500', 'FLAT', 500, 3999);
    console.log('Coupons seeded.');

    // Home page banners and header ticker (editable from the admin panel)
    const insertOffer = db.prepare('INSERT INTO offers (title, subtitle, cta_label, link, image, placement, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const u = (id, w) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
    insertOffer.run('The New Season Edit', 'Fresh fits, festive colour and everyday essentials, all in one place.', 'Shop Women', '/products/Women', u('1483985988355-763728e1935b', 1400), 'hero', 1);
    insertOffer.run('Sneaker drop', 'Up to 50% off top brands', 'Shop sneakers', '/products/Men?subcategory=Sneakers', u('1542291026-7eec264c27ff', 900), 'hero', 2);
    insertOffer.run('Sound on', 'Earbuds & headphones', 'Explore', '/products/Electronics', u('1505740420928-5e560c06d30e', 700), 'hero', 3);
    insertOffer.run('Home refresh', 'Decor, candles & more', 'Explore', '/products/Home%20%26%20Living', u('1616486338812-3dadae4b4ace', 700), 'hero', 4);
    [
      'Free delivery on orders above ₹999',
      'Use code WELCOME10 for 10% off your first order',
      'Easy 14-day returns & exchanges',
      'Pay instantly with any UPI app: scan the QR at checkout',
      'New: search with a photo from your camera or gallery',
    ].forEach((text, i) => insertOffer.run(text, null, null, null, null, 'ticker', i + 1));
    console.log('Offers seeded.');

    // 3. Products
    const products = generateProducts(loadImages(), loadMeta());
    const insertProduct = db.prepare(`
      INSERT INTO products
      (name, brand, description, category, subcategory, gender, price, discount_percent, rating, rating_count, stock, colors, sizes, images, created_at)
      VALUES (@name, @brand, @description, @category, @subcategory, @gender, @price, @discount_percent, @rating, @rating_count, @stock, @colors, @sizes, @images, @created_at)
    `);
    const insertReview = db.prepare('INSERT INTO reviews (user_id, product_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)');

    let reviewCount = 0;
    db.transaction(() => {
      for (const p of products) {
        const productId = insertProduct.run(p).lastInsertRowid;
        // About half the products get a handful of written reviews
        if (chance(0.5)) {
          const reviewers = [...reviewerIds].sort(() => random() - 0.5).slice(0, Math.round(between(2, 6)));
          for (const userId of reviewers) {
            const rating = reviewRating(p.rating);
            insertReview.run(userId, productId, rating, pick(REVIEW_TEXT[rating]), sqlDate(between(0, 90)));
            reviewCount++;
          }
        }
      }
    })();

    const perSub = db.prepare('SELECT MIN(c) AS min FROM (SELECT COUNT(*) AS c FROM products GROUP BY category, subcategory)').get();
    console.log(`Seeded ${products.length} products (at least ${perSub.min} per subcategory) and ${reviewCount} reviews.`);
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exitCode = 1;
  }
};

seedDatabase();
