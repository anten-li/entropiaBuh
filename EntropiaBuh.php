<?php
class EntrBub {
	private $SQLBase;
	public function __construct() {
		set_error_handler ( function ($errno, $errstr, $errfile = null, $errline = null) {
			throw new Exception ( $errstr, $errno );
		} );
		try {
			$this->SQLBase = new EntrBase ();
		} catch ( Exception $e ) {
			$this->errExit ( $e->getMessage () );
		}
	}
	public function errExit($exc, $noErr = false) {
		print_r ( json_encode ( [ 
				"noErr" => $noErr,
				"rez" => $exc
		] ) );
		exit ();
	}
	public function StartLoad($mm) {
		try {
			$size = count ( $mm ) - 1;
			$par = [];
			$lvl = 0;
			$accOst = $this->SQLBase->addGrup('accTab', 'Остатки', '', 'FALSE');
			for($i = 0; $i < $size; $i++) {
				$str = $mm [$i];
				$lvln = trim($str[1]);
				if (!$lvln) continue;
				if($lvl > $lvln)
					for($j = 0; $j < $lvl - $lvln; $j++) array_pop($par);
				$lvl = $lvln;
				$nom = $this->SQLBase->escape( $str [3] );
				$val = $this->SQLBase->escape( $str [4] );
				$opr = trim ( $str [5] );
				if ($mm[$i+1][1] > $lvl or
					 (!$mm[$i+1][1] and $mm[$i+2][1] > $lvl)) {
					//
					$lvl_ = $mm[$i+1][1];
					if(!$lvl_)	$lvl_ = $mm[$i+2][1];
					
					for($j = 0; $j < $lvl_ - $lvl - 1; $j++) $par[] = '';
					 
					// Группа		
					if($opr == 'остатки'){
						$par[] = $this->SQLBase->addGrup ( 'Nomenkl', $nom, end($par));
						continue;
					} else {
						$par[] = $this->SQLBase->addGrup ( 'accTab', $nom, end($par));
						continue;
					}
				
				}
				
				if($opr == 'остатки'){
					// Остатки
					$nomenkl = $this->SQLBase->addGrup('Nomenkl', $nom, end($par), 'FALSE');
					$this->SQLBase->addAccDvij('2019-01-01 00:00:00', $accOst, $nomenkl, str_replace(',', '.', $val), 
							['ref' => $accOst, 'nam' => 'Остатки']);
				} else {
					$nomenkl = $this->SQLBase->addGrup('Nomenkl', $nom, '', 'FALSE');
					//$dat = $this->DataConv($str[2]);
					//$docType = $this->LoadDocType($par);
		//			$this->SQLBase->addAccDvij('2019-01-01 00:00:00', $accOst, $nomenkl, str_replace(',', '.', $val),
		//					['ref' => $accOst, 'nam' => 'Остатки']);
				}
					
				
			}
		} catch ( Exception $e ) {
			$this->errExit ( $e->getMessage () );
		}
	}
	public function getNomenkl(){
		$otb = [[
			'field' => 'grup',
			'comp' => '=',
			'val' => 'FALSE'
		]];
		
		$rez = $this->SQLBase->GetTabl('Nomenkl', $otb, ['name'])->fetch_all(MYSQLI_ASSOC);
		for($i = 0; $i < count($rez); $i++) $rez[$i]['gTab'] = $this->getNomenklType($rez[$i]['gTab']);
		return $rez;
	}
	public function UpdateNomenkl($ref, $param){
		foreach ($param as $key => $pStr)
			if(is_string($pStr)) $param[$key] = $this->SQLBase->escape($pStr);
		$this->SQLBase->UpdateNomenkl($this->SQLBase->escape($ref), $param);
		return [];
	}
	public function getNomenklType($TypeInt){
		return $TypeInt;
		
		if(!$TypeInt) {
			return "<не указано>";
		} else 
			return "<неизвестный тип>";
	}
	public function Otch($depth){
		try {
			return $this->SQLBase->AccObor(intval($depth))->fetch_all(MYSQLI_ASSOC);
		} catch ( Exception $e ) {
			$this->errExit ( $e->getMessage () );
		}
	}
	public function DataConv($dat) {
		return new DateTime(str_replace('_', '-', $dat));
	}
	public function LoadDocType($acc) {
		$cnt = count($acc);
		if($cnt >= 2) {
			
		}
	}
}
class EntrBase {
	private $param;
	private $cnn;
	public function __construct() {
		require 'setup.php';

		try {
			$this->cnn = new mysqli ( $this->param ["sql_server"], $this->param ["sql_user"], $this->param ["sql_pass"], $this->param ["sql_DBname"] );
			$this->cnn->set_charset ( "utf8" );
		} catch ( Exception $e ) {
			$this->cnn = new mysqli ( $this->param ["sql_server"], $this->param ["sql_user"], $this->param ["sql_pass"] );
			$this->cnn->set_charset ( "utf8" );
			$this->createBase ();
			$this->cnn->close ();
			$this->cnn = new mysqli ( $this->param ["sql_server"], $this->param ["sql_user"], $this->param ["sql_pass"], $this->param ["sql_DBname"] );
			$this->cnn->set_charset ( "utf8" ); 
		} 
	} 
	
	/*
	 * Дата
	 * счет (acc) *
	 * номенклатура (Nomenkl) *
	 * документ (doc_ref) *
	 * партия (nomPart)
	 * номенклатура субк (subkNom)
	 */
	
	public function escape($str){
		$rez = trim($str);
		if(strlen($rez) > 1 and $rez[0] == '"' and $rez[strlen($rez) - 1] == '"') {
			$rez = substr($rez, 1, strlen($rez) - 2);
		}
		return $this->cnn->real_escape_string($rez);
	}
	public function createBase() {
		$DBname = $this->param ['sql_DBname'];
		$pref = $this->param ['sql_pref'];
		if ($this->stsQuery ( "SHOW DATABASES LIKE '$DBname'" )->num_rows == 0) {
			$this->cnn->multi_query ( "CREATE DATABASE {$DBname} CHARACTER SET utf8;
                USE {$DBname};
                SET AUTOCOMMIT=0;
                START TRANSACTION;
                CREATE TABLE {$pref}config (
                  vers INT
                );
                CREATE TABLE {$pref}accMain (
                  ref CHAR(36) NOT NULL PRIMARY KEY,
                  date DATETIME,
                  acc CHAR(36),
                  value DECIMAL(15,5),
                  subkNom CHAR(36),
									doc_ref CHAR(36),
									doc_nam VARCHAR(255),
                  Nomenkl CHAR(36),
                  nomPart CHAR(36)
                );
                CREATE TABLE {$pref}Nomenkl (
                  ref CHAR(36) NOT NULL PRIMARY KEY,
									par CHAR(36),
									grup TINYINT,
									gTab TINYINT,
                  name VARCHAR(255)
								);
                CREATE TABLE {$pref}accTab (
                  ref CHAR(36) NOT NULL PRIMARY KEY,
									par CHAR(36),
									grup TINYINT,
                  name VARCHAR(255)
                );
                INSERT INTO {$pref}config SET 
                  vers = 1;
                COMMIT;
                " );
		}
	}
	/**
	 *@param $tabl
	 *@param $name
	 *@param $par
	 *@param $grup
	 */
	public function addGrup($tabl, $name, $par, $grup = '') {
		$eName = $name;
		if($grup == 'FALSE'){
			if($par) {
				$par_ = " AND par = '{$par}' ";
			} else {
				$par_ = '';
			}
			$uuid = $this->stsQuery ("SELECT ref FROM {$this->param['sql_pref']}{$tabl}
				WHERE grup = {$grup} {$par_} AND
					name = '{$eName}'
			")->fetch_assoc();
		} else {
			$uuid = $this->stsQuery (
				"SELECT ref FROM {$this->param['sql_pref']}{$tabl}
				WHERE grup = TRUE AND
					par = '{$par}' AND
					name = '{$eName}'
				")->fetch_assoc();
			$grup = 'TRUE';
		}
		if($uuid){
			return $uuid['ref'];
		} else {
			$uuid = $this->CreateUUID ();
			$this->stsQuery ( "INSERT INTO {$this->param['sql_pref']}{$tabl} SET
      	ref = '{$uuid}',
				par = '{$par}',
				grup = {$grup},
        name = '{$eName}';" );
			return $uuid;
		}
	}
	public function GetTabl($tName, $tWhere = [], $tOdr = []){
		$WhereC = '';
		$odrC = '';
		for($i = 0; $i < count($tWhere); $i++){
			if($WhereC) $WhereC.= ' and ';
			$WhereC.= "{$tWhere[$i]['field']} ";
			$WhereC.= "{$tWhere[$i]['comp']} ";;
			$WhereC.= $tWhere[$i]['val'];
		}
		for($i = 0; $i < count($tOdr); $i++){
			if($odrC) $odrC.= ', ';
			$odrC.= $tOdr[$i];
		}
		if($WhereC) $WhereC = "WHERE {$WhereC}";
		if($odrC) $odrC = "ORDER BY {$odrC}";
		
		return $this->stsQuery ("SELECT * FROM {$this->param['sql_pref']}{$tName} {$WhereC} {$odrC}");
	}
	public function addAccDvij($date, $acc, $Nomenkl, $value, $doc){
		$uuid = $this->CreateUUID ();
		if($doc['nam'] = 'Остатки') {
			$part = $uuid;
		}
		
		$this->stsQuery ( "INSERT INTO {$this->param['sql_pref']}accMain SET
			ref = '{$uuid}',
			date = '{$date}',
			acc = '{$acc}',
			Nomenkl = '{$Nomenkl}',
			value = {$value},
			doc_ref = '{$doc['ref']}',
			doc_nam = '{$doc['nam']}',
			nomPart = '{$part}'
		");
	}
	public function stsQuery($q) {
		try {
			$rez = $this->cnn->query ( $q );
			if (! $rez)
				throw new Exception ( "{$this->cnn->error}; $q" );
		} catch ( Exception $e ) {
			throw new Exception ( "{$e->getMessage()}; $q" );
		}
		return $rez;
	}
	public function zapIerar($tabl, $lvl) {
		$pol = '';
		$pol_n = '';
		$join = '';
		for($i = 1; $i <= $lvl; $i++){
			$i1 = $i - 1;
			if($pol) $pol.=', ';
			if($pol_n) $pol_n.=', ';
			$pol.= "tab_{$i}.ref AS ref_{$i}";
			$pol_n.= "tab_{$i}.name AS name_{$i}";
			if($i > 1) $join .="
  LEFT JOIN {$this->param['sql_pref']}{$tabl} AS tab_{$i} ON tab_{$i}.par = tab_{$i1}.ref";
		}
		return 
"SELECT
	{$pol},
  {$pol_n}
FROM 
  {$this->param['sql_pref']}{$tabl} AS tab_1 
  {$join}
WHERE tab_1.par =''";
	}
	public function AccObor($lvl) {
		$pol = ''; $pol_n = ''; $ord = '';
		$join = ''; $rtxt = ''; $lvlm = 3;
		
		for($i = 1; $i <= $lvlm; $i++){
			$pol.= ", Nomen.ref_{$i} AS ref_{$i}";
			$pol_n.= ", Nomen.name_{$i} AS name_{$i}";
			if($join) $join.= ' OR ';
			$join.= "Acc.Nomenkl = Nomen.ref_{$i}";
		}
		
		for($i = 1; $i <= $lvl; $i++){
			if($ord) $ord.= ', ';
			$ord.= "name_{$i}";
			
			$polr = '';
			$pgup = '';
			for($j = 1; $j <= $lvl; $j++){
				if($j > $i) {$polr.= ", '' AS name_{$j}";}
				else $polr.= ", vt_AccObor.name_{$j} AS name_{$j}";
				if($j <= $i) {
					if($pgup) $pgup.=', ';
					$pgup.="vt_AccObor.name_{$j}";
				}
			}
			if($rtxt) $rtxt.=' UNION ALL ';
			$rtxt.=
"SELECT
  vt_AccObor.name_{$i} AS name
  {$polr},
  'lvl_{$i}' AS lvl,
  SUM(vt_AccObor.value) AS value
FROM 
  vt_AccObor_{$i} AS vt_AccObor
WHERE 
  vt_AccObor.ref_{$i} <> ''
GROUP BY 
  {$pgup}";			
			
		}
		$polr = '';
		for($i = 1; $i <= $lvl; $i++) $polr.= ", 'яяяя'";
		$i = $lvl + 1;
		$rtxt.= " UNION ALL
SELECT 
	'ИТОГО'
	{$polr},
	'lvl_total',
	SUM(vt_AccObor.value) AS value
FROM 
	vt_AccObor_{$i} AS vt_AccObor
";
		
		$rtxt.= " ORDER BY {$ord}";
		
		$this->stsQuery(
"CREATE TEMPORARY TABLE vt_AccObor_1
	SELECT
		Acc.value AS value
		{$pol}{$pol_n}
	FROM
		{$this->param['sql_pref']}accMain AS Acc
			LEFT JOIN ({$this->zapIerar('Nomenkl', $lvlm)}) AS Nomen
			ON {$join}");
		
		for($i = 2; $i <= $lvl + 1; $i++){
			$this->stsQuery("
CREATE TEMPORARY TABLE vt_AccObor_{$i}
SELECT * FROM vt_AccObor_1;");
		}
		
		$rez = $this->stsQuery($rtxt);
		for($i = 1; $i <= $lvl; $i++)
			$this->DeletVT("vt_AccObor_{$j}");
		
		return $rez;
	}
	public function ShowVT($name) {
		return $this->stsQuery(
			"SELECT *
			FROM {$name}"); 
	}
	public function DeletVT($name) {
		return $this->stsQuery(
			"DROP TABLE IF EXISTS {$name};");
	}
	public function UpdateNomenkl($ref, $param){
		$tt = "";
		foreach ($param as $key => $pStr){
			if($tt) $tt .= ", ";
			$tt .= $key." = ";
			if(is_string($pStr)) {
				$tt .= "'".$pStr."'";
			} elseif (is_int($pStr)) {
				$tt .= $pStr;
			}
		}
		
		return $this->stsQuery(
			"UPDATE {$this->param['sql_pref']}Nomenkl
			SET {$tt}
			where ref ='{$ref}'");
	}
	public function CreateUUID() {
		return sprintf ( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x', 
				mt_rand ( 0, 0xffff ), mt_rand ( 0, 0xffff ), 
				mt_rand ( 0, 0xffff ), 
				mt_rand ( 0, 0x0fff ) | 0x4000, 
				mt_rand ( 0, 0x3fff ) | 0x8000, 
				mt_rand ( 0, 0xffff ), mt_rand ( 0, 0xffff ), mt_rand ( 0, 0xffff ) );
	}
}
?>