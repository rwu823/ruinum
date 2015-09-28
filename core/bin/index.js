#!/usr/bin/env node
'use strict'

var spawn = require('child_process').spawn
var path = require('path')

var cmd = require('commander');
var pkg = require('../package.json')

var stdio = {stdio: 'inherit'}

var nightwatchPath = path.join(__dirname, '../node_modules/.bin/nightwatch')


cmd.version(pkg.version)
    .option('start', 'Start on the bot')
    .option('run', 'Run the auto-load')
    .parse(process.argv)


if(cmd.start){
    spawn('java', ['-jar', path.join(__dirname, './selenium-server-standalone-2.47.1.jar')], stdio)
}
else if(cmd.run){
    spawn('node', [
        nightwatchPath,
        '-c', './bot/nightwatch.json',
        '-e', 'chrome',
        '-t', './bot/run/index.js',
        //'--verbose'
    ], stdio)
}