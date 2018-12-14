# bobaos.tool - bobaos.pub/sub cli

## Introduction

This is CLI tool to work with KNX Datapoint objects via BAOS(Bus Access Object Server) protocol

## Installation

First of all, be sure to have [bobaos.pub](https://github.com/bobaoskit/bobaos.pub) running, then install this app via node package manager:

```
sudo npm i -g bobaos.tool
```

## Usage:

```
$ bobaos-tool
hello, friend
connected to ipc, still not subscribed to channels
ready to send requests
bobaos> help
:: To work with datapoints
::  set ( 1: true | [2: "hello", 3: 42] )
::> get ( 1 2 3 | [1, 2, 3] )
::  stored ( 1 2 3 | [1, 2, 3] )
::> read ( 1 2 3 | [1, 2, 3] )
::  description ( * | 1 2 3 | [1, 2, 3] )

:: Helpful in bus monitoring:
::> watch ( 1: red | [1: red, 2: green, 3: underline] )
::  unwatch ( 1 2 3 | [1, 2, 3] )

:: BAOS services:
::> getbyte ( 1 2 3 | [1, 2, 3] )
::  getitem ( * | ServerItem1 Item2... | [Item1, Item2, ..] )
::> progmode ( ? | true/false/1/0 )

:: General:
::> ping
::  state
::> reset
::  help
bobaos> get 1
23:00:04:266,    id: 1, value: 23, raw: [12,126]
bobaos> get 1 101 102
23:00:20:747,    id: 1, value: 23, raw: [12,126]
23:00:20:755,    id: 101, value: false, raw: [0]
23:00:20:762,    id: 102, value: true, raw: [1]
bobaos> 
bobaos> set 101: false
[ '23:00:40:110,    id: 101, value: false, raw: [0]' ]
bobaos> description 1 101
#1: length = 2, dpt = dpt9,  prio: low  flags: [C-WTU]
#101: length = 1, dpt = dpt1,  prio: low  flags: [C-WTU]
```

This app uses ebnf parser to process commands, so it is possible to use lists, arrays in command parameters.


