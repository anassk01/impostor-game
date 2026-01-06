// ============================================
// CONSTANTS & WORD DATA
// ============================================
export const WORD_CATEGORIES = {
  en: {
    food: ['Pizza', 'Sushi', 'Burger', 'Taco', 'Pasta', 'Ice Cream', 'Chocolate', 'Steak', 'Salad', 'Soup', 'Sandwich', 'Pancake', 'Donut', 'Popcorn', 'Cheese'],
    animals: ['Dog', 'Cat', 'Elephant', 'Lion', 'Penguin', 'Dolphin', 'Eagle', 'Snake', 'Rabbit', 'Tiger', 'Bear', 'Monkey', 'Giraffe', 'Wolf', 'Owl'],
    movies: ['Titanic', 'Avatar', 'Inception', 'Frozen', 'Jaws', 'Matrix', 'Shrek', 'Batman', 'Joker', 'Alien', 'Rocky', 'Gladiator', 'Up', 'Coco', 'Moana'],
    places: ['Beach', 'Mountain', 'Paris', 'Hospital', 'School', 'Airport', 'Museum', 'Library', 'Restaurant', 'Zoo', 'Stadium', 'Castle', 'Desert', 'Forest', 'Island'],
    sports: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Golf', 'Baseball', 'Hockey', 'Boxing', 'Skiing', 'Surfing', 'Cycling', 'Wrestling', 'Volleyball', 'Rugby', 'Cricket'],
    objects: ['Phone', 'Guitar', 'Clock', 'Mirror', 'Umbrella', 'Candle', 'Camera', 'Scissors', 'Balloon', 'Ladder', 'Hammer', 'Pillow', 'Backpack', 'Glasses', 'Key']
  },
  ar: {
    food: ['بيتزا', 'سوشي', 'برجر', 'تاكو', 'باستا', 'آيس كريم', 'شوكولاتة', 'ستيك', 'سلطة', 'شوربة', 'ساندويتش', 'فطيرة', 'دونات', 'فشار', 'جبن'],
    animals: ['كلب', 'قطة', 'فيل', 'أسد', 'بطريق', 'دولفين', 'نسر', 'ثعبان', 'أرنب', 'نمر', 'دب', 'قرد', 'زرافة', 'ذئب', 'بومة'],
    movies: ['تايتانيك', 'أفاتار', 'إنسبشن', 'فروزن', 'جوز', 'ماتريكس', 'شريك', 'باتمان', 'جوكر', 'إليين', 'روكي', 'جلادياتور', 'أب', 'كوكو', 'موانا'],
    places: ['شاطئ', 'جبل', 'باريس', 'مستشفى', 'مدرسة', 'مطار', 'متحف', 'مكتبة', 'مطعم', 'حديقة حيوان', 'ملعب', 'قصر', 'صحراء', 'غابة', 'جزيرة'],
    sports: ['كرة قدم', 'كرة سلة', 'تنس', 'سباحة', 'جولف', 'بيسبول', 'هوكي', 'ملاكمة', 'تزلج', 'ركوب أمواج', 'دراجات', 'مصارعة', 'كرة طائرة', 'رجبي', 'كريكيت'],
    objects: ['هاتف', 'جيتار', 'ساعة', 'مرآة', 'مظلة', 'شمعة', 'كاميرا', 'مقص', 'بالون', 'سلم', 'مطرقة', 'وسادة', 'حقيبة ظهر', 'نظارات', 'مفتاح']
  }
};

export const CATEGORY_NAMES = {
  en: { food: 'Food', animals: 'Animals', movies: 'Movies', places: 'Places', sports: 'Sports', objects: 'Objects' },
  ar: { food: 'طعام', animals: 'حيوانات', movies: 'أفلام', places: 'أماكن', sports: 'رياضة', objects: 'أشياء' }
};

export const PHASES = {
  HOME: 'home',
  LOBBY: 'lobby',
  CLUE: 'clue',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  ROUND_RESULT: 'round_result',
  REVEAL: 'reveal'
};
