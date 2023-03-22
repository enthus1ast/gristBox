// maybe this works withouth globals
let currentId = -1
var currentDocument = null

var directions = {
  "get": "Austragen",
  "put": "Eintragen"
}


function parseToList(str) {
  if (str == "") {return []}
  let parts = str.split("-")
  if (parts.length == 2) {
    let min = Number(parts[0])
    let max = Number(parts[1])
    if(min < max) {
      let result = []
      for (let idx = min; idx <= max; idx++ ) {
        result.push(String(idx))
      }
      return result
    }
  }
  return []
}

function toggleClass(elem, classname) {
  // returns true if the class was added, false if it was removed
  if (elem.classList.contains(classname)) {
    elem.classList.remove(classname)
    return false
  } else {
    elem.classList.add(classname)
    return true
  }
}

function changeClass(oldClassName, newClassName) {
  let objs = document.getElementsByClassName("gridelem");
  for (let index = 0; index < objs.length; index++) {
    const element = objs[index];
    if (element.classList.contains(oldClassName) || element.classList.contains(newClassName)) {
      element.classList.remove(oldClassName)
      element.classList.add(newClassName)
    }
  }
}

function listToDict(lst) {
  let pdic = {}
  for (let index = 0; index < lst.length; index++) {
    const element = lst[index];
    pdic[element] = ""
  }
  return pdic
}

function removeElement(lst, value) {
  let index = lst.indexOf(value);
  if (index == -1){return lst} // do nothing if the element was not found
  return lst.splice(index, 1);
}

async function genGrid(width, height, elem) {
  let cnt = 0

  let table = document.createElement("table");

  for (let hh = 0; hh < height; hh++) {
    let tr = document.createElement("tr")
    for (let ww = 0; ww < width; ww++) {
        cnt += 1;
        let td = document.createElement("td");
        td.innerText = cnt;
        td.id = cnt;
        td.classList.add("gridelem")

        td.addEventListener("click", function(ev) {
          // console.log("clicked:", ev.target);

          let wasAdded
          if (currentDocument.Eintragen_Austragen == directions["put"]) {
            wasAdded = toggleClass(ev.target, "insert");
          }
          if (currentDocument.Eintragen_Austragen == directions["get"]) {
            wasAdded = toggleClass(ev.target, "remove");
          }

          let list = currentDocument.Position || [] // if list not there create
          if (wasAdded) {
            list.push(String(ev.target.id))
            // TODO it is strange that it needs to be a dict, fix this when a better way is known
            let pdic = listToDict(list)
            grist.getTable().updateRecords({"Position": [pdic]},[currentDocument.id])
          } else {
            removeElement(list, String(ev.target.id))
            // list.push(String(ev.target.id))
            // TODO it is strange that it needs to be a dict, fix this when a better way is known
            let pdic = listToDict(list)
            grist.getTable().updateRecords({"Position": [pdic]},[currentDocument.id])
          }
        })

        tr.appendChild(td);

    }
    table.appendChild(tr);
  }

  elem.appendChild(table)

}




function wipeClass(classname) {
  let objs = document.querySelectorAll('*');
  for (let index = 0; index < objs.length; index++) {
    const element = objs[index];
    element.classList.remove(classname)
  }
}

function colorTheGrid(recordRaw) {
  wipeClass("insert")
  wipeClass("remove")
  if (recordRaw.Position != null) {
    for (let index = 0; index < recordRaw.Position.length; index++) {
      const element = recordRaw.Position[index];
      obj = document.getElementById(element)
      if(recordRaw.Eintragen_Austragen == directions["put"]) {
        obj.classList.add("insert");
      }
      if(recordRaw.Eintragen_Austragen == directions["get"]) {
        obj.classList.add("remove");
      }
    }
  }
}

function gristOnRecordHandler(recordRaw, mappings) {
  let record = grist.mapColumnNames(recordRaw);


  if (currentDocument != null) {
    if ((record.Eingetragen != currentDocument.Eingetragen) || (record.Ausgetragen != currentDocument.Ausgetragen)) {
      changeClass()
    }
  }
  currentDocument = record;
  currentId = record.id
  colorTheGrid(record)
}

function gristOnRecordsHandler(records, mappings) {}

function gristOnOptionsHandler(options, interaction) {
  // console.log("OPTIONS:");
  // console.log(options);
  // console.log(interaction);
  // grist.setOption("put", "Eintragen");
  // grist.setOption("get", "Austragen");

}


function getDirectionVerbs() {
  // Get the direction verbs from the query url
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  if (urlParams.has("get")) {
    directions["get"] = urlParams.get('get')
  }
  if (urlParams.has("put")) {
    directions["put"] = urlParams.get('put')
  }
}


function main() {
  // The main function that gets executed when the dom is ready

  getDirectionVerbs()


  genGrid(9, 9, document.getElementById("container"))
  grist.ready({
      requiredAccess: 'full',
      columns: [
        "Eintragen_Austragen", // the direction
        {
          name: "Position",
          type: "ChoiceList"
        }, // the position choice list
        // "Eingetragen", // what are these?
        // "Ausgetragen" // what are these?
      ],
      onEditOptions: function() {
        // alert("Options");
        // let put = prompt("Value for put:")
        // grist.setOption("put", put);

        // let get = prompt("Value for get:")
        // grist.setOption("get", get);
      },
      // opasdtions: {
      //   "put": "Eintragen",
      //   "get": "Austragen"
      // }
    });
  grist.onRecord(gristOnRecordHandler);
  grist.onRecords(gristOnRecordsHandler);
  grist.onOptions(gristOnOptionsHandler);


  // Fill positon button and parser
  function fillPositionWithParser() {
    list = parseToList(document.getElementById("fillpositioninput").value)
    if(list == []){return}
    let pdic = listToDict(list)
    grist.getTable().updateRecords({"Position": [pdic]},[currentDocument.id])
  }

  document.getElementById("fillpositionbutton").addEventListener("click", function (ev) {
    fillPositionWithParser()
  })

  document.getElementById("fillpositioninput").addEventListener("keyup", function(ev) {
    if (ev.key === "Enter") {
        fillPositionWithParser()
    }
  });

} // main

window.addEventListener('DOMContentLoaded', (event) => {
    main()
});