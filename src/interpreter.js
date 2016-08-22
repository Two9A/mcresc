// Mornington Crescent Interactive Debugger, Imran Nazar, 2016
// Thanks to https://www.youtube.com/watch?v=TfrUNMvSJow
// for invaluable debugging assistance

// TODO: Breakpoints
// TODO: Support loading arbitrary files
// TODO: Live editing of the source window

class Interpreter {
    constructor() {
        // 50ms between steps when running
        this.RUN_TIMER = 50;

        // The MCresc file to load
        this.SOURCE_FILE = '../examples/hello.mcresc';

        this.ops = {
            // Integer add
            'Upminster': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A += this.mem[station];
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Integer multiply
            'Chalfont & Latimer': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A *= this.mem[station];
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Integer division
            'Cannon Street': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    if (this.state.A) {
                        this.state.A = 0|(this.mem[station] / this.state.A);
                    } else {
                        this.state.A = '';
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Integer modulus
            'Preston Road': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    if (this.state.A) {
                        this.state.A = this.mem[station] % this.state.A;
                    } else {
                        this.state.A = '';
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Integer maximum
            'Bounds Green': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    if (this.state.A < this.mem[station]) {
                        this.state.A = this.mem[station];
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bitwise NOR
            'Manor House': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A |= this.mem[station];
                    this.state.A = ~this.state.A;
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bitwise AND
            'Holland Park': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A &= this.mem[station];
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bitwise right shift
            'Turnham Green': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    if (this.mem[station] > 0) {
                        this.state.A >>= this.mem[station];
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bitwise left shift
            'Stepney Green': (station) => {
                if (isInt(this.state.A, this.mem[station])) {
                    let prevA = this.state.A;
                    if (this.mem[station] > 0) {
                        this.state.A <<= this.mem[station];
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Square
            'Russell Square': (station) => {
                if (isInt(this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A = this.mem[station] * this.mem[station];
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bitwise NOT
            'Notting Hill Gate': (station) => {
                if (isInt(this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A = ~this.mem[station];
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Parse accumulator to integer
            'Parsons Green': (station) => {
                if (isInt(this.state.A)) {
                    this.swapAccWith(station);
                } else {
                    let matches = this.state.A.match(/(-?\d+)(.*)$/);
                    if (matches && matches.length) {
                        if (matches[1]) {
                            this.state.A = Integer.parseInt(matches[1]);
                        } else {
                            this.state.A = 0;
                        }
                        if (matches[2]) {
                            this.setMem(station, matches[2]);
                        } else {
                            this.setMem(station, '');
                        }
                    } else {
                        this.state.A = 0;
                        this.setMem(station, '');
                    }
                }
            },

            // Seven
            'Seven Sisters': (station) => {
                this.state.A = 7;
                this.setMem(station, 7);
            },

            // Char to code / code to char conversion
            'Charing Cross': (station) => {
                let prevA = this.state.A;
                if (isInt(this.mem[station])) {
                    this.state.A = String.fromCharCode(this.mem[station]);
                } else {
                    if (this.mem[station].length) {
                        this.state.A = this.mem[station].charCodeAt(0);
                    } else {
                        this.state.A = 0;
                    }
                }
                this.setMem(station, prevA);
            },

            // Concatenate
            'Paddington': (station) => {
                if (isInt(this.state.A) || isInt(this.mem[station])) {
                    this.swapAccWith(station);
                } else {
                    let prevA = this.state.A;
                    this.state.A = this.mem[station] + this.state.A;
                    this.setMem(station, prevA);
                }
            },

            // Left substring
            'Gunnersbury': (station) => {
                let prevA = this.state.A;
                if (isInt(this.state.A) && !isInt(this.mem[station])) {
                    if (this.state.A < 0) {
                        this.signal('Cannot take a negative substring');
                    } else if (this.state.A >= this.mem[station].length) {
                        this.signal('Cannot take a substring from past the end');
                    } else {
                        this.state.A = this.mem[station].substr(0, this.state.A);
                    }
                    this.setMem(station, prevA);
                } else if (isInt(this.mem[station]) && !isInt(this.state.A)) {
                    if (this.mem[station] < 0) {
                        this.signal('Cannot take a negative substring');
                    } else if (this.mem[station] >= this.state.A.length) {
                        this.signal('Cannot take a substring from past the end');
                    } else {
                        this.state.A = this.state.A.substr(0, this.mem[station]);
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Right substring
            'Mile End': (station) => {
                let prevA = this.state.A;
                if (isInt(this.state.A) && !isInt(this.mem[station])) {
                    if (this.state.A < 0) {
                        this.signal('Cannot take a negative substring');
                    } else if (this.state.A >= this.mem[station].length) {
                        this.signal('Cannot take a substring from past the end');
                    } else {
                        this.state.A = this.mem[station].substr(-this.state.A);
                    }
                    this.setMem(station, prevA);
                } else if (isInt(this.mem[station]) && !isInt(this.state.A)) {
                    if (this.mem[station] < 0) {
                        this.signal('Cannot take a negative substring');
                    } else if (this.mem[station] >= this.state.A.length) {
                        this.signal('Cannot take a substring from past the end');
                    } else {
                        this.state.A = this.state.A.substr(-this.mem[station]);
                    }
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Uppercase
            'Upney': (station) => {
                if (!isInt(this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A = this.mem[station].toUpperCase();
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Lowercase
            'Hounslow Central': (station) => {
                if (!isInt(this.mem[station])) {
                    let prevA = this.state.A;
                    this.state.A = this.mem[station].toLowerCase();
                    this.setMem(station, prevA);
                } else {
                    this.swapAccWith(station);
                }
            },

            // Bank a value at Hammersmith
            'Bank': (station) => {
                this.swapAccWith(station);
                this.setMem('hsc', this.mem.bnk);
                this.setMem('hsd', this.mem.bnk);
                this.setMem('mmt', this.mem.bnk);
            },
            'Monument': (station) => {
                this.swapAccWith(station);
                this.setMem('hsc', this.mem.mmt);
                this.setMem('hsd', this.mem.mmt);
                this.setMem('bnk', this.mem.mmt);
            },

            // Copy to accumulator
            'Hammersmith': (station) => {
                this.state.A = this.mem[station];
            },

            // Set a jump point
            'Temple': (station) => {
                this.state.jumpstack.unshift(this.state.PC);
            },

            // Conditional jump
            'Angel': (station) => {
                if (!(isInt(this.state.A) && this.state.A == 0)) {
                    this.state.DC = 'tmp';
                    this.state.PC = this.state.jumpstack[0];
                }
            },

            // Unset a jump point
            'Marble Arch': (station) => {
                this.state.jumpstack.shift();
            },

            // End
            'Mornington Crescent': (station) => {
                this.state.output = this.state.A;
                this.pause();
            }
        };

        this.state = {
            A: '',
            PC: 0,
            DC: 'mtc',
            prevDC: 'mtc',
            prevLine: 'northern',
            program: [],
            jumpstack: [],
            running: false,
            runningInterval: null,
            lastError: null,
            output: null
        };
        this.mem = {};
        this.memAccess = {};
    }

    hook() {
        document.getElementById('mcresc-step').addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.state.running) {
                this.step.call(this);
            }
            return false;
        });
        document.getElementById('mcresc-run').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.state.running) {
                this.pause.call(this);
            } else {
                this.run.call(this);
            }
            return false;
        });
        document.getElementById('mcresc-reset').addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.state.running) {
                this.reset.call(this);
            }
            return false;
        });

        // TODO: Live editing of the source code
        document.getElementById('mcresc-code').addEventListener('keydown', (e) => {
            // For now, prevent all edits
            e.preventDefault();
            return false;
        });
        document.getElementById('mcresc-code').addEventListener('keyup', (e) => {
            // For now, prevent all edits
            e.preventDefault();
            return false;
        });
    }

    step() {
        try {
            this.state.lastError = null;
            this.state.output = null;

            // Skip over comments
            let parsed;
            while (!(parsed = this.parseCurrentLine())) {
                this.state.PC++;
            }

            // For stations like Hammersmith and Bank/Monument, the
            // current data pointer might not be on the next Tube line
            let dcStations = this.map.stationCodes[this.map.stationNames[this.state.DC]];
            let lineDC = null;
            for (let station in dcStations) {
                if (this.map.hasStation(parsed.line, dcStations[station])) {
                    lineDC = dcStations[station];
                    break;
                }
            }
            if (lineDC === null) {
                this.state.DC = dcStations[0];
                this.signal('Starting station is not on this line');
            } else {
                this.state.DC = lineDC;
            }

            // If both endpoints are on the line requested, execute
            if (this.map.hasStation(parsed.line, parsed.to)) {
                this.state.prevLine = parsed.line;
                this.state.prevDC = this.state.DC;
                this.state.DC = parsed.to;
                this.perform(this.state.DC);
            } else {
                this.signal('Line or station not found');
            }

            this.state.PC++;
            this.render();

            // End if either output or errors are triggered
            return (this.state.output === null && this.state.lastError === null);
        } catch (e) {
            alert(e.message);
            return false;
        }
    }

    run() {
        this.state.running = true;
        if (this.step()) {
            this.state.runningInterval = window.requestAnimationFrame(this.run.bind(this), this.RUN_TIMER);
        } else {
            this.pause();
        }
    }

    pause() {
        this.state.running = false;
        window.cancelAnimationFrame(this.state.runningInterval);
        this.state.runningInterval = null;
        this.render();
    }

    reset() {
        this.state.A = '';
        this.state.PC = 0;
        this.state.DC = 'mtc';
        this.state.prevDC = 'mtc';
        this.state.prevLine = 'northern';
        this.state.jumpstack = [];
        this.state.running = false;
        this.state.runningInterval = null;
        this.state.lastError = null;
        this.state.output = null;
        for (let station in this.map.stationNames) {
            this.mem[station] = this.map.stationNames[station];
            this.memAccess[station] = 0;
        }
        this.render();
    }

    signal(err) {
        this.state.lastError = err;
        this.state.running = false;
        this.render();
    }

    perform(station) {
        if (this.map.stationNames[station] && this.ops[this.map.stationNames[station]]) {
            this.ops[this.map.stationNames[station]].call(this, station);
        } else {
            this.swapAccWith(station);
        }
    }
    
    swapAccWith(station) {
        let temp = this.state.A;
        this.state.A = this.mem[station];
        this.setMem(station, temp);
    }

    setMem(station, value) {
        this.mem[station] = value;
        this.memAccess[station] = (new Date).getTime();
    }

    load() {
        return new Promise((resolve, reject) => {
            this.map = new TubeMap('#mcresc-map');
            Promise.all([
                this.map.load(),
                XHR(this.SOURCE_FILE)
            ]).then((responses) => {
                this.state.program = responses[1].split("\n");
                this.reset();
                this.render();
                this.hook();
                resolve();
            });
        });
    }

    parseLine(line) {
        if (line && line.length) {
            let matches = line.match(/^Take (.*) Line to (.*)$/i);
            if (matches && matches.length) {
                let line = this.map.lineCodes[matches[1]];
                let stations = this.map.stationCodes[matches[2]];
                let to = null;
                for (let station in stations) {
                    if (this.map.hasStation(line, stations[station])) {
                        to = stations[station];
                        break;
                    }
                }
                if (to) {
                    return {
                        line: line,
                        to: to
                    }
                }
            }
        }
        return false;
    }

    parseCurrentLine() {
        if (typeof this.state.program[this.state.PC] === 'undefined') {
            this.signal('Premature end of program');
        }
        return this.parseLine(this.state.program[this.state.PC]);
    }

    highlight(str) {
        let parsed = this.parseLine(str);
        if (parsed === false) {
            return '<span class="comment">' + str + '</span>';
        } else {
            return 'Take <span class="route">' + this.map.lineNames[parsed.line] + '</span> Line to <span class="station">' + this.map.stationNames[parsed.to] + '</span>';
        }
    }

    render() {
        // Show the currently traversed instruction
        this.map.hideAll();
        this.map.show(this.state.prevLine, this.state.prevDC, this.state.DC);

        // Update the debugger buttons
        if (this.state.running) {
            document.getElementById('mcresc-step').classList.add('disabled');
            document.getElementById('mcresc-reset').classList.add('disabled');
            document.getElementById('mcresc-run').classList.add('running');
        } else {
            document.getElementById('mcresc-step').classList.remove('disabled');
            document.getElementById('mcresc-reset').classList.remove('disabled');
            document.getElementById('mcresc-run').classList.remove('running');
        }

        // Render the highlighted program code
        let code = document.getElementById('mcresc-code');
        code.innerHTML = '';
        this.state.program.forEach((str, idx) => {
            let line = document.createElement('div');
            line.className = 'code-line';
            line.setAttribute('data-line', idx);
            line.innerHTML = this.highlight(str);
            code.appendChild(line);
        });
        
        // Show the current line
        [].forEach.call(document.querySelectorAll('#mcresc-code .code-line'), (line) => {
            line.classList.remove('current');
        });
        let curline = document.querySelector('#mcresc-code .code-line:nth-child(' + (this.state.PC + 1) + ')');
        if (curline) {
            curline.classList.add('current');
            document.getElementById('mcresc-code').scrollTop = curline.offsetTop - (curline.offsetHeight * 8);
        }

        // Update the watch values
        document.getElementById('mcresc-acc').innerHTML = isInt(this.state.A) ? this.state.A : ('"' + this.state.A + '"');
        document.getElementById('mcresc-dp').innerHTML = this.map.stationNames[this.state.DC];
        
        let i, memWithAccess = [], memLines = [];
        for (i in this.memAccess) {
            memWithAccess.push([i, this.memAccess[i]]);
        }
        memWithAccess.sort((a, b) => {
            a = a[1]; b = b[1];
            return b - a;
        });
        for (i = 0; i < memWithAccess.length; i++) {
            let name = memWithAccess[i][0];
            if (memWithAccess[i][1]) {
                memLines.push('<li>' + this.map.stationNames[name] + ': <span class="value">' + (isInt(this.mem[name]) ? this.mem[name] : ('"' + this.mem[name] + '"')) + '</span></li>');
            }
        }
        document.getElementById('mcresc-mem').innerHTML = memLines.join('');

        // If there's been output or an error, show that
        if (this.state.output !== null) {
            document.getElementById('mcresc-output').classList.remove('error');
            document.getElementById('mcresc-output').innerHTML = this.state.output;
        }
        if (this.state.lastError !== null) {
            document.getElementById('mcresc-output').classList.add('error');
            document.getElementById('mcresc-output').innerHTML = this.state.lastError;
        }
        if (this.state.output === null && this.state.lastError === null) {
            document.getElementById('mcresc-output').classList.remove('error');
            document.getElementById('mcresc-output').innerHTML = '';
        }
    }
}
