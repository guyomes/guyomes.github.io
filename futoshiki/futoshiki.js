/*******************************************************************
               Copyright (C) 2019 Guillaume Moroz

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
                 http://www.gnu.org/licenses/
*******************************************************************/

// Global variables
var difficultyLabels = ["&#9733;", "&#9733; &#9733;", "&#9733; &#9733; &#9733;"];
var difficulty = 1;
var size = 7;
//var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--n'));
var n = 9;
var board_square = Array.from(Array(n), () => new Array(n));
var board_horizontal = Array.from(Array(n), () => new Array(n));
var board_vertical = Array.from(Array(n), () => new Array(n));
var board_side = new Array(n);
var board_highlight = null;
var board_undo = null;
var delta = 10;
var rotation = 0;
var board_side_main = null;
var undo_list = [];
var ineq = new Object();
ineq["<"] = "&#9650;";
ineq[">"] = "&#9660;";

var selected_element = null;

// Menu drawing : Edit, Guess, Highlight, Undo, Choose
function createMenu() {
    var highlight = document.createElement("img");
    highlight.classList.add("button_highlight");
    highlight.setAttribute('src', '/futoshiki/highlighter.svg');
    highlight.setAttribute('onmousedown', 'modeHighlight()');
    highlight.setAttribute('ontouchstart', 'modeHighlight(); event.preventDefault()');
    document.body.appendChild(highlight);
    board_highlight = highlight;

    var undo = document.createElement("img");
    undo.classList.add("button_undo");
    undo.setAttribute('src', '/futoshiki/undo.svg');
    undo.setAttribute('onmousedown', 'actionUndo()');
    undo.setAttribute('ontouchstart', 'actionUndo(); event.preventDefault()');
    document.body.appendChild(undo);
    board_undo = undo;

    //var guess = document.createElement("div");
    //guess.classList.add("button_guess");
    //guess.setAttribute('onmousedown', 'modeGuess()');
    //guess.setAttribute('ontouchstart', 'modeGuess(); event.preventDefault()');
}

// Side bar drawing
function createSide() {
    var side = document.createElement("div");
    side.classList.add("side");
    board_side_main = side;
    document.body.appendChild(side);
    for(i = 0; i < n; i++) {
        square = document.createElement("div")
        square.classList.add("square");
        square.classList.add("strikeout");
        square.setAttribute('num', i)
        num_content = document.createTextNode(i+1);
        square.appendChild(num_content);
        side.appendChild(square);
        board_side[i] = square;
    }
}

// Grid drawing and styling
function createGrid() {
    var grid = document.createElement("div");
    grid.classList.add("grid");
    document.body.appendChild(grid);
    for(i = 0; i < n; i++) {
        for(j = 0; j < n; j++) {
            cell = document.createElement("div")
            cell.classList.add("cell");
            cell.classList.add("id" + i + j);
            grid.appendChild(cell);

            square = document.createElement("div")
            square.classList.add("square");
            square.setAttribute('row', i);
            square.setAttribute('col', j);
            square.setAttribute('onmousedown', 'modeGuess(); select(this)');
            square.setAttribute('ontouchstart', 'modeGuess(); select(this); event.preventDefault()');
            cell.appendChild(square);
            board_square[i][j] = square;

            for(k = 0; k < n; k++) {
                var num = document.createElement("div");
                num.classList.add("multiple");
                num.classList.add("guess");
                num_content = document.createTextNode(k+1);
                num.appendChild(num_content);
                square.appendChild(num);
            }

            right = document.createElement("div")
            right.classList.add("right");
            cell.appendChild(right);
            board_horizontal[i][j] = right;

            below = document.createElement("div")
            below.classList.add("below");
            cell.appendChild(below);
            board_vertical[i][j] = below;
        }
    }
}

function actionUndo() {
    action = undo_list.pop();
    var i = action[0];
    var j = action[1];
    var num = action[2];
    var alert = action[3];

    select(board_square[i][j]);
    toggleGuess(board_side[num]);
    rotation -= 2*delta;
    board_undo.style.transform = "rotate("+ rotation + "deg)";
    if(!alert) {
        board_square[i][j].childNodes[num].classList.remove("alert");
        board_side[num].classList.remove("alert");
    }
    undo_list.pop();
}

function modeGuess() {
    board_side_main.classList.remove("mode_highlight");
    board_highlight.classList.remove("focus");
    var is_highlighted = false;
    for(i = 0; i < n; i++) {
        board_side[i].setAttribute('onmousedown', 'toggleGuess(this)');
        board_side[i].setAttribute('ontouchstart', 'toggleGuess(this); event.preventDefault()');
        if(board_side[i].classList.contains("highlight")) {
            board_side[i].classList.remove("highlight");
            is_highlighted = true;
        }
    }
    if(is_highlighted) {
        for(i = 0; i < n; i++) {
            for(j = 0; j < n; j++) {
                board_square[i][j].classList.remove("highlight");
            }
        }
    }

}

function modeHighlight() {
    board_side_main.classList.add("mode_highlight");
    if(selected_element != null) {
        selected_element.classList.remove("focus");
        selected_element = null;
    }
    board_highlight.classList.add("focus");
    for(i = 0; i < n; i++) {
        board_side[i].setAttribute('onmousedown', 'toggleHighlight(this)');
        board_side[i].setAttribute('ontouchstart', 'toggleHighlight(this); event.preventDefault()');
        board_side[i].classList.remove("strikeout");
        board_side[i].classList.remove("alert");
    }
}

function toggleHighlight(element) {
    if(!element.classList.contains("highlight")) {
        element.classList.add("highlight");
        var num = element.getAttribute("num");
        for(i = 0; i < n; i++) {
            for(j = 0; j < n; j++) {
                if(!board_square[i][j].childNodes[num].classList.contains("hide")) {
                    board_square[i][j].classList.add("highlight");
                }
            }
        }
    } else {
        element.classList.remove("highlight");
        var numlist = [];
        for(i = 0; i < n; i++) {
            if(board_side[i].classList.contains("highlight")) {
                numlist.push(i);
            }
        }
        for(i = 0; i < n; i++) {
            for(j = 0; j < n; j++) {
                board_square[i][j].classList.remove("highlight");
                for(k = 0; k < numlist.length; k++) {
                    if(!board_square[i][j].childNodes[numlist[k]].classList.contains("hide")) {
                        board_square[i][j].classList.add("highlight");
                        break;
                    }
                }
            }
        }
    }
}

// set fixed numbers from a board
function setBoardNumber(i, j, k) {
    board_square[i-1][j-1].removeAttribute('onmousedown');
    board_square[i-1][j-1].removeAttribute('ontouchstart');
    var num_list = board_square[i-1][j-1].childNodes;
    for(i = 0; i < n; i++) {
        num_list[i].classList.add("hide");
    }
    num_list[k-1].classList.add("unique");
    num_list[k-1].classList.add("board");
    num_list[k-1].classList.remove("hide");
}

// fill board with a game given by 3 arrays
function loadBoard(numbers, horizontals, verticals) {
    for(i = 0; i < numbers.length; i++) {
        setBoardNumber(numbers[i][0], numbers[i][1], numbers[i][2]);
    }
    for(i = 0; i < horizontals.length; i++) {
        board_horizontal[horizontals[i][0]-1][horizontals[i][1]-1].innerHTML = ineq[horizontals[i][2]];
    }
    for(i = 0; i < verticals.length; i++) {
        board_vertical[verticals[i][0]-1][verticals[i][1]-1].innerHTML = ineq[verticals[i][2]];
    }
}

function select(element) {
    if(selected_element != null) {
        selected_element.classList.remove("focus");
    }
    element.classList.add("focus");
    selected_element = element;
    for(i = 0; i < n; i++) {
        num = element.childNodes[i];
        if(num.classList.contains("hide")) {
            board_side[i].classList.add("strikeout");
            board_side[i].classList.remove("alert");
        } else {
            board_side[i].classList.remove("strikeout");
            if(num.classList.contains("alert")) {
                board_side[i].classList.add("alert");
            } else {
                board_side[i].classList.remove("alert");
            }
        }
    }
}

function toggleGuess(element) {
    if(selected_element == null) {
        return;
    }
    var num = parseInt(element.getAttribute("num"));
    var row = parseInt(selected_element.getAttribute("row"));
    var col = parseInt(selected_element.getAttribute("col"));
    element.classList.toggle("strikeout");
    selected_element.childNodes[num].classList.toggle("hide");
    was_alert = selected_element.childNodes[num].classList.contains("alert");
    var count = 0;
    var unique = 0;
    if(!element.classList.contains("strikeout")
       && (!checkLatinRow(row, col, num)
           || !checkLatinCol(row, col, num)
           || !checkIneq(row, col, num))) {
        selected_element.childNodes[num].classList.add("alert");
        element.classList.add("alert");
    } else {
        selected_element.childNodes[num].classList.remove("alert");
        element.classList.remove("alert");
    }
    for(i = 0; i < n; i++) {
        selected_element.childNodes[i].classList.remove("unique");
        if(selected_element.childNodes[i].classList.contains("hide")) {
            count += 1;
        } else {
            unique = i;
        }
    }
    if(count == n-1) {
        selected_element.childNodes[unique].classList.add("unique");
        if(!checkLatinRow(row, col, unique)
               || !checkLatinCol(row, col, unique)
               || !checkIneq(row, col, unique)) {
            selected_element.childNodes[unique].classList.add("alert");
            board_side[unique].classList.add("alert");
        }
    }
    // update highlight
    selected_element.classList.remove("highlight");
    for(k = 0; k < n; k++) {
        if(board_side[k].classList.contains("highlight")
           &&
           !selected_element.childNodes[k].classList.contains("hide")) {
            selected_element.classList.add("highlight");
            break;
        }
    }
    rotation += delta;
    board_undo.style.transform = "rotate("+ rotation + "deg)";
    undo_list.push([row, col, num, was_alert]);
}

function checkLatinRow(row, col, unique) {
    for(i = 0; i < n; i++) {
        if(i != col) {
            for(j = 0; j < n; j++) {
                if(board_square[row][i].childNodes[j].classList.contains("unique")) {
                    if(j == unique) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function checkLatinCol(row, col, unique) {
    for(i = 0; i < n; i++) {
        if(i != row) {
            for(j = 0; j < n; j++) {
                if(board_square[i][col].childNodes[j].classList.contains("unique")) {
                    if(j == unique) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function getUnique(element) {
    for(j = 0; j < n; j++) {
        if(element.childNodes[j].classList.contains("unique")) {
            return j;
        }
    }
    return -1;
}

function checkIneq(row, col, unique) {
    if(col > 0) {
        var candidate = getUnique(board_square[row][col-1]);
        if((candidate > -1) &&
           ( (candidate >= unique &&
              board_horizontal[row][col-1].textContent == "<")
             ||
             (candidate <= unique &&
              board_horizontal[row][col-1].textContent == ">")))
        {
            return false;
        }
    }
    if(col < n-1) {
        var candidate = getUnique(board_square[row][col+1]);
        if((candidate > -1) &&
           ( (candidate >= unique &&
              board_horizontal[row][col].textContent == ">")
             ||
             (candidate <= unique &&
              board_horizontal[row][col].textContent == "<")))
        {
            return false;
        }
    }
    if(row > 0) {
        var candidate = getUnique(board_square[row-1][col]);
        if((candidate > -1) &&
           ( (candidate >= unique &&
              board_vertical[row-1][col].textContent == "<")
             ||
             (candidate <= unique &&
              board_vertical[row-1][col].textContent == ">")))
        {
            return false;
        }
    }
    if(row < n-1) {
        var candidate = getUnique(board_square[row+1][col]);
        if((candidate > -1) &&
           ( (candidate >= unique &&
              board_vertical[row][col].textContent == ">")
             ||
             (candidate <= unique &&
              board_vertical[row][col].textContent == "<")))
        {
            return false;
        }
    }
    return true
}

/* UI for level screen */

// Menu drawing : Edit, Guess, Highlight, Undo, Choose
function createMenuLevels() {
    var harder = document.createElement("div");
    harder.classList.add("button_harder");
    harder.textContent = ">";
    harder.setAttribute('onmousedown', 'increaseDifficulty()');
    harder.setAttribute('ontouchstart', 'increaseDifficulty(); event.preventDefault()');
    document.body.appendChild(harder);

    var easier = document.createElement("div");
    easier.classList.add("button_easier");
    easier.textContent = "<";
    easier.setAttribute('onmousedown', 'decreaseDifficulty()');
    easier.setAttribute('ontouchstart', 'decreaseDifficulty(); event.preventDefault()');
    document.body.appendChild(easier);
}

// Side bar drawing
function createSideLevels() {
    var side = document.createElement("div");
    side.classList.add("side");
    side.classList.add("mode_highlight");
    board_side_main = side;
    document.body.appendChild(side);
    label = document.createElement("div");
    label.classList.add("label");
    label.innerHTML = difficultyLabels[difficulty];
    side.appendChild(label);
    for(i = 3; i < 9; i++) {
        square = document.createElement("div")
        square.classList.add("square");
        square.setAttribute('num', i)
        square.setAttribute('onmousedown', 'setSize(this)');
        square.setAttribute('ontouchstart', 'setSize(this); event.preventDefault()');
        num_content = document.createTextNode(i+1);
        square.appendChild(num_content);
        side.appendChild(square);
        board_side[i] = square;
    }
}

// Grid drawing and styling
function createGridLevels() {
    var grid = document.createElement("div");
    grid.classList.add("grid");
    document.body.appendChild(grid);
    for(i = 0; i < 9; i++) {
        for(j = 0; j < 9; j++) {
            cell = document.createElement("div")
            cell.classList.add("cell");
            grid.appendChild(cell);

            square = document.createElement("div")
            square.classList.add("square");
            square.classList.add("center");
            square.setAttribute('row', i);
            square.setAttribute('col', j);
            square.setAttribute('onmousedown', 'loadLevel(this);');
            square.setAttribute('ontouchstart', 'loadLevel(this); event.preventDefault()');
            square.textContent = (9*i + j + 1).toString();
            cell.appendChild(square);
            board_square[i][j] = square;
        }
    }
}


function increaseDifficulty() {
    if(difficulty == 0) {
        difficulty += 1;
    } else if (difficulty == 1) {
        difficulty += 1;
    } else if (difficulty == 2) {
    }
    label.innerHTML = difficultyLabels[difficulty];
}

function decreaseDifficulty() {
    if(difficulty == 0) {
    } else if (difficulty == 1) {
        difficulty -= 1;
    } else if (difficulty == 2) {
        difficulty -= 1;
    }
    label.innerHTML = difficultyLabels[difficulty];
}

function setSize(element) {
    board_side[size-1].classList.remove("focus_light");
    size = parseInt(element.getAttribute("num")) + 1;
    element.classList.add("focus_light");
}


function buildUrl(num) {
    var url = "/futoshiki/puzzles/";
    var url_difficulty = ["Easy", "Tricky", "Extreme"];
    var url_size = ["04x04", "05x05", "06x06", "07x07", "08x08", "09x09"];
    var url_id = "00" + ("0"+num).slice(-2);
    var file_url = url + "/" + url_difficulty[difficulty] + "/" + url_size[size - 4] + "/Puzzle" + url_id + ".txt";
    return file_url;
}


function loadLevel(element) {
    var num = element.textContent;
    var file_url = buildUrl(num);
    var rawFile = new XMLHttpRequest();
    rawFile.onload = loadLevelReady;
    rawFile.open("GET",file_url,true);
    rawFile.send(null);
}

function loadLevelReady() {
    var puzzle = this.responseText;
    var numbers = [];
    var horizontals = [];
    var verticals = [];
    var line_size = 2*size-1;
    for(i = 0; i < size; i++) {
        for(j = 0; j < size; j++) {
            var c = puzzle.charAt(2*line_size*i + 2*j);
            if (c != '.') {
                numbers.push([i+1, j+1, parseInt(c)]);
            }
            if (j < size - 1) {
                var c = puzzle.charAt(2*line_size*i + 2*j+1);
                if (c == '(') {
                    horizontals.push([i+1, j+1, '<']);
                } else if (c == ')') {
                    horizontals.push([i+1, j+1, '>']);
                }
            }
            if (i < size - 1) {
                var c = puzzle.charAt((2*i+1)*line_size + 2*j);
                if (c == '^') {
                    verticals.push([i+1, j+1, '<']);
                } else if (c == 'v') {
                    verticals.push([i+1, j+1, '>']);
                }
            }
        }
    }
    loadGame(numbers, horizontals, verticals);
}

function loadGame(numbers, horizontals, verticals) {
    n = size;
    document.documentElement.style.setProperty('--n', size);
    document.body.textContent = '';
    document.body.classList.add("theme_pad");
    createMenu();
    createSide();
    createGrid();
    modeGuess();
    loadBoard(numbers, horizontals, verticals);
}

function loadChooseLevels() {
    document.body.classList.add("theme_pad");
    createMenuLevels();
    createSideLevels();
    createGridLevels();
    setSize(board_side[size-1]);
}
