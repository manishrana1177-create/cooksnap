// Comprehensive ingredient database with English + Hinglish names
// Each entry has: english name, hinglish name(s), category, and common unit

export interface IngredientEntry {
  english: string
  hinglish: string[]
  category: string
  emoji: string
}

export const INGREDIENTS_DB: IngredientEntry[] = [
  // Protein
  { english: "Chicken", hinglish: ["Murgi", "Chicken", "Murgh"], category: "protein", emoji: "🍗" },
  { english: "Egg", hinglish: ["Anda", "Egg", "Dim"], category: "protein", emoji: "🥚" },
  { english: "Fish", hinglish: ["Machhi", "Fish", "Machli"], category: "protein", emoji: "🐟" },
  { english: "Mutton", hinglish: ["Mutton", "Lamb", "Goat meat", "Bakre ka meat"], category: "protein", emoji: "🥩" },
  { english: "Prawns", hinglish: ["Jhinga", "Prawns", "Shrimp"], category: "protein", emoji: "🦐" },
  { english: "Paneer", hinglish: ["Paneer", "Cottage cheese"], category: "protein", emoji: "🧀" },
  { english: "Tofu", hinglish: ["Tofu", "Soy paneer"], category: "protein", emoji: "🧊" },
  { english: "Lentils", hinglish: ["Dal", "Lentils", "Daal"], category: "protein", emoji: "🫘" },
  { english: "Chickpeas", hinglish: ["Chole", "Kabuli chana", "Chickpeas", "Chana"], category: "protein", emoji: "🫘" },
  { english: "Kidney Beans", hinglish: ["Rajma", "Kidney beans"], category: "protein", emoji: "🫘" },
  { english: "Black Gram", hinglish: ["Urad dal", "Maash ki dal"], category: "protein", emoji: "🫘" },
  { english: "Minced Meat", hinglish: ["Keema", "Minced meat", "Ground meat"], category: "protein", emoji: "🥩" },
  { english: "Turkey", hinglish: ["Turkey", "Bada murgi"], category: "protein", emoji: "🍗" },
  { english: "Crab", hinglish: ["Crab", "Kekda"], category: "protein", emoji: "🦀" },

  // Vegetables
  { english: "Tomato", hinglish: ["Tamatar", "Tomato"], category: "vegetable", emoji: "🍅" },
  { english: "Onion", hinglish: ["Pyaz", "Onion", "Kanda"], category: "vegetable", emoji: "🧅" },
  { english: "Potato", hinglish: ["Aloo", "Potato", "Batata"], category: "vegetable", emoji: "🥔" },
  { english: "Garlic", hinglish: ["Lehsun", "Garlic", "Lasun"], category: "vegetable", emoji: "🧄" },
  { english: "Ginger", hinglish: ["Adrak", "Ginger"], category: "vegetable", emoji: "🫚" },
  { english: "Green Chili", hinglish: ["Hari mirch", "Green chili", "Mirchi"], category: "vegetable", emoji: "🌶️" },
  { english: "Capsicum", hinglish: ["Shimla mirch", "Capsicum", "Bell pepper"], category: "vegetable", emoji: "🫑" },
  { english: "Cauliflower", hinglish: ["Gobi", "Cauliflower", "Phool gobi"], category: "vegetable", emoji: "🥦" },
  { english: "Cabbage", hinglish: ["Patta gobi", "Cabbage", "Band gobi"], category: "vegetable", emoji: "🥬" },
  { english: "Spinach", hinglish: ["Palak", "Spinach"], category: "vegetable", emoji: "🥬" },
  { english: "Carrot", hinglish: ["Gajar", "Carrot"], category: "vegetable", emoji: "🥕" },
  { english: "Green Peas", hinglish: ["Matar", "Green peas", "Peas"], category: "vegetable", emoji: "🟢" },
  { english: "Okra", hinglish: ["Bhindi", "Okra", "Lady finger"], category: "vegetable", emoji: "🥒" },
  { english: "Eggplant", hinglish: ["Baingan", "Eggplant", "Brinjal"], category: "vegetable", emoji: "🍆" },
  { english: "Bitter Gourd", hinglish: ["Karela", "Bitter gourd", "Bitter melon"], category: "vegetable", emoji: "🥒" },
  { english: "Ridge Gourd", hinglish: ["Turai", "Ridge gourd", "Torai"], category: "vegetable", emoji: "🥒" },
  { english: "Bottle Gourd", hinglish: ["Lauki", "Bottle gourd", "Dudhi"], category: "vegetable", emoji: "🥒" },
  { english: "Pumpkin", hinglish: ["Kaddu", "Pumpkin", "Sitaphal"], category: "vegetable", emoji: "🎃" },
  { english: "Radish", hinglish: ["Mooli", "Radish", "Daikon"], category: "vegetable", emoji: "🥕" },
  { english: "Turnip", hinglish: ["Shalgam", "Turnip"], category: "vegetable", emoji: "🥕" },
  { english: "Beetroot", hinglish: ["Chukandar", "Beetroot", "Beet"], category: "vegetable", emoji: "🟣" },
  { english: "Mushroom", hinglish: ["Mushroom", "Khumb"], category: "vegetable", emoji: "🍄" },
  { english: "Corn", hinglish: ["Makka", "Corn", "Sweet corn", "Bhutta"], category: "vegetable", emoji: "🌽" },
  { english: "Drumstick", hinglish: ["Sahjan", "Drumstick", "Moringa"], category: "vegetable", emoji: "🥢" },
  { english: "Fenugreek Leaves", hinglish: ["Methi", "Fenugreek leaves"], category: "vegetable", emoji: "🌿" },
  { english: "Coriander Leaves", hinglish: ["Dhania", "Cilantro", "Coriander leaves", "Hara dhania"], category: "vegetable", emoji: "🌿" },
  { english: "Mint Leaves", hinglish: ["Pudina", "Mint leaves", "Mint"], category: "vegetable", emoji: "🌿" },
  { english: "Curry Leaves", hinglish: ["Curry patta", "Kadi patta", "Curry leaves"], category: "vegetable", emoji: "🌿" },
  { english: "Green Beans", hinglish: ["Sem phali", "French beans", "Green beans"], category: "vegetable", emoji: "🫘" },

  // Fruits
  { english: "Lemon", hinglish: ["Nimbu", "Lemon"], category: "fruit", emoji: "🍋" },
  { english: "Mango", hinglish: ["Aam", "Mango"], category: "fruit", emoji: "🥭" },
  { english: "Banana", hinglish: ["Kela", "Banana"], category: "fruit", emoji: "🍌" },
  { english: "Apple", hinglish: ["Seb", "Apple"], category: "fruit", emoji: "🍎" },
  { english: "Coconut", hinglish: ["Nariyal", "Coconut"], category: "fruit", emoji: "🥥" },
  { english: "Pomegranate", hinglish: ["Anar", "Pomegranate"], category: "fruit", emoji: "🫐" },
  { english: "Papaya", hinglish: ["Papita", "Papaya"], category: "fruit", emoji: "🍈" },
  { english: "Pineapple", hinglish: ["Ananas", "Pineapple"], category: "fruit", emoji: "🍍" },
  { english: "Lime", hinglish: ["Kagzi nimbu", "Lime"], category: "fruit", emoji: "🍏" },
  { english: "Tamarind", hinglish: ["Imli", "Tamarind"], category: "fruit", emoji: "🟤" },
  { english: "Indian Gooseberry", hinglish: ["Amla", "Gooseberry"], category: "fruit", emoji: "🟢" },

  // Dairy
  { english: "Milk", hinglish: ["Doodh", "Milk"], category: "dairy", emoji: "🥛" },
  { english: "Curd/Yogurt", hinglish: ["Dahi", "Curd", "Yogurt"], category: "dairy", emoji: "🥛" },
  { english: "Butter", hinglish: ["Makhan", "Butter"], category: "dairy", emoji: "🧈" },
  { english: "Ghee", hinglish: ["Ghee", "Clarified butter"], category: "dairy", emoji: "🫙" },
  { english: "Cream", hinglish: ["Malai", "Cream", "Heavy cream"], category: "dairy", emoji: "🥛" },
  { english: "Cheese", hinglish: ["Cheese", "Paneer"], category: "dairy", emoji: "🧀" },
  { english: "Buttermilk", hinglish: ["Chhach", "Buttermilk", "Mattha"], category: "dairy", emoji: "🥛" },
  { english: "Condensed Milk", hinglish: ["Mawa", "Khoya", "Condensed milk"], category: "dairy", emoji: "🥫" },

  // Grains
  { english: "Rice", hinglish: ["Chawal", "Rice"], category: "grain", emoji: "🍚" },
  { english: "Wheat Flour", hinglish: ["Atta", "Wheat flour", "Maida"], category: "grain", emoji: "🌾" },
  { english: "Basmati Rice", hinglish: ["Basmati chawal", "Basmati rice"], category: "grain", emoji: "🍚" },
  { english: "Bread", hinglish: ["Bread", "Double roti"], category: "grain", emoji: "🍞" },
  { english: "Semolina", hinglish: ["Sooji", "Rava", "Semolina"], category: "grain", emoji: "🌾" },
  { english: "Gram Flour", hinglish: ["Besan", "Gram flour", "Chana flour"], category: "grain", emoji: "🌾" },
  { english: "Oats", hinglish: ["Oats", "Jai"], category: "grain", emoji: "🥣" },
  { english: "Poha", hinglish: ["Poha", "Flattened rice", "Chivda"], category: "grain", emoji: "🌾" },
  { english: "Vermicelli", hinglish: ["Sevai", "Vermicelli"], category: "grain", emoji: "🍜" },
  { english: "Noodles", hinglish: ["Noodles", "Sevai"], category: "grain", emoji: "🍜" },
  { english: "Pasta", hinglish: ["Pasta", "Meethi sevai"], category: "grain", emoji: "🍝" },
  { english: "Cornmeal", hinglish: ["Makki ka atta", "Cornmeal", "Corn flour"], category: "grain", emoji: "🌽" },
  { english: "Millet", hinglish: ["Bajra", "Millet", "Jowar", "Ragi"], category: "grain", emoji: "🌾" },

  // Spices
  { english: "Turmeric", hinglish: ["Haldi", "Turmeric"], category: "spice", emoji: "🟡" },
  { english: "Red Chili Powder", hinglish: ["Lal mirch powder", "Red chili powder", "Mirch powder"], category: "spice", emoji: "🌶️" },
  { english: "Cumin Seeds", hinglish: ["Jeera", "Cumin seeds"], category: "spice", emoji: "🟤" },
  { english: "Coriander Powder", hinglish: ["Dhania powder", "Coriander powder"], category: "spice", emoji: "🟤" },
  { english: "Garam Masala", hinglish: ["Garam masala"], category: "spice", emoji: "🫙" },
  { english: "Mustard Seeds", hinglish: ["Rai", "Sarson", "Mustard seeds"], category: "spice", emoji: "🟤" },
  { english: "Fenugreek Seeds", hinglish: ["Methi dana", "Fenugreek seeds"], category: "spice", emoji: "🟤" },
  { english: "Cardamom", hinglish: ["Elaichi", "Cardamom"], category: "spice", emoji: "🟢" },
  { english: "Cinnamon", hinglish: ["Dalchini", "Cinnamon"], category: "spice", emoji: "🟤" },
  { english: "Cloves", hinglish: ["Laung", "Cloves"], category: "spice", emoji: "🟤" },
  { english: "Black Pepper", hinglish: ["Kali mirch", "Black pepper"], category: "spice", emoji: "⚫" },
  { english: "Bay Leaf", hinglish: ["Tej patta", "Bay leaf"], category: "spice", emoji: "🍃" },
  { english: "Star Anise", hinglish: ["Badiyan", "Star anise", "Chakri phool"], category: "spice", emoji: "⭐" },
  { english: "Saffron", hinglish: ["Kesar", "Saffron", "Zafran"], category: "spice", emoji: "🧡" },
  { english: "Nutmeg", hinglish: ["Jaiphal", "Nutmeg"], category: "spice", emoji: "🟤" },
  { english: "Asafoetida", hinglish: ["Hing", "Asafoetida"], category: "spice", emoji: "🟡" },
  { english: "Fennel Seeds", hinglish: ["Saunf", "Fennel seeds"], category: "spice", emoji: "🟢" },
  { english: "Carom Seeds", hinglish: ["Ajwain", "Carom seeds"], category: "spice", emoji: "🟤" },
  { english: "Mango Powder", hinglish: ["Amchur", "Dry mango powder", "Aamchoor"], category: "spice", emoji: "🟡" },
  { english: "Pomegranate Seeds", hinglish: ["Anardana", "Pomegranate seeds"], category: "spice", emoji: "🔴" },
  { english: "Black Salt", hinglish: ["Kala namak", "Black salt"], category: "spice", emoji: "⚫" },
  { english: "Chaat Masala", hinglish: ["Chaat masala"], category: "spice", emoji: "🫙" },
  { english: "Sambhar Masala", hinglish: ["Sambhar masala"], category: "spice", emoji: "🫙" },
  { english: "Kitchen King Masala", hinglish: ["Kitchen king masala"], category: "spice", emoji: "🫙" },
  { english: "Tandoori Masala", hinglish: ["Tandoori masala"], category: "spice", emoji: "🫙" },
  { english: "Five Spice", hinglish: ["Panch phoron", "Five spice"], category: "spice", emoji: "🫙" },

  // Condiments
  { english: "Soy Sauce", hinglish: ["Soy sauce"], category: "condiment", emoji: "🫗" },
  { english: "Vinegar", hinglish: ["Sirka", "Vinegar"], category: "condiment", emoji: "🫗" },
  { english: "Tomato Ketchup", hinglish: ["Tomato ketchup", "Tomato sauce"], category: "condiment", emoji: "🥫" },
  { english: "Green Chutney", hinglish: ["Hari chutney", "Green chutney"], category: "condiment", emoji: "🟢" },
  { english: "Tamarind Chutney", hinglish: ["Imli ki chutney", "Tamarind chutney", "Meethi chutney"], category: "condiment", emoji: "🟤" },
  { english: "Honey", hinglish: ["Shahad", "Honey"], category: "condiment", emoji: "🍯" },
  { english: "Sugar", hinglish: ["Cheeni", "Shakkar", "Sugar"], category: "condiment", emoji: "🧂" },
  { english: "Salt", hinglish: ["Namak", "Salt"], category: "condiment", emoji: "🧂" },
  { english: "Oil", hinglish: ["Tel", "Oil"], category: "condiment", emoji: "🫗" },
  { english: "Mustard Oil", hinglish: ["Sarson ka tel", "Mustard oil"], category: "condiment", emoji: "🫗" },
  { english: "Coconut Oil", hinglish: ["Nariyal ka tel", "Coconut oil"], category: "condiment", emoji: "🫗" },
  { english: "Sesame Oil", hinglish: ["Til ka tel", "Sesame oil"], category: "condiment", emoji: "🫗" },
  { english: "Olive Oil", hinglish: ["Olive oil", "Jaitun ka tel"], category: "condiment", emoji: "🫗" },
  { english: "Pickle", hinglish: ["Achaar", "Pickle"], category: "condiment", emoji: "🫙" },
  { english: "Papad", hinglish: ["Papad", "Poppadom"], category: "condiment", emoji: "🫓" },

  // Beverage
  { english: "Water", hinglish: ["Paani", "Water"], category: "beverage", emoji: "💧" },
  { english: "Tea", hinglish: ["Chai", "Tea"], category: "beverage", emoji: "🍵" },
  { english: "Coffee", hinglish: ["Coffee", "Kafi"], category: "beverage", emoji: "☕" },
  { english: "Coconut Water", hinglish: ["Nariyal paani", "Coconut water"], category: "beverage", emoji: "🥥" },
  { english: "Lassi", hinglish: ["Lassi", "Buttermilk drink"], category: "beverage", emoji: "🥛" },
]

// Search function that matches English and Hinglish names
export function searchIngredients(query: string): IngredientEntry[] {
  if (!query || query.trim().length === 0) return []

  const q = query.toLowerCase().trim()

  return INGREDIENTS_DB.filter((item) => {
    // Match against English name
    if (item.english.toLowerCase().includes(q)) return true
    // Match against all Hinglish names
    if (item.hinglish.some((h) => h.toLowerCase().includes(q))) return true
    return false
  }).slice(0, 10) // Limit to 10 suggestions
}

// Get the display name (shows both English and Hinglish)
export function getIngredientDisplayName(english: string): string {
  const entry = INGREDIENTS_DB.find((i) => i.english === english)
  if (!entry) return english
  // If Hinglish is different from English, show both
  const hinglishName = entry.hinglish.find((h) => h.toLowerCase() !== english.toLowerCase())
  return hinglishName ? `${english} (${hinglishName})` : english
}
