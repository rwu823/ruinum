'use strict'

var gu = require('gulp')
var spawn = require('child_process').spawn


gu
    .task('start', function (){
        spawn('java', ['-jar', './selenium-server-standalone-2.45.0.jar'], {stdio: 'inherit'})

    })
    .task('run', function (){

    })