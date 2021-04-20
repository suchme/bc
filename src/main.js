"use strict";

import DATA from "./data.js";

var values={total:{},subtotal:{},extra_passives:[],bonus:{}};

var reset=function(a){
	DATA.param_cd.forEach(function(e){ a[e]= 0; });
}
var add=function(a,b){
	DATA.param_cd.forEach(function(e){ a[e] += b[e]; });
}
var addBiko=function(label,value){
	if(value>0){
		return label+"+"+value+" ";
	}
	if(value<0){
		return label+value+" ";
	}
	return "";
}

var reCalc=function(){
	//計算処理
	var passives=[];

	var nodes = document.querySelectorAll("#form select[bind]");
	for(var i=0;i<nodes.length;i++){
		var node = nodes[i];
		const bind = Bind.binds.find(function(elem){return elem.target ===node});
		if(!bind)continue;
		Bind.setBindValue(bind,node.value);
	}
	values.total.cost=0;

	//神姫
	values.shinki.org = DATA.shinkis.find(function(elem){return elem.cd === values.shinki.cd});
	var shinki = values.shinki.org;
	if(!values.shinki.org){return;}
	reset(values.shinki);
	add(values.shinki,values.shinki.org);
	values.shinki.name=values.shinki.org.name;


	//レアリティ
	var rare = values.shinki.rarelity;
	add(values.shinki,DATA.shinki_rarelity_bonus[rare]);

	values.shinki.apts=[];
	values.shinki.org.apts.forEach(function(effect,idx){
		var apt={};
		if(effect!==0){
			apt.category = idx;
			if(effect===100){
				effect-=20*rare;
			}else if(effect===-50){
				effect+=10*rare;
			}else if(effect<0){
				effect+=5*rare;
			}else{
				effect-=5*rare;
			}
			apt.effect = effect;
			values.shinki.apts.push(apt);
		}
	});
	values.shinki.apts.sort(function(a,b){return b.effect - a.effect;});
	var span= document.createElement("span");
	var br=0;
	values.shinki.apts.forEach(function(e){
		if(!br && e.effect<0){
			span.appendChild(document.createElement("br"));
			br=1;
		}
		span.appendChild(getAptSpan(e));
	});

	var passive={};
	passive.skill = DATA.passives[values.shinki.org.exskill];
	passive.effect= 0;
	span.appendChild(document.createElement("br"));
	span.appendChild(getPassiveSpan(passive));
	values.shinki.skill= span;

	//追加パッシブ
	var parent_span= document.querySelector("#extra_passive");
	parent_span.innerHTML="";
	values.extra_passives.forEach(function(e,idx){
		var span = getPassiveSpan(e);
		var button = document.createElement("button");
		button.appendChild(span);
		button.onclick=function(){
			values.extra_passives.splice(idx,1);
			reCalc();
		};
		//span.appendChild(remove);
		parent_span.appendChild(button);

		passives.push(e);
	});
	

	var biko="";
	if(armor.flying){
		biko+="飛行 ";
	}
	values.shinki.dash			=90*rare + shinki.dash;
	values.shinki.dash_cost		=20*rare+ shinki.dash_cost;
	values.shinki.jump_cost		=20*rare+shinki.jump_cost;
	values.shinki.hover_cost	=20*rare+shinki.hover_cost;
	values.shinki.guard_cost	=20*rare  +shinki.guard_cost;
	biko+="ダッシュ速度"		+ values.shinki.dash+" ";
	biko+="ダッシュ消費"		+ values.shinki.dash_cost+" ";
	biko+="ジャンプ消費"		+ values.shinki.jump_cost+" ";
	biko+="ホバリング消費"		+ values.shinki.hover_cost+" ";
	biko+="防御消費"			+ values.shinki.guard_cost+" ";
	biko+=shinki.biko;
	values.shinki.biko=biko;
	
	//アイコン補正
	values.individual= DATA.individuals[values.shinki.individual];

	//lv
	if(values.shinki.lv==="60"){
		add(values.shinki,{atk:8,def:8,spd:3,lp:80,bst:30});
	}

	//武装
	DATA.part_cd.forEach(function(part){
		if(part==="shinki")return;
		var r = Number(values[part].rarelity);
		var lv= values[part].lv;
		var cd = values[part].cd;

		var idx = DATA.armors.findIndex(function(elem){return elem.cd === cd;});
		reset(values[part]);

		if(idx<0){ return; }

		var armor = DATA.armors[idx];
		if(armor.rarelity !== r){
			var idx2 = idx + r -armor.rarelity;
			if(DATA.armors[idx2].name === armor.name){
				armor = DATA.armors[idx2];
				values[part].cd = armor.cd;
			}else{
				values[part].rarelity = armor.rarelity;
			}
		}
		values[part].org = armor;

		values[part].name=armor.name;
	  	if(armor.part===6){
			values[part].name=armor.name + "[" +DATA.category_short[armor.category]+"]";
		}
		add(values[part],armor);
		if(lv==60){
			var bonus;
			if(armor.part===6){
				if(armor.range===0){
					bonus= DATA.lv_bonus.weapon_short[r];
				}else{
					bonus= DATA.lv_bonus.weapon_long[r];
				}
			}else{
				bonus= DATA.lv_bonus[part][r];
			}
			add(values[part],bonus);
		}

		values.total.cost+=DATA.cost[values[part].rarelity];

		if(part === "weapon2"){return;}
		var span_skill= document.createElement("span");//document.querySelector("#"+part+" span.skill");
		if(armor.passive>0){
			var passive={};
			passive.skill = DATA.passives[armor.passive];
			passive.effect= armor.effect;
			passives.push(passive);
			var span =getPassiveSpan(passive);
			span_skill.appendChild(span);
		}
		if(armor.active>0){
			var skill={};
			skill.skill = DATA.actives[armor.active];
			skill.effect= armor.active_effect;
			var span =getSkillSpan(skill);
			span.className = "active";
			span_skill.appendChild(span);
		}
		values[part].skill=span_skill;

		var biko="";
		if(armor.flying){
			biko+="飛行 ";
		}
		biko+=addBiko("回復",armor.recover);
		biko+=addBiko("ダッシュ速度",armor.dash);
		biko+=addBiko("ダッシュ消費",armor.dash_cost);
		biko+=addBiko("ジャンプ消費",armor.jump_cost);
		biko+=addBiko("ホバリング消費",armor.hover_cost);
		biko+=addBiko("防御消費",armor.guard_cost);
		biko+=armor.biko;
		values[part].biko=biko;
	});

	//小計
	reset(values.subtotal);
	add(values.subtotal,values.shinki);
	add(values.subtotal,values.individual);
	add(values.subtotal,values.head);
	add(values.subtotal,values.body);
	add(values.subtotal,values.arm);
	add(values.subtotal,values.leg);
	add(values.subtotal,values.rear);
	add(values.subtotal,values.weapon);
	
	//最終値
	reset(values.total);
	reset(values.bonus);
	
	add(values.total,values.subtotal);

	values.subtotal.biko =document.createElement("span");
	//適性補正
	values.shinki.apts.forEach(function(apt){
		if(apt.category !== values.weapon.org.category)return;
		values.bonus.atk += values.subtotal.atk * apt.effect*0.01;
		//values.subtotal.biko.appendChild(getAptSpan(apt));
	});
	//パッシブ補正
	passives.forEach(function(passive){
		//var span = getPassiveSpan(passive);
		//values.subtotal.biko.appendChild(span);
		if(passive.skill.func){
			passive.skill.func(passive.effect);
		}
	});

	values.bonus.atk = Math.trunc(values.bonus.atk); 
	values.bonus.def = Math.trunc(values.bonus.def); 
	values.bonus.spd = Math.trunc(values.bonus.spd); 
	values.bonus.lp  = Math.trunc(values.bonus.lp ); 
	values.bonus.bst = Math.trunc(values.bonus.bst); 
	add(values.total,values.bonus);


	//レアリティ色
	DATA.part_cd.forEach(function(e,idx){
		document.querySelectorAll("span."+e+" select,span."+e+" button").forEach(function(node){
			node.classList.remove("N","R","SR","UR");
			node.classList.add(DATA.rarelity[values[e].rarelity]);
		});
	});



	//エクスポートテキスト
	var export_text_data="";
	export_text_data += "攻"+values.total.atk 
		+" 防" +values.total.def
		+" 速" +values.total.spd
		+" 体" +values.total.lp
		+" ブ" +values.total.bst+"\n";
	DATA.part_cd.forEach(function(e,idx){
		var data = values[e];
		export_text_data += "Lv" + data.lv + DATA.rarelity[data.rarelity];
		export_text_data +=  data.org.name;
		if(idx==0){
			export_text_data +="("+ DATA.individuals[data.individual].name+")";
		}
		
		export_text_data +=  "\n";
	});

	var param = new Uint8Array(25);
	var dv = new DataView(param.buffer);
	DATA.part_cd.forEach(function(e,idx){
		var obj = values[e];
		if(idx===0){
			dv.setUint8(0,obj.lv);
			dv.setUint8(1,obj.rarelity);
			dv.setUint8(2,parseInt(obj.cd.substr(1)));
			dv.setUint8(3,obj.individual);
		}else{
			dv.setUint8(1+idx*3,obj.lv);
			dv.setUint16(2+idx*3,parseInt(obj.cd.substr(1)));
		}
	});
	var param = "0"+arrayToBase64(param);

	export_text_data += location.protocol + "//"+location.host+location.pathname +"?" + param;

	values.export_text = export_text_data;


	Bind.refresh();
}


var onloadfunc=function(){
	DATA.cost=[10,20,50,140];

	//部位ごとのフォーム作成
	var parent = document.querySelector("#armor");
	DATA.part_cd.forEach(function(e,idx){
		if(idx===0)return;
		var div = document.createElement("div");
		var span= document.createElement("span");
		span.className="template_part";
		span.id=e;
		div.appendChild(span);
		parent.appendChild(div);
	});

	var targets= document.querySelectorAll(".template_part");
	var template=document.querySelector("#template_armor");
	for(var i=0;i<targets.length;i++){
		var target = targets[i];
		var part_cd = target.id;
		var part_idx = DATA.part_cd.findIndex(function(e){return e===part_cd;});
		if(part_idx===7){part_idx=6;};

		var clone = template.cloneNode(true);

		clone.id = target.id;
		clone.classList.add(target.id,"armor");

		var children = clone.querySelectorAll("[bind]");
		for(var j=0;j<children.length;j++){
			children[j].setAttribute("bind",part_cd+children[j].getAttribute("bind"));
		}
		 clone.querySelector(".part").textContent = DATA.part_name[i];
 
		var span = clone.querySelector("button.armor");
		span.addEventListener("click" ,(function(part_cd,part_idx){
			return function(e){
				var rarelity = Number(values[part_cd].rarelity);

				sub_cols=[
					{label:"name",data:"name",filter:1,class:"shinki"
						,disp:function(e){ 
						if(e.parent === undefined){return e.name};
						return (
						(e.parent!=="-"?"-":"")
						+(e.set !==""?"+":"")
						+e.name);}}
					,{data:"atk",label:"攻",class:"status",sort:-1}
					,{data:"def",label:"防",class:"status",sort:-1}
					,{data:"spd",label:"速",class:"status",sort:-1}
					,{data:"lp", label:"体",class:"status",sort:-1}
					,{data:"bst",label:"ブ",class:"status",sort:-1}
					];

				if(part_idx===0){
					//神姫の場合
					sub_cols.splice(6,0,{class:"status",label:"回復",data:"recover",sort:-1});
					sub_cols.splice(7,0,{class:"status",label:"走速度",data:"dash",sort:-1});
					sub_cols.splice(8,0,{class:"status",label:"走消費",data:"dash_cost"});
					sub_cols.splice(9,0,{class:"status",label:"跳消費",data:"jump_cost"});
					sub_cols.splice(10,0,{class:"status",label:"浮消費",data:"hover_cost"});
					sub_cols.splice(10,0,{class:"status",label:"防御消費",data:"guard_cost"});
					values.filter={};
					var datalist = [];
					DATA.shinkis.forEach(function(e2){
						var data={};
						sub_cols.forEach(function(e){
							data[e.data]=e2[e.data];
						});
						DATA.category_short.forEach(function(e,idx){
							if(idx===0)return;
							data["cat"+idx]=e2.apts[idx];
						});
						data.cd = e2.cd;
						datalist.push(data);
					});
					table_data = datalist;
					DATA.category_short.forEach(function(e,idx){
						if(idx===0)return;
						sub_cols.push({label:e,data:"cat"+idx,class:"cat",sort:-1})
					});
				}else{
					//武装の場合

					if(part_idx!==6){
						sub_cols.push({class:"status",label:"回復",data:"recover",sort:-1});
					}
					sub_cols.push({class:"status",label:"走速度",data:"dash",sort:-1});
					sub_cols.push({class:"status",label:"走消費",data:"dash_cost"});
					//sub_cols.push({class:"status",label:"跳消費",class:"cost",data:"jump_cost"});
					if(part_idx===5){
						sub_cols.push({class:"status",label:"浮消費",class:"cost",data:"hover_cost"});
					}

					if(part_idx===6){
						//武器
						sub_cols.push({class:"status",label:"防御消費",class:"cost",data:"guard_cost"});
						sub_cols.splice(1,0,{data:"range",filter:1,disp:function(e,parent){
							if(e[this.data]===0){
								parent.classList.add("short");
							}else{
								parent.classList.add("long");
							}
							return DATA.range[e[this.data]];
						}});
						sub_cols.splice(2,0,{data:"category",label:"カテゴリ",filter:1,disp:function(e,p){

							if(e.category===15){
								p.classList.add("bougu");
							}else if(e.range===0){
								p.classList.add("short");
							}else{
								p.classList.add("long");
							}

							return DATA.category_short[e.category];}}); 
						sub_cols.push({data:"active",filter:1,disp:function(e){
								return getSkillName(DATA.actives[e.active],e.active_effect); }}); 
								

					}else{
						//防具
						sub_cols.push({data:"passive",filter:1,disp:function(e){
								return getSkillName(DATA.passives[e.passive],e.effect); }}); 
					}
					if(part_idx===5){
						sub_cols.push({data:"flying",label:"飛行",filter:1,disp:function(e){return DATA.flying[e.flying]}});
					}

					sub_cols.push({label:"備考",data:"biko"});
					sub_cols.splice(0,0,{data:"rarelity",filter:1
						,disp:function(e){return DATA.rarelity[e.rarelity];}}); 
					sub_cols.unshift({data:"class",label:"分類",filter:1
						,disp:function(e){return DATA.class[e.class];}});
					sub_cols.unshift({data:"part",filter:1
						,disp:function(e){return DATA.part_name[e.part]}});
					values.filter={part:[part_idx],rarelity:[rarelity]};
					table_data = DATA.armors;
				}
				openSubWindow(function(e){
					if(e===null){ return; }
					if(part_cd !== 'shinki'){

						if(e.part === 6 && part_cd ==='weapon2'){
						}else{
							part_cd = DATA.part_cd[e.part];
						}
						var armor = DATA.armors.find(function(elem){return elem.cd === e.cd;});
						if(armor){
							values[part_cd].cd = armor.cd ;
							values[part_cd].rarelity = armor.rarelity;
						}
						if(armor.set !== ""){
							//セット装備がある場合
							var setArmors = DATA.armors.filter(function(e){return e.parent === armor.set && e.rarelity === armor.rarelity;});
							setArmors.forEach(function(e){
								var part_cd = DATA.part_cd[e.part];
								values[part_cd].cd = e.cd ;
								values[part_cd].rarelity = e.rarelity;
							});
						}
					}else{
						values[part_cd].cd = e.cd;
					}
					Bind.refresh();
					reCalc();
				});
				e.preventDefault();
				return false;
			}
		})(part_cd,part_idx));

		target.parentNode.replaceChild(clone,target);
	}

	//param
	var nodes= document.querySelectorAll("span.param");
	var param= document.getElementById("param");
	DATA.param_cd.forEach(function(e,idx){
		var span = document.createElement("span");
		span.classList.add("status",e);
		span.setAttribute("bind","."+e);
		param.appendChild(span);
	});
	nodes.forEach(function(node){
		var newnode = param.cloneNode(true);
		var bindName = node.getAttribute("bind");
		var children = newnode.querySelectorAll("[bind]");
		children.forEach(function(e){
			e.setAttribute("bind",bindName +e.getAttribute("bind"));
		});
		node.parentNode.replaceChild(newnode,node);
	});

	//レアリティコンボボックス設定
	nodes= document.querySelectorAll("select.rarelity");
	var rare = document.getElementById("rarelity");
	DATA.rarelity.forEach(function(e,idx){
		var option = document.createElement("OPTION");
		option.textContent = e;
		option.className=e;
		option.value= idx;
		rare.appendChild(option);
	});
	nodes.forEach(function(org){
		var rare2 = rare.cloneNode(true);
		rare2.id="";
		if(org.getAttribute("bind") !== null){
			rare2.setAttribute("bind",org.getAttribute("bind"));
		}
		org.parentNode.replaceChild(rare2,org);
	});


	var correctStatus=function(atk,def,spd,lp,bst){
	   values.bonus.atk += values.subtotal.atk * 0.01*atk;
	   values.bonus.def += values.subtotal.def * 0.01*def;
	   values.bonus.spd += values.subtotal.spd * 0.01*spd;
	   values.bonus.lp  += values.subtotal.lp  * 0.01*lp;
	   values.bonus.bst += values.subtotal.bst * 0.01*bst;
	}
	DATA.passives[ 1].func=function(effect){ correctStatus(1+effect,0,0,0,0); }
	DATA.passives[ 2].func=function(effect){ correctStatus(0,1+effect,0,0,0); }
	DATA.passives[ 3].func=function(effect){ correctStatus(0,0,1+effect,0,0); }
	DATA.passives[ 4].func=function(effect){ correctStatus(0,0,0,1+effect,0); }
	DATA.passives[ 5].func=function(effect){ correctStatus(0,0,0,0,1+effect); }
	DATA.passives[ 6].func=function(effect){
		var a =Math.trunc(effect*0.5)
		correctStatus(a+1,a+1,a,a+1,a+1);
	}


	document.querySelectorAll("select").forEach(function(node){
		node.addEventListener("change",function(){ reCalc(); });
	});

	var select = document.querySelector("#individual");
	DATA.individuals.forEach(function(e,idx){
		var option = document.createElement("OPTION");
		option.textContent = e.name;
		option.value= idx;
		select.appendChild(option);
	});
	


	var dt=new Date(DATA.date);
	values.version="code2021/03/22<br>"
	   	+ "data"+ dt.getFullYear() +"/"+("0"+(dt.getMonth()+1)).slice(-2)
		+"/" +("0"+dt.getDate()).slice(-2);

	//初期値セット
	if(location.search===""){
		DATA.part_cd.forEach(function(e){
			values[e]={cd:DATA.default[e].cd,rarelity:DATA.default[e].rarelity,lv:"1"};
		});
		values.shinki.individual="0";
	}else{
		var param = location.search.substring(1);
		var version = param.substring(0,1);
		if(version==="v"){
			param = decodeURIComponent(atob(param.substring(2)));
			var individual= param.match(/^(\d+)/)[1];
			DATA.part_cd.forEach(function(e){
				var initial = e.substr(0,1);
				var regexp = new RegExp("("+ initial +"\\d+)([NRSU]+)(\\d+)");
				var result = param.match(regexp);
				values[e]={};
				values[e].cd = result[1];
				values[e].rarelity= ""+DATA.rarelity.indexOf(result[2]);
				values[e].lv= result[3];
				param=param.substr(result.index+result[0].length);
			});
			values.shinki.individual =individual;
		}else{
			var param = base64ToArray(param.substr(1));
			var dv = new DataView(param.buffer);
			DATA.part_cd.forEach(function(e,idx){
				values[e]={};;
				var obj = values[e];
				if(idx===0){
					obj.lv = dv.getUint8(0);
					obj.rarelity =dv.getUint8(1);
					obj.cd=e.substr(0,1)+dv.getUint8(2);
					obj.individual = dv.getUint8(3);
				}else{
					obj.lv =dv.getUint8(1+idx*3);
					obj.cd = e.substr(0,1)+dv.getUint16(2+idx*3);
					var armor = DATA.armors.find(function(elem){return elem.cd === obj.cd;});
					obj.rarelity= armor.rarelity;
				}
			});
		}
	}

	Bind.init();
	Bind.refresh();

	reCalc();

}


//サブ画面ーーーーーーーーーーーーーーーーーー
var sub_cols=[];
var table_data=[];
var sub_callback=null;
var openSubWindow=function(callback){
	  sub_callback=callback;
	
	values.sort=[];

	//ヘッダ作る
	var tr_sort = document.createElement("tr");
	tr_sort.classList.add("sort");
	var tr_filter = document.createElement("tr");
	tr_filter.classList.add("filter");

	var th = document.createElement("th");
	th.className="pick";
	tr_filter.appendChild(th);
	th = document.createElement("th");
	th.className="pick";
	tr_sort.appendChild(th);

	sub_cols.forEach(function(col){
		var th_filter = document.createElement("th");

		var th_sort = document.createElement("th");
		var a= document.createElement("button");
		a.textContent=col.label?col.label:col.data;
		a.onclick=(function(cd){return function(e){setSort(cd);}})(col);
		th_sort.appendChild(a);

		th_filter.classList.add(col.data);
		th_sort.classList.add(col.data);
		if(col.class){
			th_filter.classList.add(col.class);
			th_sort.classList.add(col.class);
		}
		tr_filter.appendChild(th_filter);
		tr_sort.appendChild(th_sort);
	});
	var cols = document.querySelectorAll("#sub_head tr");
	cols[0].parentNode.replaceChild(tr_filter,cols[0]);
	cols[1].parentNode.replaceChild(tr_sort,cols[1]);

	Bind.init();

	createTable();
	var subwindow= document.querySelector("#subwindow");
	subwindow.style.display="block";
  }

var closeSubWindow = function(e){
	var subwindow= document.querySelector("#subwindow");
	subwindow.style.display="none";

	if(sub_callback){
		sub_callback(e);
	}

}

var setFilter=function(name,value){
	var filter = values.filter;
	if(!value){
		delete filter[name];
	}else if(value.length===0){
		delete filter[name];
	}else{
		filter[name]=value;
	}

	createTable();
}
var setSort=function(col){
	var data=col.data;
	//var filter_sort = JSON.parse(values.filter_sort);
	var sort = values.sort;

	var idx = sort.indexOf(data);
	if(idx<0){
		idx = sort.indexOf("!"+data);
	}else{
		data = "!"+data;
	}
	if(idx>=0){
		sort.splice(idx,1);
	}else{
		if(col.sort<0){
			data = "!"+data;
		}
	}
	sort.unshift(data);
	createTable();

}
var createTable=function(){

	var filters = values.filter;
	var sort = values.sort;
	var keys = Object.keys(filters);

	//フィルタ
	var data= table_data.filter(function(e){
		var flg=true;
		keys.forEach(function(key){
			flg &= (filters[key].indexOf(e[key])>=0);
		});
		return flg;
	});

	values.filter_name=[];
	sub_cols.forEach(function(cols){
		var filter= filters[cols.data];
		var th = document.querySelector("tr.filter th."+cols.data);
		th.innerHTML="";
		if(filter){
			filter.forEach(function(e,idx){
				var button = document.createElement("button");
				var obj={};
				obj[cols.data]=e;
				button.textContent=cols.disp?cols.disp(obj,button):e;
				button.onclick=function(){
					filter.splice(idx,1);
					setFilter(cols.data,filter)
				};
				th.appendChild(button);
			});
			
		}
	});

	
	//ソート
	data.sort(function(a,b){
		var result=0;
		sort.some(function(e){
		
			if(e.indexOf("!")!=0){
				result =a[e]> b[e]?1:-1;
			}else{
				e = e.substr(1);
				result =a[e]< b[e]?1:-1;
			}
			if(a[e] !== b[e]){return true;}
		});
		return result;
	});


//ボディ作る
	var tbody = document.querySelector("#sub_body");
	tbody.innerHTML="";
	for(var i=0;i<data.length;i++){
		var rowdata = data[i];
		var tr;
		tr = document.createElement("tr");

		var th = document.createElement("th");
		th.className="pick";
		var span = document.createElement("button");
		span.textContent = "選択";
		span.className="pick";
		span.onclick=(function(cd){return function(e){closeSubWindow(cd);}})(rowdata);
		th.appendChild(span);
		tr.appendChild(th);

		sub_cols.forEach(function(col){
			var td = document.createElement("td");
			var content =  typeof col.disp == "function"?col.disp(rowdata,td):rowdata[col.data];
			td.classList.add(col.data);
			if(col.class){
				td.classList.add(col.class);
			}
			if(content===0){
				td.classList.add("zero");
			}
			if(content<0){
				td.classList.add("minus");
			}
			var span = td;//document.createElement("span");
			span.innerHTML= content;
			//td.appendChild(span);
			if( col.data ==='rarelity'){
				if(rowdata.rarelity>=0){
					span.classList.add(DATA.rarelity[rowdata.rarelity]);
				}
			}
			if(col.filter){
				span.classList.add("filtertarget");
				span.onclick=(function(cd,value){return function(e){setFilter(cd,[value]);}})(col.data,rowdata[col.data]);
			}
			tr.appendChild(td);
		});
		tbody.appendChild(tr);
	}


	Bind.refresh();
}

//バインドーーーーーーーーーーーーーーーーーーーーー
var Bind={};
Bind.binds=[];
Bind.init=function(){
	Bind.binds=[];
	var bindedNodes = document.querySelectorAll("#form [bind]");
	for(var i=0;i<bindedNodes.length;i++){
		Bind.bind(bindedNodes[i]);
	}
}

Bind.bind=function(target){
	var bind={};
	bind.target = target;
	bind.variable = bind.target.getAttribute("bind").split(".");
	this.binds.push(bind);
}
Bind.setBindValue=function(bind,n){
	var val =this.getBindValue(bind,1);
	val[bind.variable[bind.variable.length-1]]=n;
}
Bind.getBindValue=function(bind,n){
	var value=values;
	for(var j=0;j<bind.variable.length-n;j++){
		value = value[bind.variable[j]];
		if(value == undefined){
			value=null;
			break;
		}
	}
	return value;
}
Bind.refresh=function(){
	for(var i=0;i<this.binds.length;i++){
		const bind = this.binds[i];
		var value = this.getBindValue(bind,0);
		if(bind.old_value  === value){continue;}
		var target = bind.target;
		if(target.tagName==="INPUT" || target.tagName==="SELECT" || target.tagName==="TEXTAREA"){
			if(target.value !== value){
				target.value = value;
			}
		}else{
			  if(value && (value instanceof HTMLElement || value.nodeName)){
	  			target.innerHTML="";
				target.appendChild(value);
			}else{
				//target.textContent= value;
				target.innerHTML= value;
			  }
		}
		bind.old_value = value;
	}
}

//パッシブサブ画面
var span = document.querySelector("#add_extra_passive");
span.addEventListener("click",function(e){

  sub_cols=[{label:"パッシブスキル",data:"name",filter:1,disp:function(e){
  		return e.name + (e.effect>0?"["+DATA.effect[e.effect]+"]":"");
		}}
		,{label:"効果量",data:"effect",filter:1,disp:function(e){return DATA.effect[e.effect];}}];

	values.filter={effect:[0,1]};
	table_data=[];
	DATA.passives.forEach(function(e,idx){
		if(idx===0)return;
		if(e.effect_type===0){
			var data  ={name:e.name,cd:idx,effect:0};
			table_data.push(data);
		}else{
			for(var i=1;i<5;i++){
				var data  ={name:e.name,cd:idx,effect:i};
				table_data.push(data);
			}
		}
	});
	
	openSubWindow(function(res){
		if(res===null){ return; }
	  	values.extra_passives.push({cd:res.cd,skill:DATA.passives[res.cd],effect:res.effect});
		
		reCalc();
	});
 });


var getPassiveSpan=function(skill){
	var span = document.createElement("span");
	span.textContent = getSkillName(skill.skill,skill.effect);
	span.title = skill.skill.biko;
	span.className = "passive";
	return span;
}
var getSkillSpan=function(skill){
	var span = document.createElement("span");
	span.textContent = getSkillName(skill.skill,skill.effect);
	span.title = skill.skill.biko;
	span.className = "passive";
	return span;
}
var getSkillName=function(skill,effect){
	return skill.name +(effect>0?"[" + DATA.effect[effect]+"]":"");
}
var getAptSpan=function(apt){
	var span = document.createElement("span");
	span.textContent ="[" + DATA.category_short[apt.category]+ "]";
	span.className= "apt";
	var span2 = document.createElement("span");
	span2.textContent =apt.effect+"%";
	span2.className= (apt.effect)<0?"minus":"";
	 span.appendChild(span2);
	return span;
}

var arrayToBase64=function(array){
	return btoa(String.fromCharCode(...array));
}
var base64ToArray=function(base64){
	var binary = atob(base64);
	var len = binary.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++)        {
	  bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

onloadfunc();