"use strict"
window.globalParam = {};
var myIE = document.all; //IEflg
var ua = window.navigator.userAgent.toLowerCase();
if(ua.indexOf("windows" !== -1)){
	globalParam.windows=1;
}


	var loadingCount =0
		,imagedatacanvas
		,imagedatacontext
		
		,fps=30
		,spf=0
		,nextsleep=0
		,fpserror=0
		,fpserrordelta=0
		,mainfunc
		
		,SCREEN_W
		,SCREEN_H
	;
	
var i=0
	,keymap=new Array(256)
;
	keymap[37]=i++;
	keymap[38]=i++;
	keymap[39]=i++;
	keymap[40]=i++;
	keymap[' '.charCodeAt(0)]=i++;
	keymap['X'.charCodeAt(0)]=i++;
	keymap['C'.charCodeAt(0)]=i++;
	keymap['V'.charCodeAt(0)]=i++;
	
	keymap['A'.charCodeAt(0)]=i++;
	keymap['W'.charCodeAt(0)]=i++;
	keymap['D'.charCodeAt(0)]=i++;
	keymap['S'.charCodeAt(0)]=i++;
	keymap['F'.charCodeAt(0)]=i++;
	keymap['G'.charCodeAt(0)]=i++;
	keymap['H'.charCodeAt(0)]=i++;
	keymap['J'.charCodeAt(0)]=i++;

	var virtualPad = null;
	var virtualPadP = null;
	var virtualBtn = null;
	
export default class Util{
	static getLoadingCount(){
		return loadingCount;
	}
	static ctx=null;
	static canvas=null;
	static canvasgl=null;
	static cursorX=0;
	static cursorY=0;
	static padX =0;
	static padY =0;
	static wheelDelta=0;
	static pressOn=0;
	static pressCount=0;
	static pressOnRight=0;
	static pressCountRight=0;
	static oldcursorX=0;
	static oldcursorY=0;
	static screenscale=1;
	static tap=0;
	static keyflag=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	static keyflagOld=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	static keymap=keymap;
	static enablePad = 1;
	

	static createCanvas= function(width,height){
		var canvas= document.createElement("canvas")
		if(typeof G_vmlCanvasManager !== 'undefined'){
			canvas = G_vmlCanvasManager.initElement(canvas);
		}
		canvas.setAttribute('width',width)
		canvas.setAttribute('height',height)
		return canvas
	}
	static mainloop(){
		var dx,dy
		Util.tap=0
	
		if(Util.pressOn){
			Util.pressCount = Util.pressCount + 1
			if(Util.pressCount==1){
	
				Util.oldcursorX2= Util.cursorX
				Util.oldcursorY2= Util.cursorY
				Util.oldcursorX = Util.cursorX
				Util.oldcursorY = Util.cursorY
			}
		}else if(Util.pressCount > 0){
			
			dx=Util.cursorX-Util.oldcursorX2
			dy=Util.cursorY-Util.oldcursorY2
			if(Util.pressCount<10 && dx*dx+dy*dy<16){
				Util.tap=1
			}
			Util.pressCount = -1
			
		}else Util.pressCount = 0
		if(Util.pressOnRight){
			Util.pressCountRight += 1
		}else{
			Util.pressCountRight =0
		}

		if(loadingCount ==0){
			mainfunc()
		}
		Util.oldcursorX = Util.cursorX
		Util.oldcursorY = Util.cursorY
		
		var i 
		for(i=Util.keyflag.length;i--;){
			Util.keyflagOld[i]=Util.keyflag[i]
		}

	}
	
	static loadImage(url,norepeat,func){
		var image = new Image();

		var flg=true
		if(globalParam.files)
		for (var i = 0, f; f = globalParam.files[i]; i++) {
			if(escape(f.name)==url){
				//ローカルファイルの場合
				var reader = new FileReader()
				
				reader.onload =  function(e){
					image.src=e.target.result;
				}
				reader.readAsDataURL(f);
				flg=false;
				break;
			}
		}
		if(flg){
			//リモートファイルの場合
			image.src = url
		}

		//ロードカウンタを増やす
		loadingCount++;
		image.onerror=function(){
			//エラーの場合減らす
			loadingCount--
		}
		console.log("load start",url);
		
		//読み込みが終わっていない場合はイベントリスナ登録
		image.addEventListener("load",function(e) {
			if(!image.pat){
				console.log("load end",image);
				//ロード処理(1回のみ)
				//ロードカウンタを減らす
				loadingCount--;
				if(norepeat){
					image.pat =Util.ctx.createPattern(image,"no-repeat")
				}else{
					image.pat =Util.ctx.createPattern(image,"repeat")
				}
				imagedatacontext.clearRect(0,0,imagedatacanvas.width,imagedatacanvas.height);
				imagedatacontext.drawImage(image,0,0)

				if(imagedatacontext.getImageData){
					image.imagedata = imagedatacontext.getImageData(0,0,image.width,image.height)
				}
			}

			if(func){
				//コールバック指定がある場合は行う
				func(image);
			}
		});
		
		return image
	}
	static loadText(url,callback){
		var flg=true
		var filename_ex = url.match("([^/]+?)([\?#;].*)?$")[1];
		if(globalParam.files){
			for (var i = 0, f; f = globalParam.files[i]; i++) {
				if(escape(f.name)== filename_ex){
					var reader = new FileReader()
					reader.onload = function(e){
						var buf=e.target.result
						if(callback){
							callback(buf);
						}
					}
					reader.readAsText(f)
					flg=false;
					break;
				}
			}
		}
		if(flg){

			var request = Util.createXMLHttpRequest()
			request.open("GET", url, true)
			request.onload = function(e){
				if(request.status == 200 || request.status ==304){
					var buf =request.responseText;
					if(callback){
						callback(buf);
					}
				}
				loadingCount--;
				console.log("loadtext end",loadingCount);
			}
			console.log("loadtext start",url);
			loadingCount++;
			request.send("")
		}
		return null;
	}

	static loadFile(file,callback){
		var reader=new FileReader();
		reader.onload = function(e){
			if(callback){
				callback(e.target.result);
			}
		}
		reader.readAsDataURL(file);
	}
	static loadBinary(url,_callback){
		if(typeof url !== "string"){
			Util.loadFile(url,function(url){
				Util.loadBinary(url,_callback);

			});
			return null;
		}
		var callback=_callback;
		var cfunc = function(buf){
			if(callback){
				callback(buf);
			}
			loadingCount--;
			console.log("loadbinary end",loadingCount);
		}

		console.log("loadbinary start");
		loadingCount++;

		var request = Util.createXMLHttpRequest()
		request.open("GET", url, true)
		request.responseType="arraybuffer";
		request.onload = function(e){
			cfunc(request.response);
		}
		request.send("")
		

	}

	static rgb(r,g,b){
		r = (0x100|r*255).toString(16)
		g = (0x100|g*255).toString(16)
		b = (0x100|b*255).toString(16)
		return "#" + r.slice(-2) + g.slice(-2) + b.slice(-2)
	}
static hex2rgb(rgb,hex){
	hex=hex+"000000";
	rgb[0] = parseInt(hex.slice(0,2),16)/255;
	rgb[1] = parseInt(hex.slice(2,4),16)/255;
	rgb[2] = parseInt(hex.slice(4,6),16)/255;
	return rgb;
}
static str2rgba(rgba,str){
	var sp = str.split(",");
	rgba[0]=Number(sp[0]);
	rgba[1]=Number(sp[1]);
	rgba[2]=Number(sp[2]);
	rgba[3]=Number(sp[3]);
	return rgba;
}
	static rgba(r,g,b,a){
		return 'rgba(' +r +','+ g +','+ b +','+ a+')'
	}
		
	static createXMLHttpRequest = function() {
	  if (window.XMLHttpRequest) {
	    return new XMLHttpRequest()
	  } else if (window.ActiveXObject) {
	    try {
	      return new ActiveXObject("Msxml2.XMLHTTP")
	    } catch (e) {
	      try {
	        return new ActiveXObject("Microsoft.XMLHTTP")
	      } catch (e2) {
	        return null
	      }
	    }
	  } else {
	    return null
	  }
	}

	static hsv2rgb(rgb,hsv){
		//hsvをrgbに変換
		var f;
		var i, p, q, t;
		var v = hsv[2];
		var h =hsv[0];
		var s =hsv[1];
		i = (h*6|0) % 6;
		f = h*6-(h*6|0);
		p = v * (1.0 - s );
		q = v * (1.0 - s  * f);
		t = v * (1.0 - s  * (1.0 - f));
		
		switch(i){
			case 0 : rgb[0] = v; rgb[1] = t; rgb[2] = p; break;
			case 1 : rgb[0] = q; rgb[1] = v; rgb[2] = p; break;
			case 2 : rgb[0] = p; rgb[1] = v; rgb[2] = t; break;
			case 3 : rgb[0] = p; rgb[1] = q; rgb[2] = v; break;
			case 4 : rgb[0] = t; rgb[1] = p; rgb[2] = v; break;
			case 5 : rgb[0] = v; rgb[1] = p; rgb[2] = q; break;
		}

		return rgb;
	}

	static rgb2hsv(hsv,rgb){
		//rgbをhsvに変換
		var max = Math.max(rgb[0], Math.max(rgb[1], rgb[2]));
		var min = Math.min(rgb[0], Math.min(rgb[1], rgb[2]));

		if(max == min){
			hsv[0] = 0;
		} else if(max == rgb[0]){
			hsv[0] = (1/6* (rgb[1] - rgb[2]) / (max - min) + 1);
		} else if(max == rgb[1]){
			hsv[0] = (1/6* (rgb[2] - rgb[0]) / (max - min)) + 2/6;
		} else if(max == rgb[2]){
			hsv[0] = (1/6* (rgb[0] - rgb[1]) / (max - min)) + 4/6;   
		}
		hsv[0]-=hsv[0]|0;

		if(max == 0){
			hsv[1] = 0;
		} else{
			hsv[1] = (max - min) / max;
		}

		hsv[2] = max;
		return hsv;
	}
	static init(canvas,canvasgl,_inputarea){
		Util.canvasgl =canvasgl;
		Util.canvas =canvas;
		if( !Util.canvas || !Util.canvas.getContext){
			return false
		}
			
		SCREEN_W = Util.canvas.getAttribute('width')
		SCREEN_H = Util.canvas.getAttribute('height')

		Util.ctx = Util.canvas.getContext('2d')
		Util.ctx.clearRect(0,0,SCREEN_W,SCREEN_H)

		imagedatacanvas =Util.createCanvas(1024,1024)
		imagedatacontext = imagedatacanvas.getContext('2d')
		
		var inputarea =_inputarea;

		if(inputarea){
			inputarea.onselect = function(){return false;}
			inputarea.onselectstart = function(){return false;}
		}
	
	var setCursor = function(x,y){
		var target = Util.canvasgl;
		var scalex=target.width/target.clientWidth;
		var scaley=target.height/target.clientHeight;
		Util.cursorX = (x-target.offsetLeft)*scalex;
		Util.cursorY = (y-target.offsetTop)*scaley;

	}
	var tap = function(){
	}
	var tapout = function(){
		Util.padX=0;
		Util.padY=0;
		virtualPad.style.display="none";
	}


	var rela = function(e){
		if(e.currentTarget.getBoundingClientRect){
			var rect = e.currentTarget.getBoundingClientRect();
			e.relativeX = e.clientX - rect.left;
			e.relativeY = e.clientY - rect.top;
		}
	}
	var relo = function(e,t){
		e.pageX = t.pageX;
		e.pageY = t.pageY;
		e.layerX= t.layerX;
		e.layerY= t.layerY;
		e.clientX = t.clientX;
		e.clientY = t.clientY;
	}
		Util.mouseMove = function(elem,func){
			if(!elem)return;
			if (navigator.userAgent.match(/iPhone/i)
			||navigator.userAgent.match(/iPod/i) 
			||navigator.userAgent.match(/Android/i) ){
				elem.addEventListener("touchmove",function(e) {
					relo(e,e.touches[0]);
					rela(e);
					func(e);

				});
			}else{
				elem.addEventListener("mousemove",function(e) {
					e = e || window.event;
					rela(e);
					func(e);

				},false);
			}
		}
		Util.mouseDown = function(elem,func){
			if(!elem)return;

			if (navigator.userAgent.match(/iPhone/i)
			||navigator.userAgent.match(/iPod/i) 
			||navigator.userAgent.match(/Android/i) ){
				elem.addEventListener("touchstart",function(e) {
					relo(e,e.touches[0]);
					rela(e);
					e.button=0;
					func(e);

				});
			}else{
				elem.addEventListener("mousedown",function(e) {
					e = e || window.event;
					rela(e);
					func(e);
				});
			}
		}

		Util.mouseUp = function(elem,func){
			if (navigator.userAgent.match(/iPhone/i)
			||navigator.userAgent.match(/iPod/i) 
			||navigator.userAgent.match(/Android/i) ){
				elem.addEventListener("touchend",function(e) {
					relo(e,e.changedTouches[0]);
					rela(e);
					e.button=0;
					func(e);

				});
			}else{
				elem.addEventListener("mouseup",function(e) {
					e = e || window.event;
					rela(e);
					func(e);
				});
			}
		}
		Util.mouseMove(inputarea, function(e){
			setCursor(e.pageX,e.pageY);

			if(virtualPad.style.display === "block"){
			var target = e.currentTarget;
				Util.padX= (e.relativeX - virtualPad.offsetLeft)/virtualPad.offsetWidth *2-1;
				Util.padY= (e.relativeY - virtualPad.offsetTop)/virtualPad.offsetHeight *2-1;
				var l = Util.padX * Util.padX + Util.padY * Util.padY ;
				if(l > 1.0){
					l = Math.sqrt(l);
					Util.padX = Util.padX/l;
					Util.padY = Util.padY/l;
					
					virtualPad.style.left = e.relativeX - Util.padX * virtualPad.offsetWidth*0.5 + "px";
					virtualPad.style.top= e.relativeY - Util.padY * virtualPad.offsetHeight*0.5 + "px";

				}

				setPad();
				}
		});
		Util.mouseDown(inputarea, function(e){
			setCursor(e.pageX,e.pageY);
			switch(e.button){
			case 0:
				Util.pressOn = 1;
				break
			case 2:
				Util.pressOnRight=1;
				break
			}
		});
		Util.mouseUp(window, function(e){
			setCursor(e.pageX,e.pageY);
			switch(e.button){
			case 0:
				Util.pressOn = 0;

				tapout();
				break
			case 2:
				Util.pressOnRight=0;
				break
			}
			Util.keyflag[4]=0;
		});

		//バーチャルパッド
		var setPad = function(){

			virtualPadP.style.left = (Util.padX+1.0)*50 +"%";
			virtualPadP.style.top= (Util.padY+1.0)*50+"%";
		}
		var varea = document.getElementById("vertualPadArea");
		Util.mouseDown(varea,function(e){
			switch(e.button){
			case 0:
				virtualPad.style.display="block";
				Util.padX=0;
				Util.padY=0;
				virtualPad.style.left = e.relativeX+"px";
				virtualPad.style.top= e.relativeY+ "px";
				setPad();
				e.stopPropagation();
				break
			}
		});

		if (navigator.userAgent.match(/iPhone/i)
		||navigator.userAgent.match(/iPod/i) 
		||navigator.userAgent.match(/Android/i) ){

		}else{
			var wheelfunc = function(e){
				e = e || window.event;
				if(e.wheelDelta){
					Util.wheelDelta = e.wheelDelta/120;
					if(window.opera) Util.wheelDelta = -Util.wheelDelta;
				}else if(e.detail){
					Util.wheelDelta = -e.detail/3;
				}

				if (e.preventDefault)
					e.preventDefault();
				//e.returnValue = false
			}
			if(window.addEventListener) window.addEventListener('DOMMouseScroll',wheelfunc,{passive: true});
			else if(document.attachEvent) document.attachEvent('onmousewheel',wheelfunc);
			else if(inputarea) inputarea.onmousewheel = wheelfunc;
				

			document.body.onkeydown = function(e){
				e = e ||  window.event;
				var code = e.keyCode
				if(Util.keymap[code]!=null){
					Util.keyflag[Util.keymap[code]]=1
				}
				if(code == 13){
					Util.canvasgl.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
					if(window.parent.screen.width/Util.canvasgl.width> window.parent.screen.height/Util.canvasgl.height){
						canvasgl.style.width="auto";
						canvasgl.style.height="100%";
					}else{
						canvasgl.style.width="100%";
						canvasgl.style.height="auto";
					}
				}
			}
			document.body.onkeyup = function(e){
				e = e ||  window.event;
				var code = e.keyCode
				if(Util.keymap[code]!=null){
					Util.keyflag[Util.keymap[code]]=0
				}
			}
			document.body.onblur = function(e){
				e = e ||  window.event;
				var code = e.keyCode;
				for(var i=0;i<Util.keyflag.length;i++){
					Util.keyflag[i]=0
				}
			}
		}

		virtualPad = document.createElement("div");
		virtualPad.style.backgroundColor="#ff0000";
		virtualPad.style.opacity="0.3";
		virtualPad.style.width="256px";
		virtualPad.style.height="256px";
		virtualPad.style.position="absolute";
		virtualPad.style.left = "10px";
		virtualPad.style.top= "10px";
		virtualPad.style.borderRadius="50%";
		virtualPad.style.zIndex="10";
		virtualPad.style.display="none";
		virtualPad.style.marginLeft="-128px";
		virtualPad.style.marginTop="-128px";
		if(inputarea) inputarea.appendChild(virtualPad);

		virtualPadP = document.createElement("div");
		virtualPadP.style.backgroundColor="#00ff00";
		virtualPadP.style.width="32px";
		virtualPadP.style.height="32px";
		virtualPadP.style.position="absolute";
		virtualPadP.style.borderRadius="50%";
		virtualPadP.style.marginLeft="-16px";
		virtualPadP.style.marginTop="-16px";
		virtualPad.appendChild(virtualPadP);

		virtualBtn = document.createElement("div");
		virtualBtn.style.backgroundColor="#0000ff";
		virtualBtn.style.opacity="0.25";
		virtualBtn.style.width="256px";
		virtualBtn.style.height="256px";
		virtualBtn.style.position="absolute";
		virtualBtn.style.right= "10%";
		virtualBtn.style.bottom= "20%";
		virtualBtn.style.borderRadius="50%";
		virtualBtn.style.zIndex="100";
		virtualBtn.style.display="none";
		virtualBtn.innerHTML="jump";
		if(inputarea)inputarea.appendChild(virtualBtn);

		if(Util.enableVirtualBtn){
			virtualBtn.style.display="inline";
		}

		if (navigator.userAgent.match(/iPhone/i)
		||navigator.userAgent.match(/iPod/i) 
		||navigator.userAgent.match(/Android/i) ){
			virtualBtn.addEventListener("touchstart",function(e) {
				e = e ||  window.event;
				Util.keyflag[4]=1;
			},false);
			window.addEventListener("touchend",function(e) {
				e = e ||  window.event;
				Util.keyflag[4]=0;
			},false);
			virtualBtn.addEventListener("touchmove",function(e) {
			},false);
			virtualBtn.addEventListener("touchend",function(e) {
				Util.keyflag[4]=0;
			},false);
		}else{
			virtualBtn.onmousedown = function(e){
				e = e ||  window.event;
				Util.keyflag[4]=1;
				//e.stopPropagation();
			}
			virtualBtn.onmouseup= function(e){
				e = e ||  window.event;
				Util.keyflag[4]=0;
			}
		}
	}
	static setFps(argfps,mf){
		fps=argfps|0;
		spf=(1000/fps)|0;
		fpserror = 0;
		fpserrordelta= 1000%fps;
		nextsleep=performance.now();//Date.now();
		mainfunc=mf;
	
		Util.pressCount = 0

	}
	
	 static fpsman= function(){
		var nowTime = performance.now();//Date.now();
		var dt = nextsleep - nowTime;

//		if(0<dt>>1){
//			setTimeout(fpsman,dt>>1);
//			return;
//		}
		
		//端数処理
		fpserror +=fpserrordelta;
		if(dt>spf)dt=spf
		if(dt<-spf)dt=-spf
		if(fpserror>=fps){
			//時間誤差が1msを超えたら次回1ms増やす
			fpserror-=fps
			dt+=1
		}
		
		nextsleep = nowTime + spf + dt;
		Util.mainloop()
		nowTime = performance.now();//Date.now();
		dt=nextsleep-nowTime;
		if(dt<=0)dt=1;
		setTimeout(Util.fpsman,dt);

	}
	static drawText(target,x,y,text,img,sizex,sizey){
	
		var dx = x
		var dy = y
		var i,max
		var sx,sy
		for(i=0,max=text.length;i<max;i++){
			sx = text.charCodeAt(i)-32
			sy = (sx>>4) * sizex
			sx =(sx & 0xf) * sizey
			target.drawImage(img,sx,sy,sizex,sizey,dx,dy,sizex,sizey)
			dx = dx + sizex
		}
	}
	static convertURLcode (str){
		var imax=str.length
		,jmax
		,i,j
		,charcode
		,percent='%'.charCodeAt(0)
		,decode=""
		,sub
		for(i=0;i<imax;i++){
			charcode=str.charCodeAt(i)
			if(charcode==percent){
				i++
				charcode = parseInt(str.slice(i,i+2),16)
				if((charcode&0xF0)==0xE0){
					jmax=2
					charcode=charcode&0xf
				}else if((charcode&0xE0)==0xC0){
					jmax=1
					charcode=charcode&0x1f
				}else {
					jmax=0
				}
				i+=1
				for(j=0;j<jmax;j++){
					i+=2
					charcode<<=6
					charcode |= parseInt(str.slice(i,i+2),16)&0x3f
					i+=1
				}
			}
			decode+=String.fromCharCode(charcode)
		}
		return decode
	}
	
	static getCurrent = function(){
		var current="/";
		if (document.currentScript) {
			current=document.currentScript.src;
		} else {
			var scripts = document.getElementsByTagName('script'),
			script = scripts[scripts.length-1];
			if (script.src) {
				current=script.src;
			}
		}
		current = current.substring(0,current.lastIndexOf('/')+1);
		return current;
	};
	static loadJs= function(path,func){
		////var script = document.createElement('script');
		////script.type="module"
		////script.src = path;
		//loadingCount++;

		//var _func = func;

		//import(path)
		//.then( function(){
		//	loadingCount--;
		//	if(_func){
		//		_func();
		//	}
		//})
		//.catch(function(){
		//	loadingCount--;
		//})
		////document.head.appendChild(script);
	}

	static fireEvent(elem,eventname,evt){
		if(document.all){
			elem.fireEvent("on"+eventname)
		}else{
			if(!evt){
				evt = document.createEvent("Event");
			}
			evt.initEvent(eventname,true,true);
			elem.dispatchEvent(evt)
		}
	}
	static setText(elem,text){
		elem.innerText=text;
		//elem.textContent=text;
		//elem.innerHTML=text;
		
	}
	static getText(elem){
		return (elem.textContent)?elem.textContent:elem.innerText
	}
	static getLoadingCount(){
		return loadingCount;
	}
	static stringToUtf8(str){
		var utf8str = unescape(encodeURIComponent(str));
		var utf8array=new Uint8Array(utf8str.length);
		for(var i=0;i<utf8str.length;i++){
			utf8array[i]=utf8str.charCodeAt(i);
		}
		return utf8array;
	}
	static utf8ToString(array){
		var str ="";
		for(var i=0;i<array.length;i++){
			str +=String.fromCharCode(array[i]);
		}
		return  decodeURIComponent(escape(str));	
	}

}

