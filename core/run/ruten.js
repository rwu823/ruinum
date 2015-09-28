'use strict'

var c = require('colors')
var path = require('path')
var fs = require('fs')
var HOME = process.env.HOME

var itemsPath = path.join(__dirname, '../../items')
var itemDirs = fs.readdirSync(itemsPath).map(function (p){
    return path.join(itemsPath, p)
})


if(!itemDirs.length){
    return console.log(`You don't have any items!`.red)
}

var _ = require('lodash')
var glob = require('glob')

var cfg = require('../../config')
var exec = require('child_process').exec


var lwip = require('lwip')
var storeStart = 0

module.exports = function (browser) {
    function login(user, passwd){
        browser
            .url('http://mybidu.ruten.com.tw/upload/step2.htm')
            .setValue('input[name="userid"]', user)
            .setValue('input[name="userpass"]', passwd)
            .click('input[name="expire"]')
            .execute(function (){
                $('#btn_login').css('border', '2px solid red')
            }, [], function (){
                browser
                    .saveScreenshot('./CAPTCHA.png', function (){
                        lwip.open('./CAPTCHA.png', function(err, image){
                            // w: 200, h: 120
                            var startX = 705
                            var startY = 333
                            var width = 196
                            var height = 116
                            var x, y, login_x, login_y
                            var skip
                            for(x = startX; x<= startX+width; x++){
                                for(y = startY; y<= startY+height; y++){
                                    var c = image.getPixel(x, y)
                                    if(c.r !== 253 && c.g !== 239 && c.b !== 217){
                                        skip = true
                                        login_x = (x-startX + 40)
                                        login_y = (y-startY + 10)
                                        break
                                    }
                                }

                                if(skip) break
                            }

                            browser
                                .execute(function (x, y){
                                    $('#btn_login_x').val(x)
                                    $('#btn_login_y').val(y)
                                    $('#login_form').submit()
                                }, [login_x, login_y])
                        })
                    })
            })

    }

    function upload(files, cb){
        browser
            .waitForElementPresent('input[name="g_name"]', 15000)
            .execute(function (){
                $('#B3').click()
            })
            .window_handles(function(result) {
                var fileUploadPopup = result.value[1]
                var originWindow = result.value[0]

                browser.switchWindow(fileUploadPopup)

                files.forEach(function (p, idx){
                    browser.setValue(`#File${idx + 1}`, p)
                })

                browser
                    .click('input[name=B4]')
                    .waitForElementNotPresent('input[name=B4d]', 15000)
                    .switchWindow(originWindow, function (){
                        cb()
                        console.log('Upload images'.yellow, JSON.stringify(files, null, 4).cyan)
                    })

            })
    }

    function fillForm(opts){
        opts = _.merge({
            title: '請填物品名稱',
            price: '999999',
            description: '',
            num: 1,
            status: 'A',
            loc: '台北市',
            categoryStore: '4374191',
            //流行女裝-其他
            categoryRetun: '00020025'
        }, opts)

        browser
            .waitForElementPresent('input[name="g_name"]', 15000)
            .execute(function (opts){
                $('input[name="g_name"]').val(opts.title)
                $('input[name="g_direct_price"]').val(opts.price)
                $('input[name="show_num"]').val(opts.num)
                $('#location_tw').val(opts.loc)
                $('select[name="user_class_select"]').val(opts.categoryStore)

                setTimeout(function (){
                    $('#shop_id').val(opts.categoryRetun)

                    // 運費保持預設，需點二下才正常
                    $('input.align-item').click()
                    $('input.align-item').click()
                    $('label.align-item').click()

                    // go next
                    $('input[name="Submit3"]').click()
                }, 500)


                //商品狀態, A=物品中描述 B=全新 C=二手
                $(`input[name="g_condition"][value="${opts.status}"]`).click()

                // 物品說明
                $('#text2_ID_ifr').contents().find('body').html(opts.description)
            }, [opts])
    }

    function setp3(cb){
        browser
            .waitForElementPresent('#step3form_send', 15000)
            .click('#step3form_send', function (){
                if(_.isFunction(cb)) cb()
            })
    }

    function mvDone(src, dist){
        var mv = `mv "${src}" "${dist}"`
        exec(mv)
        console.log(mv.yellow)
    }

    function backAgain(cb){
        storeStart += 1
        cb = cb || function(){}

        if(itemDirs[storeStart]){
            browser
                .waitForElementPresent('.t1623 a', 15000)
                .click('.t1623 a', function (){
                    start(storeStart)
                    cb()
                })
        }else{
            browser.end(cb)
        }
    }

    function start(idx){
        var targetDir = itemDirs[idx]
        var detail = require(path.join(targetDir, 'detail.js'))
        var images = glob.sync('/*.jpg', {
            root: targetDir
        })

        console.log('Runium is working on'.yellow, targetDir.cyan)

        detail.title = cfg.banner + path.basename(targetDir)
        //detail.description = fs.readFileSync(`${targetDir}/description.html`).toString()

        upload(images, function (){
            fillForm(detail)
            setp3(function (){
                backAgain(function (){
                    mvDone(targetDir, path.join(targetDir, '../../done'))
                })
            })
        })
    }

    login(cfg.loginID, cfg.passwd)
    start(storeStart)
}
