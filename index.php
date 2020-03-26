<?php

require_once "EntropiaBuh.php";

$entrBuh = new EntrBub();

$inParam = file_get_contents ( 'php://input' );
if ($inParam != "") {
    try {
        $inParam = json_decode($inParam, TRUE);
        if($inParam["cmd"] == "Login") {
            if($entrBuh->enter($inParam["Log"], md5($inParam["PWD"]))) {
                $entrBuh->errExit(['logined' => TRUE], TRUE);
            } else {
                $entrBuh->errExit(['logined' => false], TRUE);
            };
        } elseif ($entrBuh->Logined()) {
            if ($inParam["cmd"] == "StartLoad") {
              $entrBuh->StartLoad($inParam["rez"], $inParam["fgNomenkl"]);
              $entrBuh->errExit($inParam["rez"][2][3], TRUE);
            } elseif ($inParam["cmd"] == "otch") {
              $entrBuh->errExit($entrBuh->Otch($inParam["depth"]), TRUE);
            } elseif ($inParam["cmd"] == "NomenklSp") {
              $entrBuh->errExit($entrBuh->getNomenkl(), TRUE);
            } elseif ($inParam["cmd"] == "NomenklUpdate") {
              $entrBuh->errExit($entrBuh->UpdateNomenkl($inParam["ref"], $inParam["dat"]), TRUE);
           } elseif ($inParam["cmd"] == "logOff") {
            	$entrBuh->logOff();
            	$entrBuh->errExit(['logined' => false], TRUE);
            } else {
              $entrBuh->errExit([], TRUE);
            };
        } else {
          $entrBuh->errExit("ошибка авторизации", false);
        };
    } catch (Exception $e) {
    	$entrBuh->errExit($e->getMessage(), false);
    }
}
require "form.php";
?>