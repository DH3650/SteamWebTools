// ==UserScript==
// @include https://steamcommunity.com/id/*
// @include http://steamcommunity.com/id/*
// @include https://steamcommunity.com/profiles/*
// @include http://steamcommunity.com/profiles/*
// ==/UserScript==


(function(){
  
var $ = window.jQuery, langNo, steamLanguage = document.cookie.match(/(^|\s)Steam_Language=([^;]*)/);
// [en,ru,cn][langNo]
switch(steamLanguage && steamLanguage[2]){
    case 'russian' : langNo = 1; break;
    case 'schinese' : langNo = 2; break;
    case 'tchinese' : langNo = 2; break;
    case 'simplified chinese' : langNo = 2; break;
    case 'traditional chinese' : langNo = 2; break; 
    default : langNo = 0;
}

function init(){

	if (window.g_rgProfileData) {
		profileNewPageInit();
	}
	else if (window.g_strInventoryLoadURL) {
		inventoryPageInit();
	}
	else if (window.location.pathname.indexOf('/badges')>-1){
		badgesPageInit();
	}
	else if (/\/gamecards\/\d+/.test(window.location.pathname)){
		gamecardsPageInit();
	}
	
	if(window.location.hash == '#pending_gifts') {
		pendingGiftInit();
	}
}

function pendingGiftInit(){
	$('#tabcontent_pendinggifts > .pending_gifts_header:first-child').after('<div style="margin: 0px 0px 24px"><a class="btn_darkblue_white_innerfade btn_medium" href="#" onClick="acceptAllGifts();"><span>' + ['Accept All Gifts to Inventory','Сложить все в инвентарь','接受所有礼物至库存'][langNo] + '</span></a></div>');
	window.acceptAllGifts = function() {
		var giftHolderz = $('div[id^=unpacked_gift_]');
		var gifts = Array();
		
		for(var i=0; i<giftHolderz.length; i++)
		{
			gifts.push(giftHolderz[i].attributes['id'].value.substring(14));
		}
		for(var i=0; i<gifts.length; i++)
		{
			DoAcceptGift(gifts[i], false);
		}	
	}
}

function gamecardsPageInit(){
	var app = window.location.pathname.match(/\/gamecards\/(\d+)/)[1];
	$('.gamecards_inventorylink').append('<a class="btn_grey_grey btn_small_thin" href="http://backpack.tf/cardswap?appid='+app+'"><span>Backpack.tf/cardswap</span></a>');
}

function badgesPageInit(){
	$('.badge_details_set_favorite').append('<div class="btn_grey_black btn_small_thin" onclick="showWithDrop()"><span>' + ['Show Only Badges With Card Drops Remaining','Показать с невыпавшими картами','仅显示仍可掉落卡片的徽章'][langNo] + '</span></div>');
	window.showWithDrop=function(){
		$('.badge_row').filter(function(i,el){
			return !($('a.btn_green_white_innerfade',el).length)
		}).remove()
		return false;
	}

}

function includeJS(url){
	document.getElementsByTagName('head')[0].appendChild(document.createElement('SCRIPT')).src=url;
}

function SetRepBadges(selector){
	document.querySelector(selector).insertAdjacentHTML('afterEnd',
		'<a id="csmbadge" class="badge" href="http://check.csmania.ru/#steam:'+steamid+'">CSm: <span></sapn></a> <a id="srbadge" class="badge" href="http://steamrep.com/profiles/'+steamid+'">SR: <span></sapn></a>'
	);

	var badges = {
		0:{
			text : ['Unknown','неизвестен','未知'][langNo],
			color : '606060'
		},
		1:{
			text : ['MIDDLEMAN','гарант','担保人'][langNo],
			color : '5E931B'
		},
		2:{
			text : ['SCAMMER','в белом списке','骗子'][langNo],
			color : '247E9E'
		},
		3:{
			text : ['TRUSTED SELLER','в черном списке','可信'][langNo],
			color : '9E2424'
		},
		4:{
			text : ['CAUTION','подозрительный','可疑'][langNo],
			color : 'B47200'
		},
		error:{
			text : ['Error','Error','错误'][langNo],
			color : '606060'
		}
	};


	window.setRepStatus = function(res) {
		if(!(res.csm >= 0)){
			res.csm = error;
		}
		document.querySelector('#csmbadge').style.background = '#'+badges[res.csm].color;
		document.querySelector('#csmbadge span').innerHTML = badges[res.csm].text;

		var srbcolor;
		if(!res.srcom){
			res.srcom = badges[0].text;
			srbcolor = badges[0].color;
		} else {
			if(res.srcom.indexOf('SCAMMER')>-1){
				srbcolor = badges[3].color;
			} else
			if(res.srcom.indexOf('CAUTION')>-1){
				srbcolor = badges[4].color;
			} else
			if(res.srcom.indexOf('MIDDLEMAN')>-1){
				srbcolor = badges[1].color;
			} else
			if((res.srcom.indexOf('TRUSTED SELLER')>-1)||(res.srcom.indexOf('ADMIN')>-1)){
				srbcolor = badges[2].color;
			} else {
				srbcolor = badges[0].color;
			}
		}

		document.querySelector('#srbadge').style.background = '#'+srbcolor;
		document.querySelector('#srbadge span').innerHTML = res.srcom;

	}

	// get rep status
	includeJS('http://check.csmania.ru/api/swt9Hk02yFhf/0/repforext/'+steamid);

}

function inventoryPageInit(){
	// for subid detect
	var ajaxTarget = {descriptions:[]};

	window.getSubid = function(target, itemid){
		ajaxTarget.element = target;

		var item = window.UserYou.rgContexts[753][1].inventory.rgInventory[itemid];

		ajaxTarget.classid = item.classid;
		ajaxTarget.giftId = itemid;
		ajaxTarget.giftName = encodeURIComponent(item.name);

		includeJS('http://v1t.su/projects/steam/class-sub.php?jsonp=setSubID&get=sub&value='+item.classid);
	}

	window.setSubID=function(subid, f){
		var str = 'SubscriptionID = ';

		if (subid=="0"){

			if(window.g_bViewingOwnProfile){
				new window.Ajax.Request( 'http://steamcommunity.com/gifts/' + ajaxTarget.giftId + '/validateunpack', {
					method: 'post',
					parameters: { sessionid: window.g_sessionID },
					onSuccess: function( transport ) {
						window.setSubID(transport.responseJSON.packageid, true);
					}
				});
				return;
			} else
				str += ['unknow','не известно','未知'][langNo];
		} else {
			str += '<a href="http://steamdb.info/sub/'+subid+'">'+subid+'</a>';
			if(f) {
				//send to base | Please do not spam!
				includeJS('http://v1t.su/projects/steam/set_class-sub.php?class='+ajaxTarget.classid+'&sub='+subid+'&name='+ajaxTarget.giftName);
			}
		}
		ajaxTarget.element.outerHTML=str;
		var ds = ajaxTarget.descriptions[ajaxTarget.classid];
		ds[ds.length-1]={value:str};
		ds.withSubid=true;
	}

	// multi gifts sending
	document.body.insertAdjacentHTML("afterBegin",
		'<style>.checkedForSend{background:#366836!important}.itemcount{background:#292929;color:#FFF;font-weight:700;position:absolute;right:0;bottom:0}#inventory_logos{display:none}</style>'
	);
	window.checkedForSend={};
	window.checkForSend = function(giftId){
		var item = window.g_ActiveInventory.selectedItem;
		if(item.checkedForSend){
			item.checkedForSend=false;
			item.element.removeClassName('checkedForSend');
			if(item._amount>1){
				for(var i=0;i<item._amount;i++){
					delete window.checkedForSend[item._ids[i]];
				}
			} else {
				delete window.checkedForSend[giftId];
			}

		} else {
			var amount = 1;
			if(item._amount>1) {
				amount =  parseInt(prompt(['Amount, At Most: ','Сколько выбрать? из ','选择数量, 最大'][langNo] + item._amount, item._amount)) || 1;
				if (amount>item._amount)
					amount=item._amount;
			}
			if(amount>1){
				for(var i=0;i<amount;i++){
					window.checkedForSend[item._ids[i]]=item.name;
				}
			} else {
				window.checkedForSend[giftId]=item.name;
			}

			item.checkedForSend=true;
			item.element.addClassName('checkedForSend');


		}
	}
	window.sendChecked = function(){
		var url = 'http://store.steampowered.com/checkout/sendgift/';
		// first to gid
		for(var gid in window.checkedForSend){
			break;
		}

		url+=gid+'#multisend='+encodeURIComponent(JSON.stringify(window.checkedForSend))

		window.location.href=url;

	}
	// END multi gifts sending

	//// gifts notes
	var giftsNotes = window.localStorage.giftsNotes;
	if(giftsNotes)
		giftsNotes = JSON.parse(giftsNotes);
	else giftsNotes={};
	window.loadGiftNote = function(){
		var gid = window.g_ActiveInventory.selectedItem.id;
		if(!$('#iteminfo'+window.iActiveSelectView+'_item_tags_content textarea.giftnote').length)
			$('#iteminfo'+window.iActiveSelectView+'_item_tags_content').append('<br/><textarea class="giftnote" style="width:100%">'+(giftsNotes[gid]||'')+'</textarea><button onclick="saveGiftNote(\''+gid+'\')">' + ['Save','Сохранить','保存'][langNo] + '</button>');
	}
	window.saveGiftNote = function(gid){
		giftsNotes[gid]=$('#iteminfo'+window.iActiveSelectView+'_content textarea.giftnote').val();
		window.localStorage.giftsNotes = JSON.stringify(giftsNotes);
	}

	//// action for gifts and tf2 items
	var BuildHover_orig = window.BuildHover;
	window.BuildHover = function(){
		var item = arguments[1];
		// gifts
		if(window.g_ActiveInventory && (window.g_ActiveInventory.appid == 753)){
			if ((item.contextid==1) && !item.descriptions.withClassid) {
				item.descriptions.withClassid=true;

				if(!item.descriptions)
					item.descriptions = [];

				item.descriptions.push({value:'ClassID = '+item.classid});
				item.descriptions.push({type: 'html', value:'<a href="#" onclick="getSubid(event.target,\''+item.id+'\');return false">' + ['Get','Получить','获取'][langNo] + ' SubscriptionID</a>'});

				if(!ajaxTarget.descriptions[item.classid])
					ajaxTarget.descriptions[item.classid] = item.descriptions;


				if(item.owner_actions) {
					item.owner_actions.push({
						link:'javascript:checkForSend("%assetid%")',
						name:['Select This Gift','Выбрать для отправки','选中这个礼物'][langNo]
					});
					item.owner_actions.push({
						link:'javascript:sendChecked()',
						name:['Send All Selected Gifts','Отправить выбранные','发送当前所有选中的礼物'][langNo]
					});
					item.owner_actions.push({
						link:'javascript:loadGiftNote()',
						name:['Load Gift Note','Посмотреть','礼物备忘记录'][langNo]
					});
				}
			}
		} /*else
		// tf2 items
		//need fix link
		if(window.g_ActiveInventory && (window.g_ActiveInventory.appid == 440)){
			if (item.actions.swt!=1) {
				item.actions.swt=1;
				item.actions.push({
					link:'http://backpack.tf/stats/'+item.app_data.def_index+'/'+item.app_data.quality+'/0',
					name:'Цена предмета'
				});

			}
		}
		*/
		return BuildHover_orig.apply(this, arguments);
	}


	//// View in Market Button
	// not for me
	if (window.UserYou.strSteamId!=window.g_steamID){
		var PopulateMarketActions_orig = window.PopulateMarketActions;
		window.PopulateMarketActions = function (elActions, item) {
			var res = PopulateMarketActions_orig.apply(this, arguments);
			if (!item.marketable) {
				return res;
			}
			var market_hash_name = item.market_hash_name ? item.market_hash_name : item.market_name;
			elActions.appendChild(window.CreateMarketActionButton('blue', 'http://steamcommunity.com/market/listings/'+item.appid+'/'+market_hash_name, ['Minimum Price on the Steam Market','Мин цена на маркете','Steam市场最低价'][langNo] + ': <span id="swt_lowestItemPrice_'+item.classid+'">?</span>'));
			$(elActions).css('display', 'block');
			$.ajax( {
				url: 'http://steamcommunity.com/market/priceoverview/',
				type: 'GET',
				data: {
					country: window.g_strCountryCode,
					currency: typeof(window.g_rgWalletInfo) != 'undefined' ? window.g_rgWalletInfo['wallet_currency'] : 1,
					appid: item.appid,
					market_hash_name: market_hash_name
				}
			} ).done( function ( data ) {
				var price='ERROR';
				if(data.success){
					price=data.lowest_price
				}
				$('#swt_lowestItemPrice_'+item.classid).html(price);
			} ).fail(function(jqxhr) {
				$('#swt_lowestItemPrice_'+item.classid).text('ERROR');
			} );


			return res;
		}
	}

	//// Hide Duplicates
	/*window.UserYou.ReloadInventory_old = window.UserYou.ReloadInventory;
	window.UserYou.ReloadInventory = function(){
		g_ActiveInventory._hiddenDup = false;
		return window.UserYou.ReloadInventory_old.apply(this, arguments);
	}*/

	var SelectInventoryFromUser_old = window.SelectInventoryFromUser;
	window.SelectInventoryFromUser = function(){
		var appid = arguments[1];
		var contextid = arguments[2];

		var inventory = window.UserYou.getInventory( appid, contextid );
		if (window.localStorage.hideDupItems && !inventory._hiddenDup) {

			// display count
			if(!inventory.BuildItemElement_old){
				inventory.BuildItemElement_old = inventory.BuildItemElement;
				inventory.BuildItemElement = function(){
					var el = inventory.BuildItemElement_old.apply(this, arguments);
					el.innerHTML+='<div class="itemcount">x'+el.rgItem._amount+'</div>';
					return el;
				}
			}

			var itemsA = [];

			if(inventory.rgChildInventories) {
				for(var x in inventory.rgChildInventories){
					inventory.rgChildInventories[x].BuildItemElement = inventory.BuildItemElement; // display count
					itemsA.push(inventory.rgChildInventories[x].rgInventory);
				}
			} else {
				if(inventory.rgInventory)
					itemsA.push(inventory.rgInventory);
			}

			if(itemsA.length){
				inventory._hiddenDup = true;
				var items, newItems;
				for(var i=0; i<itemsA.length; i++){
					items = itemsA[i];
					newItems=[];

					for ( var j in items ){
						if(items[j]._is_stackable || items[j].is_stackable)
							continue;
						if(newItems[items[j].classid]){
							newItems[items[j].classid]._amount +=1;
							newItems[items[j].classid]._ids.push(items[j].id);
							delete items[j];
						} else {
							items[j]._is_stackable = true;
							items[j]._amount = 1;
							items[j]._ids = [items[j].id];
							newItems[items[j].classid] = items[j];
						}
					}
				}
			}

		}

		return SelectInventoryFromUser_old.apply(this, arguments);
	}

/*** goooooooooooooo ***/
    var HTMLGooBtn = '<button id="swt_goo_btn" onclick="window.grindallitems()">批量粉碎背景和表情</button>';
	document.getElementById('inventory_pagecontrols').insertAdjacentHTML("beforeBegin", HTMLGooBtn);
    var HTMLGooInfo = '<div id="swt_goo_info"> </div>';
	document.getElementById('inventory_pagecontrols').insertAdjacentHTML("beforeBegin", HTMLGooInfo);
  
    //grind all items into goo
    window.grindallitems = function(){
      var ltd_price_str = prompt('请输入限定的市场最高价, 只能输入数字 \
      \n\n只有市场价格不高于此价格的社区物品 (表情和背景,不包含卡片) 将被粉碎成宝石, \
      如果输入为0则不做限定, 货币单位为steam钱包对应国家的货币', '0.00');
      if(ltd_price_str === null) return false;
      if(isNaN(ltd_price_str) || ltd_price_str.replace(/(^\s*)|(\s*$)/g,"")===""){
        alert('只能输入数字');
        return false;
      }

      var ltd_goo_str = prompt('请输入限定的物品的最低宝石价值 (物品被粉碎后获得的宝石数量), \
      只能输入数字 \n\n只有宝石价值"不低于此数值"的物品将会被粉碎, 如果输入为0则不做限定', 10);
      if(ltd_goo_str === null) return false; 
      if(isNaN(ltd_goo_str) || ltd_goo_str.replace(/(^\s*)|(\s*$)/g,"")===""){
        alert('只能输入数字');
        return false;
      }

      var ltd_price = Number(ltd_price_str), ltd_goo = Number(ltd_goo_str), isltd_price = !!ltd_price, isltd_goo = !!ltd_goo,
        cfm = confirm('所有' + 
                      (isltd_price ? ' 市场价格不高于' + ltd_price : '') + 
                      (isltd_goo ? ' 宝石价值不低于' + ltd_goo : '') + 
                      '的表情和背景将被粉碎成宝石, \n开始后速度约为每0.5秒检查一个物品, 检查通过的物品会被粉碎, 可在浏览器控制台查看物品信息 \n\n是否确认');
      if(!cfm) return false;

      var timer_push, timer_pop, bgs_ems = [], items_stack = [], 
        receivedgems_total = 0, finished = false, inv_datas = [],
        url_goovalue = window.g_strProfileURL + '/ajaxgetgoovalue/' + '?contextid=6&sessionid=' + window.g_sessionID + '&appid=';
      
      
      function count(id){
        var ele = document.getElementById(id);
        ele.innerHTML = Number(ele.innerHTML) + 1;
      }
      function grind(item) {
        if(!item) return;
        jQuery.get(url_goovalue + item.appid + '&assetid=' + item.id, function(data){
          var _goovalue = data['goo_value'];
          if(!_goovalue){
            console.log(item['market_hash_name'] + '不能被粉碎');
            isltd_goo ? count('swt_num_checkfailed') : count('swt_num_grindfailed');
            return false;
          }
          if(isltd_goo && _goovalue < ltd_goo) return;
          console.log('准备粉碎 ' + item['market_hash_name']);
          jQuery.post(
            window.g_strProfileURL + '/ajaxgrindintogoo/', 
            {
              sessionid : window.g_sessionID,
              appid : item.appid,
              assetid : item.id,
              contextid : 6,
              goo_value_expected : _goovalue
            },
            function(data){
              if(data.success !== 1){
                console.log(item['market_hash_name'] + '粉碎失败');
                count('swt_num_grindfailed');
                return;
              }
              count('swt_num_grindsuccess');
              receivedgems_total += Number(data['goo_value_received ']);
              var _result = item['market_hash_name'] + ' 已被粉碎, 获得 ' + 
                            data['goo_value_received '] + ' 个宝石, 当前共拥有 ' + 
                            data['goo_value_total'];
              document.getElementById('swt_item_recycled').innerHTML = _result;
              console.log('%c ' + _result, 'background: #000000;color: #eeee11');
            }
          ).fail(function(){
            console.log(item['market_hash_name'] + '粉碎失败');
            count('swt_num_grindfailed'); 
          }).always(function(){ 
            bgs_ems.length === 0 && items_stack.length === 0 && (finished = true); 
          });
        }).fail(function(){
          isltd_goo ? count('swt_num_checkfailed') : count('swt_num_grindfailed'); 
        }).always(function(){
          bgs_ems.length === 0 && items_stack.length === 0 && (finished = true); 
        });
      }

      function handler_push() {
        if (bgs_ems.length === 0) {
          clearInterval(timer_push);
          return;
        }
        var _item = bgs_ems.pop();
        jQuery.get(
          'http://steamcommunity.com/market/priceoverview/', 
          {
            country : window.g_strCountryCode,
            currency: window.g_rgWalletInfo && window.g_rgWalletInfo['wallet_currency'] || 1,
            appid : 753,
            market_hash_name : _item.market_hash_name || _item.market_name
          },
          function (data) {
            if(!data['lowest_price']){
              count('swt_num_checkfailed');
              return;
            }
            var _price =  data['lowest_price'].match(/(&.*;|\S)([\.\d]*)/);
            if (_price && _price[2] <= ltd_price) {
              items_stack.push(_item);
            }
          }
        ).fail(function(){ count('swt_num_checkfailed'); });
      }
      function handler_pop(items) {
        items_stack.length > 0 && grind(items_stack.pop());
        document.getElementById('swt_num_tocheck').innerHTML = bgs_ems.length;
        document.getElementById('swt_num_togrind').innerHTML = items_stack.length;
        if(finished){
          var _msg = '粉碎完成, \n共粉碎' + 
            document.getElementById('swt_num_grindsuccess').innerHTML + 
            '个物品, 共获得' + receivedgems_total + '个宝石';
          console.log('%c' + _msg, 'background: #000000;color: #eeee11');
          alert(_msg);
          setTimeout(function(){ cancel_grind(); }, 0);
          finished = false;
        } 
      }

      function cancel_grind(){
        timer_push && clearInterval(timer_push);
        timer_pop && clearInterval(timer_pop);
        document.getElementById('swt_goo_btn').innerHTML = '批量粉碎背景和表情';
        document.getElementById('swt_goo_btn').onclick = window.grindallitems;
      };

      SetCookie('Steam_Language', 'english', 0.0001);
      document.getElementById('swt_goo_info').innerHTML = '';
      document.getElementById('swt_goo_btn').innerHTML = '正在获取库存数据...';
      document.getElementById('swt_goo_btn').onclick = null;
      
      (function get_inv(start){
        var _pram = start ? ('?start=' + start) : '';
        jQuery.get(window.g_strInventoryLoadURL + '753/6/' + _pram, function(data){
          if(data.success !== true){
            alert('获取库存数据失败');
            return;
          }
          
          inv_datas.push(data);
          if(data['more']){
            get_inv(data['more_start']);
            return;
          }
          
          while(inv_datas.length !== 0){
            var _data = inv_datas.pop();
            _items = _data['rgInventory'];
            _descs = _data['rgDescriptions'];
            for (var i in _items) {
              var _item = _items[i], 
                _desc = _descs[ _item['classid'] + '_' + _item['instanceid'] ], 
                _type = _desc && _desc['type'];
              if (_type && !/(Trading Card|Booster Pack|Steam Gems|\u96c6\u6362\u5f0f\u5361\u724c|\u4ea4\u63db\u5361\u7247|\u8865\u5145\u5305|\u64f4\u5145\u5305)/.test(_type)) {
                _item['appid'] = _desc['app_data']['appid'];
                _item['market_hash_name'] = _desc['market_hash_name'];
                bgs_ems.push(_item);
              }
            }
          }

          if(bgs_ems.length === 0){
            cancel_grind();
            alert('没有可粉碎的物品');
            return;
          }

          var HTMLgooinfo = '可碎粉物品总数: <span id="swt_num_total">' + 
              bgs_ems.length + '</span><br> 待检查物品数量: <span id="swt_num_tocheck">' + 
              bgs_ems.length + '</span> | 检查失败物品数量: <span id="swt_num_checkfailed">' + 
              '0</span><br> 待粉碎数量: <span id="swt_num_togrind">' + 
              '0</span> | 成功粉碎数量: <span id="swt_num_grindsuccess">' + 
              '0</span> | 粉碎失败数量: <span id="swt_num_grindfailed">' + 
              '0</span><br> 最新信息: <span id="swt_item_recycled">...</span>';
          document.getElementById('swt_goo_info').innerHTML = HTMLgooinfo;
          document.getElementById('swt_goo_btn').innerHTML = '粉碎中..点击停止';
          document.getElementById('swt_goo_btn').onclick = cancel_grind;
          if(isltd_price){
            timer_push = setInterval(handler_push, 500);
            timer_pop = setInterval(handler_pop, 800);
          }else{
            items_stack = bgs_ems.slice(0);
            bgs_ems = [];
            timer_pop = setInterval(handler_pop, 800);
          }
        });
        
      }());
    }//window.grindallitems
/*** goooooooooooooo ***/

	var HTMLHideDup = '<input type="checkbox" name="hidedup" onchange="window.onchangehidedup(event)" '+((window.localStorage.hideDupItems)?'checked="true"':'')+'/>' + ['Hide Duplicated Items','Прятать дубликаты, показывая кол-во','隐藏重复的物品'][langNo];
	document.getElementById('inventory_pagecontrols').insertAdjacentHTML("beforeBegin", HTMLHideDup);

	window.onchangehidedup = function(e){
		if(e.target.checked){
			window.localStorage.hideDupItems = 1
		} else {
			window.localStorage.removeItem('hideDupItems')
		}

		window.location.reload();
	};

	//// sell dialog accept ssa checked
	$('#market_sell_dialog_accept_ssa').attr('checked',true);

	//// multisell
	if(window.localStorage.hideDupItems){
		window.SellItemDialog.OnConfirmationAccept_old = window.SellItemDialog.OnConfirmationAccept;
		var SellCurrentSelection_old = window.SellCurrentSelection;
		window.SellCurrentSelection = function(){
			var res = SellCurrentSelection_old.apply(this, arguments);
			var count = window.g_ActiveInventory.selectedItem._amount;
			window.$('market_sell_dialog_ok').stopObserving();
			$('#market_sell_dialog_ok').unbind();
			if(count>1) {
				var amount =  parseInt(prompt(['Amount, At Most: ','Сколько продавать? из ','出售数量,最大 '][langNo] + count, count)) || 1;
				if (amount>count)
					amount=count;

				if(amount>1){
					window.SellItemDialog._amount=amount;
					window.SellItemDialog._itemNum=0;
					window.SellItemDialog.OnConfirmationAccept_new = function(event){

						window.$('market_sell_dialog_error').hide();
						window.$('market_sell_dialog_ok').fade({duration:0.25});
						window.$('market_sell_dialog_back').fade({duration:0.25});
						window.$('market_sell_dialog_throbber').show();
						window.$('market_sell_dialog_throbber').fade({duration:0.25,from:0,to:1});

						window.SellItemDialog.m_item.id=window.SellItemDialog.m_item._ids[window.SellItemDialog._itemNum];
						window.SellItemDialog._itemNum++;

						$.ajax( {
							url: 'https://steamcommunity.com/market/sellitem/',
							type: 'POST',
							data: {
								sessionid: window.g_sessionID,
								appid: window.SellItemDialog.m_item.appid,
								contextid: window.SellItemDialog.m_item.contextid,
								assetid: window.SellItemDialog.m_item.id,
								amount: window.SellItemDialog.m_nConfirmedQuantity,
								price: window.SellItemDialog.m_nConfirmedPrice
							},
							crossDomain: true,
							xhrFields: { withCredentials: true }
						} ).done( function ( data ) {
							$('#market_sell_dialog_item_availability_hint>.market_dialog_topwarning').text(['to sell No.','Выставлен №','正在出售... 第'][langNo] + window.SellItemDialog._itemNum);
							if(window.SellItemDialog._itemNum>=window.SellItemDialog._amount)
								window.SellItemDialog.OnSuccess( { responseJSON: data } );
							else {
								return window.SellItemDialog.OnConfirmationAccept_new.apply(window.SellItemDialog, arguments);
							}
						} ).fail( function( jqxhr ) {
							// jquery doesn't parse json on fail
							var data = $.parseJSON( jqxhr.responseText );
							window.SellItemDialog.OnFailure( { responseJSON: data } );
						} );
						//window.SellItemDialog.Dismiss();
						//event.stop();

					}
					window.SellItemDialog.OnConfirmationAccept = window.SellItemDialog.OnConfirmationAccept_new;
				} else {
					window.SellItemDialog.OnConfirmationAccept = window.SellItemDialog.OnConfirmationAccept_old;
				}


			} else
				window.SellItemDialog.OnConfirmationAccept = window.SellItemDialog.OnConfirmationAccept_old;
			$('#market_sell_dialog_ok').on("click", $.proxy(window.SellItemDialog.OnConfirmationAccept, window.SellItemDialog));
			return res;
		}

	}

}

function profileNewPageInit(){

	steamid = window.g_rgProfileData.steamid;

	var profilesLinks = [
		{
			href: 'http://steamrepcn.com/profiles/'+steamid,
			icon: 'http://steamrepcn.com/favicon.ico',
			text: ['View in SteamrepCN.com','Профиль на SteamrepCN.com','到SteamrepCN.com上查看'][langNo],
		},
		{
			href: 'http://forums.steamrep.com/search/search?keywords='+steamid,
			icon: 'http://steamrep.com/favicon.ico',
			text: ['Search in SteamRep.com','Искать на форумах SteamRep.com','在SteamRep.com上搜索'][langNo],
		},
		{
			href: 'http://forums.sourceop.com/search.php?do=process&query='+steamid,
			icon: 'http://forums.sourceop.com/favicon.ico',
			text: ['Search in SourceOP.com','Искать на форумах SourceOP.com','在SourceOP.com上搜索'][langNo],
		},
		{
			href: 'http://www.steamtrades.com/user/id/'+steamid,
			icon: 'http://www.steamtrades.com/favicon.ico',
			text: ['View in SteamTrades.com','Инвентарь SteamTrades.com','到SteamTrades.com上查看'][langNo],
		},
		{hr:true},
		{
			href: 'http://backpack.tf/profiles/'+steamid,
			icon: 'http://backpack.tf/favicon_440.ico',
			text: ['View in Backpack.tf','Инвентарь Backpack.tf','到Backpack.tf上查看'][langNo],
		},
		{
			href: 'http://tf2b.com/tf2/'+steamid,
			icon: 'http://tf2b.com/favicon.ico',
			text: ['View in TF2B.com','Инвентарь TF2B.com','到TF2B.com上查看'][langNo],
		},
		{
			href: 'http://tf2outpost.com/backpack/'+steamid,
			icon: 'http://cdn.tf2outpost.com/img/favicon_440.ico',
			text: ['View in TF2OutPost.com','Инвентарь TF2OutPost.com','到TF2OutPost查看背包'][langNo],
		},
		{hr:true},
		{
			href: 'http://tf2outpost.com/user/'+steamid,
			icon: 'http://cdn.tf2outpost.com/img/favicon_440.ico',
			text: ['View in TF2OutPost.com','Трэйды на TF2OutPost.com','TF2OutPost.com交易'][langNo],
		},
		{
			href: 'http://dota2lounge.com/profile?id='+steamid,
			icon: 'http://dota2lounge.com/favicon.ico',
			text: ['View in Dota2Lounge.com','Трэйды на Dota2Lounge.com','到Dota2Lounge.com上查看'][langNo],
		},
		{
			href: 'http://csgolounge.com/profile?id='+steamid,
			icon: 'http://csgolounge.com/favicon.ico',
			text: ['View in CSGOLounge.com','Трэйды на CSGOLounge.com','到CSGOLounge.com上查看'][langNo],
		},
		{hr:true},
		{
			href: 'http://steammoney.com/trade/user/'+steamid,
			icon: 'http://steammoney.com/favicon.ico',
			text: ['View in SteamMoney.com','Инвентарь SteamMoney.com','到SteamMoney.com上查看'][langNo],
		},
		{
			id:   'inv_spub',
			href: 'http://steampub.ru/user/'+steamid,
			icon: 'http://steampub.ru/favicon.ico',
			text: ['View in SteamPub.ru','Профиль на SteamPub.ru','到SteamPub.ru上查看'][langNo],
		}
	];

	// Styles
	document.body.insertAdjacentHTML("afterBegin",
		'<style>.badge{border-radius:3px;box-shadow:1px 1px 0px 0px #1D1D1D;font-size:.7em;padding:3px;position:relative;top:-2px}#swt_info{position:absolute;top:201px}</style>'
	);


	$('.profile_header').append('<div id="swt_info"><span id="permlink"> SteamID64: <a href="http://steamcommunity.com/profiles/'+steamid+'">'+steamid+'</a> </span> <a href="#getMoreInfo" onclick="getMoreInfo();return false">' + ['Get more info','Get more info','获取更多信息'][langNo] + '</a></div>');


	SetRepBadges('#permlink');
	window.getMoreInfo = function() {
		var Modal = window.ShowDialog('Extended Info', $('<div id="swtexinfo"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif"></div>'));
		window.setTimeout(function(){Modal.AdjustSizing();},1);
		$.ajax({
			url: window.location.href+'?xml=1',
			context: document.body,
			dataType: 'xml'
		}).done(function(responseText, textStatus, xhr) {
			var xml = $(xhr.responseXML);
			var isLimitedAccount = xml.find('isLimitedAccount').text();
			var tradeBanState = xml.find('tradeBanState').text();
			var vacBanned = xml.find('vacBanned').text();
			var accCrDate = xml.find('memberSince').text();

			// calc STEAMID
			var steamid2 = parseInt(steamid.substr(-10),10);
			var srv = steamid2 % 2;
			var accountid = steamid2 - 7960265728;
			steamid2 = "STEAM_0:" + srv + ":" + ((accountid-srv)/2);


			$('#swtexinfo').html(
				'<table>'+
				'<tr><td><b>CommunityID</b></td><td>'+steamid+'</td>'+
				'<tr><td><b>SteamID</b></td><td>'+steamid2+'</td>'+
				'<tr><td><b>AccountID</b></td><td>'+accountid+'</td>'+
				'<tr><td><b>Registration date</b></td><td>'+accCrDate+'</td>'+
				'<tr><td><b>VAC</b></td><td>'+(vacBanned=='0'?'Clear':'Banned')+'</td>'+
				'<tr><td><b>Trade Ban</b></td><td>'+tradeBanState+'</td>'+
				'<tr><td><b>Is Limited Account</b></td><td>'+(isLimitedAccount=='0'?'No':'Yes')+'</td>'+
				'</table>'
			);
			window.setTimeout(function(){Modal.AdjustSizing();},1);
		}).fail(function(){
			$('#swtexinfo').html(['Request Error','Ошибка при получении данных','错误请求'][langNo])
		});
	};


	// chat button
	try {
		var pm_btn = $('.profile_header_actions>a.btn_profile_action[href^="javascript:LaunchWebChat"]')[0];
		pm_btn.outerHTML='<span class="btn_profile_action btn_medium"><span><a href="steam://friends/message/'+steamid+'">Chat: Steam</a> | <a href="'+pm_btn.href+'">Web</a></span></span>';
	} catch(e) {};

	// Games link - tab all games
	var el = document.querySelector('.profile_count_link a[href$="games/"]');
	if(el) el.href+='?tab=all';
	// inventory links
	el = document.querySelector('.profile_count_link a[href$="inventory/"]');
	if(el)
		el.insertAdjacentHTML('afterEnd', ': <span class="linkActionSubtle"><a title="Steam Gifts" href="'+el.href+'#753_1"><img src="http://www.iconsearch.ru/uploads/icons/basicset/16x16/present_16.png"/></a> <a title="Steam Cards" href="'+el.href+'#753_6"><img width="26" height="16" src="http://store.akamai.steamstatic.com/public/images/ico/ico_cards.png"/></a> <a title="TF2" href="'+el.href+'#440"><img src="http://media.steampowered.com/apps/tf2/blog/images/favicon.ico"/></a> <a title="Dota 2" href="'+el.href+'#570"><img src="http://www.dota2.com/images/favicon.ico"/></a> <a title="CSGO" href="'+el.href+'#730"><img src="http://blog.counter-strike.net/wp-content/themes/counterstrike_launch/favicon.ico"/></a></span>');



	var out = '', link;
	for (var i=0; i < profilesLinks.length; i++){
		link = profilesLinks[i];

		if (link.hr) {
			out +='<hr/>';
		} else {
			out += '<a class="popup_menu_item" href="'+link.href+'"><img style="width:18px;height:18px" src="'+link.icon+'"> '+link.text+'</a>';
		}

	}
	try {
		document.querySelector('#profile_action_dropdown>.popup_body.popup_menu').insertAdjacentHTML("beforeEnd", out);
	} catch(err) {
		// "More" button for self profile
		$('.profile_header_actions').append('<span class="btn_profile_action btn_medium" onclick="ShowMenu(this,\'profile_action_dropdown\',\'right\')"><span>' + ['More','More','更多'][langNo] + ' <img src="http://cdn.steamcommunity.com/public/images/profile/profile_action_dropdown.png"/></span></span><div class="popup_block" id="profile_action_dropdown" style="visibility:visible;display:none"><div class="popup_body popup_menu">'+out+'</div></div>')
	}


}

var state = window.document.readyState;
if((state == 'interactive')||(state == 'complete'))
	init();
else
	window.addEventListener("DOMContentLoaded", init,false);

})();
