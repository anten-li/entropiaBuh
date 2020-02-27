/**
 * 
 */

function LoadPage() {
  
  var aliLib = GetAliLib();
  
  var elmForm = {};
  elmForm.tablAcc = {};
  elmForm.tabNomenkl = {};
  
  var spNomType = ["финансы", "Одежда", "броня", "Оружие", "Инструмент", "Материал",
      "ресурс", "Чертеж", "прочие", "Майндфорс"];
  
  //функции
  var LoadNomenkl = function() {
    var param = {};
    param.cmd = "NomenklSp";
    aliLib.ServerCall(param, function(rez) {
      var tablParam = elmForm.tabNomenkl;
      tablParam["table"]       = document.getElementById("NomenklTable");
      tablParam["arr"]         = rez;
      tablParam["arColum"]     = {"name" : {"name" : "наименование", "hiden" : false}, 
                                  "gTab" : {"name" : "тип",          "hiden" : false},
                                  "ref"  : {"name" : "ссылка",       "hiden" : true}};
      
      tablParam["merBtm"]      = 15;
      tablParam["ffInsertRow"] = function(row) {
        if(!row.cells[1].textContent) {
          row.cells[1].innerHTML = "<не указано>";
        } else {
          row.cells[1].innerHTML = spNomType[parseInt(row.cells[1].textContent, 10) - 1];
        };
        row.ondblclick = function(ev) {
          var winNom = aliLib.CreateWin(row.cells[0].textContent, "", function() {
            var param = {};
            param.cmd = "NomenklUpdate";
            param.ref = row.cells[2].textContent;
            param.dat = {"gTab" : winNom.spType.index() + 1};
            aliLib.ServerCall(param, function(rez) {
              row.cells[1].innerHTML = spNomType[winNom.spType.index()];
            });
          });
          winNom.elMSG.appendChild(document.createElement("span")).innerHTML = "тип: ";
          winNom.elMSG.style.marginTop = "10px";
          winNom.elMSG.style.textAlign = "left";
          winNom.elBtnType = winNom.elMSG.appendChild(document.createElement("span"));
          winNom.elBtnType.classList.add("aliDropdown");
          winNom.elBtnType.style.minWidth = "100px";
          winNom.spType    = aliLib.Dropdown(winNom.elBtnType);
          winNom.spType.elemSp.style.minWidth = "94px";
          for(var k = 0; k < spNomType.length; k++)
            winNom.spType.addElem(spNomType[k]);
          winNom.spType.elemKn.innerHTML = row.cells[1].textContent;
          winNom.elBtnCen = winNom.elPodv.appendChild(document.createElement("span"));
          winNom.elBtnCen.classList.add("aliButton");
          winNom.elBtnCen.innerHTML  = "Отмена";
          winNom.elBtnCen.onclick = function() {
            document.body.removeChild(winNom.elDivOsn);
          }
        }
      };
      aliLib.drowTab(tablParam);
      tablParam.resize();
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
      var tablParam = elmForm.tablAcc;
      tablParam["table"]    = document.getElementById("mainTable");
      tablParam["arr"]      = rez;
      tablParam["arColum"]  = {"name" : "наименование", "value": "сумма"};
      tablParam["ClassCol"] = "lvl";
      tablParam["merBtm"]   = 15;
      aliLib.drowTab(tablParam);
      tablParam.resize();
    });
  };

  
  //меню
  var mMenu = {kont : document.getElementById("main_menu"),
       fncChangeTab : function(name) {
         if(name == 'Nomenkl') {
           if(elmForm.tabNomenkl.table == undefined) {
             LoadNomenkl();
           } else {
             elmForm.tabNomenkl.resize();
           }
         }
         if(name == 'acc' && elmForm.tablAcc.resize != undefined) elmForm.tablAcc.resize();
         return true;
       }
  };
  aliLib.UL_Menu(mMenu);
  mMenu.addItem("acc",     "Оборотка",     "Tab_1");
  mMenu.addItem("Nomenkl", "Номенклатера", "Tab_2");
  mMenu.addItem("Setting", "Настройки",    "Tab_3");
  mMenu.items[0].elm.click();
  
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
  
  lib.GetModalWin = function(text = "") {
    var win = {};
    
    win.show = function() {
      win.elDivOsn = document.body.appendChild(document.createElement("div"));
      win.elDivOsn.classList.add("aliModal");
      win.elDivMain = win.elDivOsn.appendChild(document.createElement("div"));
      win.elDivMain.innerHTML = text;
    };
    
    return win;
  };
  
  lib.CreateWin = function(zag, msg, ff) {
    var win = lib.GetModalWin();
    win.show();
    win.elHead = win.elDivMain.appendChild(document.createElement("h"));
    win.elHead.innerHTML = zag;
    win.elMSG  = win.elDivMain.appendChild(document.createElement("div"));
    win.elMSG.innerHTML  = msg;
    win.elPodv = win.elDivMain.appendChild(document.createElement("div"));
    win.elPodv.classList.add("MargTop15");
    win.elBtnOK = win.elPodv.appendChild(document.createElement("span"));
    win.elBtnOK.classList.add("aliButton");
    win.elBtnOK.innerHTML  = "ОК";
    win.elBtnOK.onclick = function() {
      if(ff) ff();
      document.body.removeChild(win.elDivOsn);
    };
    return win;
  };
  
  lib.GetSelFileWin = function(ff) {
    var IDbtn = "SelFileOk";
    
    lib.CreateWin("Файл остатков", "<input id='" + IDbtn + "_file' type='file'>", function() {
      ff(document.getElementById(IDbtn + "_file").files);
    });
  }
  
  lib.GetERRWin = function(msg, zag = "Ошибка", ff) {
    lib.CreateWin(zag, msg, ff);
  }
  
  lib.ServerCall = function(param, ff) {
    var win = lib.GetModalWin("<h3>загрузка</h3>");
    win.show();
    fetch("index.php", {
      "method" : "POST",
      "body" : JSON.stringify(param)
    }).then(function(resp) {
      document.body.removeChild(win.elDivOsn);
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
      cc.innerHTML = param.arColum[key].name;
      if(param.arColum[key].hiden) cc.style.display = "none";
    }
    for (var i = 0; i < param.arr.length; i++) {
      row = body.insertRow(-1);
      for (key in param.arColum) {
        cc = row.insertCell(-1);
        cc.innerHTML = param.arr[i][key];
        if(param.ClassCol) cc.classList.add(param.arr[i][param.ClassCol]);
        if(param.arColum[key].hiden) cc.style.display = "none";
      }
      if(param.ffInsertRow){param.ffInsertRow(row)};
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
    rez.parnt = kont;
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
    rez.index = function() {
      for(k = 0; k < rez.elemSp.children.length; k++)
        if (rez.elemSp.children[k].innerHTML == rez.elemKn.innerHTML) return k;
      return -1;
    }
    rez.elemKn.onmousemove = function() {
      if(rez.elemSp.style.display != "") rez.elemSp.style.display = "";
    }
    rez.onchange = function(name) {};
    return rez;
  }
  
  lib.UL_Menu = function(param) {
    var ff = function(i) {
      return function() {
        for (var j = 0; j < param.items.length; j++) 
          param.items[j].TabElm.style.display = 
            i == j ? "block" : "none";
        if(typeof param.activElm !== 'undefined')
          param.items[param.activElm].elm.classList.remove('Active');
        param.items[i].elm.classList.add('Active');
        
        param.activElm = i;
        param.fncChangeTab(param.items[i].Name);
      }
    }
    param.addItem = function(name, fullName, TabID) {
      var item = {
        get Name(){return name},
        get FullName(){return fullName} 
      };
      item.elm = document.createElement("li");
      item.elm.innerHTML = item.FullName;
      item.elm.onclick = ff(param.items.length);
      item.TabElm = document.getElementById(TabID);
      param.kont.appendChild(item.elm);
      param.items.push(item);
    }
    
    param.items = [];
    return param;
  }
  
  return lib;
}