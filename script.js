const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const { world } = engine;

const width = window.innerWidth;
const height = window.innerHeight * 0.9;
const rows = 9;
const cols = 12;

const cellW = width / cols;
const cellH = height / rows;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

//create Maze
const shuffle = arr => {
  for (let i = arr.length - 1; i >= 0; i--) {
    let rand = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[rand]] = [arr[rand], arr[i]];
  }
  return arr;
};

//============
//=   init   =
//============
const init = () => {
  World.clear(engine.world);
  Engine.clear(engine);
  world.gravity.y = 0;
  document.querySelector('h2').textContent = '';
  //Create borders
  const walls = [
    Bodies.rectangle(width / 2, 0, width, 1, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 1, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 1, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 1, height, { isStatic: true }),
  ];
  World.add(world, walls);

  const grid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(false));
  const verticals = Array(rows)
    .fill(null)
    .map(() => Array(cols - 1).fill(false));
  const horizontals = Array(rows - 1)
    .fill(null)
    .map(() => Array(cols).fill(false));

  const startRow = Math.floor(Math.random() * rows);
  const startColumn = Math.floor(Math.random() * cols);

  const stepThroughCell = (row, col) => {
    //If that cell is visited then return
    if (grid[row][col]) return;
    //Mark the cell as being visited
    grid[row][col] = true;
    //Assemble randomly its neighbours
    let neighbours = shuffle([
      [row, col + 1, 'right'],
      [row, col - 1, 'left'],
      [row + 1, col, 'down'],
      [row - 1, col, 'up'],
    ]);
    //Exclude neighbours out of bounds
    for (let n of neighbours) {
      const [r, c, d] = n;
      if (r >= rows || r < 0 || c < 0 || c >= cols) {
        continue;
      }
      //Exlude being visited before
      if (grid[r][c]) {
        continue;
      }
      //Remove wall
      if (d === 'right') {
        verticals[row][col] = true;
      } else if (d === 'left') {
        verticals[row][col - 1] = true;
      } else if (d === 'up') {
        horizontals[row - 1][col] = true;
      } else {
        horizontals[row][col] = true;
      }
      stepThroughCell(r, c);
    }
    //Continue to next cell
  };
  stepThroughCell(startRow, startColumn);

  //Creating horizontal walls
  horizontals.map((row, i) => {
    row.map((open, k) => {
      if (!open) {
        const rect = Bodies.rectangle(
          cellW / 2 + cellW * k,
          cellH + cellH * i,
          cellW,
          4,
          { label: 'wall', isStatic: true, render: { fillStyle: 'orange' } }
        );
        World.add(world, rect);
      }
    });
  });
  //Creating vertical walls
  verticals.map((col, i) => {
    col.map((open, k) => {
      if (!open) {
        const rect = Bodies.rectangle(
          cellW + cellW * k,
          cellH / 2 + cellH * i,
          4,
          cellH,
          { label: 'wall', isStatic: true, render: { fillStyle: 'orange' } }
        );
        World.add(world, rect);
      }
    });
  });
  //Creating goal
  const goal = Bodies.rectangle(
    width - cellW / 2,
    Math.floor(rows / 2) * cellH + cellH / 2,
    cellW * 0.7,
    cellH * 0.7,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: 'red',
      },
    }
  );
  World.add(world, goal);

  //creating player1
  const player1 = Bodies.circle(cellW / 2, cellH / 2, cellH * 0.3, {
    label: 'p1',
    render: {
      fillStyle: 'green',
    },
  });
  World.add(world, player1);
  //creating player2
  const player2 = Bodies.circle(cellW / 2, height - cellH / 2, cellH * 0.3, {
    label: 'p2',
    render: {
      fillStyle: 'blue',
    },
  });
  World.add(world, player2);

  //Key controls
  document.body.addEventListener('keydown', e => {
    e.preventDefault();
    if (e.key === 'd') Body.setVelocity(player1, { x: 8, y: 0 });
    if (e.key === 'a') Body.setVelocity(player1, { x: -8, y: 0 });
    if (e.key === 's') Body.setVelocity(player1, { x: 0, y: 8 });
    if (e.key === 'w') Body.setVelocity(player1, { x: 0, y: -8 });
    if (e.key === 'ArrowLeft') Body.setVelocity(player2, { x: -8, y: 0 });
    if (e.key === 'ArrowRight') Body.setVelocity(player2, { x: 8, y: 0 });
    if (e.key === 'ArrowUp') Body.setVelocity(player2, { x: 0, y: -8 });
    if (e.key === 'ArrowDown') Body.setVelocity(player2, { x: 0, y: 8 });
  });
  let canWin = true;
  const win = p => {
    canWin = false;
    document.querySelector('h2').textContent = `${p} wins`;
    world.gravity.y = 1;
    let v = parseInt(document.querySelector(`.${p}`).textContent);
    document.querySelector(`.${p}`).textContent = v + 1;
    world.bodies.forEach(b => {
      if (b.label === 'wall' || b.label === 'goal') {
        Body.setStatic(b, false);
      }
    });
    setTimeout(init, 3000);
  };
  Events.on(engine, 'collisionStart', e => {
    e.pairs.forEach(collision => {
      const p1 = ['goal', 'p1'];
      const p2 = ['goal', 'p2'];
      if (
        p1.includes(collision.bodyA.label) &&
        p1.includes(collision.bodyB.label) &&
        canWin
      ) {
        win('green');
      }
      if (
        p2.includes(collision.bodyA.label) &&
        p2.includes(collision.bodyB.label) &&
        canWin
      ) {
        win('blue');
      }
    });
  });
};
init();
