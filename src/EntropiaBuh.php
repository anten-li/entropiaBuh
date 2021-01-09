<?php

namespace Entropia;

/**
 * роли пользователей
 */
abstract class UserRole {
  /**
   * администратор, полные права
   *
   * @var integer
   */
  const Admin = 0;
}

/**
 * базовый класс фабрика
 */
class Base {
  
  /**
   * соединение с SQL
   *
   * @var \mysqli
   */
  private $cnn;
  
  /**
   * параметы соединения с SQL
   *
   * @var array
   */
  public $param;
  
  /**
   * текущий пользователь
   *
   * @var array
   */
  public $CurrentUser;
  
  /**
   * конструктор
   */
  function __construct(){
    require 'setup.php';
    
    set_error_handler(array (
        $this,
        'Error'
    ));
    
    try {
      $this->cnn = new \mysqli($this->param ["sql_server"], $this->param ["sql_user"],
              $this->param ["sql_pass"], $this->param ["sql_DBname"]);
      $this->cnn->set_charset("utf8");
    } catch (\Exception $e) {
      $this->cnn = new \mysqli($this->param ["sql_server"], $this->param ["sql_user"],
              $this->param ["sql_pass"]);
      $this->cnn->set_charset("utf8");
      $this->CreateBase();
      $this->cnn->close();
      $this->cnn = new \mysqli($this->param ["sql_server"], $this->param ["sql_user"],
              $this->param ["sql_pass"], $this->param ["sql_DBname"]);
      $this->cnn->set_charset("utf8");
    }
  }
  
  /**
   * создает новую базу
   *
   * таблицы:<br>
   * Config - настройки<br>
   * Assets - регистр учета<br>
   * Items - Номенклатура<br>
   * Account - счета<br>
   * User - пользователи
   */
  private function CreateBase(){
    $DBname = $this->param ['sql_DBname'];
    $pref = $this->param ['sql_pref'];
    
    if ($this->Query("SHOW DATABASES LIKE '$DBname'")->num_rows == 0) {
      $this->cnn->multi_query( //
              "CREATE DATABASE {$DBname} CHARACTER SET utf8; " . //
              "USE {$DBname}; " . //
              "SET AUTOCOMMIT=0; " . //
              "START TRANSACTION; " . //
              "CREATE TABLE {$pref}config (" . //
              " Vers INT" . //
              "); " . //
              "CREATE TABLE {$pref}assets (" . //
              " Ref CHAR(36) NOT NULL PRIMARY KEY," . //
              " Date DATETIME," . //
              " Account CHAR(36)," . // Account
              " Value DECIMAL(15,5)," . // сумма
              " ItemTarget CHAR(36)," . // 2-я справочная номенклатура
              " DocRef CHAR(36)," . //
              " DocName VARCHAR(255)," . //
              " Item CHAR(36)," . // Items
              " ItemID CHAR(36)" . // ID для не складывающихся
              ");" . //
              "CREATE TABLE {$pref}items (" . //
              " Ref CHAR(36) NOT NULL PRIMARY KEY," . //
              " Parent CHAR(36)," . //
              " IsGroup TINYINT," . //
              " Type TINYINT DEFAULT 0," . //
              " Name VARCHAR(255) " . //
              ");  " . //
              "CREATE TABLE {$pref}account (" . //
              " Ref CHAR(36) NOT NULL PRIMARY KEY," . //
              " Parent CHAR(36)," . //
              " IsGroup TINYINT," . //
              " Name VARCHAR(255)" . //
              ");  " . //
              "CREATE TABLE {$pref}user ( " . //
              " Ref CHAR(36) NOT NULL PRIMARY KEY, " . //
              " Role TINYINT, " . //
              " Login VARCHAR(50), " . //
              " PWD VARCHAR(32), " . //
              " Hash VARCHAR(32), " . //
              " Salt VARCHAR(3), " . //
              " Name VARCHAR(255)" . //
              ");  " . //
              "INSERT INTO {$pref}config SET " . //
              " vers = 1; " . //
              "COMMIT; " . //
              "SET AUTOCOMMIT=1;");
      while ($this->cnn->more_results()) {
        $this->cnn->next_result();
        if ($this->cnn->errno)
          throw new \Exception("{$this->cnn->error}");
      }
      $this->User()->Add('Admin', 'Admin', md5('Admin'), UserRole::Admin);
    }
  }
  
  /**
   * создает GUID
   *
   * @return string
   */
  public static function CreateUUID(){
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
  }
  
  /**
   * возвращает массив отбор
   *
   * @param string $Field
   * @param string $Compare
   * @param string|int|float $Value
   * @return array
   */
  public static function Filter(string $Field, string $Compare, $Value){
    return [ 
        'field' => $Field,
        'comp' => $Compare,
        'val' => $Value
    ];
  }
  
  /**
   * обработчик ошибок
   *
   * @param integer $errno
   * @param string $errstr
   * @param string $errfile
   * @param integer $errline
   * @throws \Exception
   */
  public function Error($errno, $errstr, $errfile = null, $errline = null){
    throw new \Exception($errstr, $errno);
  }
  
  /**
   * выход из скрипта с возвращением результата
   *
   * @param string $Result
   * @param boolean $S_Ok
   */
  public function ErrExit($Result, $S_Ok = false){
    print_r(json_encode([ 
        "noErr" => $S_Ok,
        "rez" => $Result
    ]));
    exit();
  }
  public function EscapeKeys(array $Data){
    $Rezult = [ ];
    foreach ( $Data as $Key => $Value ) {
      $Rezult [$this->Escape($Key)] = $Value;
    }
    return $Rezult;
  }
  
  /**
   * экранирование
   *
   * @param string $Text
   * @return string
   */
  public function Escape(string $Text){
    $Rezult = trim($Text);
    if (strlen($Rezult) > 1 and $Rezult [0] == '"' and $Rezult [strlen($Rezult) - 1] == '"') {
      $Rezult = substr($Rezult, 1, strlen($Rezult) - 2);
    }
    return $this->cnn->real_escape_string($Rezult);
  }
  
  /**
   * удаляет временную таблицу
   *
   * @param string $Name
   */
  public function DeleteVT($Name){
    $this->Query("DROP TABLE IF EXISTS {$Name};");
  }
  
  /**
   * запрос к базе данных
   *
   * @param string $Text
   * @throws \Exception
   * @return \mysqli_result|boolean
   */
  public function Query($Text){
    try {
      $rezult = $this->cnn->query($Text);
    } catch (\Exception $e) {
      throw new \Exception("{$e->getMessage()}; $Text");
    }
    if (! $rezult)
      throw new \Exception("{$this->cnn->error}; $Text");
    return $rezult;
  }
  
  /**
   *
   * @return \Entropia\Account
   */
  public function Account(){
    return new Account($this);
  }
  
  /**
   *
   * @return \Entropia\Assets
   */
  public function Assets(){
    return new Assets($this);
  }
  
  /**
   *
   * @return \Entropia\User
   */
  public function User(){
    return new User($this);
  }
  
  /**
   *
   * @return \Entropia\Items
   */
  public function Items(){
    return new Items($this);
  }
}

/**
 * таблица базы данных
 */
class Table {
  
  /**
   * имя таблицы
   *
   * @var string
   */
  private $Name;
  
  /**
   *
   * @var base
   */
  protected $Base;
  
  /**
   * конструктор
   *
   * @param base $base
   * @param string $Name
   */
  function __construct(base $base, string $Name){
    $this->Base = $base;
    $this->Name = $Name;
  }
  
  /**
   * подготовка значения к использованию в запросах
   *
   * @param string|int|float|bool $Value
   * @throws \Exception
   * @return string
   */
  protected function ValueEscape($Value){
    if (is_string($Value)) {
      return "'{$this->Base->Escape($Value)}'";
    } elseif (is_int($Value)) {
      return "{$Value}";
    } elseif (is_float($Value)) {
      return sprintf('%0.5F', $Value);
    } elseif (is_bool($Value)) {
      if ($Value) {
        return 'TRUE';
      } else {
        return 'FALSE';
      }
    } else {
      throw new \Exception('Не верный тип');
    }
  }
  
  /**
   * ищет элемент таблицы и создает при необходимости
   *
   * @param string $Name
   * @param string $Parent
   * @param bool $Group
   * @return string GUID созданного или найденного элемента
   */
  public function CreateElement(string $Name, string $Parent = '', bool $Group = FALSE){
    $Filter = [ 
        Base::Filter('Name', '=', $Name),
        Base::Filter('IsGroup', '=', $Group)
    ];
    if ($Group) {
      array_push($Filter, Base::Filter('Parent', '=', $Parent));
    }
    $Element = $this->Select($Filter)->fetch_assoc();
    if ($Element) {
      return $Element ['Ref'];
    } else {
      return $this->Insert([ 
          'Name' => $Name,
          'Parent' => $Parent,
          'IsGroup' => $Group
      ]);
    }
  }
  
  /**
   * запрос иерархии таблицы
   *
   * @param int $MaxLevel
   *          мактимальная глубина иерархии
   * @return string текст запроса
   */
  public function ParentTreeQuery(int $MaxLevel){
    $FieldRefs = '';
    $FieldNames = '';
    $Pref = $this->Base->param ['sql_pref'];
    $Join = '';
    for($i = 1; $i <= $MaxLevel; $i ++) {
      $k = $i - 1;
      if ($FieldRefs)
        $FieldRefs .= ', ';
      if ($FieldNames)
        $FieldNames .= ', ';
      $FieldRefs .= "tab_{$i}.Ref AS Ref_{$i}";
      $FieldNames .= "tab_{$i}.Name AS Name_{$i}";
      if ($i > 1)
        $Join .= " LEFT JOIN {$Pref}{$this->Name} AS tab_{$i} ON tab_{$i}.Parent = tab_{$k}.Ref";
    }
    return "SELECT {$FieldRefs}, {$FieldNames} FROM {$Pref}{$this->Name} AS tab_1 " .
            "{$Join} WHERE tab_1.Parent =''";
  }
  
  /**
   * вставка строки в таблицу
   *
   * @param array $Data
   * @return string GUID
   */
  public function Insert(array $Data){
    $GUID = Base::CreateUUID();
    $Query = "INSERT INTO {$this->Base->param['sql_pref']}{$this->Name} SET ";
    $Query .= " Ref = '{$GUID}'";
    
    foreach ( $Data as $Key => $Value ) {
      $Query .= ', ';
      $Query .= "{$Key} = {$this->ValueEscape($Value)}";
    }
    $this->Base->Query($Query);
    return $GUID;
  }
  
  /**
   * изменяет строку таблицы
   *
   * @param array $Data
   * @return boolean
   */
  public function Update(array $Data){
    $Query = "UPDATE {$this->Base->param['sql_pref']}{$this->Name} SET ";
    $First = true;
    foreach ( $Data as $Key => $Value ) {
      if ($Key == 'Ref')
        continue;
      if ($First) {
        $First = false;
      } else {
        $Query .= ', ';
      }
      $Query .= "{$Key} = {$this->ValueEscape($Value)}";
    }
    $Query .= " WHERE Ref ='{$Data['Ref']}'";
    return $this->Base->Query($Query);
  }
  
  /**
   * выборка из таблицы
   *
   * @param array $Where
   * @param array $Order
   * @return \mysqli_result|boolean
   */
  public function Select(array $Where = [ ], array $Order = [ ]){
    $StrWhere = '';
    $StrOrder = '';
    
    for($i = 0; $i < count($Where); $i ++) {
      if ($StrWhere)
        $StrWhere .= ' and ';
      $StrWhere .= "{$Where[$i]['field']} ";
      $StrWhere .= "{$Where[$i]['comp']} ";
      $StrWhere .= $this->ValueEscape($Where [$i] ['val']);
    }
    
    for($i = 0; $i < count($Order); $i ++) {
      if ($StrOrder)
        $StrOrder .= ', ';
      $StrOrder .= $Order [$i];
    }
    
    if ($StrWhere)
      $StrWhere = "WHERE {$StrWhere}";
    if ($StrOrder)
      $StrOrder = "ORDER BY {$StrOrder}";
    
    return $this->Base->Query(
            "SELECT * FROM {$this->Base->param['sql_pref']}{$this->Name} {$StrWhere} {$StrOrder}");
  }
}

/**
 * Счета
 */
class Account extends Table {
  
  /**
   * конструктор
   *
   * @param base $base
   */
  function __construct(base $base){
    parent::__construct($base, 'account');
  }
}

/**
 * регистр учета
 */
class Assets extends Table {
  /**
   * конструктор
   *
   * @param base $base
   */
  function __construct(base $base){
    parent::__construct($base, 'assets');
  }
  
  /**
   * добавляет движение в регистр
   *
   * @param string $Date
   * @param string $Account
   * @param string $Item
   * @param string $ItemPart
   * @param float $Value
   * @param string $Doc
   * @param string $DocName
   */
  public function Add($Date, $Account, $Item, $ItemPart, $Value, $Doc, $DocName){
    if ($DocName == 'Остатки')
      $ItemPart = Base::CreateUUID();
    
    $this->Insert(
            [ 
                'Date' => $Date,
                'Account' => $Account,
                'Value' => $Value,
                'DocRef' => $Doc,
                'DocName' => $DocName,
                'Item' => $Item,
                'ItemID' => $ItemPart
            ]);
  }
  
  /**
   * загрузка остатков
   *
   * @param array $Text
   * @param bool $ItemsOnly
   */
  public function Load(array $Text, bool $ItemsOnly){
    $accBalance = $this->Base->Account()->CreateElement('Остатки');
    $Parents = [ 
        ''
    ];
    $RowNext = $Text [2];
    
    for($i = 3; $i < count($Text); $i ++) {
      $Row = $RowNext;
      $Level = trim($Row [1]);
      $Name = trim($Row [3]);
      $Value = ( float ) str_replace(',', '.', trim($Row [4]));
      $Operation = trim($Row [5]);
      
      $RowNext = $Text [$i];
      $LevelNext = trim($RowNext [1]);
      
      while (! $LevelNext and $i < count($Text)) {
        $i ++;
        $RowNext = $Text [$i];
        $LevelNext = trim($RowNext [1]);
      }
      
      if ($i == count($Text))
        return;
      
      if ($LevelNext > $Level) {
        // зашли на уровень глубже, предыдущий уровень - группа
        // если перескочили уровень добавим элементы в стек родителей
        for($j = 0; $j < $LevelNext - $Level - 1; $j ++)
          array_push($Parents, '');
        
        if ($Operation == 'остатки') {
          array_push($Parents, $this->Base->Items()->CreateElement($Name, end($Parents), TRUE));
        } else {
          array_push($Parents, $this->Base->Account()->CreateElement($Name, end($Parents), TRUE));
        }
      } else {
        if ($Operation == 'остатки') {
          $Item = $this->Base->Items()->CreateElement($Name, end($Parents), FALSE);
          if (! $ItemsOnly)
            $this->Add('2019-01-01 00:00:00', $accBalance, $Item, '', $Value, $accBalance, 'остатки');
        }
        // очистим стек родителей если вышли на уроверь выше
        if ($LevelNext < $Level)
          for($j = 0; $j < $Level - $LevelNext; $j ++)
            array_pop($Parents);
      }
    }
    // $dat = new DateTime(str_replace('_', '-', $str[2]));
  }
  
  /**
   * Отчет оборотка
   *
   * @param int $depth
   *          глубина иерархии
   * @param int $MaxLevel
   * @return \mysqli_result|boolean
   */
  public function Report(int $depth, int $MaxLevel = 3){
    $FieldRef = '';
    $FieldNames = '';
    $Order = '';
    $Join = '';
    $Text = '';
    
    for($i = 1; $i <= $MaxLevel; $i ++) {
      $FieldRef .= ", Items.Ref_{$i} AS Ref_{$i}";
      $FieldNames .= ", Items.Name_{$i} AS Name_{$i}";
      if ($Join)
        $Join .= ' OR ';
      $Join .= "Assets.Item = Items.Ref_{$i}";
    }
    
    for($i = 1; $i <= $depth; $i ++) {
      if ($Order)
        $Order .= ', ';
      $Order .= "Name_{$i}";
      
      $Fields = '';
      $Group = '';
      for($j = 1; $j <= $depth; $j ++) {
        if ($j > $i) {
          $Fields .= ", '' AS Name_{$j}";
        } else {
          $Fields .= ", vt_Assets.Name_{$j} AS Name_{$j}";
          if ($Group)
            $Group .= ', ';
          
          $Group .= "vt_Assets.Name_{$j}";
        }
      }
      if ($Text)
        $Text .= ' UNION ALL ';
      
      $Text .= "SELECT" . //
      " vt_Assets.Name_{$i} AS Name" . //
      " {$Fields}," . //
      " 'lvl_{$i}' AS lvl," . //
      " SUM(vt_Assets.Value) AS Value " . //
      "FROM vt_Assets_{$i} AS vt_Assets " . //
      "WHERE vt_Assets.Ref_{$i} <> '' " . //
      "GROUP BY {$Group}";
    }
    
    $Fields = '';
    for($i = 1; $i <= $depth; $i ++)
      $Fields .= ", 'яяяя'";
    
    $i = $depth + 1;
    $Text .= " UNION ALL SELECT 'ИТОГО' {$Fields}, 'lvl_total', SUM(vt_Assets.Value) AS Value " .
            "FROM vt_Assets_{$i} AS vt_Assets ";
    
    $Text .= " ORDER BY {$Order}";
    
    // временная таблица иерархия + движения
    $this->Base->Query(
            "CREATE TEMPORARY TABLE vt_Assets_1 " .
            "SELECT	Assets.Value AS Value {$FieldRef}{$FieldNames} " .
            "FROM {$this->Base->param['sql_pref']}assets AS Assets" .
            " LEFT JOIN ({$this->Base->Items()->ParentTreeQuery($MaxLevel)}) AS Items ON {$Join}");
    
    // копирование временных таблиц
    for($i = 2; $i <= $depth + 1; $i ++) {
      $this->Base->Query("CREATE TEMPORARY TABLE vt_Assets_{$i} SELECT * FROM vt_Assets_1;");
    }
    
    $Result = $this->Base->Query($Text);
    for($i = 1; $i <= $depth; $i ++)
      $this->Base->DeleteVT("vt_Assets_{$i}");
    
    return $Result->fetch_all(MYSQLI_ASSOC);
  }
}

/**
 * номенклатура
 */
class Items extends Table {
  /**
   * конструктор
   *
   * @param base $base
   */
  function __construct(base $base){
    parent::__construct($base, 'items');
  }
  
  /**
   * возвращает список номенклатуры, не групп
   *
   * @param boolean|int $Type
   * @return mixed
   */
  public function List($Type = - 1){
    $Filter = [ 
        Base::Filter('IsGroup', '=', FALSE)
    ];
    if ($Type >= 0)
      array_push($Filter, Base::Filter('Type', '=', $Type));
    
    return $this->Select($Filter, [ 
        'Name'
    ])->fetch_all(MYSQLI_ASSOC);
  }
  
  /**
   * Добавляет номенклатуру
   * 
   * @param array $Data
   */
  public function Add($Data){
    If(!$Data['Name'])
      return [
          'err' => TRUE,
          'msg' => 'укажите наименование'
      ];
    If(!$Data['Type'])
      return [
          'err' => TRUE,
          'msg' => 'укажите тип'
      ];
    
    $Data['Parent'] = '';
    $Data['IsGroup'] = FALSE;
    
    unset($Data['Ref']);
    return [
      'err' => FALSE,
      'msg' => [
          'ref' => $this->Insert($Data)
      ]
    ];    
  }
}

/**
 * пользователь
 */
class User extends Table {
  // public $hash;
  // public $currentUser;
  
  /**
   * конструктор
   *
   * @param base $base
   */
  function __construct(base $base){
    parent::__construct($base, 'user');
  }
  /**
   * добавляет пользователя
   *
   * @param string $name
   * @param string $Login
   * @param string $PWD
   * @param int $Role
   */
  public function Add(string $name, string $Login, string $PWD, int $Role){
    $salt = ( string ) rand(100, 999);
    $this->Insert(
            [ 
                'Role' => $Role,
                'Login' => $Login,
                'PWD' => md5($PWD . $salt),
                'Salt' => $salt,
                'Name' => $name
            ]);
  }
  
  /**
   * аутентификация
   *
   * @param string $Login
   * @param string $Password
   * @return boolean
   */
  public function Login(string $Login, string $Password){
    $User = $this->Select([ 
        Base::Filter('Login', '=', $Login)
    ])->fetch_all(MYSQLI_ASSOC);
    
    if ((count($User) == 1) and ($User [0] ['PWD'] == md5($Password . $User [0] ['Salt']))) {
      // успешная аутентификация
      $this->Base->CurrentUser = $User [0];
      $this->Base->CurrentUser ['hash'] = md5(Base::CreateUUID());
      $this->Update([ 
          'Ref' => $User [0] ['Ref'],
          'Hash' => $this->Base->CurrentUser ['hash']
      ]);
      return TRUE;
    }
    return false;
  }
  
  /**
   * выход
   */
  public function LogOff(){
    setcookie("id", "", time() - 1, '/');
    setcookie("hash", "", time() - 1, '/');
    $this->Base->CurrentUser = NULL;
  }
  
  /**
   * авторизация
   *
   * @return boolean
   */
  public function Authorise($Bearer){
    $token = [ ];
    if (! preg_match('/Bearer (\w+)/', $Bearer, $token) or ! $token [1])
      return false;
    $token = $token [1];
    
    $User = $this->Select(
            [ 
                [ 
                    'field' => 'Ref',
                    'comp' => '=',
                    'val' => substr($token, 0, 8) . '-' . substr($token, 8, 4) . '-' .
                    substr($token, 12, 4) . '-' . substr($token, 16, 4) . '-' .
                    substr($token, 20, 12)
                ]
            ])->fetch_all(MYSQLI_ASSOC);
    if ((count($User) == 1) and (substr($token, 32) == $User [0] ['Hash'])) {
      $this->Base->CurrentUser = $User [0];
      return true;
    } else {
      setcookie("id", "", time() - 1, '/');
      setcookie("hash", "", time() - 1, '/');
    }
    // }
    return false;
  }
}
