/** Find Your Match: the six questions (spec §8). Option ids are the product attribute values they match. */

export type QuestionId = 'flavours' | 'spice' | 'texture' | 'occasion' | 'priority' | 'style';

export interface QuizOption {
  id: string;
  label: string;
  /** Round photo shown on the option. */
  image: string;
}

export interface QuizQuestion {
  id: QuestionId;
  /** Stepper label on wide screens. */
  step: string;
  /** Stepper label on phones. */
  short: string;
  title: string;
  hint: string;
  /** How many options may be picked; 1 behaves like radio buttons. */
  max: number;
  note?: string;
  options: QuizOption[];
}

export type QuizAnswers = Record<QuestionId, string[]>;

const img = (name: string) => `/images/quiz/${name}.webp`;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'flavours',
    step: 'Favourite Flavours',
    short: 'Flavours',
    title: 'What flavours do you love most?',
    hint: 'Select up to 3 options',
    max: 3,
    options: [
      { id: 'spicy', label: 'Spicy & Bold', image: img('spicy-bold') },
      { id: 'creamy', label: 'Creamy & Rich', image: img('creamy-rich') },
      { id: 'herby', label: 'Fresh & Herby', image: img('fresh-herby') },
      { id: 'comforting', label: 'Comforting & Classic', image: img('comforting-classic') },
      { id: 'soupy', label: 'Soupy & Light', image: img('soupy-light') },
      { id: 'sweet', label: 'Sweet & Unique', image: img('sweet-unique') },
    ],
  },
  {
    id: 'spice',
    step: 'Spice Level',
    short: 'Spice',
    title: 'How much spice do you enjoy?',
    hint: 'Choose the heat level that feels right for you.',
    max: 1,
    note: 'We’ll use this to balance your recommendations.',
    options: [
      { id: '0', label: 'No Heat', image: img('no-heat') },
      { id: '1', label: 'Mild Warmth', image: img('mild-warmth') },
      { id: '2', label: 'Medium Kick', image: img('medium-kick') },
      { id: '3', label: 'Spicy', image: img('spicy') },
      { id: '4', label: 'Extra Hot', image: img('extra-hot') },
    ],
  },
  {
    id: 'texture',
    step: 'Texture',
    short: 'Texture',
    title: 'What textures do you enjoy?',
    hint: 'Select up to 2 options',
    max: 2,
    options: [
      { id: 'twirly', label: 'Twirly & Saucy', image: img('twirly-saucy') },
      { id: 'brothy', label: 'Brothy & Tender', image: img('brothy-tender') },
      { id: 'creamy', label: 'Creamy & Cheesy', image: img('creamy-cheesy') },
      { id: 'soft', label: 'Soft & Comforting', image: img('soft-comforting') },
    ],
  },
  {
    id: 'occasion',
    step: 'Eating Occasion',
    short: 'Occasion',
    title: 'When will you enjoy your MAGO cups?',
    hint: 'Select up to 2 options',
    max: 2,
    options: [
      { id: 'quick-lunch', label: 'Quick Lunch', image: img('quick-lunch') },
      { id: 'on-the-go', label: 'On-the-Go Days', image: img('on-the-go') },
      { id: 'at-home', label: 'At Home', image: img('at-home') },
      { id: 'post-workout', label: 'Post-Workout Fuel', image: img('post-workout') },
    ],
  },
  {
    id: 'priority',
    step: 'Purchase Priority',
    short: 'Priority',
    title: 'What matters most to you?',
    hint: 'Choose one',
    max: 1,
    options: [
      { id: 'protein', label: 'Highest Protein', image: img('highest-protein') },
      { id: 'bold', label: 'Bold New Flavours', image: img('bold-new') },
      { id: 'comfort', label: 'Classic Comfort', image: img('classic-comfort') },
      { id: 'value', label: 'Best Value', image: img('best-value') },
    ],
  },
  {
    id: 'style',
    step: 'Mediterranean Style',
    short: 'Style',
    title: 'Which Mediterranean style is you?',
    hint: 'Choose one',
    max: 1,
    options: [
      { id: 'lebanese', label: 'Lebanese Classics', image: img('lebanese-classics') },
      { id: 'italian', label: 'Italian Classics', image: img('italian-classics') },
      { id: 'both', label: 'A Bit of Both', image: img('bit-of-both') },
    ],
  },
];

export function emptyAnswers(): QuizAnswers {
  return { flavours: [], spice: [], texture: [], occasion: [], priority: [], style: [] };
}
