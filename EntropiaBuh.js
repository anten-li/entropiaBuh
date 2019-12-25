/**
 * 
 */

function LoadPage() {
  
  var aliLib = GetAliLib();
  
  //обработчики
  document.getElementById("btnLoadStart").onclick = function() {
    aliLib.GetSelFileWin(function(files) {
      var rez, param = {}, reader = new FileReader();
      
      if(files.length > 0) {
        reader.readAsText(files[0]);
        reader.onload = function() {
          rez = reader.result.split(String.fromCharCode(10));
          for (let i = 0; i < rez.length; i++) rez[i] = rez[i].split(";");
          
          param.cmd = "StartLoad";
          param.rez = rez;
          aliLib.ServerCall(param, function(rez) {
            aliLib.GetERRWin(rez, "ответ сервера");
          });
        };
      };      
    });
  };
  
  var fnSpChange = function() {
    var param = {};
    param.cmd = "otch";
    if (spTabType.elemKn.innerHTML == "номенклатура") {param.tabType = "Nomenkl"}
    else if (spTabType.elemKn.innerHTML == "номенклатура") {
      
    } else {
      document.getElementById("mainTable").innerHTML = "";
      return;
    }
    param.depth = spTabDepth.elemKn.innerHTML;
    aliLib.ServerCall(param, function(rez) {
      var tablParam = {};
      tablParam["table"]    = document.getElementById("mainTable");
      tablParam["arr"]      = rez;
      tablParam["arColum"]  = {"name" : "наименование", "value": "сумма"};
      tablParam["ClassCol"] = "lvl";
      tablParam["merBtm"]   = 15;
      aliLib.drowTab(tablParam);
      tablParam.resize();
    });
  };
  
  var spTabType = aliLib.Dropdown(document.getElementById("btnTabType"));
  spTabType.onchange = fnSpChange;  
  var spTabDepth = aliLib.Dropdown(document.getElementById("btnTabDepth"));
  spTabDepth.onchange = fnSpChange;
  
  spTabDepth.addElem("1");
  spTabDepth.addElem("2");
  spTabDepth.addElem("3");
  spTabDepth.elemKn.innerHTML = "1";
  
  spTabType.addElem("документ");
  spTabType.addElem("номенклатура").click();
  
}

function GetAliLib() {
  var lib = {};
  
  lib.GetModalWin = function(text) {
    var win = {};
    
    win.show = function() {
      win.DivEl = document.body.appendChild(document.createElement("div"));
      win.DivEl.classList.add("aliModal");
      win.DivElMain = win.DivEl.appendChild(document.createElement("div"));
      win.DivElMain.innerHTML = text;
    };
    
    return win;
  };
  
  lib.CreateWin = function(zag, msg, id, ff) {
    var win = lib.GetModalWin("<h3>" + zag + "</h3><div>" + msg
        + "</div><div class='MargTop15'><span id='" + id
        + "_btnOk' class='aliButton'>ОК</span></div>");
    
    win.show();
    document.getElementById(id + "_btnOk").onclick = function() {
      if(ff) ff();
      document.body.removeChild(win.DivEl);
    }
  }
  
  lib.GetSelFileWin = function(ff) {
    var IDbtn = "SelFileOk";
    
    lib.CreateWin("Файл остатков", "<input id='" + IDbtn + "_file' type='file'>", IDbtn, function() {
      ff(document.getElementById(IDbtn + "_file").files);
    });
  }
  
  lib.GetERRWin = function(msg, zag = "Ошибка", ff) {
    lib.CreateWin(zag, msg, "ERRWinOk", ff);
  }
  
  lib.ServerCall = function(param, ff) {
    var win = lib.GetModalWin("<h3>загрузка</h3>");
    win.show();
    fetch("index.php", {
      "method" : "POST",
      "body" : JSON.stringify(param)
    }).then(function(resp) {
      document.body.removeChild(win.DivEl);
      if(resp.ok){
        resp.json().then(function(rez) {
          if(rez.noErr){
            ff(rez.rez);
          } else {
            lib.GetERRWin(rez.rez);
          }
        });
      } else {
        lib.GetERRWin(resp.status + "<br>" + resp.statusText);
      }
    });
  }
  lib.drowTab = function(param) {
    var key, cc;
    if (param.arr.lenght == 0)
      return param;
    
    param.table.innerHTML = "";
    
    var header = param.table.createTHead();
    var body = param.table.createTBody();
    var row = header.insertRow(-1);

    for (key in param.arColum) {
      cc = row.insertCell(-1);
      cc.innerHTML = param.arColum[key];
    }
    for (var i = 0; i < param.arr.length; i++) {
      row = body.insertRow(-1);
      for (key in param.arColum) {
        cc = row.insertCell(-1);
        cc.innerHTML = param.arr[i][key];
        if(param.ClassCol) cc.classList.add(param.arr[i][param.ClassCol]);
      }
    }
    param.resize = function() {
      var bodyHei = document.body.clientHeight;
      param.table.style.height = (bodyHei - param.table.getBoundingClientRect().top 
          - param.merBtm) + "px";
      
      var rsElm = param.table.tBodies[0];
      rsElm.style.height = (bodyHei - rsElm.getBoundingClientRect().top
          - param.merBtm + 1) + "px";
      
      param.table.classList.remove("noScrlTab");
      param.table.classList.add("ScrlTab");
      if (rsElm.clientHeight == rsElm.scrollHeight) {
        param.table.classList.remove("ScrlTab");
        param.table.classList.add("noScrlTab");
        param.table.style.height = "";
      }
      for (var j = 0; j < 2; j++) {
        for (var i = 0; i < Object.keys(param.arColum).length; i++) {
          param.table.tHead.rows[0].cells[i].style.width = getComputedStyle(
              param.table.tBodies[0].rows[0].cells[i]).width;
        }
      }
    }
    return param;
  };

  lib.Dropdown = function(kont) {
    var rez = {};
    rez.elemKn = kont.appendChild(document.createElement("div"));
    rez.elemSp = kont.appendChild(document.createElement("ul"));
    rez.cheng = function(ev) {
      rez.elemKn.innerHTML = ev.srcElement.innerText;
      rez.elemSp.style.display = "none";
      rez.onchange(rez.elemKn.innerHTML);
    }
    rez.addElem = function(name) {
      var nElem = rez.elemSp.appendChild(document.createElement("li"));
      nElem.innerHTML = name;
      nElem.onclick = rez.cheng;
      return nElem;
    }
    rez.elemKn.onmousemove = function() {
      if(rez.elemSp.style.display != "") rez.elemSp.style.display = "";
    }
    rez.onchange = function(name) {};
    return rez;
  }
  
  return lib;
}