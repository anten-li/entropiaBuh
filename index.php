<?php

require_once "EntropiaBuh.php";

$entrBuh = new EntrBub();

$inParam = file_get_contents ( 'php://input' );
if ($inParam != "") {
    try {
        $inParam = json_decode($inParam, TRUE);
        if ($inParam["cmd"] == "StartLoad") {
          $entrBuh->StartLoad($inParam["rez"]);
          $entrBuh->errExit($inParam["rez"][2][3], TRUE);
        } elseif ($inParam["cmd"] == "otch") {
        	$entrBuh->errExit($entrBuh->Otch($inParam["depth"]), TRUE);
        } elseif ($inParam["cmd"] == "NomenklSp") {
        	$entrBuh->errExit($entrBuh->getNomenkl(), TRUE);
        }
    } catch (Exception $e) {}
}
require "form.php";
?>