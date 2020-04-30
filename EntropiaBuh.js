/**
 * 
 */

function LoadPage() {
  
  var aliLib = GetAliLib();
  
  var winLog = undefined;
  
  var elmForm = {};
  elmForm.tablAcc    = aliLib.CreateTab("tbNomenkl", document.getElementById("mainTable"));
  elmForm.tabNomenkl = aliLib.CreateTab("tbNomenkl", document.getElementById("NomenklTable"));
  
  var spNomType = ["финансы", "Одежда", "броня", "Оружие", "Инструмент", "Материал",
      "ресурс", "Чертеж", "прочие", "Майндфорс"];
  
  //функции
  aliLib.errFF = function(rez) {
	if(rez.rez == 'ошибка авторизации') {
	  fLogin();
	  return false;
	};  
	return true;
  };
  
  var init = function() {
	mMenu.items[0].elm.click();
	spTabDepth.elemKn.innerHTML = "1";
	spTabType.elemKn.innerHTML = "номенклатура";
	spTabType.elemSp.children[spTabType.index()].click();
	//rez.elemKn.innerHTML
  }
  
  var fLogin = function() {
	if (winLog != undefined) return; 
    winLog = aliLib.CreateWin("Авторизация", "", function() {
      var param = {};
      param.cmd = "Login";
      param.Log = eLog.value;
      param.PWD = ePwd.value;
      aliLib.ServerCall(param, function(rez) {
    	winLog = undefined;
    	if(rez.logined) {
    	  init();
    	} else {
    	  fLogin();
    	} 
      });
    });
    winLog.elMSG.appendChild(document.createElement("span")).innerHTML = "Login: ";
    var eLog = winLog.elMSG.appendChild(document.createElement("input"));
    winLog.elMSG.appendChild(document.createElement("br"));
    winLog.elMSG.appendChild(document.createElement("span")).innerHTML = "password: ";
    var ePwd = winLog.elMSG.appendChild(document.createElement("input"));
  }
  
  var LoadNomenkl = function() {
    var param = {};
    param.cmd = "NomenklSp";
    param.Filter = spItemType.index() - 1;
    aliLib.ServerCall(param, function(rez) {
      var tablParam = elmForm.tabNomenkl;
      tablParam["arr"]         = rez;
      tablParam["arColum"]     = {"Name" : {"name" : "наименование", "hiden" : false}, 
                                  "Type" : {"name" : "тип",          "hiden" : false},
                                  "Ref"  : {"name" : "ссылка",       "hiden" : true}};
      
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
            //param.ref = row.cells[2].textContent;
            param.dat = {"Type" : winNom.spType.index() + 1, "Ref" : row.cells[2].textContent};
            aliLib.ServerCall(param, function(rez) {
              if((spItemType.index() != 0) && (spItemType.index() - 1 != winNom.spType.index())) {
            	LoadNomenkl();  
              }	else {
                row.cells[1].innerHTML = spNomType[winNom.spType.index()];
              }
            });
          });
          winNom.elMSG.appendChild(document.createElement("span")).innerHTML = "тип: ";
          winNom.elMSG.style.marginTop = "10px";
          winNom.elMSG.style.textAlign = "left";
          winNom.elBtnType = winNom.elMSG.appendChild(document.createElement("span"));
          winNom.elBtnType.classList.add("aliDropdown");
          winNom.elBtnType.style.minWidth = "100px";
          winNom.spType    = aliLib.Dropdown("ddNomType", winNom.elBtnType);
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
      tablParam.drow();
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
      tablParam["arr"]      = rez;
      tablParam["arColum"]  = {"Name" : {"name" : "наименование", "hiden" : false}, 
    		  				   "Value": {"name" : "сумма", 		  "hiden" : false}};
      tablParam["ClassCol"] = "lvl";
      tablParam["merBtm"]   = 15;
      tablParam.drow();
      tablParam.resize();
    });
  };

  
  //меню
  var mMenu = aliLib.UL_Menu("MineMenu", document.getElementById("main_menu"));
  mMenu.fncChangeTab = function(name) {
    if(name == 'Nomenkl') {
      if(elmForm.tabNomenkl.parnt.innerHTML == "") {
        LoadNomenkl();
      } else {
        elmForm.tabNomenkl.resize();
      }
    } else if(name == 'acc' && elmForm.tablAcc.resize != undefined) {
      elmForm.tablAcc.resize();
	} else if(name == 'logOff') {
	  var param = {};
	  param.cmd = "logOff";
	  aliLib.ServerCall(param, function(rez) {
		var param2 = {};
		param2.cmd = "GetUser";
		aliLib.ServerCall(param2, function(rez) {
		  init();  
		});
	  });
	}; 
    return true;
  }
  mMenu.addItem("acc",     "Оборотка",     "Tab_1");
  mMenu.addItem("Nomenkl", "Номенклатера", "Tab_2");
  mMenu.addItem("Setting", "Настройки",    "Tab_3");
  mMenu.addItem("logOff",  "Выход",        "Tab_4");
 // mMenu.items[0].elm.click();
  
  //обработчики
  document.getElementById("btnLoadStart").onclick = function() {
    var win = aliLib.GetSelFileWin(function(files) {
      var rez, param = {}, reader = new FileReader();
      
      if(files.length > 0) {
        reader.readAsText(files[0]);
        reader.onload = function() {
          rez = reader.result.split(String.fromCharCode(10));
          for (let i = 0; i < rez.length; i++) rez[i] = rez[i].split(";");
          
          param.cmd = "StartLoad";
          param.rez = rez;
          param.fgNomenkl = win.fgNomenkl.checked;
          aliLib.ServerCall(param, function(rez) {
            aliLib.GetERRWin(rez, "ответ сервера");
          });
        };
      };      
    });
    win.elMSG.appendChild(document.createElement("br"));
    win.fgNomenkl = win.elMSG.appendChild(document.createElement("input"));
    win.fgNomenkl.classList.add("MargTop15");
    win.fgNomenkl.type = "checkbox";
    var elm = win.elMSG.appendChild(document.createElement("span"));
    elm.innerHTML = "только номенклатура";
  };
    
  var spTabType = aliLib.Dropdown("ddTabType", document.getElementById("btnTabType"));
  spTabType.onchange = fnSpChange;  
  var spTabDepth = aliLib.Dropdown("ddDepth", document.getElementById("btnTabDepth"));
  spTabDepth.onchange = fnSpChange;
  
  spTabDepth.addElem("1");
  spTabDepth.addElem("2");
  spTabDepth.addElem("3");
 // spTabDepth.elemKn.innerHTML = "1";
  
  spTabType.addElem("документ");
  spTabType.addElem("номенклатура"); //.click();
  
  var spItemType = aliLib.Dropdown("ddItemType", document.getElementById("btnItemType"));
  spItemType.addElem("все");
  spItemType.addElem("<не указано>");
  for(var k = 0; k < spNomType.length; k++)
    spItemType.addElem(spNomType[k]);
  spItemType.elemSp.style.minWidth = "100px";
  spItemType.elemKn.style.minWidth = "100px";
  spItemType.elemKn.innerHTML = "все";
  spItemType.onchange = LoadNomenkl;
  
  //авторизация	
  var param = {};
  param.cmd = "GetUser";
  aliLib.ServerCall(param, function(rez) {
	init();  
  });
}

function GetAliLib() {
  var lib = {};
    
  lib.createElement = function(Name, elm = undefined){
    var rez = {"Name" : Name, "parnt" : elm};
    return rez;
  }
  
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
    win.elHead = win.elDivMain.appendChild(document.createElement("h4"));
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
    
    return lib.CreateWin("Файл остатков", "<input id='" + IDbtn + "_file' type='file'>", function() {
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
        	if((lib.errFF)&&(lib.errFF(rez)))  
              lib.GetERRWin(rez.rez);
          }
        });
      } else {
        lib.GetERRWin(resp.status + "<br>" + resp.statusText);
      }
    });
  }
  lib.CreateTab = function(Name, kont) {
    var key, cc;
    var param = lib.createElement(Name, kont);
    
    param.drow = function(){
      if (param.arr.lenght == 0)
        return param;

      param.parnt.innerHTML = "";

      var header = param.parnt.createTHead();
      var body = param.parnt.createTBody();
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
    };
    param.resize = function() {
      if(param.parnt.innerHTML == "") return;
      var bodyHei = document.body.clientHeight;
      param.parnt.style.height = (bodyHei - param.parnt.getBoundingClientRect().top 
          - param.merBtm) + "px";
      
      var rsElm = param.parnt.tBodies[0];
      rsElm.style.height = (bodyHei - rsElm.getBoundingClientRect().top
          - param.merBtm + 1) + "px";
      
      param.parnt.classList.remove("noScrlTab");
      param.parnt.classList.add("ScrlTab");
      if (rsElm.clientHeight == rsElm.scrollHeight) {
        param.parnt.classList.remove("ScrlTab");
        param.parnt.classList.add("noScrlTab");
        param.parnt.style.height = "";
      }
      for (var j = 0; j < 2; j++) {
        for (var i = 0; i < Object.keys(param.arColum).length; i++) {
          param.parnt.tHead.rows[0].cells[i].style.width = getComputedStyle(
              param.parnt.tBodies[0].rows[0].cells[i]).width;
        }
      }
    }
    return param;
  };

  lib.Dropdown = function(Name, kont) {
    var rez = lib.createElement(Name, kont);
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
  
  lib.UL_Menu = function(Name, kont) {
    var param = lib.createElement(Name, kont);
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
      param.parnt.appendChild(item.elm);
      param.items.push(item);
    }
    
    param.items = [];
    return param;
  }
  
  return lib;
}