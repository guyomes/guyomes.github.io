/*******************************************************************
               Copyright (C) 2019 Guillaume Moroz

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
                 http://www.gnu.org/licenses/
*******************************************************************/

const glpk = new Worker('/mineopt/script/glpk-worker.js');
glpk.onerror = (err) => {
    console.log(err);
};
glpk.onmessage = (evt) => {
    if(evt.data.result) {
        console.log(evt.data);
    }
};
var targets_list = null;
var base_yield = null;
var problem = null;
var test = null;

var raw = [
  "Veldspar",
  "Scordite",
  "Pyroxeres",
  "Plagioclase",
  "Omber",
  "Kernit",
  "Jaspet",
  "Hemorphite",
  "Hedbergite",
  "Spodumain",
  "Dark_Ochre",
  "Gneiss",
  "Crockite",
  "Bistot",
  "Arkonor",
  "Mercoxit"
]

var processed = [
  "Tritanium",
  "Pyerite",
  "Mexallon",
  "Isogen",
  "Nocxium",
  "Zydrine",
  "Megacyte",
  "Morphite"
];

async function fill_targets() {
    targets_list = await fetch("/mineopt/data/targets.json").then(response => response.json());
    var targets_select = document.getElementById('Targets_list');
    for(i = 0; i < targets_list.length; i++) {
        var option = document.createElement('option');
        option.text = targets_list[i].name;
        option.value = i;
        targets_select.add(option);
    }
}

async function init_problem() {
    base_yield = await fetch("/mineopt/data/base_yield.json").then(response => response.json());
    test = await fetch("/mineopt/problem_base_yield.json").then(response => response.json());
    problem = {
      "name": "mineopt",
      "generals": raw,
      "objective": {
        "direction": 1,
        "name": "roundtrips",
        "vars": [],
      },
      "subjectTo": [],
      "options": {
        "msglev": 0
      }
    };
    for(let j=0; j < processed.length; j++) {
        var coefficients = [];
        for(let i=0; i < raw.length; i++) {
            coefficients.push({"name": raw[i], "coef": base_yield[raw[i]][processed[j]]});
        }
        problem.subjectTo.push({
                "name": processed[j],
                "vars": coefficients,
                "bnds": {"type": 2, "lb": 0}
        });
    }
    for(let i=0; i < raw.length; i++) {
        problem.objective.vars.push({"name": raw[i], "coef": 1});
        problem.subjectTo.push({
            "name": raw[i],
            "vars": [{"name": raw[i], "coef": 1}],
            "bnds": {"type": 2, "lb": 0}
        });
    }
}

function update_target(element) {
    for(let i = 0; i < processed.length; i++) {
        var num = targets_list[element.value].resources[processed[i]];
        document.getElementById(processed[i]).value = num;
        problem.subjectTo[i].bnds.lb = num;
    }
    solve();
}

function update(element) {
    solve();
}

function solve() {
    //console.log(test);
    //glpk.postMessage(test);
    //console.log(problem);
    glpk.postMessage(problem);
}

function init() {
    fill_targets();
    init_problem();
}


