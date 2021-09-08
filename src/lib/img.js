"use strict" 

import Util from "./util.js"
import {Vec4} from "./vector.js"
import OpenEXR from "./openexr.js";
	let ctx,canvas,ctx_imagedata;
	canvas =  document.createElement('canvas');
	canvas.width=1;
	canvas.height=1;
	ctx =  canvas.getContext('2d');
	ctx_imagedata=ctx.createImageData(canvas.width,canvas.height);
	let  FORMAT_FLOAT32 = 0;
	let  FORMAT_UINT8 = 1;
	let  ret_data= new Vec4();


	let add = (dst,src,idx,idx2,idx3,r) => {
		//var a2 = src[idx2+3];
		//var a3 = src[idx3+3];
		dst[idx+0]+=(src[idx2+0] +src[idx3+0])*r;
		dst[idx+1]+=(src[idx2+1] +src[idx3+1])*r;
		dst[idx+2]+=(src[idx2+2] +src[idx3+2])*r;
		dst[idx+3]+=(src[idx2+3] +src[idx3+3])*r;
	}
	let mul = (dst,idx) => {
		var a = dst[idx+3];
		if(a===0 || a===1){
			return;
		}
		a=1/a;
		dst[idx+0]*=a;
		dst[idx+1]*=a;
		dst[idx+2]*=a;
	};
export default class Img{
	//イメージ
	constructor(x,y,format){
		if(!x){
			x=0;
			y=0;
		}
		this.width=x;
		this.height=y;
		this.data=null;
		this.format=format;
		if(this.width){
			switch(this.format){
			case FORMAT_UINT8:
				this.imagedata=ctx.createImageData(this.width,this.height);
				this.data=this.imagedata.data;//new Uint8Array(this.width*this.height<<2);
				this.rgba=new Uint32Array(this.data.buffer);
				break;
			default:
				this.data=new Float32Array(this.width*this.height<<2);
				break;
			}
		}
	};

	static FORMAT_FLOAT32 = 0;
	static FORMAT_UINT8 = 1;


	scan(f,x,y,w,h){
		var data = this.data;
		if(x === undefined){
			x =0;
			y=0;
			w=this.width;
			h = this.height;
		}
		for(var yi=0;yi<h;yi++){
			var idx = this.getIndex(x,yi+y)<<2;
			for(var xi=0;xi<w;xi++){
				f(data,idx,x+xi,y+yi);
				//data[idx ] =  ret_data[0];
				//data[idx+1] = ret_data[1];
				//data[idx+2] = ret_data[2];
				//data[idx+3] = ret_data[3];
				idx+=4;
			}
		}
	}

	static copy(dst,dst_x,dst_y,src,src_x,src_y,src_w,src_h,f){
		var dst_data = dst.data;
		var dst_width = dst.width;
		var src_data = src.data;
		var src_width = src.width;

		if(src_w + src_x>src.width){
			src_w = src.width- src_x;
		}
		if(src_h + src_y>src.height){
			src_h = src.height- src_y;
		}

		var left = dst_x;
		var right = dst_x + src_w ;
		var top = dst_y;
		var bottom = dst_y + src_h ;

		if(src_x<0){
			left-=src_x;
			src_x=0;
		}
		if(src_y<0){
			top-=src_y;
			src_y=0;
		}

		if(left<0){
			src_x -=left;
			left=0;
		}
		if(top<0){
			src_y -=top;
			top=0;
		}
		if(right>dst.width){
			right =dst.width;
		}
		if(bottom>dst.height){
			bottom =dst.height;
		}

		if(dst.type===FORMAT_UINT8 && src.type===FORMAT_UINT8){
			for(var yi=top;yi<bottom;yi++){
				var dst_idx= dst.getIndex(left,yi);
				var src_idx= src.getIndex(src_x,src_y+yi-top);
				for(var xi=left;xi<right;xi++){
					dst.rgba[dst_idx] = src.rgba[src_idx];
					dst_idx++;
					src_idx++;
				}
			}
		}else{
			for(var yi=top;yi<bottom;yi++){
				var dst_idx= dst.getIndex(left,yi);
				var src_idx= src.getIndex(src_x,src_y+yi-top);
				dst_idx<<=2;
				src_idx<<=2;
				for(var xi=left;xi<right;xi++){
					dst_data[dst_idx+0] = src_data[src_idx+0];
					dst_data[dst_idx+1] = src_data[src_idx+1];
					dst_data[dst_idx+2] = src_data[src_idx+2];
					dst_data[dst_idx+3] = src_data[src_idx+3];
					dst_idx+=4;
					src_idx+=4;
				}
			}
		}
	}
	copy(dst,dst_x,dst_y,src,src_x,src_y,src_w,src_h){
		Img.copy(this,dst,dst_x,dst_y,src,src_x,src_y,src_w,src_h);
	}

	getIndex(x,y){
		return y * this.width + x;
	}
	getIndexLoop(x,y){
		var xx = x % this.width ;
		var yy = y % this.height ;
		if(xx<0)xx+=this.width;
		if(yy<0)yy+=this.height;
		return yy * this.width + xx;
	}

	createExr(compression){
		var img = this;
		var obj={};
		obj.width =img.width;
		obj.height=img.height;
		
		obj.attributes=[];
		obj.attributes["compression"]=compression;
		obj.attributes["dataWindow"]={xMin:0,yMin:0,xMax:img.width-1,yMax:img.height-1};
		obj.attributes["displayWindow"]={xMin:0,yMin:0,xMax:img.width-1,yMax:img.height-1};
		obj.attributes["lineOrder"]=0;
		obj.attributes["pixelAspectRatio"]=1;
		obj.attributes["screenWindowCenter"]=[0,0];
		obj.attributes["screenWindowWidth"]=1;
//		obj.attributes["chromaticities"]=[0.1,0.1,0.1,0.2,0.3,0.4,0.5,0.6];

		var size = img.width*img.height;
		var channels=[];
		for(var i=0;i<4;i++){
			var channel={};
			channel.data=new Float32Array(size);
			channel.pixel_type=1;
			channel.pLiner=0;
			channel.reserved=0;
			channel.xSampling=1;
			channel.ySampling=1;
			channels.push(channel);
		}
		channels[0].name="A";
		channels[1].name="B";
		channels[2].name="G";
		channels[3].name="R";

		var img_data = img.data;
		for(var i=0;i<size;i++){
			var idx=i<<2;
			channels[0].data[i]=img_data[idx+3];
			channels[1].data[i]=img_data[idx+2];
			channels[2].data[i]=img_data[idx+1];
			channels[3].data[i]=img_data[idx+0];
		}
		obj.attributes.channels=channels;


		return OpenEXR.toArrayBuffer(obj);
	}

	static loadImg(url,format,func){
		if(typeof url !== "string"){
			Util.loadFile(url,function(url){
				Img.loadImg(url,format,func);

			});
			return null;
		}
		var image = new Image();
		image.src=url;
		var img=new Img();
		img.name=url;
		img.format=format;
		image.onload = function(e){
			img.width=image.width;
			img.height=image.height;

			if(canvas.width<img.width || canvas.height<img.height){
				//開いた画像がキャンバスより大きい場合は広げる
				if(canvas.width<img.width){
					canvas.width=img.width;
				}
				if(canvas.height<img.height){
					canvas.height=img.height;
				}
				ctx_imagedata=ctx.createImageData(canvas.width,canvas.height);
			}



			//ピクセルデータ取得
			ctx.clearRect(0,0,canvas.width,canvas.height);
			ctx.drawImage(image,0,0);
			var data=ctx.getImageData(0,0,img.width,img.height).data;

			switch(img.format){
				case 1:
					img.data=new Uint8Array(img.width*img.height*4);
					img.rgba=new Uint32Array(img.data.buffer);
					for(var di=0;di<img.width*img.height*4;di++){
						img.data[di]=data[di] ;
					}
					break;
				default:
					img.data=new Float32Array(img.width*img.height*4);
					var r = 1.0/255.0;
					for(var di=0;di<img.width*img.height*4;di++){
						img.data[di]=data[di] * r;
					}
			}

			if(func){
				func(img);
			}
		}
		return img;
	}

	static loadExr(url,format,func){
		var img = new Img();
		var f=function(buffer){
			var obj={};
			OpenEXR.fromArrayBuffer(obj,buffer);

			img.width =obj.width;
			img.height=obj.height;
			img.data=new Float32Array(img.width*img.height*4);
			
			//RGBAチャンネルの情報をdataにセットする
			var channels=obj.attributes.channels;
			var data = img.data;
			var cindex={};
			cindex["R"]=-1;
			cindex["G"]=-1;
			cindex["B"]=-1;
			cindex["A"]=-1;
			for(var i=0;i<channels.length;i++){
				cindex[channels[i].name]=i;
			}
			var r = cindex["R"];
			var g = cindex["G"];
			var b = cindex["B"];
			var size = img.width*img.height*4;
			for(var i=0;i<size;i+=4){
				data[i]=channels[r].data[i>>2];
				data[i+1]=channels[g].data[i>>2];
				data[i+2]=channels[b].data[i>>2];
			}
			var a = cindex["A"];
			if(a>=0){
				for(var i=0;i<size;i+=4){
					data[i+3]=channels[a].data[i>>2];
				}
			}else{
				for(var i=0;i<size;i+=4){
					data[i+3]=1;
				}
			}
			if(func){
				func(img);
			}
		};
		if(typeof url === "string"){
			Util.loadBinary(url,function(buffer){
				f(buffer);
			});
		}else{	

			if(url.byteLength){
				f(url);
			}else{
				Util.loadBinary(url,function(buffer){
					f(buffer);
				});
			}
		}
		
		return img;
	}
	fill(r,g,b,a,x,y,w,h){
		var data = this.data;
		if(x === undefined){
			var size = data.length;
			for(var i=0;i<size;i+=4){
				data[idx+0]=r;
				data[idx+1]=g;
				data[idx+2]=b;
				data[idx+3]=a;
			}
		}else{
			var img_width = this.width;
			var bottom = Math.min(this.height, y+h);
			var right = Math.min(img_width,x+w);
			for(var yi=y;yi<bottom;yi++){
				var idx = yi * img_width + x << 2;
				var max = yi * img_width + right << 2;
				for(;idx<max;idx+=4){
					data[idx+0]=r;
					data[idx+1]=g;
					data[idx+2]=b;
					data[idx+3]=a;
				}
			}
		}
	}
	clear(x,y,w,h){
		//透明でクリア
		var data = this.data;
		if(x === undefined){
			var size = data.length;
			data.fill(0);
		}else{
			var img_width = this.width;
			var bottom = Math.min(this.height, y+h);
			var right = Math.min(img_width,x+w);
			for(var yi=y;yi<bottom;yi++){
				var idx = yi * img_width + x << 2;
				var max = yi * img_width + right << 2;
				data.fill(0,idx,max);
//				for(;idx<max;idx+=4){
//					data[idx+0]=1;
//					data[idx+1]=1;
//					data[idx+2]=1;
//					data[idx+3]=0;
//				}
			}
		}
	}
	toCanvas(x,y,w,h){
		if(x === undefined){
			x=0;
			y=0;
			w=this.width;
			h=this.height;
		}
		canvas.width=w;
		canvas.height=h;
		
		ctx.putImageData(this.toImageData(),0,0,x,y,w,h);
		return canvas;
	}
	toDataURL= function(p1,p2,x,y,w,h){
		return this.toCanvas(x,y,w,h).toDataURL(p1,p2);
		
	}
	toBlob= function(f,p1,p2,x,y,w,h){
		return this.toCanvas(x,y,w,h).toBlob(f,p1,p2);
		
	}

	toBMP= function(){
		var height=this.height;
		var width=this.width;
		var l= height*(((width*4+1)>>>2)<<2)*2+14+40;
		var dv = new DataStream(l);
		//0x0000　(2)	bfType	ファイルタイプ　通常は'BM'
		dv.setTextBuf("BM",0);
		//0x0002　(4)	bfSize	ファイルサイズ (byte)
		dv.setUint32(l,true);
		//0x0006　(2)	bfReserved1	予約領域　常に 0
		dv.setUint16(0,true);
		//0x0008　(2)	bfReserved2	予約領域　常に 0
		dv.setUint16(0,true);
		//0x000A　(4)	bfOffBits	ファイル先頭から画像データまでのオフセット (byte)
		dv.setUint32(12+42,true);

//ヘッダサイズ
		dv.setUint32(40,true);
		//画像幅
		dv.setUint32(this.width,true);
		//画像高さ
		dv.setUint32(this.height,true);
		//プレーン数
		dv.setUint16(1,true);
		//1画素あたり
		dv.setUint16(32,true);
		//圧縮
		dv.setUint32(0,true);
		//画像サイズ
		dv.setUint32(this.data.length,true);
		//横解像度
		dv.setUint32(0,true);
		//縦解像度
		dv.setUint32(0,true);
		//パレット
		dv.setUint32(0,true);
		//重要パレット
		dv.setUint32(0,true);


		var data= this.data;
		switch(this.format){
		case 1:
			for(var yi=height;yi--;){
				var idx = yi*width<<2;
				for(var xi=0;xi<width;xi++){
					dv.setUint8(data[idx+2],true);
					dv.setUint8(data[idx+1],true);
					dv.setUint8(data[idx+0],true);
					dv.setUint8(data[idx+3],true);
					idx+=4;
				}
			}
			break;
		default:
			break;
		}
		//var blob = new Blob([dv.byteBuffer], {type: "application/octet-stream"});
		//return  window.URL.createObjectURL(blob);
		return dv.byteBuffer;
		//var b64= btoa(String.fromCharCode.apply(null,dv.byteBuffer));
		//return "data:image/bmp;base64,"+b64;
	}
	toImageData(){
		var ctx_imagedata;
		var data = this.data;
		switch(this.format){
		case FORMAT_UINT8:
			ctx_imagedata =this.imagedata;
			//for(var yi=0;yi<this.height;yi++){
			//	for(var xi=0;xi<this.width;xi++){
			//		var idx=yi*this.width + xi<<2;
			//		for(var ii=0;ii<4;ii++){
			//			ctx_imagedata.data[idx+ii]=data[idx+ii];
			//		}
			//	}
			//}
			break;
		default:
			ctx_imagedata=ctx.createImageData(this.width,this.height);
			for(var yi=0;yi<this.height;yi++){
				for(var xi=0;xi<this.width;xi++){
					var idx=yi*this.width + xi<<2;
					for(var ii=0;ii<4;ii++){
						ctx_imagedata.data[idx+ii]=data[idx+ii]*255.0;
					}
				}
			}
			break;
		}
		return ctx_imagedata;
	}

	gauss(d,size,left,top,w,h){
		if(!size)return;
		var src = this;
		d = Math.max(1,d);
		var MAX = size|0;

		if(buffer_img.data.length< src.data.length){
			buffer_img = new Img(src.width,src.height);
		}
		buffer_img.width=src.width;
		buffer_img.height=src.height;

		var dst= buffer_img;
		var right = left+w-1;
		var bottom= top+h-1;
		

		//係数作成
		var weight = new Array(MAX);
		var t = 0.0;
		for(var i = 0; i < weight.length; i++){
			var r =   i;
			var we = Math.exp(- (r * r) / (2*d*d));
			weight[i] = we;
			if(i > 0){we *= 2.0;}
			t += we;
		}
		for(i = 0; i < weight.length; i++){
			weight[i] /= t;
		}


		var height = src.height;
		var width = src.width;
		var data = src.data;
		var dstdata = dst.data;

		//横ぼかし
		var top2 = Math.max(0,top-size);
		var bottom2 = Math.min(src.height,bottom+size+1);
		for(var y=top2;y<bottom2;y++){
			var yidx= y * width;

			for(var idx=yidx+left<<2,idxmax=yidx+(right+1)<<2;idx<idxmax;idx+=4){
				var a = data[idx+3];
				data[idx+0]*=a;
				data[idx+1]*=a;
				data[idx+2]*=a;
			}
			var x = left;
			var idx = yidx + left <<2;
			var max = yidx + right+1 <<2;
			var r = weight[0];


			var maxidx = y*width+(width-1) <<2;
			var minidx = y*width<<2;

			for(;idx<max;idx+=4){
				dstdata[idx+0]=data[idx+0]*r;
				dstdata[idx+1]=data[idx+1]*r;
				dstdata[idx+2]=data[idx+2]*r;
				dstdata[idx+3]=data[idx+3]*r;
			}
			max = Math.min(MAX,right+1);
			for(;x<max;x++){
				var idx= yidx + x <<2;
				var idx2= idx;
				var idx3= idx;
				for(var i=1;i<MAX;i++){
					idx2 = Math.max(idx2-4,minidx);
					idx3 = Math.min(idx3+4,maxidx);
					var r =weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			}

			max = Math.min(width-MAX,right+1);
			for(;x<max;x++){
				var idx= yidx + x <<2;
				var idx2 = idx;
				var idx3 = idx;
				for(var i=1;i<MAX;i++){
					idx2-=4;
					idx3+=4;
					var r =weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			}
			var max = Math.min(right+1,width);
			for(;x<max;x++){
				var idx= yidx + x <<2;
				var idx2 = idx;
				var idx3 = idx;
				for(var i=1;i<MAX;i++){
					idx2 = Math.max(idx2-4,minidx);
					idx3 = Math.min(idx3+4,maxidx);
					var r =weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			}

		}

		//縦ぼかし
		data = dst.data;
		dstdata = src.data;

		for(var x=left;x<right+1;x++){



			var width4= width<<2;
			var idx = top*width + x<<2;
			var max = (bottom+1)*width+ x<<2;
			var r = weight[0];
			for(;idx<max;idx+=width*4){
				dstdata[idx+0]=data[idx+0]*r;
				dstdata[idx+1]=data[idx+1]*r;
				dstdata[idx+2]=data[idx+2]*r;
				dstdata[idx+3]=data[idx+3]*r;
			}
		
			y=top
			max = Math.min(MAX,bottom+1);
			var maxidx = (height-1)* width + x <<2;
			var minidx = x <<2;
			for(;y<max;y++){
				idx= y * width + x <<2;
				idx2 = idx ;
				idx3 = idx ;

				for(var i=1;i<MAX;i++){
					idx2 = Math.max(idx2-width4,minidx);
					idx3 = Math.min(idx3+width4,maxidx);
					var r = weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			 }
			max = Math.min(height-MAX,bottom+1);
			for(;y<max;y++){
				idx= y * width + x <<2;
				var idx2 = idx ;
				var idx3 = idx ;

				var aaa = width<<2;
				for(var i=1;i<MAX;i++){
					idx2 -= width4;
					idx3 += width4;
					var r = weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			}

			max = Math.min(height,bottom+1);
			for(;y<max;y++){
				idx= y * width + x <<2;
				idx2 = idx ;
				idx3 = idx ;

				for(var i=1;i<MAX;i++){
					idx2 = Math.max(idx2-width4,minidx);
					idx3 = Math.min(idx3+width4,maxidx);
					//var idx2= Math.max(y-i,0) *width+ x  <<2;
					//var idx3= Math.min(y+i,height-1)*width+x <<2;
					var r = weight[i];
					dstdata[idx+0]+=(data[idx2+0] +data[idx3+0])*r;
					dstdata[idx+1]+=(data[idx2+1] +data[idx3+1])*r;
					dstdata[idx+2]+=(data[idx2+2] +data[idx3+2])*r;
					dstdata[idx+3]+=(data[idx2+3] +data[idx3+3])*r;
				}
			}


			for(var idx=top*width+x<<2,idxmax=(bottom+1)*width+x<<2;idx<idxmax;idx+=4*width){
				var a = dstdata[idx+3];
				if(a>0 && a<1){
					a=1/a;
					dstdata[idx+0]*=a;
					dstdata[idx+1]*=a;
					dstdata[idx+2]*=a;
				}
			}
		}
	}
}
let buffer_img= new Img(1024,1024);
