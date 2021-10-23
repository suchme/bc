"use strict";

import DATA from "./data.js";
import Binder from "./lib/binder.js";
import Subselector from "./subselector.js";
import SubLayout from "./sub_layout.js";
//import Visualizer from "./visualizer.js";

var values={total:{},subtotal:{},extra_passives:[],bonus:{},selected_tab:"main",extension:{}};
window.values = values;
var binder = new Binder();
var subselector= new Subselector();

function getPassiveSpan(skill){
	var span = document.createElement("span");
	span.textContent = getSkillName(skill.skill,skill.effect);
	span.title = skill.skill.biko;
	span.className = "passive icon";
	return span;
}
function getSkillSpan(skill){
	var span = document.createElement("span");
	span.textContent = getSkillName(skill.skill,skill.effect);
	span.title = skill.skill.biko;
	span.className = "passive icon";
	return span;
}
function getSkillName(skill,effect){
	return skill.name +(effect>0?"[" + DATA.effect[effect]+"]":"");
}

function arrayToBase64(array){
	return btoa(String.fromCharCode(...array));
}
function base64ToArray(base64){
	var binary = atob(base64);
	var len = binary.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++)        {
	  bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
function getAptSpan(apt){
	var span = document.createElement("span");
	span.textContent ="[" + DATA.category_short[apt.category]+ "]";
	span.className= "apt";
	var span2 = document.createElement("span");
	if(apt.effect>0){
		span2.textContent ="+"+apt.effect+"%";
	}else{
		span2.textContent =apt.effect+"%";
	}
	span2.className= (apt.effect)<0?"minus":"";
	 span.appendChild(span2);
	return span;
}

function reset(a){
	DATA.param_cd.forEach(function(e){ a[e]= 0; });
}
function add(a,b){
	DATA.param_cd.forEach(function(e){ a[e] += b[e]; });
}
function addBiko(label,value){
	if(value>0){
		return label+"+"+value+" ";
	}
	if(value<0){
		return label+value+" ";
	}
	return "";
}
class Main {


	reCalc(){
		//計算処理
		var passives=[];

		values.total.cost=0;

		//神姫
		values.shinki.org = DATA.shinkis.find(function(elem){return elem.cd === values.shinki.cd});
		var shinki = values.shinki.org;
		if(!values.shinki.org){return;}
		reset(values.shinki);
		add(values.shinki,values.shinki.org);
		values.shinki.name=values.shinki.org.name;

//		document.querySelector("#shinki .part_icon").className = 
//			"part_icon " + values.shinki.org.cd;
		document.querySelector("#shinki .name").className = 
			"name shinki " + values.shinki.org.cd;


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
				}else if(effect>=50){
					effect-=10*rare;
				}else if(effect<=-50){
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

		var passive={};
		passive.skill = DATA.passives[values.shinki.org.expassive];
		passive.effect= 0;
		span.appendChild(getPassiveSpan(passive));
		values.shinki.skill= span;

		//追加パッシブ
		var parent_span= document.querySelector("#extra_passive");
		parent_span.innerHTML="";
		values.extra_passives.forEach((e,idx)=>{
			var span = getPassiveSpan(e);
			var button = document.createElement("button");
			button.appendChild(span);
			button.onclick=(e)=>{
				values.extra_passives.splice(idx,1);
				this.reCalc();
			};
			//span.appendChild(remove);
			parent_span.appendChild(button);

			passives.push(e);
		});
		

		//アイコン補正
		values.individual= DATA.individuals[values.shinki.individual];
		add(values.shinki,values.individual);

		var biko="";
		biko+="回"		+ values.shinki.recover+" ";
		biko+="走"		+ values.shinki.dash+" ";
		biko+="走費"		+ values.shinki.dash_cost+" ";
		biko+="跳費"		+ values.shinki.jump_cost+" ";
		biko+="浮費"		+ values.shinki.hover_cost+" ";
		biko+="防費"			+ values.shinki.guard_cost+" ";
		biko+=shinki.biko;
		values.shinki.biko=biko;
		

		//lv
		if(values.shinki.lv!="1"){
			add(values.shinki,DATA.lv_bonus.shinki[0][values.shinki.lv]);
			//add(values.shinki,{atk:8,def:8,spd:3,lp:80,bst:30});
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
			//if(armor.part===6){
			//	values[part].name=armor.name + "[" +DATA.category_short[armor.category]+"]";
			//}
			add(values[part],armor);
			if(lv!="1"){
				var bonus;
				if(armor.part===6){
					if(armor.distance===0){
						bonus= DATA.lv_bonus.weapon_short[r][lv];
					}else{
						bonus= DATA.lv_bonus.weapon_long[r][lv];
					}
				}else{
					bonus= DATA.lv_bonus[part][r][lv];
				}
				add(values[part],bonus);
			}

			values.total.cost+=DATA.cost[values[part].rarelity];

			if(part === "weapon2"){return;}
			var span_skill= document.createElement("span");//document.querySelector("#"+part+" span.skill");
			if(part === "weapon"){
				var apt=values.shinki.apts.find((e)=>{return e.category === values.weapon.org.category});
				if(apt){
					span_skill.appendChild( getAptSpan(apt) );
				}
			}
			if(armor.flying){
				var img=document.createElement("img");
				img.src= "icon/flying.svg";
				img.width=16;
				img.height=16;
				span_skill.appendChild(img);
			}
			if(armor.passive>0){
				var passive={};
				passive.skill = DATA.passives[armor.passive];
				passive.effect= armor.passive_effect;
				passives.push(passive);
				var span =getPassiveSpan(passive);
				span_skill.appendChild(span);
			}
			if(armor.active>0){
				var skill={};
				skill.skill = DATA.actives[armor.active];
				skill.effect= armor.active_effect;
				var span =getSkillSpan(skill);
				span.className = "active icon";
				span_skill.appendChild(span);
			}
			values[part].skill=span_skill;

			var biko="";
			//if(armor.flying){
			//	biko+="飛行 ";
			//}
			//biko+=addBiko("回復",armor.recover);
			//biko+=addBiko("走",armor.dash);
			//biko+=addBiko("走費",armor.dash_cost);
			//biko+=addBiko("跳費",armor.jump_cost);
			//biko+=addBiko("浮費",armor.hover_cost);
			//biko+=addBiko("防費",armor.guard_cost);
			//biko+=armor.biko;
			//values[part].biko=biko;
		});

		//小計
		reset(values.subtotal);
		add(values.subtotal,values.shinki);
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

		var keys = Object.keys(values.bonus);
		keys.forEach((e)=>{
			values.bonus[e] = Math.trunc(values.bonus[e]); 
		});
		add(values.total,values.bonus);

		reset(values.subtotal);
		add(values.subtotal,values.total);
		
		//固有パッシブ補正
		var skill = DATA.passives[values.shinki.org.expassive];
		switch(skill.name){
			case "カーテンコール":
				values.total.bst += Math.trunc(values.total.bst *0.2)
				break;
			case "クイックドローガード":
				values.total.guard_cost -= Math.trunc(values.total.guard_cost *0.6)
				break;
			case "グライドオンプレステイル":
				values.total.hover_cost -= Math.trunc(values.total.hover_cost *0.3)
				break;
			case "忍びの技術":
				values.total.dash += Math.trunc(values.total.dash*0.15)
				break;
		}

//		//レアリティ色
//		DATA.part_cd.forEach(function(e,idx){
//			document.querySelectorAll("span."+e+" select.rarelity").forEach(function(node){
//				node.classList.remove("N","R","SR","UR");
//				node.classList.add(DATA.rarelity[values[e].rarelity]);
//			});
//		});



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


		values.extension.dash_time= ((values.total.bst - values.total.dash_cost)/values.total.dash_cost).toFixed(2);
		values.extension.recover_overheat=(values.total.bst/values.total.recover).toFixed(2);
		values.extension.hover_time=((values.total.bst -values.total.jump_cost - values.total.dash_cost)
		   / values.total.hover_cost).toFixed(2);
		values.extension.jump_time=((values.total.bst -values.total.jump_cost - values.total.dash_cost)
		   / values.total.jump_cost).toFixed(2);

//		binder.refresh();
	}

	onloadfunc=function(){
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

			//var children = clone.querySelectorAll("[bind\\:text]");

			var bindedNodes = clone.querySelectorAll("*");
			bindedNodes.forEach((node)=>{
			//for(var j=0;j<children.length;j++){
				for(var i=0;i<node.attributes.length;i++){
					var name = node.attributes[i].name;
					if(name.indexOf("bind:")!==0)continue;
					node.setAttribute(name,part_cd + node.getAttribute(name));
				};
			});
			 clone.querySelector(".part").textContent = DATA.part_name[i];
			 if(i===7){
			 	clone.querySelector(".part").textContent = "サブ"
			 }
			 //clone.querySelector(".part_icon").classList.add(part_cd);
			 //clone.querySelector(".part_icon").title= 
			 	clone.querySelector(".part").textContent ;
	 
			var span = clone.querySelector("button.armor");
			span.addEventListener("click" ,(function(part_cd,part_idx){
				return function(e){
					var rarelity = Number(values[part_cd].rarelity);
					var cols;

					cols=[
						{data:"atk",label:"攻",class:"status",sort:-1}
						,{data:"def",label:"防",class:"status",sort:-1}
						,{data:"spd",label:"速",class:"status",sort:-1}
						,{data:"lp", label:"体",class:"status",sort:-1}
						,{data:"bst",label:"ブ",class:"status",sort:-1}
						];
					cols.splice(6,0,{class:"status",label:"回復",data:"recover",sort:-1});
					cols.splice(7,0,{class:"status",label:"走",data:"dash",sort:-1});
					cols.splice(8,0,{class:"status",label:"展開",data:"extend",sort:-1});
					cols.splice(9,0,{class:"status",label:"走費",data:"dash_cost"});
					cols.splice(10,0,{class:"status",label:"跳費",data:"jump_cost"});
					cols.splice(11,0,{class:"status",label:"浮費",data:"hover_cost"});
					cols.splice(11,0,{class:"status",label:"防費",data:"guard_cost"});
					cols.splice(11,0,{label:"近耐",data:"short_regist",sort:1,filter:1});
					cols.splice(11,0,{label:"遠耐",data:"long_regist",sort:1,filter:1});
					cols.splice(11,0,{label:"身長",data:"height",sort:1,filter:1});

						cols.push({data:"expassive",label:"固有パッシブスキル",filter:1,disp:function(e,parent){

								if(e.expassive===0){
									parent.style.display = "none";
								}
								var passive={};
								passive.skill = DATA.passives[e.expassive];
								passive.effect= 0;
								return getPassiveSpan(passive);
								//return getSkillName(DATA.passives[e.expassive],-1); 
						}}); 


					if(part_idx===0){
						cols.splice(10,0, {label:"名称",data:"name",filter:1
						,disp:function(e,node){
							node.classList.add(e.cd);
							return e.name;}});
					}else{

						cols.splice(10,0, {label:"名称",data:"name",filter:1
							,disp:function(e){ 
							if(e.parent === undefined){return e.name};
							return (
							(e.parent!=="-"?"-":"")
							+(e.set !==""?"+":"")
							+e.name);}}
							);
					}


							cols.splice(1,0,{data:"distance",label:"回収範囲",filter:1,disp:function(e,parent){
								if(e[this.data]===0){
									parent.classList.add("short");
								}else{
									parent.classList.add("long");
								}
								return DATA.distance[e[this.data]];
							}});
							cols.splice(2,0,{data:"category",label:"カテゴリ",filter:1,disp:function(e,p){

								if(e.category>=16){
									p.classList.add("bougu");
								}else if(e.distance===0){
									p.classList.add("short");
								}else{
									p.classList.add("long");
								}

								return DATA.category_short[e.category];}}); 
							cols.push({data:"active",label:"アクティブスキル",filter:1,disp:function(e,node){
								if(e.active===0){
									node.style.display = "none";
								}
								node.classList.add("icon");
									node.classList.add("active");
								return getSkillName(DATA.actives[e.active],e.active_effect);
							}}); 
									
							cols.push({label:"リキャスト",data:"recast",disp:SubLayout.guarge,sort:-1});
							cols.push({label:"リロード",data:"reload",disp:SubLayout.guarge,sort:-1});
							cols.push({label:"射程",data:"range",disp:SubLayout.guarge_range,sort:-1});

							cols.push({label:"弾速",data:"bullet_spd",sort:1});
							cols.push({label:"弾数",data:"bullet_num",sort:1});
							cols.push({data:"flying",label:"飛行",filter:1,disp:function(e,parent){
									if(e.flying) parent.classList.add("enable");
									return DATA.flying[e.flying]}});
							cols.push({data:"passive",label:"パッシブスキル",filter:1,disp:function(e,node){

									if(e.passive===0){
										node.style.display = "none";
									}
									node.classList.add("icon");
									node.classList.add("passive");
									return getSkillName(DATA.passives[e.passive],e.passive_effect); }}); 

						cols.push({label:"備考",data:"biko"});
						cols.splice(0,0,{data:"rarelity",filter:1,label:"レアリティ"
							,disp:function(e,parent){
								parent.classList.add(DATA.rarelity[e[this.data]]);
								return DATA.rarelity[e[this.data]];
							}});
						cols.unshift({data:"class",label:"分類",filter:1
							,disp:function(e,node,data){
								node.classList.add(DATA.class_shinki[data]);
								node.classList.add("class");
								return DATA.class[data];}});
						cols.unshift({data:"part",label:"部位",filter:1
							,disp:function(e){return DATA.part_name[e.part]}});
					subselector.rowhtml = SubLayout.arr[part_idx];
					if(part_idx===0){
						//神姫の場合
						subselector.filter={};
						var datalist = [];
						DATA.shinkis.forEach(function(e2){
							var data={};
							cols.forEach(function(e){
								data[e.data]=e2[e.data];
							});
							DATA.category_short.forEach(function(e,idx){
								if(idx===0)return;
								data["cat"+idx]=e2.apts[idx];
							});
							data.cd = e2.cd;
							datalist.push(data);
						});
						subselector.source= datalist;
						DATA.category_short.forEach(function(e,idx){
							if(idx===0)return;
							cols.push({label:e,data:"cat"+idx,class:"cat",sort:-1})
						});
					}else{
						subselector.filter={part:[part_idx],rarelity:[rarelity]};
						subselector.source= DATA.armors;
					}
					subselector.sort=[];
					subselector.cols=cols;
					subselector.open(function(e){
						if(!e){ return; }
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
						//binder.refresh();
						main.reCalc();
					});
					e.preventDefault();
					return false;
				}
			})(part_cd,part_idx));

			target.parentNode.replaceChild(clone,target);
		}

		//param
		var nodes= document.querySelectorAll("span.param");
		var param= document.getElementById("template_param");
		//DATA.param_cd.forEach(function(e,idx){
		//	if(idx>=5)return false;
		//	var span = document.createElement("span");
		//	span.classList.add("status",e);
		//	span.setAttribute("bind:","."+e);
		//	param.appendChild(span);
		//});
		nodes.forEach(function(node){
			var newnode = param.cloneNode(true);
			var bindName = node.getAttribute("bind:");

			var bindedNodes = newnode.querySelectorAll("*");
			bindedNodes.forEach((node)=>{
				for(var i=0;i<node.attributes.length;i++){
					var name = node.attributes[i].name;
					if(name.indexOf("bind:")!==0)continue;
					node.setAttribute(name,bindName+ node.getAttribute(name));
				};
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
			if(org.getAttribute("bind:") !== null){
				rare2.setAttribute("bind:",org.getAttribute("bind:"));
			}
			org.parentNode.replaceChild(rare2,org);
		});

		//lvコンボ
		var sel = document.querySelector("span.shinki select.lv ");
		sel.childNodes[3].innerText = "100";
		sel.childNodes[3].value= "100";

		var sel = document.querySelector("span.weapon select.lv ");
		var option = document.createElement("OPTION");
		option.textContent = "30";
		option.value= 30;
		sel.childNodes[1].after(option);

		sel = document.querySelector("span.weapon2 select.lv ");
		option = document.createElement("OPTION");
		option.textContent = "30";
		option.value= 30;
		sel.childNodes[1].after(option);



		//パッシブによるステータス変化計算
		var correctStatus=function(target,eff){
		   values.bonus[target] += values.subtotal[target] * eff;
		}
		DATA.passives[ 1].func=function(effect){ correctStatus("atk",(1+effect)*0.01); }
		DATA.passives[ 2].func=function(effect){ correctStatus("def",(1+effect)*0.01); }
		DATA.passives[ 3].func=function(effect){ correctStatus("spd",(1+effect)*0.01); }
		DATA.passives[ 4].func=function(effect){ correctStatus("lp",(1+effect)*0.01); }
		DATA.passives[ 5].func=function(effect){ correctStatus("bst",(1+effect)*0.01); }
		DATA.passives[ 6].func=function(effect){
			var a =Math.trunc(effect*0.5)
			correctStatus("atk",(1+a)*0.01); 
			correctStatus("def",(1+a)*0.01);
			correctStatus("spd",a*0.01); 
			correctStatus("lp",(1+a)*0.01);
			correctStatus("bst",(1+a)*0.01);
		}
		DATA.passives[20].func=function(effect){ correctStatus("dash",(1+effect)*0.01); }
		DATA.passives[28].func=function(effect){ correctStatus("dash_cost",-effect*0.01); }
		DATA.passives[29].func=function(effect){ correctStatus("hover_cost",-(effect*0.01)); }


		document.querySelectorAll("select").forEach(function(node){
			node.addEventListener("change",function(){
				var node = this;
				const bind = binder.binds.find(function(elem){return elem.node===node});
				if(!bind)return;
				bind.feedBack(node.value);
				   
				main.reCalc(); });
		});

		var select = document.querySelector("#individual");
		DATA.individuals.forEach(function(e,idx){
			var option = document.createElement("OPTION");
			option.textContent = e.name;
			option.value= idx;
			select.appendChild(option);
		});

		select.addEventListener("change",(e)=>{
			var ct = e.currentTarget;
			ct.className="individual_" + ct.value;
		});
		


		var dt=new Date(DATA.date);
		values.version="code2021/10/16\n"
			+ "data"+ dt.getFullYear() +"/"+("0"+(dt.getMonth()+1)).slice(-2)
			+"/" +("0"+dt.getDate()).slice(-2);

		//初期値セット
		if(location.search===""){
			param ="0AQAAAAEAAQEAAQEAAQEAAQEAAQEAAQEAAQ==";
		}else{
			param = location.search.substring(1);
		}
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
		
		//パッシブサブ画面
		var span = document.querySelector("#add_extra_passive");
		span.addEventListener("click",(e)=>{
			subselector.rowhtml="";

			subselector.cols=[
				{label:"パッシブスキル",data:"name",filter:1,disp:function(e){
				return e.name + (e.effect>0?"["+DATA.effect[e.effect]+"]":"");
				}}
				,{label:"効果量",data:"effect",filter:1,disp:function(e){return DATA.effect[e.effect];}}
			];

			subselector.filter={effect:[1]};
			var source=[];
			DATA.passives.forEach(function(e,idx){
				if(idx===0)return;
				if(e.effect_type===0){
					var data  ={name:e.name,cd:idx,effect:0};
					source.push(data);
				}else{
					for(var i=1;i<5;i++){
						var data  ={name:e.name,cd:idx,effect:i};
						source.push(data);
					}
				}
			});
			
			subselector.source = source;
			subselector.open((res)=>{
				if(!res){ return; }
				values.extra_passives.push({cd:res.cd,skill:DATA.passives[res.cd],effect:res.effect});
				
				main.reCalc();
			});
		 });

//動的スタイルシート生成
var newStyle = document.createElement('style');newStyle.type = "text/css";
document.getElementsByTagName('head').item(0).appendChild(newStyle);
var stylesheet = document.styleSheets.item(document.styleSheets.length-1);
DATA.shinkis.forEach((e)=>{
	//	if(e.cd=='s0' || e.cd=='s1' || e.cd=='s2'){
	//		stylesheet.insertRule(` 
	//			.${e.cd}::before{
	//	content:'';
	//			background-image:url(icon/${e.cd}.svg);
	//		}
	//		`, stylesheet.cssRules.length);
	//		}else{
			stylesheet.insertRule(` 
				.part_icon.${e.cd}{
				content:'';
				background-image:url(icon/${e.cd}.png);
			}
			`, stylesheet.cssRules.length);

			stylesheet.insertRule(` 
				.shinki .${e.cd}::before
				,.class.${e.cd}::before{
				content:'';
				background-image:url(icon/${e.cd}.png);
			}
			`, stylesheet.cssRules.length);
	//		}

	stylesheet.insertRule(` 
		.class.${e.cd}{
		color:${e.color};
	}
	`, stylesheet.cssRules.length);
});

DATA.part_cd.forEach(function(e,i){

	stylesheet.insertRule(` 
		span.part_icon.${e}{
			background-image:url(icon/${e}.svg);
			background-size:100%;
		}
	`, stylesheet.cssRules.length);

	stylesheet.insertRule(` 
		span.armor.${e}{
			background-image:url(icon/${e}_back.svg);
			background-position-x:${i*10}px;
		}
	`, stylesheet.cssRules.length);
	//stylesheet.insertRule(` 
	//	.part.${e}::before{
	//		content:url(icon/${e}.svg);
	//	}
	//`, stylesheet.cssRules.length);
});

//パラメータ説明追加
DATA.param_cd.forEach((e,idx)=>{
	document.querySelectorAll(".status."+e).forEach((ee)=>{
		ee.title=DATA.param_name[idx] + "\n" + DATA.param_title[idx];
	})
	

});
//	var v = new Visualizer();
//	v.main();


document.querySelector("#shinki div.skill").appendChild(
	document.querySelector("span.addpassive")
);

	binder.init(values);
//	binder.refresh();
	main.reCalc();

	}


}

window.lvmax=function(){
	if(values.shinki.lv !== 100){
		values.shinki.lv=100;
		values.head.lv=60;
		values.body.lv=60;
		values.arm.lv=60;
		values.leg.lv=60;
		values.rear.lv=60;
		values.weapon.lv=60;
		values.weapon2.lv=60;
	}else{
		values.shinki.lv=1;
		values.head.lv=1;
		values.body.lv=1;
		values.arm.lv=1;
		values.leg.lv=1;
		values.rear.lv=1;
		values.weapon.lv=1;
		values.weapon2.lv=1;
	}
	main.reCalc();
}

var main = new Main();

main.onloadfunc();
