const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const GAME_TYPES = ['trivia', 'wordle', 'ransomnote', 'dingbats', 'wheeloffortune'];
const BOT_NAMES = ['Robo-X', 'Byte', 'Circuit', 'Pixel', 'Glitch', 'Nano', 'Volt', 'Chip', 'Dash', 'Nova'];
const BOT_AVATARS = ['🤖', '👾', '🦾', '⚡', '💡', '🔮', '🎯', '🌀'];

function getBotScore(game) {
  const skill = 0.35 + Math.random() * 0.45;
  switch (game) {
    case 'trivia':         return Math.round(skill * 5);
    case 'wordle':         return Math.round(1 + skill * 6);
    case 'ransomnote':     return Math.round(skill * 8);
    case 'dingbats':       return Math.round(skill * 5);
    case 'wheeloffortune': return Math.round(skill * 10);
    default:               return Math.round(skill * 100);
  }
}

// --- Game Data ---
const TRIVIA_QUESTIONS = [
  { q: 'What is the fastest land animal?', a: 'Cheetah', options: ['Lion', 'Cheetah', 'Greyhound', 'Horse'] },
  { q: 'How many sides does a hexagon have?', a: 'Six', options: ['Five', 'Six', 'Seven', 'Eight'] },
  { q: 'Which planet is closest to the Sun?', a: 'Mercury', options: ['Venus', 'Earth', 'Mercury', 'Mars'] },
  { q: 'What language has the most native speakers?', a: 'Mandarin', options: ['English', 'Spanish', 'Mandarin', 'Hindi'] },
  { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Caravaggio'] },
  { q: 'What is the capital of Australia?', a: 'Canberra', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'] },
  { q: 'How many bones are in the adult human body?', a: '206', options: ['196', '206', '215', '230'] },
  { q: 'What element does "Au" represent on the periodic table?', a: 'Gold', options: ['Silver', 'Aluminum', 'Gold', 'Argon'] },
  { q: 'Which ocean is the largest?', a: 'Pacific', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'] },
  { q: 'In what year did World War II end?', a: '1945', options: ['1943', '1944', '1945', '1946'] },
  { q: 'What is the smallest prime number?', a: '2', options: ['0', '1', '2', '3'] },
  { q: 'Which country invented pizza?', a: 'Italy', options: ['France', 'Greece', 'Italy', 'Spain'] },
  { q: 'What is the hardest natural substance on Earth?', a: 'Diamond', options: ['Ruby', 'Diamond', 'Titanium', 'Quartz'] },
  { q: 'How many continents are there?', a: '7', options: ['5', '6', '7', '8'] },
  { q: 'Which animal can sleep standing up?', a: 'Horse', options: ['Cow', 'Horse', 'Elephant', 'Giraffe'] },
  { q: 'What is the longest river in the world?', a: 'Nile', options: ['Amazon', 'Yangtze', 'Nile', 'Mississippi'] },
  { q: 'How many strings does a standard guitar have?', a: '6', options: ['4', '5', '6', '7'] },
  { q: 'What gas do plants absorb from the air?', a: 'Carbon dioxide', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'] },
  { q: 'Which country has the most natural lakes?', a: 'Canada', options: ['Russia', 'USA', 'Canada', 'Finland'] },
  { q: 'What is the square root of 144?', a: '12', options: ['11', '12', '13', '14'] },
  { q: 'Which fruit has seeds on the outside?', a: 'Strawberry', options: ['Raspberry', 'Strawberry', 'Blueberry', 'Kiwi'] },
  { q: 'How many players are on a basketball team on the court?', a: '5', options: ['4', '5', '6', '7'] },
  { q: 'What is the most spoken language in Brazil?', a: 'Portuguese', options: ['Spanish', 'Portuguese', 'English', 'French'] },
  { q: 'Which planet has the most moons?', a: 'Saturn', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'] },
  { q: 'What does DNA stand for?', a: 'Deoxyribonucleic acid', options: ['Digital Network Algorithm', 'Deoxyribonucleic acid', 'Dynamic Nucleic Array', 'Dual Nitrogen Acid'] },
  { q: 'What currency does Japan use?', a: 'Yen', options: ['Won', 'Yuan', 'Yen', 'Ringgit'] },
  { q: 'How many zeroes are in one million?', a: '6', options: ['5', '6', '7', '8'] },
  { q: 'Which sport uses a shuttlecock?', a: 'Badminton', options: ['Tennis', 'Squash', 'Badminton', 'Pickleball'] },
  { q: 'What color is a polar bear\'s skin?', a: 'Black', options: ['White', 'Pink', 'Black', 'Transparent'] },
  { q: 'Who wrote Romeo and Juliet?', a: 'Shakespeare', options: ['Dickens', 'Shakespeare', 'Austen', 'Chaucer'] },
  { q: 'How many hours are in a week?', a: '168', options: ['148', '168', '172', '180'] },
  { q: 'What is the most abundant gas in Earth\'s atmosphere?', a: 'Nitrogen', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'] },
  { q: 'Which country is home to the kangaroo?', a: 'Australia', options: ['New Zealand', 'South Africa', 'Australia', 'Papua New Guinea'] },
  { q: 'What does "www" stand for?', a: 'World Wide Web', options: ['World Wide Web', 'Web World Wide', 'Wide World Web', 'World Web Wide'] },
  { q: 'How many legs does a spider have?', a: '8', options: ['6', '8', '10', '12'] },
];

const WORDLE_WORDS = [
  'BRAVE','CRIMP','FLOSS','GHOST','STING','PLUMB','DWARF','CRAVE','BLUNT','SPOOK',
  'GROAN','SWEPT','CHUNK','FROTH','PLAZA','BLAZE','STOMP','SHRUB','GLINT','PERKY',
  'CRANE','FLASK','TROVE','QUIRK','SCALP','BRAWL','CRYPT','DWELT','FLUNK','GRIPE',
  'HAVOC','JOUST','KNACK','LUSTY','MANGY','NOTCH','OVOID','PLUNK','RISKY','SKUNK',
  'THUMP','VYING','WHIFF','YEARN','ZESTY','ABUZZ','BLIMP','CLEFT','DENIM','EXPEL',
  'FJORD','GLOOM','HIPPO','INEPT','JELLY','KNAVE','LAPEL','MAXIM','NYMPH','OXIDE',
];

const WOF_PHRASES = [
  { phrase: 'PIECE OF CAKE', hint: 'Easy task' },
  { phrase: 'BREAK A LEG', hint: 'Good luck expression' },
  { phrase: 'HIT THE ROAD', hint: 'Time to leave' },
  { phrase: 'UNDER THE WEATHER', hint: 'Feeling sick' },
  { phrase: 'BITE THE BULLET', hint: 'Endure pain' },
  { phrase: 'BURNING THE MIDNIGHT OIL', hint: 'Working late' },
  { phrase: 'SPILL THE BEANS', hint: 'Reveal a secret' },
  { phrase: 'COSTS AN ARM AND A LEG', hint: 'Very expensive' },
  { phrase: 'THE BALL IS IN YOUR COURT', hint: 'Your decision' },
  { phrase: 'BEATING AROUND THE BUSH', hint: 'Avoiding the point' },
  { phrase: 'ONCE IN A BLUE MOON', hint: 'Very rarely' },
  { phrase: 'BITE OFF MORE THAN YOU CAN CHEW', hint: 'Take on too much' },
  { phrase: 'EVERY CLOUD HAS A SILVER LINING', hint: 'Optimistic saying' },
  { phrase: 'KILL TWO BIRDS WITH ONE STONE', hint: 'Two tasks one action' },
  { phrase: 'LET THE CAT OUT OF THE BAG', hint: 'Revealed a secret' },
  { phrase: 'BARKING UP THE WRONG TREE', hint: 'Wrong assumption' },
  { phrase: 'CUT TO THE CHASE', hint: 'Get to the point' },
  { phrase: 'JUMP ON THE BANDWAGON', hint: 'Follow the trend' },
  { phrase: 'NO PAIN NO GAIN', hint: 'Hard work required' },
  { phrase: 'ACTIONS SPEAK LOUDER THAN WORDS', hint: 'Do not just talk' },
];

const RANSOM_WORDS = [
  'STRAWBERRY', 'CONGRATULATIONS', 'THUNDERSTRUCK', 'EXTRAORDINARY', 'CHAMPIONSHIP',
  'WONDERFULLY', 'COMFORTABLE', 'CHRISTOPHER', 'REFRIGERATOR', 'STRAWBERRIES',
  'PHILOSOPHERS', 'COUNTRYSIDE', 'MEASUREMENTS', 'THUNDERSTORMS', 'BUTTERFINGERS',
  'SUPERNATURAL', 'CATASTROPHE', 'UNDERSTANDING', 'PERSONALITIES', 'NEIGHBORHOOD',
];

const RANSOM_VALID_WORDS = new Set([
  'A','I','AN','AS','AT','BE','BY','DO','GO','HE','IF','IN','IS','IT','ME','MY','NO','OF','ON','OR','SO','TO','UP','US','WE',
  'ACE','ACT','ADD','AGE','AGO','AID','AIM','AIR','ALL','AND','ANT','APE','ARC','ARE','ARM','ART','ASH','ASK','ATE','AWE',
  'BAD','BAG','BAN','BAR','BAT','BED','BIG','BIT','BOX','BOY','BUD','BUN','BUT','BUY','CAN','CAP','CAR','CAT','COB','COD',
  'COT','CUP','CUT','DAB','DAD','DAM','DAY','DEN','DIG','DIM','DIP','DOE','DOG','DOT','DRY','DUE','DUG','EAR','EAT','EEL',
  'EGG','ELM','END','ERA','EWE','EYE','FAD','FAR','FAT','FIG','FIN','FIT','FIX','FLY','FOB','FOG','FOR','FUN','FUR','GAP',
  'GAS','GEL','GEM','GET','GIN','GNU','GOD','GOT','GUM','GUN','GUT','GUY','GYM','HAD','HAM','HAS','HAT','HAY','HER',
  'HIM','HIP','HIT','HOG','HOP','HOT','HOW','HUB','HUG','HUM','HUT','ICE','ILL','INN','ION','IRE','JAB','JAM','JAR','JAW',
  'JET','JOB','JOG','JOT','JOY','JUG','JUT','KEG','KID','KIT','LAB','LAD','LAP','LAW','LAX','LAY','LEA','LED','LEG','LET',
  'LID','LIP','LIT','LOG','LOT','LOW','MAD','MAP','MAR','MAT','MAW','MAY','MEN','MET','MID','MIX','MOB','MOD','MOM','MOP',
  'MUD','MUG','NAB','NAG','NAP','NET','NEW','NIT','NOD','NOR','NOT','NOW','NUN','NUT','OAK','OAR','OAT','ODD','ODE','OPT',
  'ORB','ORE','OWE','OWL','OWN','PAD','PAL','PAN','PAP','PAR','PAT','PAW','PAY','PEA','PEG','PEN','PEP','PER','PET','PEW',
  'PHI','PIE','PIG','PIN','PIT','PLY','POD','POP','POT','POW','PRY','PUB','PUN','PUP','PUT','RAG','RAM','RAN','RAP',
  'RAT','RAW','RAY','RED','RIB','RID','RIG','RIM','RIP','ROB','ROD','ROT','ROW','RUB','RUG','RUN','RUT','SAC','SAP','SAT',
  'SAW','SAY','SEA','SET','SEW','SKI','SKY','SOB','SOD','SON','SOP','SOT','SOW','SOY','SPA','SPY','STY','SUB','SUM','SUN',
  'SUP','TAB','TAD','TAN','TAP','TAR','TAX','TEA','TEN','THE','TIE','TIN','TIP','TOE','TON','TOO','TOP','TOT','TOW','TOY',
  'TUB','TUG','TUN','TWO','URN','USE','VAN','VAT','VET','VIE','VOW','WAD','WAR','WAS','WAX','WAY','WEB','WED','WET',
  'WHO','WHY','WIG','WIN','WIT','WOK','WON','WOO','YAK','YAM','YAP','YAW','YEA','YET','YEW','YOU','ZAP','ZIT','ZOO',
  'ABLE','ACHE','ACRE','ALSO','ARCH','AREA','ARMY','ATOM','AUNT','BACK','BAKE','BALD','BALL','BAND','BANE','BANK',
  'BARE','BARN','BASE','BATH','BEAD','BEAM','BEAN','BEAR','BEAT','BEEN','BELL','BELT','BEND','BEST','BIKE','BILL','BIND',
  'BIRD','BITE','BOLD','BOLT','BOMB','BOND','BONE','BOOK','BORE','BORN','BOSS','BOTH','BURN','CAFE','CAGE','CAKE','CALF',
  'CALL','CALM','CAME','CAMP','CARD','CARE','CART','CASE','CAST','CAVE','CENT','CHAT','CHEF','CHIP','CITY','CLAM',
  'CLAP','CLAY','CLIP','CLUE','COAL','COAT','CODE','COIL','COIN','COLD','COME','CONE','COOK','COOL','COPE','CORD',
  'CORE','CORN','COST','CRAB','CREW','CROP','CROW','CURE','CURL','CUTE','DAME','DARE','DARK','DART','DATA','DATE',
  'DAWN','DEAD','DEAL','DEAR','DECK','DEEP','DEED','DEER','DENY','DESK','DIAL','DIET','DINE','DIRE',
  'DIRT','DISK','DOCK','DOLL','DONE','DOOM','DOOR','DOPE','DOSE','DOVE','DOWN','DRAW','DRIP','DROP',
  'DRUM','DUCK','DULL','DUMB','DUMP','DUNE','DUSK','DUST','EARL','EARN','EASE','EAST','EDGE','ELSE',
  'EPIC','EVEN','EVIL','FACE','FACT','FAIL','FAIR','FALL','FAME','FARM','FAST','FATE','FEAR','FEAT','FEEL',
  'FEET','FELL','FELT','FEND','FILE','FILL','FILM','FIND','FINE','FIRE','FIRM','FISH','FIST','FLAG','FLAP',
  'FLAT','FLAW','FLEA','FLEW','FLEX','FLIP','FLOW','FOAM','FOLD','FOLK','FOND','FONT','FOOD','FOOL','FOOT','FORD',
  'FORE','FORK','FORM','FORT','FOUL','FOUR','FOWL','FROG','FROM','FUEL','FULL','FUND','FUSE','GAIN','GALE','GAME','GANG',
  'GAZE','GEAR','GIFT','GIRL','GIVE','GLAD','GLOW','GLUE','GOAL','GOAT','GOLD','GONE',
  'GOWN','GRAB','GRAM','GRAY','GREW','GRID','GRIN','GRIP','GROW','GULF','HALL','HALT','HAND','HANG','HARD','HARE',
  'HARM','HATE','HAVE','HAWK','HEAD','HEAP','HEAT','HEEL','HELD','HELP','HERB','HERE','HERO','HIGH','HILL','HINT',
  'HIRE','HOLD','HOLE','HOME','HOOD','HOOK','HOPE','HORN','HOUR','HUGE','HULL','HUNT','HURT','IDEA','IDLE','INCH',
  'INTO','IRON','ISLE','ITEM','JAIL','JEST','JOIN','JOKE','JUMP','JUST','KEEN','KEEP','KILL','KIND','KING','KISS',
  'KNEW','KNOW','LACK','LAKE','LAMB','LAME','LAND','LANE','LASH','LAST','LATE','LEAD','LEAF','LEAN','LEFT','LEND','LESS',
  'LIFE','LIFT','LIKE','LIMB','LIME','LINE','LINK','LION','LIST','LIVE','LOAD','LOAN','LOCK','LOFT','LONE','LONG','LOOK',
  'LORD','LOSE','LOSS','LOST','LOUD','LOVE','LUCK','LURE','MADE','MAIL','MAIN','MAKE','MALE','MALL','MALT',
  'MANY','MARE','MARK','MARS','MAST','MATE','MATH','MAZE','MEAL','MEAN','MEAT','MEET','MELT','MEMO','MERE','MESH','MESS',
  'MILD','MILE','MILK','MILL','MIND','MINE','MINT','MISS','MIST','MODE','MOLE','MOOD','MOON','MOOR','MORE',
  'MOST','MOVE','MUCH','MUST','NAIL','NAME','NAVY','NEAR','NECK','NEED','NEST','NEXT','NICE','NODE',
  'NONE','NOON','NORM','NOSE','NOTE','NOUN','OATH','ONCE','ONLY','ONTO','OPEN','OVEN','OVER',
  'PACE','PACK','PAGE','PAIN','PAIR','PALE','PALM','PART','PASS','PAST','PATH','PAVE','PEAK','PEAR','PEEL',
  'PEER','PICK','PILE','PINE','PINK','PIPE','PLAN','PLAY','PLEA','PLOT','PLUG','PLUS','POLE','POLL','POND',
  'POOL','POOR','PORK','PORT','POSE','POST','POUR','PRAY','PREP','PREY','PROP','PULL','PURE','PUSH',
  'RACE','RACK','RAGE','RAID','RAIL','RAIN','RAKE','RAMP','RANG','RANK','RANT','RARE','RATE','READ','REAL','REAP','REEL',
  'RELY','RENT','REST','RICE','RICH','RIDE','RIFT','RING','RIOT','RISE','RISK','ROAD','ROAM','ROAR','ROBE','ROCK',
  'RODE','ROLE','ROLL','ROOF','ROOM','ROOT','ROPE','ROSE','RUBY','RUIN','RULE','RUSH','RUST','SAFE','SAGA','SAID','SAIL',
  'SAKE','SALE','SALT','SAME','SAND','SANE','SANG','SAVE','SCAN','SCAR','SEAM','SEAT','SEED','SEEK','SEEM',
  'SEEN','SELF','SELL','SEND','SHED','SHIP','SHOE','SHOP','SHOT','SHOW','SHUT','SICK','SIDE','SIGH','SIGN','SING',
  'SINK','SITE','SIZE','SKIN','SKIP','SLAM','SLAP','SLIM','SLIP','SLOW','SNAP','SOAK','SOAP','SOAR','SOCK',
  'SOFT','SOIL','SOLD','SOLE','SOLO','SOME','SONG','SOON','SORE','SORT','SOUL','SOUP','SOUR','SPAN','SPIN','SPIT','SPOT',
  'STAR','STAY','STEM','STEP','STEW','STOP','STUD','SUCH','SUIT','SUNG','SUNK','SURE','SURF','SWAN','SWAP','SWAY',
  'TACK','TAIL','TAKE','TALE','TALK','TALL','TANK','TAPE','TASK','TAME','TEAM','TEAR','TELL','TEND','TENT',
  'TERM','TEST','TEXT','THAN','THAT','THEM','THEN','THEY','THIN','THIS','TILL','TIME','TIRE','TOAD','TOLD','TOLL',
  'TOMB','TORE','TORN','TOSS','TOUR','TOWN','TRAP','TREE','TRIM','TRIO','TRIP','TROT','TRUE','TUCK','TUNA','TUNE',
  'TURF','TURN','TUSK','TWIN','TYPE','UGLY','UNDO','UNIT','UPON','USED','VALE','VARY','VAST','VEIL','VEIN','VERY','VEST',
  'VETO','VIEW','VILE','VINE','VOID','VOTE','WADE','WAGE','WAIT','WAKE','WALK','WALL','WAND','WANT','WARD',
  'WARM','WARN','WASH','WASP','WAVE','WEAK','WEAR','WEED','WEEK','WELL','WENT',
  'WERE','WHAT','WHEN','WHOM','WIDE','WIFE','WILD','WILL','WIND','WINE','WING','WINK','WIRE','WISE','WISH',
  'WITH','WOLF','WOOD','WOOL','WORD','WORE','WORK','WORN','WRAP','YEAR','YELL','YOGA','YOLK','YOUR','ZERO','ZONE',
]);

const DINGBATS_ITEMS = [
  { visual: 'STAND\nI', answer: 'I UNDERSTAND', hint: 'Look at position of I' },
  { visual: 'WEAR\nLONG', answer: 'LONG UNDERWEAR', hint: 'Where is WEAR?' },
  { visual: 'EGGS\nEGGS\nEGGS\nEGGS\nEGGS\nEGGS', answer: 'HALF A DOZEN EGGS', hint: 'Count them' },
  { visual: 'BAN ANA', answer: 'BANANA SPLIT', hint: 'What is split?' },
  { visual: 'TIMING\nTIM ING', answer: 'SPLIT SECOND TIMING', hint: 'Something is split' },
  { visual: 'DEATH/LIFE', answer: 'LIFE AFTER DEATH', hint: 'Order matters' },
  { visual: 'NIP\nTUCK', answer: 'NIP AND TUCK', hint: 'What connects them?' },
  { visual: 'HEAD\n────\nHEELS', answer: 'HEAD OVER HEELS', hint: 'What is between them?' },
  { visual: 'ONCE\n  ONCE\n    ONCE', answer: 'ONCE UPON A TIME', hint: 'How many times and what pattern?' },
  { visual: 'NOON\nGOOD', answer: 'GOOD AFTERNOON', hint: 'GOOD + AFTER + NOON' },
  { visual: 'CC\nCC', answer: 'FOUR CORNERS', hint: 'Count the Cs' },
  { visual: 'MILONEI', answer: 'ONE IN A MILLION', hint: 'Where is ONE?' },
  { visual: 'STEP\nPETS', answer: 'STEP ON PETS', hint: 'Read both ways' },
  { visual: 'EZ\n  I', answer: 'EASY ON THE EYE', hint: 'Sounds like...' },
  { visual: 'POD\n□ □ □', answer: 'THREE PEAS IN A POD', hint: 'Count the squares' },
  { visual: 'GROUND\nFEET\nFEET\nFEET\nFEET\nFEET\nFEET', answer: 'SIX FEET UNDERGROUND', hint: 'Count the FEET' },
  { visual: 'ROAD\n  A  \nHOG', answer: 'A HOG IN THE ROAD', hint: 'Something in the middle' },
  { visual: 'T\nRN\n  O\n    U', answer: 'TURN ABOUT', hint: 'What direction do you read?' },
  { visual: 'CHESS', answer: 'CHESS NUT', hint: 'What nut is in CHESS?' },
  { visual: 'KNEE\nLIGHT', answer: 'NEON LIGHT', hint: 'KNEE + ON + LIGHT' },
];


function getGameData(game, room) {
  if (!room.tournament.usedItems) room.tournament.usedItems = {};
  const used = room.tournament.usedItems;

  if (game === 'trivia') {
    if (!used.trivia) used.trivia = [];
    const pool = TRIVIA_QUESTIONS.filter((_, i) => !used.trivia.includes(i));
    const src = pool.length >= 5 ? pool : TRIVIA_QUESTIONS;
    const shuffled = shuffle([...Array(src.length).keys()]);
    const picked = shuffled.slice(0, 5).map(i => src[i]);
    picked.forEach(q => {
      const idx = TRIVIA_QUESTIONS.indexOf(q);
      if (idx >= 0 && !used.trivia.includes(idx)) used.trivia.push(idx);
    });
    return { questions: picked };
  }

  if (game === 'wordle') {
    if (!used.wordle) used.wordle = [];
    const pool = WORDLE_WORDS.filter((_, i) => !used.wordle.includes(i));
    const src = pool.length ? pool : WORDLE_WORDS;
    const idx = Math.floor(Math.random() * src.length);
    const word = src[idx];
    const wordIdx = WORDLE_WORDS.indexOf(word);
    if (!used.wordle.includes(wordIdx)) used.wordle.push(wordIdx);
    return { word };
  }

  if (game === 'wheeloffortune') {
    if (!used.wof) used.wof = [];
    const pool = WOF_PHRASES.filter((_, i) => !used.wof.includes(i));
    const src = pool.length ? pool : WOF_PHRASES;
    const idx = Math.floor(Math.random() * src.length);
    const item = src[idx];
    const itemIdx = WOF_PHRASES.indexOf(item);
    if (!used.wof.includes(itemIdx)) used.wof.push(itemIdx);
    return { phrase: item.phrase, hint: item.hint };
  }

  if (game === 'ransomnote') {
    const word = RANSOM_WORDS[Math.floor(Math.random() * RANSOM_WORDS.length)];
    const validWords = [...RANSOM_VALID_WORDS].filter(w => {
      if (w.length < 2) return false;
      const letterPool = word.split('');
      for (const ch of w) {
        const i = letterPool.indexOf(ch);
        if (i === -1) return false;
        letterPool.splice(i, 1);
      }
      return true;
    });
    return { sourceWord: word, validWords };
  }

  if (game === 'dingbats') {
    if (!used.dingbats) used.dingbats = [];
    const pool = DINGBATS_ITEMS.filter((_, i) => !used.dingbats.includes(i));
    const src = pool.length >= 5 ? pool : DINGBATS_ITEMS;
    const indices = shuffle([...Array(src.length).keys()]).slice(0, 5);
    const picked = indices.map(i => src[i]);
    picked.forEach(d => {
      const idx = DINGBATS_ITEMS.indexOf(d);
      if (idx >= 0 && !used.dingbats.includes(idx)) used.dingbats.push(idx);
    });
    return { puzzles: picked };
  }

  return null;
}

// --- Utility ---
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
const genId = () => Math.random().toString(36).substr(2, 9);
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// --- Room storage ---
const rooms = {};
const playerRoom = {};

function createBracket(players) {
  const shuffled = shuffle(players);
  const n = shuffled.length;
  if (n <= 8) return createEliminationBracket(shuffled);
  return createGroupStageBracket(shuffled);
}

function pickGame(usedGames = []) {
  const recent = usedGames.slice(-4);
  const pool = GAME_TYPES.filter(g => !recent.includes(g));
  const src = pool.length ? pool : GAME_TYPES;
  return src[Math.floor(Math.random() * src.length)];
}

function createEliminationBracket(players) {
  const n = players.length;
  let bracketSize = 2;
  while (bracketSize < n) bracketSize *= 2;
  const byes = bracketSize - n;
  const usedGames = [];
  const firstRound = [];
  let pi = 0;
  for (let i = 0; i < byes; i++) {
    firstRound.push({ id: genId(), p1: players[pi], p2: null, winner: players[pi], game: null, state: 'bye', scores: { p1: 0, p2: 0 } });
    pi++;
  }
  while (pi < players.length) {
    const game = pickGame(usedGames);
    usedGames.push(game);
    const match = { id: genId(), p1: players[pi], p2: players[pi + 1], winner: null, game, state: 'pending', scores: { p1: 0, p2: 0 } };
    if (n === 2) { match.bestOf = 3; match.seriesScore = { p1: 0, p2: 0 }; }
    firstRound.push(match);
    pi += 2;
  }
  const rounds = [firstRound];
  let prev = firstRound;
  while (prev.length > 1) {
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push({ id: genId(), p1: null, p2: null, winner: null, game: null, state: 'tbd', scores: { p1: 0, p2: 0 }, fromMatches: [prev[i]?.id, prev[i + 1]?.id] });
    }
    rounds.push(next);
    prev = next;
  }
  return { format: 'elimination', players, rounds, currentRound: 0, usedGames };
}

function createGroupStageBracket(players) {
  const n = players.length;
  const half = Math.ceil(n / 2);
  const g1 = players.slice(0, half);
  const g2 = players.slice(half);
  const usedGames = [];
  const groupMatches = (group, gNum) => {
    const ms = [];
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const game = pickGame(usedGames);
        usedGames.push(game);
        ms.push({ id: genId(), p1: group[i], p2: group[j], winner: null, game, state: 'pending', scores: { p1: 0, p2: 0 }, group: gNum });
      }
    }
    return ms;
  };
  const round0 = [...groupMatches(g1, 1), ...groupMatches(g2, 2)];
  const sf1 = { id: genId(), p1: null, p2: null, winner: null, game: null, state: 'tbd', scores: { p1: 0, p2: 0 } };
  const sf2 = { id: genId(), p1: null, p2: null, winner: null, game: null, state: 'tbd', scores: { p1: 0, p2: 0 } };
  const final = { id: genId(), p1: null, p2: null, winner: null, game: null, state: 'tbd', scores: { p1: 0, p2: 0 } };
  return {
    format: 'groups', players, rounds: [round0, [sf1, sf2], [final]],
    groups: { 1: g1, 2: g2 },
    groupStandings: {
      1: g1.map(p => ({ player: p, wins: 0, losses: 0 })),
      2: g2.map(p => ({ player: p, wins: 0, losses: 0 }))
    },
    currentRound: 0, usedGames
  };
}

function serializeTournament(t) {
  const p = ({ id, username, avatar }) => ({ id, username, avatar });
  return {
    format: t.format,
    currentRound: t.currentRound,
    rounds: t.rounds.map(round => round.map(m => ({
      id: m.id, state: m.state, game: m.game, scores: m.scores,
      bestOf: m.bestOf || null,
      seriesScore: m.seriesScore ? { ...m.seriesScore } : null,
      p1: m.p1 ? p(m.p1) : null,
      p2: m.p2 ? p(m.p2) : null,
      winner: m.winner ? p(m.winner) : null
    }))),
    groupStandings: t.groupStandings ? Object.fromEntries(
      Object.entries(t.groupStandings).map(([k, v]) => [k, v.map(s => ({ player: p(s.player), wins: s.wins, losses: s.losses }))])
    ) : null
  };
}

function findMatch(room, matchId) {
  for (const round of room.tournament.rounds) {
    const m = round.find(m => m.id === matchId);
    if (m) return m;
  }
  return null;
}

function startTournament(room) {
  room.state = 'tournament';
  room.tournament = createBracket(room.players);
  io.to(room.code).emit('tournament-start', {
    bracket: serializeTournament(room.tournament),
    players: room.players.map(({ id, username, avatar }) => ({ id, username, avatar }))
  });
  setTimeout(() => startRound(room), 4000);
}

function startRound(room) {
  const { tournament } = room;
  const round = tournament.rounds[tournament.currentRound];
  if (!round) return;
  const pending = round.filter(m => m.state === 'pending');
  if (pending.length === 0) { advanceTournament(room); return; }
  const game = pickGame(tournament.usedGames);
  pending.forEach(m => { m.game = game; m.state = 'active'; });
  tournament.usedGames.push(game);
  io.to(room.code).emit('round-start', {
    round: tournament.currentRound, game,
    matches: pending.map(m => ({ id: m.id, p1: { id: m.p1.id, username: m.p1.username, avatar: m.p1.avatar }, p2: { id: m.p2.id, username: m.p2.username, avatar: m.p2.avatar } })),
    bracket: serializeTournament(tournament)
  });
  setTimeout(() => {
    for (const match of pending) {
      const p1s = io.sockets.sockets.get(match.p1.id);
      const p2s = io.sockets.sockets.get(match.p2.id);
      const gameData = getGameData(game, room);
      if (p1s) p1s.emit('match-start', { matchId: match.id, game, opponent: { id: match.p2.id, username: match.p2.username, avatar: match.p2.avatar }, isPlayer1: true, bestOf: match.bestOf || null, seriesScore: match.seriesScore || null, gameNum: 1, gameData });
      if (p2s) p2s.emit('match-start', { matchId: match.id, game, opponent: { id: match.p1.id, username: match.p1.username, avatar: match.p1.avatar }, isPlayer1: false, bestOf: match.bestOf || null, seriesScore: match.seriesScore || null, gameNum: 1, gameData });
      if (match.p1?.isBot || match.p2?.isBot) handleBotMatch(room, match);
    }
  }, 4000);
}

function finishMatch(room, match, winner, scores) {
  if (match.state === 'complete') return;
  match.winner = winner; match.scores = scores; match.state = 'complete';
  if (match.gameLoop) { clearInterval(match.gameLoop); match.gameLoop = null; }
  io.to(room.code).emit('match-complete', { matchId: match.id, winner: { id: winner.id, username: winner.username, avatar: winner.avatar }, scores });
  if (room.tournament.format === 'groups' && room.tournament.currentRound === 0 && match.group) {
    const standings = room.tournament.groupStandings[match.group];
    if (standings) {
      const ws = standings.find(s => s.player.id === winner.id);
      const ls = standings.find(s => s.player.id !== winner.id && (s.player.id === match.p1.id || s.player.id === match.p2.id));
      if (ws) ws.wins++;
      if (ls) ls.losses++;
    }
  }
  setTimeout(() => checkRoundComplete(room), 500);
}

function handleGameEnd(room, match, winner, scores) {
  if (match.gameEndHandled) return;
  match.gameEndHandled = true;
  if (!match.bestOf) return finishMatch(room, match, winner, scores);
  match.seriesScore = match.seriesScore || { p1: 0, p2: 0 };
  const isP1Win = winner.id === match.p1.id;
  if (isP1Win) match.seriesScore.p1++; else match.seriesScore.p2++;
  const needed = Math.ceil(match.bestOf / 2);
  const gameNum = match.seriesScore.p1 + match.seriesScore.p2;
  io.to(room.code).emit('series-update', { matchId: match.id, seriesScore: { ...match.seriesScore }, lastWinner: { id: winner.id, username: winner.username, avatar: winner.avatar }, lastScores: scores, bestOf: match.bestOf, gameNum, neededToWin: needed });
  if (match.seriesScore.p1 >= needed || match.seriesScore.p2 >= needed) {
    setTimeout(() => finishMatch(room, match, winner, scores), 2500);
  } else {
    match.playerScores = {};
    if (match.gameLoop) { clearInterval(match.gameLoop); match.gameLoop = null; }
    const newGame = pickGame(room.tournament.usedGames);
    match.game = newGame;
    room.tournament.usedGames.push(newGame);
    const nextGameNum = gameNum + 1;
    match.seriesGameId = (match.seriesGameId || 0) + 1;
    setTimeout(() => {
      if (match.state !== 'active') return;
      match.gameEndHandled = false;
      const p1s = io.sockets.sockets.get(match.p1.id);
      const p2s = io.sockets.sockets.get(match.p2.id);
      const newGameData = getGameData(newGame, room);
      if (p1s) p1s.emit('match-start', { matchId: match.id, game: newGame, opponent: { id: match.p2.id, username: match.p2.username, avatar: match.p2.avatar }, isPlayer1: true, seriesScore: { ...match.seriesScore }, bestOf: match.bestOf, gameNum: nextGameNum, gameData: newGameData });
      if (p2s) p2s.emit('match-start', { matchId: match.id, game: newGame, opponent: { id: match.p1.id, username: match.p1.username, avatar: match.p1.avatar }, isPlayer1: false, seriesScore: { ...match.seriesScore }, bestOf: match.bestOf, gameNum: nextGameNum, gameData: newGameData });
      if (match.p1?.isBot || match.p2?.isBot) handleBotMatch(room, match);
    }, 5000);
  }
}

function handleBotMatch(room, match) {
  const game = match.game;
  const thisGameId = match.seriesGameId = (match.seriesGameId || 0) + 1;
  const bots = [match.p1, match.p2].filter(p => p?.isBot);
  bots.forEach(bot => {
    const opponent = match.p1.id === bot.id ? match.p2 : match.p1;
    setTimeout(() => {
      if (match.seriesGameId !== thisGameId || match.state !== 'active' || match.gameEndHandled) return;
      const score = getBotScore(game);
      if (!match.playerScores) match.playerScores = {};
      match.playerScores[bot.id] = score;
      if (!opponent || match.playerScores[opponent.id] !== undefined) {
        const s1 = match.playerScores[match.p1.id];
        const s2 = match.playerScores[match.p2.id];
        if (s1 !== undefined && s2 !== undefined) handleGameEnd(room, match, s1 >= s2 ? match.p1 : match.p2, { p1: s1, p2: s2 });
      }
    }, 18000 + Math.random() * 32000);
  });
  setTimeout(() => {
    if (match.seriesGameId !== thisGameId || match.state !== 'active' || match.gameEndHandled) return;
    if (!match.playerScores) match.playerScores = {};
    const s1 = match.playerScores[match.p1.id] ?? 0;
    const s2 = match.playerScores[match.p2.id] ?? 0;
    handleGameEnd(room, match, s1 >= s2 ? match.p1 : match.p2, { p1: s1, p2: s2 });
  }, 150000);
}

function checkRoundComplete(room) {
  const { tournament } = room;
  const round = tournament.rounds[tournament.currentRound];
  if (!round) return;
  if (round.filter(m => m.state === 'pending' || m.state === 'active').length === 0) advanceTournament(room);
}

function advanceTournament(room) {
  const { tournament } = room;
  const round = tournament.rounds[tournament.currentRound];
  const winners = round.map(m => m.winner).filter(Boolean);
  if (tournament.format === 'elimination') {
    tournament.currentRound++;
    const nextRound = tournament.rounds[tournament.currentRound];
    if (!nextRound) {
      room.state = 'gameover';
      io.to(room.code).emit('tournament-complete', { winner: { id: winners[0].id, username: winners[0].username, avatar: winners[0].avatar } });
      return;
    }
    let wi = 0;
    for (const m of nextRound) {
      m.p1 = winners[wi++] || null; m.p2 = winners[wi++] || null;
      if (m.p1 && m.p2) { m.state = 'pending'; m.game = pickGame(tournament.usedGames); }
      else if (m.p1) { m.state = 'bye'; m.winner = m.p1; }
    }
    io.to(room.code).emit('round-complete', { round: tournament.currentRound - 1, winners: winners.map(w => ({ id: w.id, username: w.username, avatar: w.avatar })), bracket: serializeTournament(tournament) });
    setTimeout(() => startRound(room), 5000);
  } else if (tournament.format === 'groups') {
    if (tournament.currentRound === 0) {
      const g1s = [...tournament.groupStandings[1]].sort((a, b) => b.wins - a.wins);
      const g2s = [...tournament.groupStandings[2]].sort((a, b) => b.wins - a.wins);
      const [sf1, sf2] = tournament.rounds[1];
      sf1.p1 = g1s[0].player; sf1.p2 = g2s[1].player; sf1.state = 'pending'; sf1.game = pickGame(tournament.usedGames);
      sf2.p1 = g2s[0].player; sf2.p2 = g1s[1].player; sf2.state = 'pending'; sf2.game = pickGame(tournament.usedGames);
      tournament.currentRound = 1;
      io.to(room.code).emit('round-complete', { round: 0, standings: serializeTournament(tournament).groupStandings, bracket: serializeTournament(tournament) });
      setTimeout(() => startRound(room), 5000);
    } else if (tournament.currentRound === 1) {
      const sfWinners = tournament.rounds[1].map(m => m.winner).filter(Boolean);
      const final = tournament.rounds[2][0];
      final.p1 = sfWinners[0]; final.p2 = sfWinners[1]; final.state = 'pending'; final.game = pickGame(tournament.usedGames);
      tournament.currentRound = 2;
      io.to(room.code).emit('round-complete', { round: 1, winners: sfWinners.map(w => ({ id: w.id, username: w.username, avatar: w.avatar })), bracket: serializeTournament(tournament) });
      setTimeout(() => startRound(room), 5000);
    } else {
      room.state = 'gameover';
      io.to(room.code).emit('tournament-complete', { winner: { id: winners[0].id, username: winners[0].username, avatar: winners[0].avatar } });
    }
  }
}

// --- Socket Handlers ---
io.on('connection', socket => {
  socket.on('create-room', () => {
    let code; do { code = genCode(); } while (rooms[code]);
    rooms[code] = { code, host: socket.id, players: [], state: 'lobby', tournament: null };
    playerRoom[socket.id] = code; socket.join(code);
    socket.emit('room-created', { code });
  });

  socket.on('join-room', ({ code }) => {
    const c = code.toUpperCase().trim();
    const room = rooms[c];
    if (!room) { socket.emit('join-error', { message: 'Room not found! Check your code.' }); return; }
    if (room.state !== 'lobby') { socket.emit('join-error', { message: 'Game already in progress!' }); return; }
    if (room.players.length >= 12) { socket.emit('join-error', { message: 'Room is full (max 12 players)!' }); return; }
    playerRoom[socket.id] = c; socket.join(c);
    socket.emit('room-joined', { code: c, isHost: room.host === socket.id, players: room.players.map(({ id, username, avatar }) => ({ id, username, avatar })) });
  });

  socket.on('set-player-info', ({ username, avatar }) => {
    const room = rooms[playerRoom[socket.id]];
    if (!room) return;
    let p = room.players.find(p => p.id === socket.id);
    if (!p) { p = { id: socket.id, username, avatar, ready: false }; room.players.push(p); }
    else { p.username = username; p.avatar = avatar; }
    io.to(room.code).emit('players-updated', { players: room.players.map(({ id, username, avatar, ready, isBot }) => ({ id, username, avatar, ready, isBot })) });
    socket.emit('player-info-set', { player: { id: p.id, username: p.username, avatar: p.avatar } });
  });

  socket.on('player-ready', () => {
    const room = rooms[playerRoom[socket.id]];
    if (!room) return;
    const p = room.players.find(p => p.id === socket.id);
    if (p) p.ready = true;
    io.to(room.code).emit('players-updated', { players: room.players.map(({ id, username, avatar, ready, isBot }) => ({ id, username, avatar, ready, isBot })) });
    if (room.players.length >= 2 && room.players.every(p => p.ready)) startTournament(room);
  });

  socket.on('add-bot', () => {
    const room = rooms[playerRoom[socket.id]];
    if (!room || room.host !== socket.id || room.state !== 'lobby') return;
    if (room.players.length >= 12) { socket.emit('join-error', { message: 'Room is full!' }); return; }
    const usedNames = room.players.filter(p => p.isBot).map(p => p.username);
    const name = BOT_NAMES.find(n => !usedNames.includes(n)) || `Bot ${room.players.filter(p => p.isBot).length + 1}`;
    const botCount = room.players.filter(p => p.isBot).length;
    room.players.push({ id: 'bot_' + genId(), username: name, avatar: BOT_AVATARS[botCount % BOT_AVATARS.length], ready: true, isBot: true });
    io.to(room.code).emit('players-updated', { players: room.players.map(({ id, username, avatar, ready, isBot }) => ({ id, username, avatar, ready, isBot })) });
  });

  socket.on('remove-bot', () => {
    const room = rooms[playerRoom[socket.id]];
    if (!room || room.host !== socket.id || room.state !== 'lobby') return;
    const bots = room.players.filter(p => p.isBot);
    if (!bots.length) return;
    room.players = room.players.filter(p => p.id !== bots[bots.length - 1].id);
    io.to(room.code).emit('players-updated', { players: room.players.map(({ id, username, avatar, ready, isBot }) => ({ id, username, avatar, ready, isBot })) });
  });

  socket.on('request-start', () => {
    const room = rooms[playerRoom[socket.id]];
    if (!room || room.host !== socket.id) return;
    if (room.players.length >= 2) startTournament(room);
  });

  socket.on('submit-score', ({ matchId, score }) => {
    const room = rooms[playerRoom[socket.id]];
    if (!room) return;
    const match = findMatch(room, matchId);
    if (!match || match.state !== 'active' || match.gameEndHandled) return;
    if (!match.playerScores) match.playerScores = {};
    match.playerScores[socket.id] = score;
    if (match.p1 && match.p2) {
      const s1 = match.playerScores[match.p1.id];
      const s2 = match.playerScores[match.p2.id];
      if (s1 !== undefined && s2 !== undefined) {
        handleGameEnd(room, match, s1 >= s2 ? match.p1 : match.p2, { p1: s1, p2: s2 });
      }
    }
  });

  socket.on('game-relay', ({ matchId, data }) => {
    const code = playerRoom[socket.id];
    if (code) socket.to(code).emit('game-relay', { matchId, data, from: socket.id });
  });

  socket.on('disconnect', () => {
    const code = playerRoom[socket.id];
    if (!code) return;
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    delete playerRoom[socket.id];
    if (room.players.length === 0) { delete rooms[code]; return; }
    if (room.host === socket.id) room.host = room.players[0].id;
    io.to(code).emit('players-updated', { players: room.players.map(({ id, username, avatar, ready, isBot }) => ({ id, username, avatar, ready, isBot })) });
    io.to(code).emit('player-left', { playerId: socket.id });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🧠 Word Games Tournament running on http://localhost:${PORT}`));
