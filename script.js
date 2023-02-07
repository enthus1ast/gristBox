// maybe this works withouth globals
let currentId = -1
var currentDocument = null

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
        // console.log(ww, hh, cnt);
        let td = document.createElement("td");
        td.innerText = cnt;
        td.id = cnt;
        td.classList.add("gridelem")

        td.addEventListener("click", function(ev) {
          console.log("clicked:", ev.target);

          let wasAdded
          if (currentDocument.Eintragen_Austragen == "Eintragen") {
            wasAdded = toggleClass(ev.target, "insert");
          }
          if (currentDocument.Eintragen_Austragen == "Austragen") {
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
          // let payload = {}
          // payload["Position"] = currentDocument.Position
          // payload["id"] = currentDocument.id
          // console.log(payload)
          // grist.selectedTable.updateRecords(payload, [currentDocument.id])
          // grist.selectedTable.updateRecords({"Position": [["1", "2"]]}, [1])
        })

        tr.appendChild(td);

    }
    table.appendChild(tr);
  }

  elem.appendChild(table)

}




function wipeClass(classname) {
  // let objs = document.getElementsByClassName(classname)
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
      // console.log(element, obj)
      if(recordRaw.Eintragen_Austragen == "Eintragen") {
        obj.classList.add("insert");
      }
      if(recordRaw.Eintragen_Austragen == "Austragen") {
        obj.classList.add("remove");
      }
    }
  }
}

function gristOnRecordHandler(recordRaw, mappings) {
  console.log(recordRaw)
  if (currentDocument != null) {
    if ((recordRaw.Eingetragen != currentDocument.Eingetragen) || (recordRaw.Ausgetragen != currentDocument.Ausgetragen)) {
      changeClass()
    }
  }
  currentDocument = recordRaw;
  currentId = recordRaw.id
  colorTheGrid(recordRaw)
}

function gristOnRecordsHandler(records, mappings) {

}

function main() {
  // The main function that gets executed when the dom is ready
  // Get the bgimage from the query params
  genGrid(9, 9, document.getElementById("container"))
  grist.ready({
      requiredAccess: 'full',
    });
  grist.onRecord(gristOnRecordHandler);
  grist.onRecords(gristOnRecordsHandler);

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