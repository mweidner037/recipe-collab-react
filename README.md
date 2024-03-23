# recipe-collab-react

Case study in building the same collaborative recipe editor using various collaboration frameworks (+ React).

This started as a [Collabs](https://collabs.readthedocs.io/en/latest/) demo, which is live at https://collabs-demos.herokuapp.com/recipe-editor/ and copied in the `collabs/` folder. I demonstrated its nuanced behavior under concurrency at [LFW.dev](https://localfirstweb.dev/) meetup #5 ([Video](https://www.youtube.com/watch?v=Z0nzsxhoToo&t=2346s), [Slides](https://docs.google.com/presentation/d/13I3L76R-wwiXxgTXI2ide3zlbjiWoTWXMSU9YbQdYXU/edit?usp=sharing)). E.g., if you edit an amount while someone else scales the recipe concurrently, your edit is also scaled, keeping the recipe in proportion.

While Collabs is specifically designed to enable that kind of nuanced behavior, I eventually realized that you can do similar things with other collaboration frameworks, if you structure your data in the right way. This repo shows how for:

- [Automerge](https://automerge.org/) (+ [position-strings](https://github.com/mweidner037/position-strings#readme) to help with move-vs-edit-ingredient)
- (More pending)
