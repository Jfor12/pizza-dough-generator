# 🍕 Pizza Dough Generator

A professional, feature-rich web application for creating custom pizza dough recipes tailored to your exact preferences. Generate perfect recipes for Neapolitan, New York, Detroit, or Roman/Pinsa style pizzas with precise measurements, comprehensive instructions, and advanced tools for serious home pizza makers.

![Pizza Dough Generator](https://img.shields.io/badge/Pizza-Dough%20Generator-red?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzguNDMgMiA1LjIzIDQuNDIgNC4yOCA3LjcxTDEyIDIybDcuNzItMTQuMjlDMTguNzcgNC40MiAxNS41NyAyIDEyIDJ6TTcgOWEyIDIgMCAxIDEgMC00IDIgMiAwIDAgMSAwIDR6bTUgNWEyIDIgMCAxIDEgMC00IDIgMiAwIDAgMSAwIDR6bTUtM2EyIDIgMCAxIDEgMC00IDIgMiAwIDAgMSAwIDR6Ii8+PC9zdmc+)
![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ Features

### 🎨 Modern Design
- **Light & Dark Mode** - Seamless theme switching with persistent preference storage
- **Classic Italian Colours** - Clean, professional colour scheme inspired by Italian design (red, green, cream)
- **Tab Navigation** - Organised interface with separate sections for recipe generation and tools
- **Open Page Layout** - Modern, full-page design without framed containers
- **Responsive Layout** - Perfect on desktop, tablet, and mobile devices
- **Smooth Animations** - Subtle, performant transitions where needed
- **Wide Desktop Support** - Adaptive layout that stretches beautifully on large screens

### 🍕 Pizza Customisation
- **Four Authentic Pizza Styles**
  - 🇮🇹 **Neapolitan** - Soft, light, and airy with traditional Italian characteristics (68% hydration, 155g flour per pizza)
  - 🗽 **New York Style** - Crisp, foldable, and chewy perfect for slices (62% hydration, 170g flour per pizza)
  - 🏙️ **Detroit Style** - Thick, focaccia-like crust with crispy cheese edges (72% hydration, 180g flour per pizza)
  - 🍕 **Roman/Pinsa Style** - Light, crispy, and highly digestible for 40×30cm trays (80% hydration, 333g flour per tray)

- **Flexible Batch Sizes** - Generate recipes for 1-12 pizzas or trays
- **Adjustable Hydration** - Fine-tune water content from 55% to 80%
  - Real-time warnings and tips based on hydration level
  - Automatic optimisation based on selected style

- **Advanced Options**
  - 🌡️ **Room Temperature Input** - Adjusts yeast amounts and timing based on ambient temperature
  - 🧪 **Poolish/Preferment Option** - Create 30% poolish for enhanced flavour and texture

- **Multiple Oven Types**
  - 🏠 Home Oven (500°F / 260°C) - With detailed baking instructions for each style
  - 🔥 Pizza Oven (850°F / 450°C) - High-temperature techniques

- **Fermentation Options**
  - ⚡ Quick (2-4 hours) - Same-day pizza
  - 🌙 Overnight (12-24 hours) - Enhanced flavour development
  - 🕐 Long (2-3 days) - Complex, sourdough-like flavour
  - Yeast amounts automatically adjusted for each timeline

### 📚 Comprehensive Instructions
- **Detailed Step-by-Step Guide** - Extensive instructions for each stage:
  - Ingredient measurement with temperature guidance
  - Poolish preparation (if selected) with timing
  - Mixing techniques with autolyse explanation
  - Kneading methods (traditional, no-knead, stretch-and-fold)
  - Fermentation guidance with visual/tactile cues
  - Shaping and final proofing with temperature monitoring (meat thermometer tips)
  - Two-stage baking for Roman pizza (par-bake technique)
  - Complete baking instructions customised for each pizza style
- **Temperature Guidance** - Specific room temperature scenarios and timing adjustments
- **Pro Techniques** - Advanced tips like semolina stretching, oil technique for Roman pizza
- **Visual Cues** - What to look for at each stage (windowpane test, poke test, jiggle test, etc.)

### 🎓 Educational Resources
- **Ingredient Substitutions** - Complete guide to flour, yeast, and salt alternatives
- **Troubleshooting Tips** - Solutions for common dough problems (sticky dough, poor rise, dense crust)
- **Dough Handling Guide** - Professional techniques for shaping and stretching (steering wheel method, gentle handling)
- **Glossary of Terms** - Comprehensive terminology including:
  - "00" Flour, Hydration, Poolish, Preferment
  - Bulk Fermentation, Proofing, Cornicione
  - Windowpane Test and more
- **Collapsible Accordions** - Keep information organised and accessible
- **British English** - Consistent spelling throughout (flavour, centre, optimisation)

### 🛠️ Advanced Tools & Utilities

#### Recipe Generator Tab
- **Baker's Percentage Toggle** - View ingredient ratios as percentages
- **Recipe Scaling** - Quick buttons to scale recipe (×0.5, ×2, ×3)
- **Unit Toggle** - Switch all measurements between metric (grams, Celsius, cm) and imperial (oz/cups, Fahrenheit, inches)
  - Converts ingredient amounts, temperatures, and sizes throughout instructions
  - Swaps display order (metric first by default, imperial first when toggled)
- **Custom Recipe Names** - Save recipes with personalised names that display in the title
- **Copy Recipe** - One-click copy to clipboard with success feedback
- **Print/PDF Export** - Clean, print-optimised layout with proper formatting
- **Share Recipe** - Native web share functionality for mobile devices
- **Recipe Notes** - Add and save personal notes for each recipe (localStorage)

#### Saved Recipes & Timer Tab
- **Save Recipes** - Store up to 10 favourite recipes with custom names and dates
- **Load Saved Recipes** - Quick access to your saved recipes (automatically switches tabs and populates form)
- **Delete Recipes** - Manage your saved recipe collection
- **Fermentation Timer** - Full-featured countdown timer with:
  - Quick presets (2h, 12h, 24h)
  - Custom time input (hours + minutes, up to 72 hours)
  - Persistent timer (survives page refresh and browser closure)
  - Browser notifications when timer completes
  - Visual countdown display (HH:MM:SS)
  - Start/Stop controls
  
### 🔬 Technical Features
- **Precise Calculations** - Accurate flour ratios and ingredient measurements
- **Dynamic Adjustments** - Temperature-based yeast calculations
- **LocalStorage Persistence** - Theme, recipes, notes, and active timer saved
- **Print Optimisation** - Proper black text on white background for printing/PDF
- **Responsive Tables** - Ingredient lists adapt to screen size
- **Browser Notifications API** - Desktop/mobile notifications for timer
- **Web Share API** - Native sharing on supported devices
- **Clipboard API** - Seamless recipe copying

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or build process required!

### Running Locally

1. **Clone the repository**
```bash
git clone https://github.com/Jfor12/pizza-dough-generator.git
cd pizza-dough-generator
```

2. **Open in browser**
```bash
# Simply open the index.html file in your browser
# On macOS:
open index.html

# On Linux:
xdg-open index.html

# On Windows:
start index.html
```

Or drag and drop the `index.html` file into your browser.

### Live Demo
🌐 **[Try it now: Pizza Dough Generator](https://jacopofornesi.co.uk/pizza-dough-generator/)**

## 🎯 How to Use

### Recipe Generator Tab (Default)
1. **Select Your Pizza Style** - Choose between Neapolitan, New York, Detroit, or Roman/Pinsa style
2. **Set Pizza Count** - Decide how many pizzas/trays you want to make (1-12)
3. **Adjust Hydration** (Optional) - Fine-tune the water content for your preference (55-80%)
4. **Advanced Options** (Optional):
   - Enter room temperature for automatic yeast adjustments
   - Enable poolish/preferment for enhanced flavour
5. **Choose Oven Type** - Select between home oven or pizza oven
6. **Select Fermentation Time** - Pick quick (2-4 hours), overnight (12-24 hours), or long (2-3 days)
7. **Generate Recipe** - Click the button to get your custom recipe with detailed instructions
8. **View Baker's Percentages** - Toggle to see ingredient ratios
9. **Scale Recipe** - Use buttons to multiply quantities (×0.5, ×2, ×3)
10. **Toggle Units** - Switch between metric and imperial for all measurements (ingredients, temperatures, sizes)
11. **Add Notes** - Write personal observations and save them
12. **Save Recipe** - Store your recipe with a custom name for future reference
13. **Export** - Copy, Print/PDF, or Share your recipe

### Saved Recipes & Timer Tab
1. **Access Your Saved Recipes** - View and load up to 10 saved recipes
2. **Start Timer** - Use quick presets or custom time for fermentation tracking
3. **Enable Notifications** - Get alerts when your dough is ready
4. **Timer Persists** - Close browser and come back - timer keeps running!

## 🔬 Technology Stack

- **HTML5** - Semantic markup with proper structure
- **CSS3** - Custom properties (CSS variables) for theming, print media queries
- **TailwindCSS** - Utility-first CSS framework via CDN (no build required)
- **Vanilla JavaScript** - No frameworks, pure ES6+ JavaScript
- **LocalStorage API** - Theme, recipes, notes, and timer persistence
- **Web Share API** - Native sharing functionality for mobile/desktop
- **Clipboard API** - Copy recipe text with one click
- **Notifications API** - Browser notifications for timer completion
- **Google Fonts** - Inter (body) & Playfair Display (headings) typography
- **Single File Architecture** - Everything in one HTML file for simplicity

## 🎨 Design Philosophy

The application follows modern web design principles:
- **User-Centric** - Intuitive tab interface with clear visual hierarchy and organised sections
- **Accessible** - Semantic HTML, proper ARIA labels, and keyboard navigation support
- **Performance** - Lightweight single-file architecture with minimal dependencies
- **Responsive** - Adaptive layout from mobile (320px) to ultra-wide desktop (2560px+)
- **Classic Italian Aesthetic** - Clean colour palette (red #C8432D, green #4A7C2C, cream #F8F6F3)
- **Dark Mode** - Professionally designed dark theme with reduced eye strain
- **Print Optimisation** - Clean black-on-white print output for physical recipe cards
- **Progressive Enhancement** - Core functionality works without JavaScript, enhanced with JS features

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Jacopo Fornesei**

- LinkedIn: [linkedin.com/in/jacopo-fornesei](https://www.linkedin.com/in/jacopo-fornesei)
- GitHub: [@Jfor12](https://github.com/Jfor12)

## 🙏 Acknowledgments

- Inspired by traditional pizza-making techniques
- Design influenced by modern web aesthetics
- Built with love for pizza enthusiasts worldwide

## 🐛 Known Issues

None at the moment! If you find any bugs, please [open an issue](https://github.com/Jfor12/pizza-dough-generator/issues).

## 🗺️ Roadmap

Completed features:
- [x] Roman/Pinsa style pizza (40×30cm trays with correct 333g flour per tray)
- [x] Comprehensive step-by-step instructions with temperature guidance
- [x] Temperature-based yeast adjustments
- [x] Baker's percentage display
- [x] Recipe scaling functionality
- [x] Recipe favourites system (up to 10 saved recipes with custom names)
- [x] Fermentation timer with notifications
- [x] Full unit toggle (metric/imperial for ingredients, temperatures, and sizes)
- [x] Dynamic measurement conversion throughout all instructions
- [x] Ingredient substitutions guide
- [x] Poolish/preferment option with measurement conversion
- [x] Recipe notes functionality
- [x] Print/PDF export with proper formatting
- [x] Tab navigation for better organisation
- [x] Timer persistence across page refreshes and browser closure
- [x] Custom recipe naming with persistent titles
- [x] Auto-load saved recipes with tab switching

Potential future enhancements:
- [ ] More pizza styles (Sicilian, Grandma, Focaccia, etc.)
- [ ] Sourdough starter calculator
- [ ] Video tutorials integration
- [ ] Multi-language support
- [ ] Ingredient calculator for bulk preparation
- [ ] Recipe sharing via URL
- [ ] Mobile app version

---

**Made with ❤️ and a passion for perfect pizza**
