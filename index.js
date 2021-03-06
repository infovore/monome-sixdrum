const monomeGrid = require('monome-grid');
const easymidi = require('easymidi');

const output = new easymidi.Output('grid out', true);
const input = new easymidi.Input('grid in', true);

let dirty = true;
let step = create2DArray(6, 16);
let timer = 0;
let play_position = 0;
let loop_start = 0;
let loop_end = 15;
let cutting = false;
let next_position = 0;
let keys_held = 0;
let key_last = 0;
let ticks = 0;
let looping = false;
let alt= false;
let increment = 1;

function create2DArray(sizeY, sizeX) {
  let arr = [];
  for (let y=0;y<sizeY;y++) {
    arr[y] = [];
    for (let x=0;x<sizeX;x++)
      arr[y][x] = 0;
  }
  return arr;
}

async function run() {
  let grid = await monomeGrid(); // optionally pass in grid identifier

  input.on('clock', () => {
    ticks++;
    if(ticks % 6 != 0)
      return;

    if(cutting)
      play_position = next_position;
    else if(looping) { 
      if(increment > 0 && (play_position == loop_end)) {
        play_position = loop_start;
      } else if(increment < 0 && (play_position == loop_start)) {
        play_position = loop_end;
      } else {
        play_position += increment;
      }
    }
    else if((play_position == 15) && (increment > 0))
      play_position = 0;
    else if((play_position == 0) && (increment < 0))
      play_position = 15;
    else
      play_position += increment;

    // TRIGGER SOMETHING
    let last_play_position = play_position - 1;
    if(last_play_position == -1)
      last_play_position = 15;
    for(let y=0;y<6;y++) {
      if(step[y][last_play_position] == 1)
        trigger('noteoff', y);
      if(step[y][play_position] == 1)
        trigger('noteon', y);
    }

    cutting = false;
    dirty = true;
  });

  input.on('start', () => {
    for(let y=0;y<6;y++)
      if(step[y][play_position] == 1)
        trigger('noteon', y);
  });

  input.on('position', (data) => {
    if(data.value != 0)
      return;
    ticks = 0;
    play_position = 0;
    if(loop_start)
      play_position = loop_start;
    dirty = true;
  });

  // refresh leds with a pattern
  let refresh = function() {
    if(dirty) {
      let led = create2DArray(8, 16);
      let highlight = 0;

      // display steps
      for (let x=0;x<16;x++) {
        // highlight the play position
        if(x == play_position)
          highlight = 4;
        else
          highlight = 0;

        for (let y=0;y<6;y++) {
          led[y][x] = step[y][x] * 11 + highlight;
        }
      }

      // draw trigger bar and on-states
      for(let x=0;x<16;x++) {
        led[6][x] = 4;
      }

      for(let y=0;y<6;y++) {
        if(step[y][play_position] == 1) {
          led[6][y] = 15;
        }
      }

      // draw loop range
      if(looping) {
        for(let l = loop_start; l <= loop_end; l++) {
          led[7][l] = 7;
        }
      }

      // draw play position
      led[7][play_position] = 15;

      if(alt) {
        led[7][15] = 8;
      } else {
        led[7][15] = 0;
      }
      // update grid
      grid.refresh(led);
      dirty = false;
    }
  }

  // call refresh() function 60 times per second
  setInterval(refresh, 1000 / 60);

  let trigger = function(type, i) {
    output.send(type, {
      note: 36 + i,
      velocity: 127,
      channel: 0
    });
  }

  // set up key handler
  grid.key((x, y, s) => {
    if(s == 1 && y < 6) {
      if(alt) {
        for(let a = 0; a < 16; a++) {
          step[y][a] = 0;
        }
      } else {
        step[y][x] ^= 1;
      }
      dirty = true;
    }
    else if(y==6 && s==1) {
      // store a trigger
      if(x < 6) {
        step[x][play_position] ^= 1;
        dirty = true;
      }
    }
    // cut and loop
    else if(y == 7) {
      if(x==15) {
        if(s>0) {
          alt = true;
        } else {
          alt = false;
        }
      }
      // track number of keys held
      keys_held = keys_held + (s*2) - 1;

      // cut
      if(s == 1 && keys_held == 1) {
        if(x != 15) {
          cutting = true;
          next_position = x;
          key_last = x;
          looping = false;
        }
      }
      // set loop points
      else if(s == 1 && keys_held == 2) {
        if (alt) {
          increment = increment * -1;
        } else {
          loop_start = key_last;
          loop_end = x;
          looping = true;
        }
      }
    }
  });

  let cleanup = function() {
    output.close();
    input.close();
    let blankLed = create2DArray(8, 16);
    grid.refresh(blankLed);
    process.exit();
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run();
