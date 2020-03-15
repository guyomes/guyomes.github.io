/*******************************************************************
               Copyright (C) 2019 Guillaume Moroz

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
                 http://www.gnu.org/licenses/
*******************************************************************/

// Global variables
var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--n'));
var board_square = Array.from(Array(n), () => new Array(n));
var board_horizontal = Array.from(Array(n), () => new Array(n));
var board_vertical = Array.from(Array(n), () => new Array(n));
var board_side = new Array(n);
var board_highlight = null;
var board_undo = null;
var delta = 10;
var rotation = 0;
var board_side = null;
var undo_list = [];
var ineq = new Object();
ineq["<"] = document.createTextNode("<");
ineq[">"] = document.createTextNode(">");

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
    board_side = side;
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
    board_side.classList.remove("mode_highlight");
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
    board_side.classList.add("mode_highlight");
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
function loadBoard(numbers, horizontal, vertical) {
    for(i = 0; i < numbers.length; i++) {
        setBoardNumber(numbers[i][0], numbers[i][1], numbers[i][2]);
    }
    for(i = 0; i < horizontal.length; i++) {
        board_horizontal[horizontal[i][0]-1][horizontal[i][1]-1].appendChild(ineq[horizontal[i][2]].cloneNode());
    }
    for(i = 0; i < vertical.length; i++) {
        board_vertical[vertical[i][0]-1][vertical[i][1]-1].appendChild(ineq[vertical[i][2]].cloneNode());
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

function loadGame(numbers, horizontal, vertical) {
    document.body.classList.add("theme_pad");
    createMenu();
    createSide();
    createGrid();
    modeGuess();
    loadBoard(numbers, horizontal, vertical);
}
