
import {Vec3,Vec4} from "./vector.js"
import Slider from "./slider.js";
import Util from "./util.js";
import Img from "./img.js";

//カラーセレクタHDR

var img = new Img(128,128,Img.FORMAT_UINT8);


let col = new Vec3();
let col_org = new Vec3();

//色相画像作成
var img_h={};
var data = img.data;
var idx=0;
for(var yi=0;yi<128;yi++){
	col[0]=yi/128;
	col[1]=1;
	col[2]=1;
	Util.hsv2rgb(col,col);
	col[0]=(col[0]*255)|0;
	col[1]=(col[1]*255)|0;
	col[2]=(col[2]*255)|0;
	idx = img.getIndex(0,yi)<<2;

	data[idx]=col[0];
	data[idx+1]=col[1];
	data[idx+2]=col[2];
	data[idx+3]=255;
	
}
var h_img_dataurl= null;

img.toBlob((blob)=>{
//	URL.revokeObjectURL(h_img_dataurl);
	h_img_dataurl = URL.createObjectURL(blob);
	var nodes = document.querySelectorAll(".cphdr_h_img");
	for(var i=0;i<nodes.length;i++){
		nodes[i].src = h_img_dataurl;
	}
},"image/png",1.0,0,0,1,128);


export default class ColorSelector{

	constructor(){

		this.div=null;
		this.sv_img=null;
		this.h_img=null;
		this.h_cursor=null;
		this.s_cursor=null;
		this.v_cursor=null;
		this.R_txt=null;
		this.G_txt=null;
		this.B_txt=null;
		this.A_txt=null;
		this.Vi_txt=null;

		this.changeCallback=null;
		this.drag_from=0;
		this.rgb=new Vec3();
		this.hsv=new Vec3();
		this.parentInput=null;//カラーピッカーが表示されている親コントロール
		this.hsv = new Vec3();

	var html = `
				<div class="div_main">
					<div class="sv_parent">
						<img class="cphdr_sv_img" draggable="false">
						<div class="cphdr_s_cursor cursor"></div>
						<div class="cphdr_v_cursor cursor"></div>
					</div>
					<div class="sv_parent">
						<img class="cphdr_h_img" draggable="false">
						<div class="cphdr_h_cursor cursor" ></div>
					</div>
				</div>
				<div class="color_status">
					<ul>
					<li class="red">R<input type="text" class="cphdr_R_txt" value="0.8" /></li>
					<li class="green">G<input type="text" class="cphdr_G_txt" value="0.2"/></li>
					<li class="blue">B<input type="text" class="cphdr_B_txt" value="0.2"/></li>
					</ul>
				</div>
				<div>
					明るさ<input class="slider cphdr_Vi_txt" min="-10" max="10" value="0" step="0.01"/>
				</div>
				A<input class="slider cphdr_A_txt" max="1" value="1" step="0.001"/>
		`;
		this.div=document.createElement("div");
		this.div.classList.add("colorselector");

		this.div.insertAdjacentHTML('beforeend',html);

		this.sv_img = this.div.querySelector(".cphdr_sv_img");
		this.h_img = this.div.querySelector(".cphdr_h_img");
		this.h_cursor = this.div.querySelector(".cphdr_h_cursor");
		this.s_cursor = this.div.querySelector(".cphdr_s_cursor");
		this.v_cursor = this.div.querySelector(".cphdr_v_cursor");
		this.R_txt= this.div.querySelector(".cphdr_R_txt");
		this.G_txt= this.div.querySelector(".cphdr_G_txt");
		this.B_txt= this.div.querySelector(".cphdr_B_txt");
		this.Vi_txt= this.div.querySelector(".cphdr_Vi_txt");
		this.A_txt= this.div.querySelector(".cphdr_A_txt");
		Slider.init(this.div);

		this.redrawSv(0);

		Vec3.set(col,1,1,1);
		this.setRGB(col);

	this.div.querySelector(".color_status").addEventListener("change",()=>{
		this.changeColor();
	if(this.changeCallback){
		this.changeCallback();
	}
	}
	);
	this.A_txt.addEventListener("change",()=>{
		this.changeColor();
	if(this.changeCallback){
		this.changeCallback();
	}
		}
	);
	this.Vi_txt.addEventListener("change",()=>{
		var vi = Math.pow(2,Number(this.Vi_txt.value));
		Util.hsv2rgb(col,this.hsv);
		this.R_txt.value=(col[0]*vi).toFixed(3);
		this.G_txt.value=(col[1]*vi).toFixed(3);
		this.B_txt.value=(col[2]*vi).toFixed(3);
	if(this.changeCallback){
		this.changeCallback();
	}

	});
	this.sv_img.parentNode.addEventListener("pointerdown",(e)=>{
		this.drag_from=1;
		this.down(e);
	});
	
	this.h_img.parentNode.addEventListener("pointerdown",(e)=>{
		this.drag_from=2;
		this.down(e);
	});

	window.addEventListener("pointermove",this.down);
	}

	redrawSv(){
		var idx=0;


		col[0]=this.hsv[0];
		col[1]=1;
		col[2]=1;
		Util.hsv2rgb(col_org,col);
		var data=img.data;
		var alpha = Number(this.A_txt.value)*255;
		for(var yi=0;yi<img.height;yi++){
			var yf = yi/img.height;
			col[0]=(1-col_org[0])*yf+col_org[0];
			col[1]=(1-col_org[1])*yf+col_org[1];
			col[2]=(1-col_org[2])*yf+col_org[2];
			Vec3.mul(col,col,255/img.width);
			for(var xi=0;xi<img.width;xi++){
				data[idx]= col[0]*xi;
				data[idx+1]=col[1]*xi;
				data[idx+2]=col[2]*xi;
				data[idx+3]=alpha;
				
				idx+=4;
			}
		}

		img.toBlob((blob)=>{
			URL.revokeObjectURL(this.sv_img.src);
			this.sv_img.src =  URL.createObjectURL(blob);
		},"image/png");
	}
setColor(c){
	this.R_txt.value = c[0];
	this.G_txt.value = c[1];
	this.B_txt.value = c[2];
	this.A_txt.value = c[3];

	this.changeColor();

}
changeColor(){
	var rgb = this.rgb;
	var hsv = this.hsv;
	rgb[0]=Number(this.R_txt.value);
	rgb[1]=Number(this.G_txt.value);
	rgb[2]=Number(this.B_txt.value);

	var max = Math.max(Math.max(rgb[0],Math.max(rgb[1],rgb[2])),1);
	Vec3.mul(col,rgb,1/max);

	Util.rgb2hsv(hsv,col);

	this.redrawSv();
	this.setCursor(hsv);

	this.Vi_txt.value=Math.log2(max);
}


down=(e)=>{
	if(!(e.buttons&1)){
		this.drag_from=0;
	}
	var hsv = this.hsv;
	var rgb = this.rgb;
	switch(this.drag_from){
	case 1:
		var rect = this.sv_img.getBoundingClientRect();
		hsv[2]=e.clientX- rect.left;
		hsv[1]=e.clientY- rect.top;
		hsv[2]/=img.width;
		hsv[1]/=img.height;
		hsv[1]=1-hsv[1];
		hsv[1]=Math.min(Math.max(hsv[1],0),1);
		hsv[2]=Math.min(Math.max(hsv[2],0),1);
		break;
	case 2:
		var rect = this.h_img.getBoundingClientRect();
		hsv[0]=e.clientY- rect.top;
		hsv[0]=hsv[0]/this.h_img.height;
		hsv[0]=Math.min(Math.max(hsv[0],0),1);

		this.redrawSv();
		break;
	default:
		return;
	}

	this.setCursor(hsv);
	var vi = Math.pow(2,Number(this.Vi_txt.value));

	Util.hsv2rgb(rgb,hsv);

	this.R_txt.value = (rgb[0]*vi).toFixed(3);
	this.G_txt.value = (rgb[1]*vi).toFixed(3);
	this.B_txt.value = (rgb[2]*vi).toFixed(3);

	if(this.changeCallback){
		this.changeCallback();
	}
}
setRGB(col){
	Vec3.copy(this.rgb,col);
	Util.rgb2hsv(this.hsv,this.rgb);
	this.setCursor(this.hsv);
}

setCursor(hsv){
	this.h_cursor.style.top=hsv[0]*127-1+"px";
	this.s_cursor.style.top=(1-hsv[1])*127-1+"px";
	this.v_cursor.style.left=hsv[2]*127-1+"px";
}

};
//window.addEventListener("load",colorselector.init,false);
