"use strict";

const sgf  = require('./parser');
const go   = require('./go');

const fs   = require('fs');
const path = require('path');
const _ = require('underscore');

const abc = 'abcdefghijklmnopqrs';

let SIZE   = 19;    

let files   = null;

function loadFiles(dir) {
    files = fs.readdirSync(dir).map(fileName => {
        return path.join(dir, fileName);
    });
    return files.length > 0;
}

function move(s, SIZE) {
    return _.indexOf(abc, s[0]) + _.indexOf(abc, s[1]) * SIZE;
}

function loadData(callback) {
    for (let ix = 0; ix < files.length; ix++) {
//      console.log('Loaded: ' + files[ix]);
        const d = fs.readFileSync(files[ix]);
        const data = d.toString();
        const moves = sgf.parse(data);
        let WINNER = '';
        if (moves) {
            let board = new Int32Array(SIZE * SIZE);
            for (let i = 0; i < moves.length; i++) {
                if (!moves[i].arg[0]) continue;
                if (moves[i].name == 'SZ') {
                    SIZE = moves[i].arg[0];
                    board = new Int32Array(SIZE * SIZE);
                    continue;
                }
                if (moves[i].name == 'RE') {
                    WINNER = moves[i].arg[0][0];
                    continue;
                }
                if (moves[i].name == 'AB') {
                    for (let j = 0; j < moves[i].arg.length; j++) {
                        const m = move(moves[i].arg[j], SIZE);
                        board[m] = 1;
                    }
                    continue;
                }
                if (moves[i].name == 'AW') {
                    for (let j = 0; j < moves[i].arg.length; j++) {
                        const m = move(moves[i].arg[j], SIZE);
                        board[m] = -1;
                    }
                    continue;
                }
                if (moves[i].name == 'B') {
                    const m = move(moves[i].arg[0], SIZE);
                    if (WINNER == moves[i].name) {
                        let setups = [];
                        _.each([0/*, 1, 2, 3, 4, 5, 6, 7*/], function(rotate) {
                            const s = go.GetFen(board, SIZE, true, rotate);
                            if (_.indexOf(setups, s) >= 0) return;
                            setups.push(s);
                            callback(s, go.transform(m, rotate, SIZE), WINNER == moves[i].name ? 1 : -1);
                        });
                    }
                    board = go.RedoMove(board, 1, m, SIZE);
                }
                if (moves[i].name == 'W') {
                    const m = move(moves[i].arg[0], SIZE);
                    if (WINNER == moves[i].name) {
                        let setups = [];
                        _.each([0/*, 1, 2, 3, 4, 5, 6, 7*/], function(rotate) {
                            const s = go.GetFen(board, SIZE, false, rotate);
                            if (_.indexOf(setups, s) >= 0) return;
                            setups.push(s);
                            callback(s, go.transform(m, rotate, SIZE), WINNER == moves[i].name ? 1 : -1);
                        });
                    }
                    board = go.RedoMove(board, -1, m, SIZE);
                }
            }
        }
    }
}

function callback(setup, move, winner) {
    console.log('insert into ai_fit(variant_id, setup, move, rd, winner) values(2, \'' + setup + '\', ' + move + ', ' + _.random(10000) + ', ' + winner + ');');
}

async function proceed() {
    loadFiles('./data');
    loadData(callback);
}

async function run() {
    await proceed();
}

(async () => { await run(); })();