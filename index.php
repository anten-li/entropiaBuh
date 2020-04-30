<?php
$inParam = file_get_contents('php://input');

if ($inParam != "") {
  require_once "EntropiaBuh.php";
  
  try {
    $Entropia = new Entropia\Base();
    
    $inParam = json_decode($inParam, TRUE);
    if ($inParam ["cmd"] == "Login") {
      if ($Entropia->User()->Login($inParam ["Log"], md5($inParam ["PWD"]))) {
        $Entropia->errExit([ 
            'logined' => TRUE
        ], TRUE);
      } else {
        $Entropia->errExit([ 
            'logined' => false
        ], TRUE);
      }
    } elseif ($Entropia->User()->Authorise()) {
      if ($inParam ["cmd"] == "StartLoad") {
        $Entropia->Assets()->Load($inParam ["rez"], $inParam ["fgNomenkl"]);
        $Entropia->ErrExit($inParam ["rez"] [2] [3], true);
      } elseif ($inParam ["cmd"] == "otch") {
        $Entropia->errExit($Entropia->Assets()->Report($inParam ["depth"]), TRUE);
      } elseif ($inParam ["cmd"] == "NomenklSp") {
        $Entropia->ErrExit($Entropia->Items()->List($inParam ["Filter"]), TRUE); 
      } elseif ($inParam ["cmd"] == "NomenklUpdate") {
        $Entropia->ErrExit($Entropia->Items()->Update($Entropia->EscapeKeys($inParam ["dat"])), TRUE);
      } elseif ($inParam ["cmd"] == "logOff") {
        $Entropia->User()->LogOff();
        $Entropia->errExit([ 
            'logined' => false
        ], TRUE);
      } else {
        $Entropia->errExit([ ], TRUE);
      }
    } else {
      $Entropia->errExit("ошибка авторизации", false);
    }
    ;
  } catch (Exception $e) {
    $Entropia->ErrExit($e->getMessage(), false);
  }
} else {
  require "form.php";
}