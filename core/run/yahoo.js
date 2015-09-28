'use strict'


module.exports = function (browser){
    browser.url('https://tw.bid.yahoo.com/partner/merchandise/select_type')
        .execute(function (){
            window['login-username'].value = 'rocky_0823'
            window['login-passwd'].value = 'H6tPzweJMpyv'
            window['login-signin'].click()
        }, [])


    //23332

}