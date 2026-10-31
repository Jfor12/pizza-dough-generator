# Pizza Dough Generator

A pizza dough calculator for Neapolitan, New York, Detroit and Roman-style pizza.
Choose a style, how many, the hydration, your oven and your schedule, and it works
out the quantities, baker's percentages and a step-by-step method as you go.

**Try it:** https://jfor12.github.io/pizza-dough-generator/

## How it works

```mermaid
flowchart LR
    A[Settings form] --> B[normaliseSettings]
    B --> C[computeRecipe]
    C --> D[Formula table<br>grams or cups, baker's %]
    C --> E[method<br>steps for style, oven, schedule]
    B <--> F[URL query<br>shareable recipe links]
    B <--> G[localStorage<br>saved recipes with notes, timer]
```

- **Baker's maths.** Every ingredient is a percentage of the flour weight, so the
  recipe scales cleanly from one pizza to twelve.

  | Style | Flour per pizza | Hydration | Salt |
  |---|---|---|---|
  | Neapolitan | 155 g | 68% | 2.8% |
  | New York | 170 g | 62% | 2.5% |
  | Detroit | 180 g | 72% | 2.2% |
  | Roman (40×30 cm tray) | 333 g | 80% | 2.5% |

- **Schedules.** Instant yeast is 1% of the flour for a quick same-day rise, 0.4%
  overnight and 0.2% for a 2–3 day cold ferment.
- **How long it takes.** Each method step has a typical duration (`DURATIONS` in
  `method.js`). Their sum is the time from starting to the first pizza going in the
  oven, shown on the schedule buttons and above the method (quick: about 4 hours;
  overnight: about 20; long: about 2 days; a poolish adds 14). The oven preheat
  overlaps the proof, so it doesn't add to the total.
- **Ready by.** Pick when you want to bake and every step shows its clock time,
  counted back from that moment.
- **Room temperature.** Yeast goes down 5% per degree above 22°C and up 5% per
  degree below it, capped at ±50%. The rise step says whether to expect it to
  take longer or shorter.
- **Poolish.** 30% of the flour becomes a 100%-hydration pre-ferment with 0.1%
  yeast. The main dough gets the remainder, so the overall formula is unchanged.
- **Units.** Grams, or cups, ounces and teaspoons (flour at 125 g per cup, water
  at 237 g per cup), with grams always shown alongside.

It also keeps saved recipes, each with an optional note, runs a dough timer that
survives closing the tab (every waiting step has its own "Start timer" button), can
keep the screen awake while you cook, gives every recipe a shareable link, and prints
just the recipe. Everything is stored in the browser only.

On phones a bar at the bottom jumps between Settings, Recipe, Timer and Saved, a
running timer floats above it, and changing a setting while the recipe is off-screen
shows a short summary of what changed. On wide screens the settings, timer and saved
recipes share one column that stays in view.

## Files

| File | What it does |
|---|---|
| `index.html` | The page, including the tips and glossary text |
| `styles.css` | All styles: light and dark themes, print layout |
| `dough.js` | The recipe maths: pure functions, no DOM |
| `method.js` | The step-by-step method for a recipe, in either unit system |
| `app.js` | Reads the form, renders the recipe, saving, the timer, the planner and theme |
| `tests/` | Unit tests for the maths and method |
| `fonts/` | Fredoka (headings and numbers) and Nunito (text), self-hosted (SIL Open Font License) |

No build step and no dependencies: GitHub Pages serves the files as they are.

## Working on it

```bash
npm test                   # run the unit tests (Node 20+)
python3 -m http.server     # then open http://localhost:8000
```

The page uses ES modules, so open it through a local server rather than
straight from the file.

## Roadmap

- [x] Recipe sharing via URL
- [ ] More pizza styles (Sicilian, focaccia)
- [ ] Sourdough starter calculator
- [ ] Video tutorials
- [ ] Multi-language support
- [ ] Ingredient calculator for bulk preparation
- [ ] Mobile app version
