// The step-by-step method for a computed recipe, in the chosen units.
// Returns [{ title, text }] where text may contain <strong>/<em> only.
import { amount, temp, size, POOLISH } from './dough.js';

const b = text => `<strong>${text}</strong>`;

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
      title: `Make the poolish (${POOLISH.hours} hours ahead)`,
      text: `Mix ${b(amount(poolish.flour, 'flour', u))} of flour, ${b(amount(poolish.water, 'water', u))} of water and ${b(amount(poolish.yeast, 'yeast', u))} of instant yeast until no dry flour remains. Cover and leave at room temperature for ${POOLISH.hours} hours, until bubbly and just starting to dome. Then carry on with the main dough.`,
    });
  }

  const m = poolish ? poolish.main : ing;
  steps.push({
    title: 'Measure the ingredients',
    text: `Use a digital scale: pizza dough rewards precision. Weigh ${b(amount(m.flour, 'flour', u))} of ${flourType}, ${b(amount(m.yeast, 'yeast', u))} of instant yeast (not active dry: instant dissolves directly), ${b(amount(m.salt, 'salt', u))} of fine sea salt and ${b(amount(m.water, 'water', u))} of lukewarm water, around ${temp('29–35', '85–95', u)}. Too hot kills the yeast; too cold slows it down. If your tap water is heavily chlorinated, filtered water tastes better.${poolish ? ' Have the poolish ready.' : ''}`,
  });

  steps.push({
    title: 'Mix',
    text: `In a large bowl, whisk the flour, yeast and salt together so the salt is evenly spread. Make a well, pour in the water${poolish ? ' and the poolish' : ''}, and mix with a spoon or your hand until no dry flour remains. It will look shaggy and sticky, which is exactly right. Cover and rest for 15–20 minutes so the flour can fully hydrate (an autolyse); it makes kneading much easier.`,
  });

  if (s.time === 'quick') {
    steps.push({
      title: 'Knead',
      text: 'Lightly flour the worktop (too much flour makes a tough dough). Push the dough away with the heel of your hand, fold it back, turn it a quarter and repeat for 8–10 minutes, until it goes from rough to smooth and elastic. Windowpane test: stretch a small piece thin; if it turns translucent without tearing, the gluten is ready. Shape into a ball, put it in a lightly oiled bowl and cover.',
    });
    steps.push({
      title: 'First rise (bulk fermentation)',
      text: `Leave the covered bowl somewhere warm and draught-free, ideally ${warm}, for 2–3 hours, until roughly doubled.${timing} Poke it with a floured finger: if the dent springs back slowly and leaves a mark, it's ready. If it springs back at once, give it longer.`,
    });
  } else if (s.time === 'overnight') {
    steps.push({
      title: 'Knead',
      text: 'Knead on a lightly floured surface for 5–7 minutes, less than for a quick dough because the cold rise keeps building gluten. It can still be slightly tacky; wet hands help. Shape into a ball, put it in an oiled bowl and cover tightly so no skin forms.',
    });
    steps.push({
      title: 'Cold rise (overnight)',
      text: `Put the bowl straight in the fridge for 12–24 hours; 16–20 hours gives the best flavour.${timing} The cold slows the yeast while enzymes build flavour and texture. It won't double, more like grow by half, and that's fine.`,
    });
  } else {
    steps.push({
      title: 'Build strength with stretch and folds',
      text: 'Cover and rest for 30 minutes. Then, with a wet hand, lift one side of the dough, stretch it up and fold it over the middle; turn the bowl a quarter and repeat on all four sides. Cover, wait 30 minutes and repeat, for 3–4 sets over 1½–2 hours. By the last set the dough should feel strong, smooth and much less sticky. No heavy kneading needed, which suits wetter doughs.',
    });
    steps.push({
      title: 'Long cold rise (2–3 days)',
      text: `Move the dough to an oiled, airtight container and refrigerate for 2–3 days.${timing} It develops a tangy, almost sourdough-like flavour: day two is great, day three is better. Expect a slow rise and a few bubbles on top.`,
    });
  }

  const cold = s.time !== 'quick';
  if (s.style === 'roman') {
    const tray = size('40×30 cm', '16×12 in', u);
    steps.push({
      title: 'Shape and final proof',
      text: `This dough is very wet and stretchy, so embrace it. Prepare ${s.count} ${tray} tray${s.count > 1 ? 's' : ''}: dust one with semolina and oil another. Turn the dough onto the semolina, press and stretch it gently towards the edges with floured hands, then move it onto the oiled tray. Drizzle with oil and coax it into the corners with your fingertips without forcing it. ${cold
        ? `Cover loosely and leave at room temperature for 2–3 hours, until the dough reaches ${target} inside (a probe thermometer helps): about 2 hours in a ${warmKitchen} kitchen, 3–4 in a ${coolRoom} room. It should jiggle when you shake the tray and show bubbles on top.`
        : 'Cover loosely and rest for 30–60 minutes, then dimple and stretch again to fill the tray.'}`,
    });
  } else {
    steps.push({
      title: 'Divide, ball and proof',
      text: `Tip the dough onto a clean, unfloured surface and divide it into ${s.count} equal piece${s.count > 1 ? 's' : ''} of about ${b(amount(recipe.perPiece, 'flour', 'metric'))}. Shape each into a tight ball by cupping your hand over it and moving in small circles, so the counter pulls the surface taut. Set them seam-side down on a lightly floured tray, ${size('8–10 cm', '3–4 in', u)} apart, or in lightly oiled tubs, and cover. ${cold
        ? `Leave at room temperature for 2–4 hours to warm to ${target} and turn soft and airy: 2–3 hours in a ${warmKitchen} kitchen, 3–4 in a ${coolRoom} room. Don't rush this; cold dough bakes dense.`
        : 'Rest for 30–60 minutes, until puffy and the poke test springs back slowly.'}`,
    });
  }

  steps.push({ title: 'Bake', text: bake(s, u) });

  if (s.hydration >= 70) {
    steps.push({
      title: 'Handling a sticky dough',
      text: 'At this hydration the dough is sticky: handle it with wet hands, use a bench scraper, and stretch gently to keep the air in.',
    });
  }
  return steps;
}

function bake(s, u) {
  if (s.oven === 'pizza') {
    if (s.style === 'neapolitan') {
      return `Heat the pizza oven to ${temp('430–480', '800–900', u)}. Stretch to ${size('25–30 cm', '10–12 in', u)}, leaving a puffy rim. Top with crushed tomatoes, fresh mozzarella, olive oil and basil. Bake for 60–90 seconds, turning every 20–30 seconds, until the rim is blistered and leopard-spotted.`;
    }
    if (s.style === 'ny') {
      return `Heat the pizza oven to ${temp('345–400', '650–750', u)}. Stretch to ${size('30–35 cm', '12–14 in', u)} with an even thickness. Top with sauce, mozzarella and toppings, and bake for 4–6 minutes, turning once or twice, until the base is crisp and spotted.`;
    }
    return 'A very hot pizza oven isn\'t a good match for this style, which needs a longer, gentler bake to set the thick crust. Switch the oven to "Home oven" above for the right instructions.';
  }
  if (s.style === 'roman') {
    return `Heat the oven to ${temp(245, 475, u)} (gas 9). Dimple the dough with your fingertips and drizzle with olive oil. Spread tomato sauce, leaving a small border, and bake on the bottom shelf for 10–12 minutes until the base sets. Add torn mozzarella, move to the top shelf and bake 10–12 minutes more, until golden and crisp at the edges. Rest for 2–3 minutes before slicing.`;
  }
  if (s.style === 'detroit') {
    return `Heat the oven to ${temp(260, 500, u)} (gas 10, or as high as it goes). Press the dough into a well-oiled Detroit pan or ${size('23×33 cm', '9×13 in', u)} tin, right into the corners. Cover it edge to edge with brick cheese or low-moisture mozzarella (this makes the crisp, caramelised cheese border), add pepperoni if you like, then spoon the sauce on top in 3–4 thick stripes. Bake on the middle shelf for 12–15 minutes, until the edges are deeply caramelised. Rest 3–4 minutes, loosen the sides with a spatula and lift it out.`;
  }
  if (s.style === 'neapolitan') {
    return `Put a pizza stone or steel on the top shelf and heat the oven as hot as it goes (at least ${temp(260, 500, u)}, ideally ${temp(290, 550, u)}) for a full hour. Press from the centre outwards, leaving a ${size('2.5 cm', '1 in', u)} rim, and stretch over your knuckles to ${size('25–30 cm', '10–12 in', u)}. On a floured peel, add a thin layer of crushed San Marzano tomatoes, olive oil, torn mozzarella and basil. Launch onto the stone and bake for 6–9 minutes, turning halfway, until the rim is puffed and charred in spots.`;
  }
  return `Put a pizza stone or steel on the middle shelf and heat to ${temp('260–290', '500–550', u)} for an hour. Stretch to ${size('30–35 cm', '12–14 in', u)} with an even thickness (New York style has no big rim) and move it to a peel dusted with cornmeal. Spread sauce to within ${size('1 cm', '½ in', u)} of the edge, add grated low-moisture mozzarella and your toppings, without overloading. Bake for 7–10 minutes until the base is crisp and spotted. It should fold in half without cracking.`;
}
