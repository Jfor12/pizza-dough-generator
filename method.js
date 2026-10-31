// The step-by-step method for a computed recipe, in the chosen units.
// Returns [{ id, title, text, why, minutes, timer, preheat, note }]:
// - text: what to do, starting with the leading action in <strong class="lead">; may contain <strong>/<em> only.
// - why: the longer explanation (shown behind a "Why?" toggle on phones), or ''.
// - minutes: typical time from the start of this step to the start of the next one. Their sum is the time
//   from starting to the first pizza going in the oven (the bake step and notes count as 0).
// - timer: { name, minutes } for steps that are a wait (rest, rise, proof, preheat).
// - preheat: minutes the oven needs before the bake; it overlaps the proof, so it never adds to the total.
import { amount, temp, size, POOLISH } from './dough.js';

const b = text => `<strong>${text}</strong>`;
const lead = text => `<strong class="lead">${text}</strong>`;

// Typical durations, in minutes, taken from the ranges the method gives.
export const DURATIONS = {
  poolish: 14 * 60,       // 12–16 hours
  measure: 10,
  mix: 25,                // a few minutes of mixing, then a 15–20 minute rest
  rest: 20,
  kneadQuick: 10,         // 8–10 minutes
  kneadCold: 7,           // 5–7 minutes
  folds: 120,             // 30 minute rest, then 3–4 sets over 1½–2 hours
  foldGap: 30,
  firstRise: 150,         // 2–3 hours
  coldRise: 16 * 60,      // 12–24 hours, 16–20 best
  longRise: 48 * 60,      // 2–3 days
  shape: 10,
  shapeTray: 15,
  proofQuick: 45,         // 30–60 minutes
  proofCold: 3 * 60,      // 2–4 hours
  proofTray: 150,         // 2–3 hours
  preheat: 60,            // stone or steel: a full hour
};

// Room temperature changes how long the first rise takes (20–30% either way).
const riseFactor = timing => (timing === 'warm' ? 0.75 : timing === 'cool' ? 1.25 : 1);
const round5 = n => Math.round(n / 5) * 5;

export function method(recipe, units) {
  const { settings: s, ingredients: ing, poolish, flourType } = recipe;
  const u = units;
  const steps = [];
  const warm = temp('24–27', '75–80', u);
  const target = temp('18–21', '65–70', u);
  const warmKitchen = temp(24, 75, u);
  const coolRoom = temp(18, 65, u);
  const timing = recipe.timing === 'warm'
    ? ' Your room is warm, so expect this to take 20–30% less time.'
    : recipe.timing === 'cool' ? ' Your room is cool, so allow 20–30% more time.' : '';

  if (poolish) {
    steps.push({
      id: 'poolish',
      title: `Make the poolish (${POOLISH.hours} hours ahead)`,
      text: `${lead(`Mix, then leave for ${POOLISH.hours} hours.`)} Stir together ${b(amount(poolish.flour, 'flour', u))} of flour, ${b(amount(poolish.water, 'water', u))} of water and ${b(amount(poolish.yeast, 'yeast', u))} of instant yeast until no dry flour remains. Cover and leave at room temperature until bubbly and just starting to dome, then carry on with the main dough.`,
      why: 'A poolish is a wet pre-ferment: the long, slow start builds flavour and an airier crumb.',
      minutes: DURATIONS.poolish,
      timer: { name: 'poolish', minutes: DURATIONS.poolish },
    });
  }

  const m = poolish ? poolish.main : ing;
  steps.push({
    id: 'measure',
    title: 'Measure the ingredients',
    text: `${lead('Weigh everything.')} ${b(amount(m.flour, 'flour', u))} of ${flourType}, ${b(amount(m.yeast, 'yeast', u))} of instant yeast, ${b(amount(m.salt, 'salt', u))} of fine sea salt and ${b(amount(m.water, 'water', u))} of lukewarm water, around ${temp('29–35', '85–95', u)}.${poolish ? ' Have the poolish ready.' : ''}`,
    why: 'Use a digital scale: pizza dough rewards precision. Use instant yeast, not active dry: instant dissolves directly. Water that’s too hot kills the yeast; too cold slows it down. If your tap water is heavily chlorinated, filtered water tastes better.',
    minutes: DURATIONS.measure,
  });

  steps.push({
    id: 'mix',
    title: 'Mix',
    text: `${lead('Mix until no dry flour remains, then rest for 15–20 minutes.')} In a large bowl, whisk the flour, yeast and salt together so the salt is evenly spread. Make a well, pour in the water${poolish ? ' and the poolish' : ''}, and mix with a spoon or your hand. Cover and leave it.`,
    why: 'It will look shaggy and sticky, which is exactly right. The rest (an autolyse) lets the flour fully hydrate, which makes kneading much easier.',
    minutes: DURATIONS.mix,
    timer: { name: 'rest', minutes: DURATIONS.rest },
  });

  if (s.time === 'quick') {
    const rise = round5(DURATIONS.firstRise * riseFactor(recipe.timing));
    steps.push({
      id: 'knead',
      title: 'Knead',
      text: `${lead('Knead for 8–10 minutes, until smooth and elastic.')} On a lightly floured worktop, push the dough away with the heel of your hand, fold it back, turn it a quarter and repeat. Shape into a ball, put it in a lightly oiled bowl and cover.`,
      why: 'Too much flour on the worktop makes a tough dough. Windowpane test: stretch a small piece thin; if it turns translucent without tearing, the gluten is ready.',
      minutes: DURATIONS.kneadQuick,
    });
    steps.push({
      id: 'rise',
      title: 'First rise (bulk fermentation)',
      text: `${lead('Leave for 2–3 hours, until roughly doubled.')} Keep the covered bowl somewhere warm and draught-free, ideally ${warm}.${timing} Poke it with a floured finger: if the dent springs back slowly and leaves a mark, it’s ready. If it springs back at once, give it longer.`,
      why: '',
      minutes: rise,
      timer: { name: 'first-rise', minutes: rise },
    });
  } else if (s.time === 'overnight') {
    steps.push({
      id: 'knead',
      title: 'Knead',
      text: `${lead('Knead for 5–7 minutes.')} Use a lightly floured surface. It can still be slightly tacky; wet hands help. Shape into a ball, put it in an oiled bowl and cover tightly so no skin forms.`,
      why: 'This is less kneading than a quick dough needs, because the cold rise keeps building gluten.',
      minutes: DURATIONS.kneadCold,
    });
    steps.push({
      id: 'rise',
      title: 'Cold rise (overnight)',
      text: `${lead('Refrigerate for 12–24 hours.')} Put the bowl straight in the fridge; 16–20 hours gives the best flavour.${timing} It won’t double, more like grow by half, and that’s fine.`,
      why: 'The cold slows the yeast while enzymes build flavour and texture.',
      minutes: DURATIONS.coldRise,
      timer: { name: 'cold-rise', minutes: DURATIONS.coldRise },
    });
  } else {
    steps.push({
      id: 'folds',
      title: 'Build strength with stretch and folds',
      text: `${lead('Rest for 30 minutes, then do 3–4 sets of stretch and folds, 30 minutes apart.')} With a wet hand, lift one side of the dough, stretch it up and fold it over the middle; turn the bowl a quarter and repeat on all four sides. Cover between sets. By the last set the dough should feel strong, smooth and much less sticky.`,
      why: 'No heavy kneading needed, which suits wetter doughs: the folds build strength gently over 1½–2 hours.',
      minutes: DURATIONS.folds,
      timer: { name: 'fold', minutes: DURATIONS.foldGap },
    });
    steps.push({
      id: 'rise',
      title: 'Long cold rise (2–3 days)',
      text: `${lead('Refrigerate for 2–3 days.')} Move the dough to an oiled, airtight container.${timing} Expect a slow rise and a few bubbles on top.`,
      why: 'It develops a tangy, almost sourdough-like flavour: day two is great, day three is better.',
      minutes: DURATIONS.longRise,
      timer: { name: 'cold-rise', minutes: DURATIONS.longRise },
    });
  }

  const cold = s.time !== 'quick';
  if (s.style === 'roman') {
    const tray = size('40×30 cm', '16×12 in', u);
    const trays = `${s.count > 1 ? `${s.count} trays` : 'the tray'}`;
    const proof = cold ? DURATIONS.proofTray : DURATIONS.proofQuick;
    steps.push({
      id: 'proof',
      title: 'Shape and final proof',
      text: `${lead(cold ? `Shape into ${trays}, then proof for 2–3 hours at room temperature.` : `Shape into ${trays}, then rest for 30–60 minutes.`)} Prepare ${s.count} ${tray} tray${s.count > 1 ? 's' : ''}: dust one with semolina and oil another. Turn the dough onto the semolina, press and stretch it gently towards the edges with floured hands, then move it onto the oiled tray. Drizzle with oil and coax it into the corners with your fingertips without forcing it. ${cold
        ? `Cover loosely and leave until the dough reaches ${target} inside: about 2 hours in a ${warmKitchen} kitchen, 3–4 in a ${coolRoom} room. It should jiggle when you shake the tray and show bubbles on top.`
        : 'Cover loosely and rest, then dimple and stretch again to fill the tray.'}`,
      why: `This dough is very wet and stretchy, so embrace it.${cold ? ' A probe thermometer helps you check the temperature inside the dough.' : ''}`,
      minutes: DURATIONS.shapeTray + proof,
      timer: { name: 'proof', minutes: proof },
    });
  } else {
    const proof = cold ? DURATIONS.proofCold : DURATIONS.proofQuick;
    const balls = s.count > 1 ? `Divide into ${s.count} balls of about ${b(amount(recipe.perPiece, 'flour', 'metric'))}` : `Shape one ball of about ${b(amount(recipe.perPiece, 'flour', 'metric'))}`;
    steps.push({
      id: 'proof',
      title: 'Divide, ball and proof',
      text: `${lead(`${balls}, then proof for ${cold ? '2–4 hours' : '30–60 minutes'}.`)} Tip the dough onto a clean, unfloured surface${s.count > 1 ? ` and divide it into ${s.count} equal pieces` : ''}. Shape ${s.count > 1 ? 'each' : 'it'} into a tight ball by cupping your hand over it and moving in small circles, so the counter pulls the surface taut. Set ${s.count > 1 ? 'them' : 'it'} seam-side down on a lightly floured tray${s.count > 1 ? `, ${size('8–10 cm', '3–4 in', u)} apart,` : ''} or in a lightly oiled tub, and cover. ${cold
        ? `Leave at room temperature to warm to ${target} and turn soft and airy: 2–3 hours in a ${warmKitchen} kitchen, 3–4 in a ${coolRoom} room.`
        : 'Rest until puffy and the poke test springs back slowly.'}`,
      why: cold ? 'Don’t rush this: cold dough bakes dense.' : '',
      minutes: DURATIONS.shape + proof,
      timer: { name: 'proof', minutes: proof },
    });
  }

  steps.push({ id: 'bake', minutes: 0, ...bake(s, u) });

  if (s.hydration >= 70) {
    steps.push({
      id: 'sticky',
      title: 'Handling a sticky dough',
      text: `${lead('Wet hands help.')} At this hydration the dough is sticky: handle it with wet hands, use a bench scraper, and stretch gently to keep the air in.`,
      why: '',
      minutes: 0,
      note: true,
    });
  }
  return steps;
}

function bake(s, u) {
  if (s.oven === 'pizza') {
    if (s.style === 'neapolitan') {
      return {
        title: 'Bake',
        text: `${lead(`Heat the pizza oven to ${temp('430–480', '800–900', u)}, then bake for 60–90 seconds.`)} Stretch to ${size('25–30 cm', '10–12 in', u)}, leaving a puffy rim. Top with crushed tomatoes, fresh mozzarella, olive oil and basil. Bake, turning every 20–30 seconds, until the rim is blistered and leopard-spotted.`,
        why: '',
      };
    }
    if (s.style === 'ny') {
      return {
        title: 'Bake',
        text: `${lead(`Heat the pizza oven to ${temp('345–400', '650–750', u)}, then bake for 4–6 minutes.`)} Stretch to ${size('30–35 cm', '12–14 in', u)} with an even thickness. Top with sauce, mozzarella and toppings, and bake, turning once or twice, until the base is crisp and spotted.`,
        why: '',
      };
    }
    return {
      title: 'Bake',
      text: `${lead('Use a home oven for this style.')} A very hot pizza oven isn’t a good match: this style needs a longer, gentler bake to set the thick crust. Switch the oven to “Home oven” above for the right instructions.`,
      why: '',
    };
  }
  if (s.style === 'roman') {
    return {
      title: 'Bake',
      text: `${lead(`Bake at ${temp(245, 475, u)} (gas 9): 10–12 minutes low, then 10–12 minutes high.`)} Heat the oven. Dimple the dough with your fingertips and drizzle with olive oil. Spread tomato sauce, leaving a small border, and bake on the bottom shelf until the base sets. Add torn mozzarella, move to the top shelf and bake until golden and crisp at the edges. Rest for 2–3 minutes before slicing.`,
      why: '',
    };
  }
  if (s.style === 'detroit') {
    return {
      title: 'Bake',
      text: `${lead(`Bake at ${temp(260, 500, u)} (gas 10) for 12–15 minutes.`)} Heat the oven as high as it goes. Press the dough into a well-oiled Detroit pan or ${size('23×33 cm', '9×13 in', u)} tin, right into the corners. Cover it edge to edge with brick cheese or low-moisture mozzarella, add pepperoni if you like, then spoon the sauce on top in 3–4 thick stripes. Bake on the middle shelf until the edges are deeply caramelised. Rest 3–4 minutes, loosen the sides with a spatula and lift it out.`,
      why: 'Cheese right to the edges makes the crisp, caramelised border.',
    };
  }
  if (s.style === 'neapolitan') {
    return {
      title: 'Bake',
      text: `${lead('Preheat a stone or steel for a full hour, then bake for 6–9 minutes.')} Put the stone or steel on the top shelf and heat the oven as hot as it goes (at least ${temp(260, 500, u)}, ideally ${temp(290, 550, u)}). Press from the centre outwards, leaving a ${size('2.5 cm', '1 in', u)} rim, and stretch over your knuckles to ${size('25–30 cm', '10–12 in', u)}. On a floured peel, add a thin layer of crushed San Marzano tomatoes, olive oil, torn mozzarella and basil. Launch onto the stone and bake, turning halfway, until the rim is puffed and charred in spots.`,
      why: '',
      preheat: DURATIONS.preheat,
      timer: { name: 'preheat', minutes: DURATIONS.preheat },
    };
  }
  return {
    title: 'Bake',
    text: `${lead('Preheat a stone or steel for an hour, then bake for 7–10 minutes.')} Put the stone or steel on the middle shelf and heat to ${temp('260–290', '500–550', u)}. Stretch to ${size('30–35 cm', '12–14 in', u)} with an even thickness and move it to a peel dusted with cornmeal. Spread sauce to within ${size('1 cm', '½ in', u)} of the edge, add grated low-moisture mozzarella and your toppings, without overloading. Bake until the base is crisp and spotted. It should fold in half without cracking.`,
    why: 'New York style has no big rim, so stretch it evenly right to the edge.',
    preheat: DURATIONS.preheat,
    timer: { name: 'preheat', minutes: DURATIONS.preheat },
  };
}

// Minutes from the start of each step to the moment the first pizza goes in the oven.
export function timeline(steps) {
  const total = totalMinutes(steps);
  let t = 0;
  return steps.map(step => {
    const start = t;
    t += step.minutes || 0;
    return { start, before: total - start, preheatBefore: step.preheat ? step.preheat : null };
  });
}

// Start to oven: every step before the bake (the preheat overlaps the proof).
export const totalMinutes = steps => steps.reduce((n, step) => n + (step.minutes || 0), 0);

const half = n => {
  const whole = Math.floor(n);
  return `${whole || ''}${n - whole ? '½' : ''}` || '0';
};

// "about 4 hours", "about 20 hours", "about 2 days": rounded to the nearest half.
export function approx(minutes, { short = false } = {}) {
  const hours = Math.round((minutes / 60) * 2) / 2;
  if (hours >= 36) {
    const days = Math.round((minutes / 1440) * 2) / 2;
    return `about ${half(days)} ${days === 1 ? 'day' : 'days'}`;
  }
  if (short) return `about ${half(hours)} h`;
  return `about ${half(hours)} ${hours === 1 ? 'hour' : 'hours'}`;
}

// "2 h 30 min", "45 min", "16 h", "2 days"
export function duration(minutes) {
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'day' : 'days'}`;
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return [h ? `${h} h` : '', min ? `${min} min` : ''].filter(Boolean).join(' ');
}
