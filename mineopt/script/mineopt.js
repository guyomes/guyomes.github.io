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
        var round_trips = 0;
        for(let i = 0; i < raw.length; i++) {
            var num = evt.data.result.vars[raw[i]];
            if(num > 0) { 
                document.getElementById(raw[i]).value = num;
                round_trips += num;
            } else {
                document.getElementById(raw[i]).value = "";
            }
        }
        if(round_trips > 0) {
            document.getElementById("Total").value = round_trips;
        } else {
            document.getElementById("Total").value = "";
        }
        if(time > 0) {
            document.getElementById("Time").value = round_trips * time;
        } else {
            document.getElementById("Time").value = "";
        }
        //console.log(evt.data);
    }
};
var targets_list = null;
var selected = null;
var base_yield = null;
var m3per100units = null;
var problem = null;
var test = null;
var time = 0;

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

var distribution = {
    "Common": [ "Veldspar", "Scordite", "Plagioclase" ],
    "Uncommon": [ "Pyroxeres", "Omber", "Kernit", "Dark_Ochre" ],
    "Special": [ "Hemorphite", "Spodumain", "Gneiss" ],
    "Rare": [ "Jaspet", "Hedbergite", "Crockite" ],
    "Precious": [ "Bistot", "Arkonor", "Mercoxit" ]
}

var skills = {
    "Common": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Uncommon": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Special": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Rare": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Precious": {"Basic": 0, "Advanced": 0, "Expert": 0},
    "Production": {"Basic": 0, "Advanced": 0, "Expert": 0}
}

var rate = {
  "Veldspar": 0.3,
  "Scordite": 0.3,
  "Pyroxeres": 0.3,
  "Plagioclase": 0.3,
  "Omber": 0.3,
  "Kernit": 0.3,
  "Jaspet": 0.3,
  "Hemorphite": 0.3,
  "Hedbergite": 0.3,
  "Spodumain": 0.3,
  "Dark_Ochre": 0.3,
  "Gneiss": 0.3,
  "Crockite": 0.3,
  "Bistot": 0.3,
  "Arkonor": 0.3,
  "Mercoxit": 0.3
}

var target_rate = 1;
var capacity = 0;
var quantity = 1;

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
    m3per100units = await fetch("/mineopt/data/m3per100units.json").then(response => response.json());
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
            coefficients.push({"name": raw[i], "coef": 0});
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

function update_production(element, level) {
    skills["Production"][level] = element.value;
    target_rate = (150 - skills["Production"]["Basic"] * 6
                       - skills["Production"]["Advanced"] * 4
                       - skills["Production"]["Expert"])
                  / 150;
    update_target(selected);
}

function update_skills(element, type, level) {
    skills[type][level] = element.value;
    for( let i = 0; i < distribution[type].length; i++) {
        rate[distribution[type][i]] =
            0.3
            + skills[type]["Basic"] * 0.3 * 0.1
            + skills[type]["Advanced"] * 0.3 * 0.05
            + skills[type]["Expert"] * 0.3 * 0.05
            + (skills[type]["Advanced"] > 0 ? 0.3*0.05 : 0);
    }
    update_subjectTo_coef();
    solve();
}

function update_time(element) {
    time = element.value;
    solve();
}

function update_capacity(element) {
    capacity = element.value;
    update_subjectTo_coef();
    solve();
}

function update_subjectTo_coef() {
    for(let j=0; j < processed.length; j++) {
        for(let i=0; i < raw.length; i++) {
            problem.subjectTo[j].vars[i].coef = base_yield[raw[i]][processed[j]] / m3per100units[raw[i]] * rate[raw[i]] * capacity;
        }
    }
}

function update_quantity(element) {
    quantity = element.value;
    update_target(selected);
}

function update_target(element) {
    selected = element;
    if(selected) {
        for(let i = 0; i < processed.length; i++) {
            var num = targets_list[element.value].resources[processed[i]];
            document.getElementById(processed[i]+"-target").value = Math.round(num * quantity * target_rate);
            update_subjectTo_bnds(i);
        }
        solve();
    }
}

function update_processed(num) {
    update_subjectTo_bnds(num);
    solve();
}

function update_subjectTo_bnds(num) {
    var credit = document.getElementById(processed[num] + "-credit").value;
    var target = document.getElementById(processed[num] + "-target").value;
    problem.subjectTo[num].bnds.lb = target - credit;
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


