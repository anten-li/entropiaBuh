<?php
$inParam = file_get_contents('php://input');

if ($inParam != "" or isset($_SERVER ['PHP_AUTH_USER'])) {
  require_once "EntropiaBuh.php";
  
  try {
    $Entropia = new Entropia\Base();
    
    if (isset($_SERVER ['PHP_AUTH_USER'])) {
      $user = $Entropia->User();
      if ($user->Login($_SERVER ['PHP_AUTH_USER'], md5($_SERVER ['PHP_AUTH_PW']))) {
        $Entropia->errExit(
                [ 
                    'logined' => TRUE,
                    'access_token' => str_replace('-', '', $Entropia->CurrentUser ['Ref']) .
                    $Entropia->CurrentUser ['hash']
                ], TRUE);
      } else {
        $Entropia->errExit([ 
            'logined' => false
        ], TRUE);
      }
    } elseif (isset($_SERVER ['HTTP_AUTHORIZATION']) and
            $Entropia->User()->Authorise($_SERVER ['HTTP_AUTHORIZATION'])) {
      
      if ($_SERVER ['HTTP_CONTENT_TYPE'] != 'application/json')
        $Entropia->errExit("ошибка запроса", false);
      
      $inParam = json_decode($inParam, TRUE);
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
      $Entropia->errExit("Authentication failure", false);
    }
    ;
  } catch (Exception $e) {
    $Entropia->ErrExit($e->getMessage(), false);
  }
} else {
  ?><!DOCTYPE html><html lang=ru><head><meta charset="utf-8"/><title>База энтропия</title><?php
  ?><link rel=stylesheet href='app.css?<?php
  echo hash('md5', filemtime('app.css'));
  ?>'/><script src=app.js?<?php
  echo hash('md5', filemtime('app.js'));
  ?>></script><body><?php
}