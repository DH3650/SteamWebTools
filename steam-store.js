// ==UserScript==
// @include https://store.steampowered.com/*
// @include http://store.steampowered.com/*
// ==/UserScript==


(function(){
  
var $ = window.jQuery, langNo, steamLanguage = document.cookie.match(/(^|\s)Steam_Language=([^;]*)(;|$)/);
// [en,ru,cn][langNo]
switch(steamLanguage && steamLanguage[2]){
    case 'russian' : langNo = 1; break;
    case 'schinese' : langNo = 2; break;
    case 'tchinese' : langNo = 2; break;
    case 'simplified chinese' : langNo = 2; break;
    case 'traditional chinese' : langNo = 2; break;
    default : langNo = 0;
}

function init() {
	
	// for age check
	/*
	if(window.location.pathname.indexOf('/agecheck')==0){
		document.cookie='birthtime=-1704124799; expires=21-Dec-2015 00:00:00 GMT; path=/';
		window.location.reload();
	}
    */

	// cc switcher
	var global_action_menu = document.getElementById('global_action_menu');
	if(global_action_menu) {
        var curCC = false;
        var savedCC = getValue('swt_cc');
        var fCCCode = document.cookie.match(/fakeCC=([a-z]{2})/i);
        var steamCCCode = document.cookie.match(/steamCC(?:_\d+){4}=([a-z]{2})/i);
		console.log('swt',savedCC,fCCCode,steamCCCode);

		//get country code from cookie
        if (steamCCCode != null && steamCCCode.length == 2) {
            curCC = steamCCCode[1];
        }
        else{
            if (fCCCode != null && fCCCode.length == 2) {
                curCC = fCCCode[1];
            }
            else {
                if(savedCC != null){
                    curCC = savedCC;
                }
                else{
                    console.log('swt','load cc info failed!!!');
                }
            }
        }

		
		var changeCCmenuHTML = '\
		<style>#cc_menu_btn{min-width:59px;padding:0 15px;z-index:999;background-color:#000;opacity:0.5;}#cc_menu_btn:hover{opacity:1}#cc_list .popup_menu_item{white-space:nowrap}</style>\
		<span class="pulldown" id="cc_menu_btn" onclick="ShowMenu(this, \'cc_menu\', \'left\');">CC'+(curCC ?': <img src="http://cdn.steamcommunity.com/public/images/countryflags/'+curCC.toLowerCase()+'.gif" /> '+curCC:'')+' </span>\
<div class="popup_block_new" id="cc_menu" style="display:none;">\
<div class="popup_body popup_menu shadow_content" id="cc_list"></div></div>\
	<div class="popup_block_new" id="cc_list_edit" style="display:none;">\
	<div class="popup_body popup_menu shadow_content">\
	<input id="ccListEdit" type="text" value="'+_cc.curList+'"/><br/><a href="javascript:;" id="cc_savebtn">[' + ['save','Сохранить','保存'][langNo] + ']</a> <a href="javascript:;" id="cc_defbtn">[' + ['default','дефолт','默认'][langNo] + ']</a> <a href="javascript:;" id="cc_cancelbtn">[' + ['cancel','отменить','取消'][langNo] + ']</a>\
	</div></div>'

		global_action_menu.insertAdjacentHTML('afterBegin', changeCCmenuHTML);

		_cc.updHTMLccList(curCC);

		document.getElementById('cc_defbtn').onclick = _cc.setDefCcList;
		document.getElementById('cc_savebtn').onclick = _cc.saveNewList;
		document.getElementById('cc_cancelbtn').onclick = function(){
			HideMenu('cc_cancelbtn','cc_list_edit');
			HideMenu("cc_cancelbtn","cc_menu");
		};
	}

	// for app/sub page
	var res = String(window.location.href).match(/\/(sub|app)\/(\d+)/i);
	if(res){

		var itemType = res[1], itemId = res[2];

		var els = document.querySelectorAll('.game_area_purchase_game');

		var subid, el, subs=[], tmp;
		for(var i=0; i < els.length; i++){
			el = els[i].querySelector('input[name="subid"]');
			if(!el) continue;
			subid = el.value;
			el = el.parentElement.parentElement
			el.insertAdjacentHTML('beforeEnd', '<div>Subscription id = <a href="http://steamdb.info/sub/'+subid+'">'+subid+'</a></div>');
			tmp = $('<div><a onclick="getPrices(event, \''+itemType+'\', '+itemId+');return false" href="#getPrices">' + ['get the prices of the other countries','Получить цены для других стран','获取其他国家的价格'][langNo] + '</a></div>');
			el = $(el).append(tmp);
			subs.push({subid:subid,el:tmp[0]});
		}

		window.getPrices = function(e, itemType, itemId){

			function getPrice(cc){
				var reqUrl = 'http://store.steampowered.com/api/';


				reqUrl += ((itemType=='app')
					? 'appdetails/?filters=basic,price_overview,packages&v=1&appids='
					: 'packagedetails/?filters=basic,price_overview,packages&v=1&packageids='
				)

				reqUrl += itemId+'&cc='+cc;

				$.get( reqUrl, function( transport ) {
						var s='';

						if(transport[itemId].success){
							var data = transport[itemId].data;
							var price = data.price_overview || data.price;

							if(price.discount_percent>0){
								s += '<s>'+(price.initial/100)+'</s> <span class="discount_pct">-'+price.discount_percent+'%</span> ';
							}

                            //need support from Enhanced_Steam(https://github.com/jshackles/Enhanced_Steam)
                            var shownPrice;
                            if(price.currency == 'USD')
                                shownPrice = (price.final / 100);
                            else
                                shownPrice = (price.final / 100 / getValue(price.currency + 'toUSD')).toFixed(2);

                            s += '<b>' + shownPrice + '</b> ' + ' USD ';

                            if(data.packages)
                                s += ' (subID:<a href="http://steamdb.info/sub/'+data.packages[0]+'">'+data.packages[0]  +'</a>)' + ';';

                            if(price.currency != 'USD') {
                                s += ' ( ' + ['Local currency:','Local currency:','当地货币:'][langNo] + (price.final / 100) + price.currency + ')';
                            }

							// for non-main subs
							try{
								var pg = data.package_groups[0].subs;
								if(pg.length>1){
									for(var i=1;i<pg.length;i++){
										var tmp = pg[i].option_text.match(/- \D*(\d+(?:[.,]\d{2})?)/i);
										document.querySelector('.swt_price_'+i+'_'+cc+'>span').innerHTML = '<b>'+tmp[tmp.length-1]+'</b> '+price.currency+' (subID:<a href="http://steamdb.info/sub/'+pg[i].packageid+'">'+pg[i].packageid+'</a>)';
									}
								}
							}catch(e){};
						} else {
							s+='NA';
						}
						document.querySelector('.swt_price_0_'+cc+'>span').innerHTML = s;
					}
				);
			}


			for(var k=0; k < subs.length; k++) {
				var str = ['get the prices of the other countries','Цены для других стран:','获取其他国家的价格'][langNo];
				for(var i=0; i < _cc.ListA.length; i++){
					str += '<div class="swt_price_'+k+'_'+_cc.ListA[i]+'"><a href="?cc='+_cc.ListA[i]+'"><img src="http://cdn.steamcommunity.com/public/images/countryflags/'+_cc.ListA[i]+'.gif" style="width:16px"/> '+_cc.ListA[i].toUpperCase()+'</a> <span>...</span></div>';

				}
				subs[k].el.innerHTML = str;
			}
			for(var i=0; i < _cc.ListA.length; i++){
				getPrice(_cc.ListA[i]);
			}
            //console.log(_cc.curCC);
			//setTimeout(function(){getPrice(_cc.curCC)}, 3500);

			return false;
		}


		var gamenameEl = document.querySelector('.game_title_area .game_name .blockbg');
		if (!gamenameEl){
			gamenameEl = document.querySelector('.apphub_AppName');
		}
		var gamename = encodeURIComponent(gamenameEl.textContent.trim());
		el = document.querySelector('#demo_block');
		if(el)
			el = el.parentElement;
		else
			el = document.querySelector('.share').parentElement.parentElement;


		links = [
			{
				href:'http://steamdb.info/'+itemType+'/'+itemId+'/', 
				icon:'http://steamdb.info/favicon.ico', 
				text:['View in SteamDB.info','Посмотреть в SteamDB.info','在SteamDB.info上查看'][langNo]
			},
			{
				href:'http://steamgamesales.com/'+itemType+'/'+itemId, 
				icon:'http://steamgamesales.com/favicon.ico', 
				text:['Take a look at SteamGameSales.com','Посмотреть на SteamGameSales.com','到SteamGameSales.com上看看'][langNo]
			},
			{
				href:'http://www.steamprices.com/'+_cc.curCC.toLowerCase()+'/'+itemType+'/'+itemId, 
				icon:'http://www.steamprices.com/favicon.ico', 
				text:['Take a look at SteamPrices.com','Посмотреть на SteamPrices.com','到SteamPrices.com上看看'][langNo]
			},
			{
				href:'http://plati.ru/asp/find.asp?agent=111350&searchstr='+gamename, 
				icon:'http://plati.ru/favicon.ico', 
				text:['Search in Plati.ru','Искать на Plati.ru','在Plati.ru上搜索'][langNo]
			},
			{
				href:'http://steampub.ru/search/'+gamename, 
				icon:'http://steampub.ru/favicon.ico', 
				text:['Search in SteamPub.ru','Искать на SteamPub.ru','在SteamPub.ru上搜索'][langNo]
			},
		];

		if(itemType=='app'){
			links.push(
				{
					href:'http://steamcommunity.com/my/gamecards/'+itemId, 
					icon:'http://cdn.steamcommunity.com/public/images/skin_1/notification_icon_guide.png', 
					text:['View Gamecards from this Game','Посмотреть мои карты этой игры','查看此游戏的卡片'][langNo]
				},
				{
					href:'http://www.steamcardexchange.net/index.php?gamepage-appid-'+itemId, 
					icon:'http://www.steamcardexchange.net/include/design/img/favicon_blue_small.png', 
					text:['View Gamecards in Steamcardexchange.net','View Gamecards in Steamcardexchange.net','在Steamcardexchange.net上查看卡片'][langNo]
				}
			);
		}

		el.insertAdjacentHTML('afterBegin', createBlock('Steam Web Tools', links));

	} else {
		$('a.linkbar[href^="http://store.steampowered.com/search/?specials=1"]').after('<a class="linkbar" href="http://steamdb.info/sales/">' + ['All Specials','All Specials','所有特惠'][langNo] + ' - SteamDB.Info</a>');
	}


};

_cc = {
	defList : 'cn ru ua us fr no gb au br de jp',
	curCC : false,
	updHTMLccList : function(curCC){
		var s='';
		_cc.ListA = _cc.curList.split(' ');
		for(var i=0; i < _cc.ListA.length; i++){
			s += '<a onclick="saveSelectedCC(' + _cc.ListA[i] + ')" class="popup_menu_item" href="'+_cc.url+_cc.ListA[i]+'"><img src="http://cdn.steamcommunity.com/public/images/countryflags/'+_cc.ListA[i]+'.gif" style="width:16px"/> '+_cc.ListA[i].toUpperCase()+'</a>';
		}
		s += '<a class="popup_menu_item" href="#" onclick="ShowMenu(this, \'cc_list_edit\', \'right\', \'bottom\', true);return false"><img src="http://cdn.steamcommunity.com/public/images/skin_1/iconEdit.gif" style="width:16px"/>' + ['Edit','Редактировать','编辑'][langNo] + '</a>';
		document.getElementById('cc_list').innerHTML=s;
		if (curCC)
			_cc.curCC=curCC
		else
			_cc.curCC=_cc.ListA[0];
	},
	saveNewList : function(){
		_cc.curList=document.getElementById('ccListEdit').value;
		window.localStorage.ccList=_cc.curList;
		_cc.updHTMLccList();
        	HideMenu('cc_savebtn','cc_list_edit');
        	HideMenu("cc_savebtn","cc_menu");
		return false;
	},
	setDefCcList : function(){
		document.getElementById('ccListEdit').value = _cc.defList;
		return false;
	},
    saveSelectedCC : function(selectedCC){
        setValue('swt_cc',selectedCC);
    }
};

_cc.curList = window.localStorage.ccList || _cc.defList;

_cc.url = String(window.location);
if (_cc.url.indexOf('?')==-1) {
	_cc.url += '?';
} else {
	_cc.url = _cc.url.replace(/\?.+/, '?');
}
_cc.url += 'cc=';

window._cc=_cc;


// block with links on app/sub page
function createBlock(title, links){
	var out='<div class="block">\
<div class="block_header"><h4>'+title+'</h4></div>\
<div class="block_content"><div class="block_content_inner">';

	var link;
	for (var i=0; i < links.length; i++) {
		link = links[i];
		out+='<a class="linkbar" href="'+link.href+'" target="_blank"><div class="rightblock" style="display:inline;margin-right:5px">\
<img src="'+link.icon+'" width="16" height="16" border="0" align="top"></div>'+link.text+'</a>'
	}

	out+='</div></div></div>';
	return out;
}


    // Chrome storage functions
    function setValue(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getValue(key) {
        var v = localStorage.getItem(key);
        if (v === undefined) return v;
        return JSON.parse(v);
    }

    function delValue(key) {
        localStorage.removeItem(key);
    }

var state = window.document.readyState;
if((state == 'interactive')||(state == 'complete'))
	init();
else
	window.addEventListener("DOMContentLoaded", init,false);

})();
