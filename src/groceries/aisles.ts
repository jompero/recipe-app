// Aisles (GLOSSARY.md, US-10.11): the merged grocery list in sections, in the order of a walk
// round the shop. The aisle comes from a static table keyed on the merge key (mergeKey.ts), so
// plurals and synonyms land together. Fix a misplaced item by editing the table; anything it
// doesn't know goes to Other.
import { singular } from "./mergeKey.ts";
import type { MergedLine } from "./types.ts";

/** The aisles, in the order the list shows them. */
export const AISLES = [
  "Produce",
  "Bakery",
  "Dairy",
  "Meat & fish",
  "Dry goods",
  "Frozen",
  "Other",
] as const;

export type Aisle = (typeof AISLES)[number];

/**
 * The aisle for a merge key. Tries the key's endings, longest first ("tin chopped tomato", then
 * "chopped tomato"), then its single words from the end, also made singular ("parmesan cheese
 * shredded" finds "cheese", "sweet potatoes chopped" finds "potato").
 * A key starting with "frozen" is Frozen; with "dried" or "dry", Dry goods.
 */
export function aisleOf(key: string): Aisle {
  const words = key.toLowerCase().split(/\s+/).filter(Boolean);
  if (words[0] === "frozen") return "Frozen";
  if (words[0] === "dried" || words[0] === "dry") return "Dry goods";
  for (let start = 0; start < words.length; start++) {
    const aisle = TABLE.get(words.slice(start).join(" "));
    if (aisle) return aisle;
  }
  for (let index = words.length - 1; index >= 0; index--) {
    const aisle = TABLE.get(words[index]!) ?? TABLE.get(singular(words[index]!));
    if (aisle) return aisle;
  }
  return "Other";
}

/** One aisle's merged lines, A–Z as `mergeLines` gives them. */
export interface AisleGroup {
  aisle: Aisle;
  lines: MergedLine[];
}

/** Merged lines in aisle sections, in the aisles' order; empty aisles are left out. */
export function groupByAisle(lines: MergedLine[]): AisleGroup[] {
  return AISLES.map((aisle) => ({
    aisle,
    lines: lines.filter((line) => aisleOf(line.key) === aisle),
  })).filter((group) => group.lines.length > 0);
}

/**
 * Words and phrases, as merge keys (lowercase, the last word singular), by aisle. Seeded from the
 * ingredients in the base data. A phrase beats a word in it: "coconut milk" is Dry goods though
 * "milk" is Dairy. Danish and Finnish names seen in the recipes are included.
 */
// prettier-ignore
const WORDS: Record<Aisle, string[]> = {
  Produce: [
    "onion", "red onion", "scallion", "spring onion", "shallot", "leek", "garlic", "carrot",
    "potato", "sweet potato", "squash", "pumpkin", "zucchini", "eggplant", "aubergine",
    "tomato", "cucumber", "bell pepper", "red pepper", "green pepper", "yellow pepper",
    "chili", "chilli", "chile", "chilly", "jalapeño", "jalapeno", "mushroom", "shitake",
    "shitaki", "spinach", "kale", "lettuce", "salad", "rucola", "arugula", "cabbage",
    "bok choy", "broccoli", "cauliflower", "celery", "fennel", "asparagus", "beetroot",
    "punajuurta", "parsnip", "radish", "artichoke", "green bean", "sprout", "avocado",
    "banana", "apple", "pear", "lemon", "lime", "orange", "clementine", "citron", "mango",
    "pineapple", "melon", "persimmon", "pomegranate", "rhubarb", "berry", "blueberry",
    "raspberry", "strawberry", "mustikoita", "grape", "ginger", "galangal", "lemongrass",
    "herb", "basil", "parsley", "dill", "chive", "coriander", "cilantro", "mint", "sage",
    "thyme", "rosemary", "tarragon", "lovage", "vegetable", "veggy", "veggie", "green",
    "root vegetable", "sipuli", "tofu", "coleslaw",
  ],
  Bakery: [
    "bread", "bun", "tortilla", "tortilla wrap", "wrap", "pita", "toast", "baguette",
    "sourdough", "pizza base", "naan", "crispbread",
  ],
  Dairy: [
    "milk", "whole milk", "buttermilk", "cream", "butter", "cheese", "parmesan", "mozzarella",
    "feta", "halloumi", "cheddar", "gorgonzola", "gruyere", "emmental", "provolone",
    "burrata", "ricotta", "mascarpone", "romano", "monterey jack", "cream cheese", "yogurt",
    "yoghurt", "skyr", "quark", "creme fraiche", "crème fraîche", "fraiche", "fraîche",
    "ymer", "tykmælk", "kermaviili", "egg", "æggeblommer", "æggehvider", "margarine",
    "margarin", "kærnemælk", "letmælk", "sødmælk", "smør", "maito", "fløde", "kerma",
  ],
  "Meat & fish": [
    "chicken", "beef", "pork", "lamb", "turkey", "bacon", "ham", "prosciutto", "gammon",
    "sausage", "chorizo", "steak", "mince", "minced meat", "meatball", "salmon", "cod",
    "haddock", "plaice", "fish", "fish fillet", "fillet", "shrimp", "prawn", "soup hen",
  ],
  "Dry goods": [
    "salt", "pepper", "black pepper", "white pepper", "peppercorn", "salt and pepper",
    "sugar", "flour", "wheat flour", "oil", "olive oil", "vinegar", "rice", "risotto",
    "pasta", "spaghetti", "macaroni", "penne", "rigatoni", "lasagna", "noodle", "gnocchi",
    "tortellini", "quinoa", "bulgur", "couscous", "oat", "oatmeal", "lentil", "bean",
    "chickpea", "yeast", "gær", "baking powder", "baking soda", "bagepulver", "powder",
    "flake", "starch", "corn starch", "cornstarch", "breadcrumb", "crumb", "panko", "honey",
    "syrup", "maple syrup", "mustard", "ketchup", "mayo", "mayonnaise", "remoulade", "sauce",
    "soy", "soy sauce", "sriracha", "tabasco", "tamari", "mirin", "pesto", "salsa",
    "chimichurri", "dressing", "stock", "broth", "bouillon", "tomato paste", "paste",
    "tomato puree", "tomato purée", "puree", "passata", "chopped tomato", "peeled tomato",
    "crushed tomato", "tomato soup", "dried tomato", "sun-dried tomato", "sundried tomato",
    "coconut milk", "kookosmaitoa", "peanut butter", "nut", "walnut", "hazelnut", "almond",
    "pine nut", "seed", "pepita", "caper", "olive", "pickle", "gherkin", "raisin", "date",
    "chocolate", "chocolate chip", "cocoa", "kakao", "vanilla", "extract", "vanilla sugar",
    "paprika", "cumin", "turmeric", "cinnamon", "kanel", "cardamom", "kardemomme",
    "kardemummaa", "nutmeg", "curry", "cayenne", "oregano", "five spice", "sumac",
    "za'atar", "spice", "tuna", "corn", "sweetcorn", "corn kernel", "jelly", "jam",
    "rice paper", "cooking spray", "spray", "hummus", "flaxmeal", "hvedemel", "sukker",
    "vehnäjauhoja", "grahamsmel", "graham flour", "korppujauhoja", "vaniljesukker", "rørsukker",
    "peber", "olivenolie", "mel", "hunajaa", "kernel", "ground coriander", "grounded coriander",
    "crushed coriander", "ground ginger",
  ],
  Frozen: ["fish stick", "pea", "ice cream", "falafel"],
  Other: [],
};

const TABLE = new Map<string, Aisle>(
  AISLES.flatMap((aisle) => WORDS[aisle].map((word) => [word, aisle] as const)),
);
