/**
 * Santali Script Converter — English → Santali Dictionary + Phonetic Engine
 *
 * Known words → looked up in the dictionary (accurate Santali)
 * Unknown words / proper nouns → phonetically transcribed into Santali Latin
 *   so they can still be rendered in Ol Chiki script.
 *
 * translateEnglishToSantali(text) returns:
 *   { result: string, transcribed: [{english, santaliLatin}] }
 */

// ─── Contractions ─────────────────────────────────────────────────────────────
const SSC_CONTRACTIONS = {
  "i'm":"i am","i've":"i have","i'll":"i will","i'd":"i would",
  "you're":"you are","you've":"you have","you'll":"you will","you'd":"you would",
  "he's":"he is","she's":"she is","it's":"it is","that's":"that is",
  "we're":"we are","we've":"we have","we'll":"we will",
  "they're":"they are","they've":"they have","they'll":"they will",
  "isn't":"is not","aren't":"are not","wasn't":"was not","weren't":"were not",
  "don't":"do not","doesn't":"does not","didn't":"did not",
  "can't":"cannot","couldn't":"could not","won't":"will not","wouldn't":"would not",
  "there's":"there is","here's":"here is","let's":"let us","what's":"what is",
  "who's":"who is","where's":"where is","how's":"how is",
};

// ─── Phrases (longest matched first) ─────────────────────────────────────────
const SSC_PHRASES = [
  ["good morning","bihaan johar"],["good afternoon","disam johar"],
  ["good evening","san johar"],["good night","nidar johar"],
  ["how are you doing","am eken caba kana"],["how are you","am sari caba"],
  ["i am very well","ing adi eken caba"],["i am fine","ing sari caba"],
  ["i am good","ing eken caba"],["nice to meet you","am ren ocoa khushi"],
  ["pleased to meet you","am ren ocoa khushi"],
  ["what is your name","am ren min do mone"],["my name is","alin min do"],
  ["where are you from","am onak atu reyak"],
  ["where do you live","am onak orak re cet kana"],
  ["how old are you","am ren baya onka"],
  ["thank you very much","adi adi dhanyabad"],["thank you","dhanyabad"],
  ["you are welcome","caba"],["i am sorry","ing micad"],
  ["excuse me","khetir kori"],["i love you","ing am ren priya"],
  ["i miss you","ing am ren man kana"],["see you later","noa baad johar"],
  ["see you tomorrow","gita johar"],["take care","eken ror"],
  ["good luck","eken johar"],["happy birthday","janma din johar"],
  ["congratulations","dhanyabad"],["i don't know","ing bae ama"],
  ["i don't understand","ing bae bujhao"],["please help me","ing ren sahay em"],
  ["i need help","ing sahay dorkae"],["i am hungry","ing dhukau"],
  ["i am thirsty","ing dak lel kana"],["i am tired","ing sirjom caba"],
  ["i am sick","ing birhi kana"],["i am happy","ing khushi kana"],
  ["i am sad","ing dukhi kana"],["i am angry","ing khisi kana"],
  ["i am afraid","ing dare kana"],["i am cold","ing sita kana"],
  ["i am hot","ing garam kana"],["what time is it","onka baje kana"],
  ["how much does this cost","noa ren mul onka"],
  ["how much is this","noa ren mul onka"],
  ["i want water","ing dak lel kana"],["i want food","ing joget lel kana"],
  ["i want to go","ing ote lel kana"],["i want to eat","ing jom lel kana"],
  ["i want to sleep","ing nidor lel kana"],["i don't want","ing bae lel"],
  ["come here","noa tege hija"],["go away","ote"],["sit down","unum"],
  ["stand up","othok"],["be quiet","chup reh"],["be careful","eken ror"],
  ["hurry up","jaldi ote"],["wait a moment","mit dam boro"],
  ["no problem","kono barhak bae"],["never mind","man bae kori"],
  ["of course","caba"],["well done","adi eken"],["very good","adi eken"],
  ["very well","adi eken"],["not good","bae eken"],
  ["i think so","ing eken man kana"],["i don't think so","ing bae man"],
  ["what is this","noa mone janam"],["what is that","hore mone janam"],
  ["who is this","noa okoe"],["where are you going","am onak ote kana"],
  ["what are you doing","am mone cet kana"],["long live","jibon johar"],
  ["good morning everyone","bihaan johar hor ko"],
  ["how is your family","am ren paribha sari caba"],
  ["my family is well","alin paribha sari caba"],
  ["bless you","bonga am ren niyom emog"],["in the name of god","bonga ren minreak te"],
  ["come with me","ing sange hija"],["follow me","ing ren sar te hija"],
  ["i understand","ing bujhao kana"],["i agree","ing man kana"],
  ["i disagree","ing bae man"],["that is correct","hore sachi"],
  ["that is wrong","hore bae sachi"],["one moment please","mit dam"],
  ["speak slowly","hola hola ror"],["i am from","ing reyak atu do"],
  ["we are santali","ale santal hor ko"],["santali language","santal ror"],
];

// ─── Word dictionary (800+ entries) ──────────────────────────────────────────
const SSC_WORDS = {
  // Particles & core
  "yes":"ho","no":"bae","not":"bae","okay":"caba","ok":"caba",
  "and":"ar","or":"nohon","but":"onokte","also":"ben","too":"ben",
  "very":"adi","so":"tahen","because":"cet te","if":"yadi","then":"tahen",
  "now":"noa te","still":"tahen ben","already":"caba","yet":"tahen",
  "again":"age","never":"khonikhan bae","always":"sada","sometimes":"kanikhan",
  "perhaps":"hokan","maybe":"hokan","please":"hoye","only":"matra",
  "just":"matra","more":"adi","less":"kom","enough":"caba",
  "all":"serma","every":"sab","some":"kanik","many":"adi bako",
  "few":"kanik","much":"adi","little":"kanik","together":"sange",
  "alone":"mit hor","here":"noa te","there":"hore te",
  "where":"onak","when":"okte","why":"cet te","how":"eke",
  "what":"mone","who":"okoe","which":"onak",
  // Pronouns
  "i":"ing","me":"ing","my":"alin","mine":"alin","myself":"ing eken",
  "you":"am","your":"am ren","yours":"am ren","yourself":"am eken",
  "he":"uni","him":"uni","his":"uni ren","himself":"uni eken",
  "she":"uni","her":"uni","herself":"uni eken",
  "it":"uni","its":"uni ren","itself":"uni eken",
  "we":"ale","us":"ale","our":"alage ren","ours":"alage ren","ourselves":"ale eken",
  "they":"unkhen","them":"unkhen","their":"unkhen ren","theirs":"unkhen ren","themselves":"unkhen eken",
  "this":"noa","that":"hore","these":"noko","those":"horeko",
  "everyone":"serma hor","someone":"kanik hor","anyone":"kanik hor",
  "nobody":"bae hor","nothing":"kanik bae","something":"kanik","everything":"serma",
  "each":"sab","both":"bar-ren ben","other":"enar","another":"enar mit",
  // Numbers
  "zero":"sunya","one":"mit","two":"bar","three":"pe","four":"pon",
  "five":"mone","six":"turui","seven":"eae","eight":"irael","nine":"are","ten":"gel",
  "eleven":"gel mit","twelve":"gel bar","thirteen":"gel pe","fourteen":"gel pon",
  "fifteen":"gel mone","sixteen":"gel turui","seventeen":"gel eae",
  "eighteen":"gel irael","nineteen":"gel are","twenty":"isi",
  "thirty":"pe gel","forty":"pon gel","fifty":"mone gel",
  "sixty":"turui gel","seventy":"eae gel","eighty":"irael gel","ninety":"are gel",
  "hundred":"hormo","thousand":"hazar","million":"lakh hazar",
  "first":"ayal","second":"bar","third":"pe","last":"alom","half":"adi",
  // Time
  "today":"noa din","tomorrow":"gita","yesterday":"sita",
  "morning":"bihaan","afternoon":"disam","evening":"san","night":"nidar",
  "midnight":"nidar madhyan","day":"din","week":"haphan","month":"chandar",
  "year":"serma","hour":"ghanta","minute":"minit","second":"sekund",
  "time":"din","moment":"dam","early":"bihaan te","late":"baad","soon":"jaldi",
  "before":"age","after":"baad","during":"majhare te","since":"khon","until":"tege",
  "always":"sada","never":"khonikhan bae","often":"adi te","sometimes":"kanikhan",
  // Days
  "monday":"ison","tuesday":"mungal","wednesday":"budh",
  "thursday":"bihisput","friday":"sokol","saturday":"sanichar","sunday":"rabibar",
  // Months
  "january":"jenuary","february":"february","march":"marc","april":"april",
  "may":"may","june":"jun","july":"julai","august":"agast",
  "september":"september","october":"october","november":"november","december":"december",
  // Family
  "mother":"ayo","mom":"ayo","mum":"ayo","father":"baba","dad":"baba",
  "parents":"ayo baba","brother":"dal","sister":"bahin","child":"hapon",
  "children":"hapon ko","son":"hapon","daughter":"harhin","baby":"bonko hapon",
  "family":"paribha","grandfather":"dada","grandmother":"dadi",
  "uncle":"kaka","aunt":"kaki","husband":"bandi","wife":"enec",
  "man":"hor","woman":"mare hor","boy":"kora","girl":"kuri",
  "person":"hor","people":"hor ko","friend":"mit horo","enemy":"durman",
  "stranger":"enar hor","neighbor":"cere orak hor","guest":"pahuna",
  "leader":"manjhi","elder":"marang hor","youth":"nawa kora",
  "king":"raja","queen":"rani","god":"bonga","spirit":"bonga",
  "ancestor":"hapam ko","community":"hor ko","tribe":"hor ko",
  // Body
  "head":"boho","hair":"bal","face":"mukh","eye":"met","eyes":"met",
  "ear":"luhur","ears":"luhur","nose":"nuk","mouth":"ho","lip":"bir ho",
  "tongue":"jiba","tooth":"dat","teeth":"dat","throat":"garang","neck":"gala",
  "shoulder":"kona","arm":"dal","hand":"hat","hands":"hat",
  "finger":"angul","fingers":"angul","nail":"nok","chest":"buku",
  "heart":"jiu","stomach":"ude","back":"sar","leg":"thet","legs":"thet",
  "knee":"dhuku","foot":"thet","feet":"thet","toe":"thet angul",
  "skin":"bala","blood":"khu","bone":"sika","breath":"san",
  "voice":"ror","life":"jibon","death":"dum",
  // Nature
  "sun":"sindi","moon":"cando","star":"itar","stars":"itar ko",
  "sky":"akash","cloud":"abrak","clouds":"abrak","rain":"barse",
  "wind":"polo","storm":"adi polo barse","thunder":"badal",
  "lightning":"bijuli","fog":"bur bur","snow":"him","ice":"him dak",
  "water":"dak","river":"daha","lake":"saru daha","sea":"marang daha",
  "ocean":"marang daha","mountain":"buru","hill":"saru buru",
  "valley":"buru majhare","forest":"bir","jungle":"bir",
  "tree":"dare","trees":"dare ko","leaf":"sakam","leaves":"sakam ko",
  "flower":"phul","flowers":"phul ko","fruit":"dareke",
  "grass":"ban","root":"jari","branch":"Dakar","seed":"bir",
  "soil":"mati","earth":"mati","ground":"mati","stone":"pathrao",
  "rock":"pathrao","sand":"balwa mati","mud":"cikut mati",
  "fire":"sengel","smoke":"dhuan","ash":"reak","light":"darap",
  "darkness":"andhir","shadow":"chaya","world":"disam","land":"disam",
  "country":"disam","village":"atu","field":"bari","road":"rasta",
  "path":"rasta","bridge":"pul",
  // Animals
  "dog":"seta","dogs":"seta ko","cat":"misi","cats":"misi ko",
  "cow":"gai","bull":"bael","ox":"bael","buffalo":"mase","goat":"mesa",
  "sheep":"bher","pig":"bike","horse":"ghora","elephant":"hathi",
  "tiger":"kul","lion":"siong","bear":"bhalu","deer":"sasan",
  "monkey":"bandar","snake":"bash","rat":"ikir","mouse":"ikir",
  "bird":"chirai","birds":"chirai ko","chicken":"kukura","hen":"kukura",
  "duck":"hans","fish":"ha","frog":"bakhar","butterfly":"phul chirai",
  "bee":"moali","ant":"kudi","worm":"cando","insect":"kirchi",
  "animal":"baha","animals":"baha ko",
  // Food
  "food":"joget","meal":"joget","rice":"dal bhat","cooked rice":"bhat",
  "bread":"roti","vegetable":"sag","vegetables":"sag","meat":"mas",
  "egg":"anda","milk":"dudh","tea":"cah","salt":"sil","sugar":"ini",
  "oil":"tel","curry":"jhol","sweet":"ini","sour":"tok",
  "bitter":"tithi","spicy":"jhol","hungry":"dhukau","thirsty":"dak leu",
  "mango":"am","banana":"kela","coconut":"narel","potato":"alu",
  "onion":"piaj","garlic":"roshun","chilli":"marich",
  // House & things
  "house":"orak","home":"orak","room":"kuti","door":"Diuri",
  "window":"janala","roof":"chhat","floor":"bhumit","wall":"bhitar",
  "bed":"nidar orak","chair":"kursit","table":"mesha","kitchen":"ran orak",
  "well":"kul","garden":"phul bari","market":"haat","shop":"dokan",
  "school":"iskoal","hospital":"birhi orak","temple":"bonga than",
  "money":"taaka","work":"seua","book":"puthi","clothes":"sali",
  "dress":"sali","shirt":"kot","wood":"kath","metal":"loha",
  "gold":"sonar","silver":"rup","knife":"bohok","axe":"tangi",
  "drum":"tamak","song":"serenj","dance":"nac","festival":"baha",
  "ceremony":"niyom",
  // Verbs
  "go":"ote","goes":"ote kana","going":"ote kana","went":"otea kana",
  "come":"hija","comes":"hija kana","coming":"hija kana","came":"hijua kana",
  "eat":"jom","eats":"jom kana","eating":"jom kana","ate":"joma kana",
  "drink":"inum","drinks":"inum kana","drinking":"inum kana","drank":"inuma kana",
  "sleep":"nidor","sleeps":"nidor kana","sleeping":"nidor kana","slept":"nidora kana",
  "wake":"uthar","woke":"uthara kana","sit":"unum","sitting":"unum kana",
  "stand":"othok","standing":"othok kana","walk":"latar","walking":"latar kana",
  "run":"ponot","running":"ponot kana","ran":"ponota kana",
  "work":"seua","working":"seua kana","worked":"seua akana",
  "speak":"ror","speaking":"ror kana","spoke":"rora kana",
  "talk":"ror","talking":"ror kana","say":"ror","said":"rora kana",
  "tell":"bujhao","told":"bujhaoa kana","listen":"suna","listening":"suna kana",
  "hear":"suna","heard":"sunoa kana","see":"tir","look":"tir","saw":"tira kana",
  "watch":"tir","read":"likha bacha","write":"likha","writing":"likha kana",
  "wrote":"likhaa kana","know":"ama","knew":"amaa kana",
  "think":"man","thought":"mana kana","understand":"bujhao",
  "understood":"bujhaoa kana","remember":"man ama","forget":"bae man",
  "want":"lel","need":"dorkae","like":"man","love":"priya","hate":"durman",
  "give":"em","gave":"ema kana","take":"pae","took":"paea kana",
  "bring":"hija em","put":"thoj","make":"cet","made":"ceta kana",
  "do":"cet","did":"ceta kana","done":"ceta kana",
  "buy":"kini","bought":"kinia kana","sell":"bik","sold":"bika kana",
  "open":"ujuk","close":"band","help":"sahay","call":"ohoi",
  "called":"ohoia kana","ask":"tahen","answer":"caba ror",
  "show":"serma tir","find":"herec","found":"hereca kana",
  "lose":"bae herec","lost":"bae hereca kana","return":"ulat hija",
  "send":"ote em","receive":"pae","hold":"jom","carry":"hej",
  "throw":"herel","catch":"dabao","pull":"tok","push":"dhak",
  "hit":"del","cut":"tor","break":"dara","build":"cet",
  "born":"janma","die":"dum","died":"duma kana","live":"cet jibon",
  "play":"nac","sing":"serenj ror","dance":"nac","swim":"dak re cet",
  "climb":"charao","fall":"doror","jump":"lompot","wash":"dhol",
  "clean":"safa","cook":"ran","plant":"dhar","harvest":"kaji",
  "grow":"boro","wait":"boro","leave":"ote","arrive":"hija caba",
  "start":"bihaan","stop":"caba","finish":"caba","continue":"age cet",
  "change":"bado","try":"cet herec","learn":"bujhao",
  "teach":"bujhao em","pray":"bonga man","worship":"bonga niyom",
  "celebrate":"baha cet","is":"do","are":"do","was":"do","were":"do",
  "be":"do","been":"caba","have":"pae","has":"pae","had":"paea",
  "will":"tahen","would":"hokan","could":"cet hokan","should":"dorkae",
  "can":"cet","must":"dorkae","shall":"tahen",
  // Adjectives
  "good":"eken","bad":"bae eken","great":"adi eken","wonderful":"adi eken caba",
  "beautiful":"sunder","ugly":"bae sunder","big":"boro","large":"boro",
  "small":"sana","little":"sana","long":"lamba","short":"sana",
  "tall":"boro","high":"boro","low":"sana","wide":"chawda",
  "narrow":"sana","thick":"cawda","thin":"sorla","heavy":"boro",
  "fast":"jaldi","slow":"hola hola","quick":"jaldi",
  "strong":"adi sakti","weak":"sana sakti","hard":"kaThin","soft":"sorla",
  "rough":"khosra","smooth":"sorla","sharp":"tijok",
  "old":"bujho","new":"nawa","young":"nawa","ancient":"hapam ren",
  "hot":"garam","warm":"moj garam","cold":"sita","cool":"moj sita",
  "wet":"barse","dry":"sukha","clean":"safa","dirty":"mila",
  "full":"bhori","empty":"khali","open":"ujuk","closed":"band",
  "rich":"dhan hor","poor":"garibi hor","happy":"khushi","sad":"dukhi",
  "angry":"khisi","afraid":"dare","brave":"bir","tired":"sirjom",
  "sick":"birhi","healthy":"eken caba","alive":"jibon","dead":"dum",
  "near":"cere","far":"dare","right":"eken","wrong":"bae eken",
  "true":"sachi","false":"bae sachi","same":"mit","different":"enar",
  "easy":"sorla","difficult":"kaThin","important":"baro","special":"baro",
  "ready":"caba","busy":"seua kana","free":"bini mul","safe":"eken caba",
  "possible":"hokan cet","impossible":"bae hokan",
  // Colors
  "white":"ujal","black":"kalom","red":"arang","green":"hariyali",
  "blue":"nil","yellow":"piyar","orange":"suntari rang","pink":"gulab rang",
  "purple":"baingan rang","brown":"khasao rang","grey":"dhusur",
  "golden":"sonar rang","silver":"rup rang","colour":"rang","color":"rang",
  // Directions
  "up":"upurun","down":"tala","inside":"bhitar","outside":"bahar",
  "left":"hadam","right":"sirjom","front":"age","back":"sar",
  "above":"upurun","below":"tala","between":"majhare","beside":"cere",
  "behind":"sar te","through":"bhitar te","across":"parer",
  "around":"cere","middle":"majhare","corner":"kona","top":"upurun",
  "bottom":"tala","side":"kona","straight":"sidha","turn":"ghur",
  "east":"bihaan kan","west":"san kan","north":"jharo kan","south":"sadom kan",
  // Common nouns
  "name":"min","age":"baya","place":"atu","thing":"mone janam",
  "word":"ror","story":"katha","news":"khobor","problem":"barhak",
  "reason":"karan","way":"rasta","idea":"man","dream":"nidor man",
  "wish":"asha","hope":"asha","plan":"cet lel","truth":"sachi",
  "lie":"rog ror","promise":"bachan","mistake":"bhul","help":"sahay",
  "gift":"bahan","pain":"birhi","happiness":"khushi","sorrow":"dukhi",
  "peace":"shanti","war":"larte","victory":"jitu","love":"priya",
  "friendship":"mit horo","respect":"man","faith":"biswas",
  "prayer":"bonga man","blessing":"niyom","health":"eken caba",
  "wealth":"dhan","power":"sakti","knowledge":"gyan","wisdom":"bujhao",
  "education":"bidya","language":"ror","music":"tarum","art":"kala",
  "nature":"pita","culture":"riti niti","tradition":"riti","custom":"niyom",
  "message":"katha","letter":"chiti","answer":"caba ror","question":"jigyasa",
  "number":"onka","price":"mul","weight":"boro","size":"onka boro",
  "colour":"rang","shape":"rup","smell":"gandh","sound":"awaaj",
  "taste":"cak","touch":"hat","sight":"met tir",
};

// ─── Phonetic transcription engine ────────────────────────────────────────────
// For words NOT in the dictionary (proper nouns, brand names, foreign words).
// Processes left-to-right, longest pattern first — gives approximate Santali
// Latin rendering so the word can still be shown in Ol Chiki script.

const _PHONETIC_RULES = [
  // 4-char
  ["tion","san"],["sion","san"],["ight","it"],["ough","o"],["ture","car"],
  ["tion","san"],["augh","o"],["ough","o"],
  // 3-char
  ["tch","c"],["dge","j"],["sch","sk"],["phr","pr"],["nce","ns"],
  ["nge","nj"],
  // 2-char
  ["th","t"],["sh","s"],["ch","c"],["ph","ph"],["wh","w"],["ck","k"],
  ["kn","n"],["gn","n"],["wr","r"],["gh",""],["qu","kw"],
  ["ee","i"],["ea","i"],["ai","e"],["ay","e"],["oo","u"],
  ["ou","au"],["ow","o"],["ey","i"],["ie","i"],["oa","o"],
  ["oe","o"],["ue","u"],["ui","u"],["au","ao"],
  // Single chars
  ["a","a"],["b","b"],["c","k"],["d","d"],["e","e"],["f","ph"],
  ["g","g"],["h","h"],["i","i"],["j","j"],["k","k"],["l","l"],
  ["m","m"],["n","n"],["o","o"],["p","p"],["q","k"],["r","r"],
  ["s","s"],["t","t"],["u","u"],["v","bh"],["w","w"],["x","ks"],
  ["y","y"],["z","j"],
];

function _phoneticTranscribe(word) {
  let w = word.toLowerCase().trim();
  // Remove trailing silent 'e' first (very common in English)
  if (w.length > 2 && w.endsWith('e') && !'aeiou'.includes(w[w.length-2])) {
    w = w.slice(0, -1);
  }
  let result = '';
  let i = 0;
  while (i < w.length) {
    let matched = false;
    for (const [pat, rep] of _PHONETIC_RULES) {
      if (w.startsWith(pat, i)) {
        result += rep;
        i += pat.length;
        matched = true;
        break;
      }
    }
    if (!matched) { result += w[i]; i++; }
  }
  return result;
}

// ─── Sorted phrases cache ─────────────────────────────────────────────────────
const _SORTED_PHRASES = [...SSC_PHRASES].sort((a, b) => b[0].length - a[0].length);

// ─── Core translation ─────────────────────────────────────────────────────────
function _translateSentence(sentence, transcribedSet) {
  const lower  = sentence.toLowerCase().trim();
  if (!lower)  return sentence;

  const tokens = lower.split(/\s+/);
  const out    = [];
  let i = 0;

  while (i < tokens.length) {
    let matched = false;

    // Try phrase matching
    for (const [phrase, santali] of _SORTED_PHRASES) {
      const words = phrase.split(' ');
      if (i + words.length <= tokens.length) {
        if (tokens.slice(i, i + words.length).join(' ') === phrase) {
          out.push(santali);
          i += words.length;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const raw   = tokens[i];
      const trail = raw.match(/[.,!?;:'")\-]+$/)?.[0] || '';
      const clean = raw.replace(/^['"(]+|[.,!?;:'")\-]+$/g, '').toLowerCase();

      if (!clean) { out.push(raw); i++; continue; }

      // 1. Exact dictionary lookup
      let santali = SSC_WORDS[clean];

      // 2. Singular fallback (strip trailing 's')
      if (!santali && clean.endsWith('s') && clean.length > 2) {
        santali = SSC_WORDS[clean.slice(0, -1)];
        if (santali) santali += ' ko'; // Santali plural marker
      }

      // 3. Not found → phonetic transcription
      if (!santali) {
        const phonetic = _phoneticTranscribe(clean);
        santali = phonetic;
        // Record this word as transcribed (avoid duplicates)
        const key = clean.toLowerCase();
        if (!transcribedSet.has(key)) {
          transcribedSet.set(key, phonetic);
        }
      }

      out.push(santali + trail);
      i++;
    }
  }

  return out.join(' ');
}

/**
 * Translate English text to Santali Latin.
 * Unknown words are phonetically transcribed and reported separately.
 *
 * @param {string} englishText
 * @returns {{ result: string, transcribed: Array<{english:string, santaliLatin:string}> }}
 */
function translateEnglishToSantali(englishText) {
  if (!englishText || !englishText.trim()) return { result: '', transcribed: [] };

  // Expand contractions
  let text = englishText;
  for (const [c, e] of Object.entries(SSC_CONTRACTIONS)) {
    text = text.replace(new RegExp('\\b' + c.replace(/'/g, "\\'") + '\\b', 'gi'), e);
  }

  const transcribedMap = new Map(); // english → santali phonetic
  const sentenceRe     = /([^.!?\n]+[.!?\n]*)/g;
  const sentences      = text.match(sentenceRe) || [text];

  const translated = sentences.map(s => {
    const trimmed = s.trim();
    if (!trimmed) return s;
    const punct   = trimmed.match(/[.!?\n]+$/)?.[0] || '';
    const core    = trimmed.slice(0, trimmed.length - punct.length).trim();
    const result  = _translateSentence(core, transcribedMap);
    const capped  = result.charAt(0).toUpperCase() + result.slice(1);
    return capped + punct;
  });

  const transcribed = [...transcribedMap.entries()].map(([english, santaliLatin]) => ({
    english,
    santaliLatin,
  }));

  return { result: translated.join(' ').trim(), transcribed };
}

const SSC_REVERSE = {};
for (const [english, santali] of Object.entries(SSC_WORDS)) {
  if (!SSC_REVERSE[santali]) {
    SSC_REVERSE[santali] = english;
  }
}

const SSC_REVERSE_PHRASES = Object.entries(SSC_WORDS)
  .filter(([eng, san]) => san.includes(' '))
  .map(([eng, san]) => [san, eng])
  .sort((a, b) => b[0].length - a[0].length);