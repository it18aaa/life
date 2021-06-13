const state = {
    data: [],
    width: 320,
    height: 160,
    generation: 0,
    celltype: 'square',
    interval: 50,
    colours: true,
    gridlines: true,
    timer: null,
    weighting: 0.6,
    rules: "2345/45678"
}

function gameOfLife() {

    state.width = parseInt($('#width').val());
    state.height = parseInt($('#height').val());
    state.interval = $('#updateInterval').val();
    state.weighting = $('#weighting').val();
    state.celltype = $('#celltype').val();
    state.rules = $('#ruleset').val();
    state.draw = false;

    state.data = init_random(state);
    render(state);

    const stepper = function () {
        step(state)
    };


    // handle events

    $('#ruleset').on('change', function () {
        const input = $(this).val();
        if (input != "custom") {
            state.rules = input;
            $('#userRules').val(input);
           // state.generation = 0;
           // state.data = init_random(state);
            render(state);
        }
    })

    $('#userRules').on('input', function () {
        state.rules = $(this).val();
        $('#ruleset').val('custom');
        //state.generation = 0;
        //state.data = init_random(state);
        render(state);
    })


    $('#celltype').on('click', function () {
        state.celltype = $(this).val();
        render(state);
    });

    $('#width').on('input', function () {
        state.width = parseInt($(this).val());
        state.data = [state.width * state.height];
        state.generation = 0;
        state.data = init_random(state);
        render(state);

    });

    $('#height').on('input', function () {
        state.height = parseInt($(this).val());
        state.data = [state.width * state.height];
        state.generation = 0;
        state.data = init_random(state);

        render(state);
    });

    $('#updateInterval').on('input', function () {
        if (state.timer) {
            clearInterval(state.timer);
            state.interval = $(this).val();
            state.timer = setInterval(stepper, state.interval)
        } else {
            state.interval = $(this).val();
        }
        $('#intervalLabel').text(state.interval)
    })

    $('#stop').on('click', () => {
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
    });

    $('#start').on('click', () => {
        if (!state.timer) {
            state.timer = setInterval(stepper, state.interval)
        }

    });


    $('#clear').on('click', ()=> {
        if(state.timer) {
            clearInterval(state.timer);
            state.timer = null;
            state.data.fill(0);
            render(state);
            state.timer = setInterval(stepper, state.interval)
        } else {
            state.data.fill(0);
            render(state)
        }
    })

    $('#random').on('click', () => {
        let restart = false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
            restart = true;
        }
        state.data = init_random(state);
        state.generation = 0;
        render(state);
        if(restart) {
            state.timer = setInterval(stepper, state.interval);
        }
    })

    $('#weighting').on('input', function () {
        state.weighting = $(this).val();
        $('#weightingLabel').text(parseInt(state.weighting*100));
    });

    $('#colours').on('change', function () {
        state.colours = $(this).prop("checked");
        render(state);
    });

    $('#gridlines').on('change', function () {
        state.gridlines = $(this).prop("checked");
        render(state);
    })


    $('#output').on('mousedown', function (e) {
        if (!state.draw) {

            const index = getCellIndex( $('#output').get(0), e);
            state.data[index] = 1;
            state.draw = true;
            render(state);
        }
    });

    $('html').on('mouseup', function(e) {
        if(state.draw) {
            state.draw = false;
        }
    });

    $('#output').on('mousemove', function(e) {
        if(state.draw) {
            // do drawing
            const index = getCellIndex($('#output').get(0), e);
            if(!state.data[index]) {
                state.data[index] = 1;
                render(state);
            }
        }
    })

    state.timer = setInterval(stepper, state.interval)
}

function getCellIndex(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    const cellx = Math.floor(x / (rect.width / state.width));
    const celly = Math.floor(y / (rect.height / state.height));
    const index = to1D({
        x: cellx,
        y: celly
    }, state.width, state.height);
    return index;
}

function step(state) {
    const newGen = next_generation(state);
    state.data = newGen;
    state.generation++;

    render(state);
}

function init_random(state) {
    const arrayLength = state.width * state.height;
    const arr = [arrayLength];
    for (let i = 0; i < arrayLength; i++) {
        arr[i] = 1 - weightedRound(Math.random(), state.weighting);
    }
    return arr;
}

function weightedRound(value, boundary) {
    return value > boundary ? 1 : 0;
}

function next_generation(state) {

    const width = state.width;
    const height = state.height;

    const newGen = [width * height];

    // create array of addresses to the cells Moore Neighbourhood.
    state.data.forEach((element, index) => {
        const el = to2D(index, width, height);
        const {
            x,
            y
        } = el;
        let neighbours = 0;

        // NW
        const nw = state.data[to1D({
            x: x - 1,
            y: y - 1
        }, width, height)];

        // N
        const n = state.data[to1D({
            x: x,
            y: y - 1
        }, width, height)];

        // NE
        const ne = state.data[to1D({
            x: x + 1,
            y: y - 1
        }, width, height)];

        // W
        const w = state.data[to1D({
            x: x - 1,
            y: y
        }, width, height)];

        //  E
        const e = state.data[to1D({
            x: x + 1,
            y: y
        }, width, height)];

        // SE
        const se = state.data[to1D({
            x: x - 1,
            y: y + 1
        }, width, height)];

        // S
        const s = state.data[to1D({
            x: x,
            y: y + 1
        }, width, height)];

        // SW
        const sw = state.data[to1D({
            x: x + 1,
            y: y + 1
        }, width, height)];

        neighbours = nw + n + ne + w + e + sw + s + se;

        newGen[index] = ruleTest(element, neighbours, state.rules)
    });

    return newGen;
}

function ruleTest(currentState, neighbours, ruleSet) {

    // assumed rule string is "S/B"
    if (!ruleSet) {
        // if not set, do conway's game of life.
        ruleSet = "23/3"
    }

    let output = 0;
    const rules = ruleSet.split("/");

    // if cell is currently alive,
    // check survival rule
    if (currentState == 1) {
        return rules[0].includes(neighbours.toString());
    } else if (currentState == 0) {
        // if cell is dead, check birth rule
        return rules[1].includes(neighbours.toString());
    }
}

// function render(data, width, height, celltype, colours, gridlines) {
function render(state) {

    //text renderer for console
    // let output = '';
    // data.forEach((cell, index) => {
    //     if (index % width) {
    //         // output += `${cell ? 'O': ' '}`;
    //         output += `${cell}`;
    //     } else {
    //         // output += `\n${index / width}: ${cell ? 'O': ' '}`
    //         output += `\n${index / width}: ${cell}`
    //     }
    // })
    // console.log(output)

    $('#generation').text(state.generation);

    var canvas = document.getElementById("output");
    var ctx = canvas.getContext("2d")

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight - 150;

    var xlen = canvas.width / state.width;
    var ylen = canvas.height / state.height;

    var xfactor = 255 / state.width;
    var yfactor = 255 / state.height;
    var temper = .95;
    let cell = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgb(240,240,240)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw grid lines

    if (state.gridlines) {
        for (let y = 0; y < canvas.height + 1; y += ylen) {
            ctx.strokeStyle = 'rgb(230, 230, 230)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        for (let x = xlen; x < canvas.width + 1; x += xlen) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }


    const spacer = state.gridlines ? 1 : 0;

    for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
            if (state.data[cell]) {
                // create the colour
                if (state.colours == true) {
                    ctx.fillStyle = 'rgb(' + Math.floor((x * xfactor) / temper) + ', ' +
                        Math.floor((255 - y * yfactor) / temper) + ', 110)';
                } else {
                    ctx.fillStyle = 'rgb(0,0,0)';
                }

                if (state.celltype === "square") {
                    ctx.fillRect(x * xlen, y * ylen, xlen - spacer, ylen - spacer);
                } else if (state.celltype === "circle") {
                    ctx.beginPath();
                    ctx.arc(x * xlen + (xlen / 2),
                        y * ylen + (ylen / 2),
                        (xlen - 1) / 2,
                        0,
                        2 * Math.PI);
                    ctx.fill();
                }
            } else {
                // ctx.fillStyle = 'rgb(230,220,230)';
                // // ctx.fillRect(x * xlen, y * ylen, xlen-1, ylen-1);
                // ctx.beginPath();
                // ctx.arc(x * xlen + (xlen / 2),
                //     y * ylen + (ylen / 2),
                //     (xlen - 1) / 2,
                //     0,
                //     2 * Math.PI);
                // ctx.fill();
            }
            cell++;
        }
    }
}

function to1D(obj, width, height) {

    const out = {
        x: obj.x,
        y: obj.y
    }

    if (obj.x < 0) {
        // % remainder to modulo, for wrap around 
        out.x = ((obj.x % width) + width) % width;
    }
    if (obj.x > width - 1) {
        out.x = obj.x % width;
    }
    if (obj.y < 0) {
        // % remainder to modulo, for wrap around 
        out.y = ((obj.y % height) + height) % height;
    }
    if (obj.y > height - 1) {
        out.y = obj.y % (height);
    }

    const output = out.y * width + out.x;

    return output;
}

function to2D(index, width, height) {
    let obj = {
        x: index % width,
        // y: Math.floor(index / width)
        y: Math.floor(index / width)
    };

    return obj;
}

function testStuff() {

    console.log("Program start")
    const w = 12;
    const h = 9;
    const size = w * h;

    console.log(`iterating through ${size} values`)
    for (let i = 0; i < size; i++) {
        const a = to2D(i, w, h);
        const b = to1D(a, w, h);
        console.log(`i: ${i}: `, a, `to1D = ${b}`);
    }


    let a = to1D({
        x: -1,
        y: -1
    }, w, h)
    console.log(`NW: ${a}`);

    a = to1D({
        x: 0,
        y: -1
    }, w, h)
    console.log(`N: ${a}`);

    a = to1D({
        x: 0,
        y: -1
    }, w, h)
    console.log(`NE: ${a}`);

    a = to1D({
        x: -1,
        y: 0
    }, w, h)
    console.log(`W: ${a}`);

    a = to1D({
        x: 1,
        y: 0
    }, w, h)
    console.log(`E: ${a}`);
}