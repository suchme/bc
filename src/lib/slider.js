import Util from "./util.js"

var drag_target=null;

//ドラッグ時処理
var drag=function(evt){
	if(!evt){ evt = window.event; }
	if(!(evt.buttons&1)){
		drag_target=null;
	}
	if(!drag_target){
		return;
	}
	var slider = drag_target ;

	var tumami = drag_target.tumami;
	var mizo= slider.mizo;
	var left = evt.clientX;
	var rect = mizo.getBoundingClientRect();
	var width = tumami.offsetWidth / 2 * 0;
	var value = Math.round(left - rect.left- width);
	value/=mizo.clientWidth;
	value=Math.max(Math.min(value,1),0);
	value=value * (slider.max-slider.min) + slider.min;
	if(slider.step){
		value = Math.ceil(value/slider.step)*slider.step;
	}

	slider.input.value = value;
	slider.setTumami();
	Util.fireEvent(slider.input,"change")
	return false;
};


var createDiv=function(slider){


	return div;
}

var replace= function(node,slider){
	//対象のノードオブジェクトをスライダに置き換える

	node.parentNode.replaceChild(slider.node,node);
	//node.setAttribute("class","js-text");
	node.classList.remove("slider");
	node.setAttribute("number","");
	node.setAttribute("type","text");
	slider.node.replaceChild(node,slider.input);
	slider.input = node;
	node.addEventListener("input",slider.changeValue);
	//input.id=node.id;
	
	slider.min = Number(node.getAttribute("min"));
	slider.max= Number(node.getAttribute("max"));
	if(slider.min===slider.max){
		slider.max = slider.min+1;
	}
	slider.step= Number(node.getAttribute("step"));

	slider.setTumami();
};


export default class Slider{
	//スライダーコントロール
	constructor(){
		this.min=0;
		this.max=1;
		this.step=0.1;
	

		//テキストエリア+スライダー
		var div=document.createElement("span");
		div.setAttribute("class","js-slider");
		div.insertAdjacentHTML('beforeend',
			`<input type="text"  class="js-text">
				<div class="js-slider3">
					<span class="js-slider2" ></span>
					<input type="button"  class="tumami">
				</div> `
		);

		this.input=div.querySelector('.js-text');
		//溝
		this.mizo=div.querySelector('.js-slider3');
		//クリック時ツマミ移動
		this.mizo.addEventListener("pointerdown",(evt)=>{
			drag_target=this;
			drag(evt);
			drag_target=null;
		});

		var tumami =div.querySelector('.tumami');
		this.tumami = tumami;
		
		//ドラッグ開始
		tumami.addEventListener("pointerdown", (evt)=>{
			drag_target=this;
			evt.stopPropagation();
		});

		//デフォルト処理無効
		tumami.addEventListener("touchmove",function(evt){ evt.preventDefault();});


		//値直接変更時にツマミ反映
		this.node = div;
		this.setTumami();
	}

	setTumami=()=>{
		var slider = this;
		var tumami = this.tumami;
		var mizo = this.mizo;
		var value = Number(this.input.value);

		value = (value - slider.min)/(slider.max-slider.min)
		var max=mizo.offsetWidth;
		var w = tumami.offsetWidth;
		if(w==0)w=15;
		if(max==0)max=100;
		tumami.style.left = (value*max - w/2) + 'px';
	};
	changeValue=()=>{
		this.setTumami();
	}


	static init=function(dom){
		if(!dom){
			dom = document;
		}

		var e = dom.querySelectorAll('input.slider');
		for(var i=0; i<e.length; i+=1) {
			var node=e[i];
			var slider = new Slider();
			replace(node,slider);
			
		}
	}
}
window.addEventListener("pointermove",drag);
window.addEventListener("load",function(e){Slider.init();});
