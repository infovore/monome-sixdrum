# Sixdrum

A simple sequencer for monome grid based on the grid studies

## Requirements

* Node 8.9.x

## Installation

```sh
npm init
```

## Running

```sh
node index.js
```



## Operation

Once run, it creates virtual midi ports. Make sure clock is sent to `grid in` and note data is received from `grid out`

Bottom right key is _meta_

Rows 1-6 are sixteenth note triggers. Each row is a distinct midi note. Tap to place a trigger on that step, tap to remove. *meta*-tap to remove all notes in row.

Row 7 is trigger steps. First six buttons will flash when a trigger is firing for that note. Push to toggle that specific note at current time.

Row 8 is playhead. Push pad button to jump to step. *meta*-push a single button in row to reverse playhead direction (and again to re-reverse). Hold two pads to set a loop within that range; tap outside to cancel looping. Playhead reversal is respected during looping.