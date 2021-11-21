"use strict"
import SH from "../lib/spherical_harmonics/sh.js";
import Rastgl from "../lib/rastgl.js"
import Ono3d from "../lib/ono3d.js"
import OnoPhy from "../lib/onophy/onophy.js"
import Bsp from "../lib/bsp.js"
import Delaunay from "../lib/delaunay.js"
import Collider from "../lib/collider/collider.js"
import AssetManager from "./assetmanager.js";
import O3o from "./o3o/o3o.js";
import Util from "../lib/util.js"
import Camera from "./camera.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../lib/vector.js"
import Obj from "./obj.js"
import ObjMan from "./objman.js"
import Scene from "./scene.js"

var ono3d;

export default class Engine{
	constructor(){
		this.camera = new Camera();
		this.scenes=[];
	}

	init(parentnode,WIDTH,HEIGHT){
		this.WIDTH = WIDTH;
		this.HEIGHT =HEIGHT;

		var canvas =document.createElement("canvas");
		canvas.width=WIDTH;
		canvas.height=HEIGHT;
		parentnode.appendChild(canvas);
		var canvasgl = document.getElementById("maincanvas");
		if(!canvasgl){
			canvasgl =document.createElement("canvas");
			canvasgl.width=WIDTH;
			canvasgl.height=HEIGHT;
			parentnode.appendChild(canvasgl);
		}else{
			canvasgl.width=WIDTH;
			canvasgl.height=HEIGHT;
			this.WIDTH=canvasgl.width;
			this.HEIGHT=canvasgl.height;
			WIDTH=this.WIDTH;
			HEIGHT=this.HEIGHT;
		}
		var ctx=canvas.getContext("2d");
		gl = canvasgl.getContext('webgl') || canvasgl.getContext('experimental-webgl');

		Util.enableVirtualPad=true;
		Util.init(canvas,canvasgl,parentnode);

		if(gl){
			globalParam.enableGL=true;
		}else{
			globalParam.enableGL=false;
		}
		globalParam.gl=gl;


		if(globalParam.enableGL){
			Rastgl.init(gl);
			canvas.style.width="0px";
			canvasgl.style.display="inline";
			//Ono3d.setDrawMethod(3);
		}else{
			canvasgl.style.display="none";
			canvas.style.display="inline";
		}
		ono3d = new Ono3d()
		this.ono3d = ono3d;


		bufTexture=Ono3d.createTexture(1024,1024);
		gl.bindTexture(gl.TEXTURE_2D, bufTexture.glTexture);
		this.bufTexture=bufTexture;

		tex512 = Ono3d.createTexture(512,512);
		averageTexture = Ono3d.createTexture(512,512);

		onoPhy = new OnoPhy();
		this.onoPhy = onoPhy;
		
		Rastgl.ono3d = ono3d;

		inittime=Date.now();

		span=document.getElementById("cons");

		


		sigmaShader=Ono3d.loadShader("./lib/spherical_harmonics/sigma.shader");
		shadow_gauss_shader=Ono3d.loadShader("./engine/gauss_shadow.shader");
		Engine.basecolorShader=Ono3d.loadShader("./lib/shader/basecolor.shader");

		for(var i=0;i<9;i++){
			shShader.push(Ono3d.loadShader("./lib/spherical_harmonics/sh"+i+".shader"));
		}

		O3o.setOno3d(ono3d)
		ono3d.init(canvas,ctx);
		ono3d.rendercanvas=canvas;
	}

	calcEnvironment(){
		var ono3d = this.ono3d;
		var engine = this;
		this.calcLightMatrix();

		//環境マップ
		ono3d.environments[0].envTexture = ono3d.createEnv(null,0,0,0,(x,y,w,h)=>{engine.drawSub(x,y,w,h)});

		var size =32;
		Engine.createSHcoeff(0,0,0,size,(x,y,w,h)=>{engine.drawSub(x,y,w,h)});
		var gl = Rastgl.gl;
		var u8 = new Uint8Array(9*4);
		gl.readPixels(0, 0, 9, 1, gl.RGBA, gl.UNSIGNED_BYTE, u8);
		var ratio = 1/(255*(size*size*0.25)*Math.PI*4);
		var shcoef=[];
		var d = new Vec4();
		for(var j=0;j<9;j++){
			d[0] = u8[(j)*4+0];
			d[1] = u8[(j)*4+1];
			d[2] = u8[(j)*4+2];
			d[3] = u8[(j)*4+3];
			var e = [0,0,0];//new Vec3();
			Ono3d.unpackFloat(e,d);
			e[0]=e[0]*ratio;
			e[1]=e[1]*ratio;
			e[2]=e[2]*ratio;
			shcoef.push(e);
		}
		//拡散用の係数に変換
		SH.mulA(shcoef);


		//ライトプローブ生成
		var points=[];
		var shcoefs=[];
		var MAX=1000;

		//外側に最大の枠を作っておく
		for(var i=0;i<8;i++){
			var p=new Vec3();
			Vec3.set(p,((i&1)*2-1)*MAX,(((i&2)>>1)*2-1)*MAX,(((i&4)>>2)*2-1)*MAX);
			points.push(p);
		}
		for(var i=0;i<8;i++){
			shcoefs.push(shcoef);
		}
		var lightProbe = Engine.createLightProbe(points,shcoefs);
		ono3d.environments[0].lightProbe = lightProbe;

	}

	drawFunc(){
		var HEIGHT = this.HEIGHT;
		var WIDTH = this.WIDTH;
		drawFlg=false;
		framecount++;

		this.ono3d.clear();

		performance.mark("drawStart");

		performance.mark("drawGeometryStart");
		for(var si=0;si<this.scenes.length;si++){
			this.scenes[si].draw();
		}
		performance.mark("drawGeometryEnd");

		performance.mark("drawRasteriseStart");

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);

		this.calcMatrix();
		this.drawSub(0,0,this.WIDTH,this.HEIGHT);
		//if(ono3d.envbufTexture.glTexture){
		//Ono3d.drawCopy(ono3d.envbufTexture,0,0,1,1)
		//}
		


		//描画結果をバッファにコピー
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);

		//画面平均光度算出
		if(globalParam.autoExposure){
			//オート露光調整の場合は画面全体の輝度から算出
			Engine.calcExpose(bufTexture,(WIDTH-512)/2.0/1024,0 ,512/1024,HEIGHT/1024);
		}else{
			//マニュアル露光調整の場合は露光と最大値をセット
			Engine.setExpose(globalParam.exposure_level,globalParam.exposure_upper);
		}

		if(globalParam.exposure_bloom ){
			// ブルーム処理
			ono3d.setViewport(0,0,WIDTH,HEIGHT);
			Engine.bloom(bufTexture,globalParam.exposure_bloom);
			Ono3d.copyImage(bufTexture,0,0,0,0,WIDTH,HEIGHT);
		}


		//トーンマッピング
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		ono3d.setViewport(0,0,WIDTH,HEIGHT);
		Engine.toneMapping(bufTexture,WIDTH/1024,HEIGHT/1024);
		



		//gl.getParameter(gl.VIEWPORT);
		performance.mark("drawRasteriseEnd");
		for(var si=0;si<this.scenes.length;si++){
			this.scenes[si].hudDraw();
		}
		performance.mark("drawEnd");


	}
	mainloop(){

	drawFlg=true;
	if(drawFlg){
		this.drawFunc();
		//drawFlg=false;
	}
	var nowTime = performance.now()
	performance.mark("mainloopStart");
	
	var obj;

	pad[0] = Util.padX + (Util.keyflag[2] || Util.keyflag[10])-(Util.keyflag[0] || Util.keyflag[8]);
	pad[1] = Util.padY + (Util.keyflag[3] || Util.keyflag[11])-(Util.keyflag[1] || Util.keyflag[9]);
	var l = Vec2.scalar(pad);
	if(l>1){
		Vec2.norm(pad);
	}
	

	for(var si=0;si<this.scenes.length;si++){
		this.scenes[si].move();
	}

	if(globalParam.physics){
		performance.mark("physicsStart");

		for(var i=0;i<globalParam.step;i++){
			onoPhy.calc(1.0/globalParam.fps/globalParam.step);
		}
		globalParam.physics_=1;
		performance.mark("physicsEnd");

	}


	var nowTime = performance.now()



	performance.mark("mainloopEnd");

	var measures=["mainloop","physics","aabb","collision","impulse","draw","drawGeometry","drawRasterise"];
	for(var i=0;i<measures.length;i++){
		var name =measures[i];
		try{
			performance.measure( name, name +'Start', name+'End');
		}catch(e){
		}
	}

	mseccount += (performance.now() - nowTime);
	if(nowTime-oldTime > 1000){
		var mspf=0;
		var fps = framecount*1000/(nowTime-oldTime)
		var entr=function(name){
			try{
				var entr=performance.getEntriesByName(name);
				var res=0;
				for(var i=0;i<entr.length;i++){
					res+=entr[i].duration;
				}
				return (res/entr.length).toFixed(2);
				
			}catch(e){
				return -1;
			}
		}
		
		Engine.output_text = 
			span,fps.toFixed(2) + "fps " 
			+"\nmainloop " + entr("mainloop") +"ms"	
			+"\n Phyisics " + entr("physics") +"ms"
			+"\n  AABB " + entr("aabb")+"ms (Object " + onoPhy.collider.collisions.length + ")"
			+"\n  Collision " + entr("collision") + "ms (calc " + onoPhy.collider.collisionCount+ ")"
			+"\n  Impulse " + entr("impulse") +"ms (repetition " + onoPhy.repetition +")"
			+"\nDraw " + entr("draw") +"ms"
			+"\n geometry " + entr("drawGeometry") +"ms"
			+"\n rasterise " + entr("drawRasterise") +"ms" 
		;

		framecount = 0
		mseccount=0
		oldTime = nowTime
		performance.clearMeasures();
	}
}

	calcMatrix(){
		//カメラ情報からレンダリング用の行列作成
		var camera = this.camera;
		var rot=new Vec3();
		var scale =new Vec3();
		var m=new Mat43();
		Vec3.set(scale,1,1,1);
		Vec3.set(rot,camera.a[0],camera.a[1]+Math.PI,camera.a[2]);
		Mat43.fromLSE(camera.matrix,camera.p,scale,rot);
		Mat43.getInv(m,camera.matrix);
		Mat44.copyMat43(ono3d.viewMatrix,m);

		var persx = camera.aov;
		var persy = camera.aov * ono3d.viewport[3]/ono3d.viewport[2];
		ono3d.calcProjectionMatrix(camera.pvMatrix,persx*camera.znear,persy*camera.znear,camera.znear,camera.zfar);

		Mat44.dotMat43(camera.pvMatrix,camera.pvMatrix,m);
		ono3d.znear=camera.znear;
		ono3d.zfar=camera.zfar;
		ono3d.aov=camera.aov;

	}

	drawSub(x,y,w,h){
		//画面描画関数

		ono3d.rf=0;
		ono3d.lineWidth=1.0;
		ono3d.smoothing=globalParam.smoothing;

		ono3d.lightThreshold1=globalParam.lightThreshold1;
		ono3d.lightThreshold2=globalParam.lightThreshold2;

	//背景描画
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.depthMask(true);
		ono3d.setViewport(x,y,w,h);

		//this.calcMatrix();

		gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.depthMask(false);
		gl.disable(gl.BLEND);
		var skyTexture=this.skyTexture;
		if(skyTexture){
			if(skyTexture.glTexture){
				if(globalParam.stereomode==0){

					ono3d.drawCelestialSphere(skyTexture);
				}else{
					ono3d.calcProjectionMatrix(
						ono3d.projectionMatrix,camera.aov * camera.znear,camera.aov*HEIGHT/WIDTH*2 * camera.znear
					,camera.znear,camera.zfar);
					ono3d.setViewport(0,0,WIDTH/2,HEIGHT);
					ono3d.drawCelestialSphere(skyTexture);
					ono3d.setViewport(WIDTH/2,0,WIDTH/2,HEIGHT);
					ono3d.drawCelestialSphere(skyTexture);
					
				}
			}
		}

		ono3d.setViewport(x,y,w,h);
		//オブジェクト描画
		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);

		if(globalParam.shader===0){
			if(globalParam.cMaterial){
				var faces=ono3d.faces;
				var s=ono3d.faces_index;
				for(var fi=ono3d.faces_static_index;fi<s;fi++){
					faces[fi].material = customMaterial;
				}
			}
			ono3d.render(this.camera.p);
		}
		
		gl.finish();
	}



	start(){

		//urlからオプションデータ取得
		var url=location.search.substring(1,location.search.length)
		var args=url.split("&")

		for(var i=args.length;i--;){
			var arg=args[i].split("=")
			if(arg.length >1){
				if(!isNaN(arg[1]) && arg[1]!=""){
					if(arg[1].length>1 && arg[1].indexOf(0) =="0"){
						globalParam[arg[0]] = arg[1]
					}else{
						globalParam[arg[0]] = +arg[1]
					}
				}else{
					globalParam[arg[0]] = arg[1]
				}
			}
		}

		//デフォルト背景読み込み
		this.skyTexture =this.loadEnvTexture("./engine/back.png");

		if(this.userInit){
			//初期化処理が設定されていれば実行
			this.userInit();
		}

		Util.setFps(globalParam.fps,()=>{
			this.mainloop();
		});
		Util.fpsman();


		drawFlg=true;
		animationFunc();
	}

	loadEnvTexture(path){
		//環境マップ読み込み
		return AssetManager.texture(path,(image)=>{
			gl.disable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);


			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			gl.viewport(0,0,image.width,image.height);
			Ono3d.postEffect(image,0,0 ,1,1,this.ono3d.shaders["envset"]); 
			gl.bindTexture(gl.TEXTURE_2D, image.glTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			Ono3d.copyImage(image,0,0,0,0,image.width,image.height);

			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			
		});
	}



	calcLightMatrix(){
		var HEIGHT = this.HEIGHT;
		var WIDTH = this.WIDTH;
		// ライト行列計算 ------
		// パースシャドウマップを作るための行列を作る
		var poses = lightArea_poses;
		var camera = this.camera;
		var light = this.ono3d.environments[0].sun;


		var xup = new Vec3();
		var yup = new Vec3();
		var zup = new Vec3();
		var z_near=1;
		var z_far=100;
		var projection_matrix = new Mat44();
		var view_matrix = new Mat43();

		var cameraz=new Vec3();

		//ライト向きとカメラ向きからライトレンダリング向き決める
		Vec3.set(yup,-light.matrix[8],-light.matrix[9],-light.matrix[10]);
		Vec3.set(cameraz,camera.matrix[6],camera.matrix[7],camera.matrix[8]);

		Vec3.cross(xup,yup,cameraz);
		Vec3.norm(xup);
		Vec3.cross(zup,xup,yup);
		Vec3.norm(zup);


		var sin_r = Math.max(0.05,Math.abs(Vec3.dot(zup,cameraz)));
		z_far = Math.max(20,100 * sin_r-50);
//		z_near=1
		z_far= 3;

		if(sin_r<0.7){
			Vec3.cross(cameraz,cameraz,xup);
			Vec3.norm(cameraz);
			if(Vec3.dot(cameraz,zup)<0){
				Vec3.mul(cameraz,cameraz,-1);
			}
		}

		var offset=(z_near +  Math.sqrt(z_near*z_far))/sin_r;


		ono3d.calcPerspectiveMatrix
			(projection_matrix
			,-camera.aov * z_near
			,camera.aov * z_near
			,camera.aov * (HEIGHT/WIDTH) * z_near
			,-camera.aov * (HEIGHT/WIDTH) * z_near
			,z_near,z_far);
		Mat43.getInv(view_matrix,camera.matrix);
		Mat44.dotMat43(projection_matrix,projection_matrix,view_matrix);
		Mat44.getInv(projection_matrix,projection_matrix);

		var support= new Vec3();
		var result= new Vec3();

		//描画領域計算
		
		//視錐台の頂点を計算
		var v4 = Vec4.poolAlloc();
		for(var i=0;i<8;i++){
			Vec4.set(v4,(i&1)*2-1,((i>>1)&1)*2-1,((i>>2)&1)*2-1,1);
			if(v4[2]<0){
				Vec4.mul(v4,v4,z_near);
			}else{
				Vec4.mul(v4,v4,z_far);
			}
			
			Mat44.dotVec4(v4,projection_matrix,v4);
			Vec3.copy(poses[i],v4);
		}
		Vec4.poolFree(1);

		//視錐台を完全に含むシャドウ用視錐台を作る
		//poses[8] は視錐台よりライト方向にあるオブジェクトを含むためのダミー
		Vec3.madd(poses[8],camera.p,zup,-z_near);
		Vec3.madd(poses[8],poses[8],yup,20);
		var light_anchor_pos = new Vec3();
		Vec3.mul(light_anchor_pos,xup
			,(calcSupport(xup,poses)+calcSupport(xup,poses,1))*0.5);
		Vec3.madd(light_anchor_pos,light_anchor_pos,yup
			,(calcSupport(yup,poses)+calcSupport(yup,poses,1))*0.5);
		Vec3.madd(light_anchor_pos,light_anchor_pos,zup
			,calcSupport(zup,poses,1) +offset);

		//シャドウマップ用行列計算
		var view_matrix = light.viewmatrix;
		Mat44.set(view_matrix
			,xup[0], xup[1], xup[2] ,0
			,yup[0] ,yup[1] ,yup[2] ,0
			,zup[0] ,zup[1] ,zup[2] ,0
			,light_anchor_pos[0] ,light_anchor_pos[1] ,light_anchor_pos[2] ,1
		);
		Mat44.getInv(view_matrix,view_matrix);

		ono3d.calcPerspectiveMatrix(projection_matrix
			,calcSupportAngle(xup,poses,light_anchor_pos,0,zup)   * offset 
			,calcSupportAngle(xup,poses,light_anchor_pos,1,zup) * offset 
			,30//calcSupportAngle(yup,poses,light_anchor_pos,1) * offset 
			,-30//calcSupportAngle(yup,poses,light_anchor_pos)   * offset 
			,offset,(calcSupport(zup,poses,1)-calcSupport(zup,poses))+offset);

		projection_matrix[5]/= offset;
		projection_matrix[13]= projection_matrix[9];
		projection_matrix[9]=0;

		Mat44.dot(view_matrix,projection_matrix,view_matrix);

		Mat44.setInit(projection_matrix);
		projection_matrix[5]=0;
		projection_matrix[9]=-1;
		projection_matrix[6]=-1;
		projection_matrix[10]=0;
		Mat44.dot(view_matrix,projection_matrix,view_matrix);


	}
}

//カメラ位置計算
var calcSupport=function(axis,poses,reverse){
	var effic = 1;
	if(reverse){
		effic=-1;
	}
	var l = Vec3.dot(poses[0],axis)*effic;

	for(pi=1;pi<poses.length;pi++){
		var l2 = Vec3.dot(poses[pi],axis)*effic;
		if(l2<l){
			l=l2;
		}
	}

	return l*effic;
}
var calcSupportAngle =function(axis,poses,ref_point,reverse,zup){
	//posesが全て内包されるよう画角を求める
	var effic = 1;
	if(reverse){
		effic=-1;
	}
	var vec3 = new Vec3();
	var pi=0;

	Vec3.sub(vec3,poses[pi],ref_point);
	var l = Vec3.dot(vec3,axis)/-Vec3.dot(vec3,zup)*effic;

	for(pi=1;pi<poses.length;pi++){
		Vec3.sub(vec3,poses[pi],ref_point);
		var l2 = Vec3.dot(vec3,axis)/-Vec3.dot(vec3,zup)*effic;
		if(l2<l){
			l=l2;
		}
	}
	return l*effic;
}




	var shShader=[];
	var sigmaShader;
	var shadow_gauss_shader;

	var customMaterial;
	var ret = Engine;
	var gl;
	var onoPhy=null;
	var bdf;
	var bdfimage=null;
	var soundbuffer=null;
	ret.goClass=[];
	ret.go=[];

	var tex512;
	var env2Texture;
	var averageTexture;
	var bufTexture;


	
	ObjMan.Obj = Obj;

Engine.Scene =Scene;


var pad =new Vec2();
Engine.pad = pad;
Engine.probs = new Collider();

var averageTexture; //光量計算用


//hud描画用
var blit = function(tex,x,y,w,h,u,v,u2,v2){
		Ono3d.drawCopy(tex.glTexture,x,y,w*2,h*2
						,u/tex.width,(v+v2)/tex.height,u2/tex.width,-v2/tex.height);
}



	globalParam.outline_bold=0;
	globalParam.outline_color="000000";
	globalParam.lightColor1="808080";
	globalParam.lightColor2="808080";;
	globalParam.lightThreshold1=0.;
	globalParam.lightThreshold2=1.;
	globalParam.physics=1;
	globalParam.physics_=0;
	globalParam.smoothing=0;
	globalParam.stereomode=0;
	globalParam.stereoVolume=1;
	globalParam.step=1;
	globalParam.fps=30;
	globalParam.scene=0;
	globalParam.shadow=1;
	globalParam.model="./f1.o3o";
	globalParam.materialMode = false;
//カスタムマテリアル
	globalParam.baseColor= "ffffff";
	globalParam.metallic= 0;
	globalParam.metalColor= "ffffff";
	globalParam.specular= 0;
	globalParam.roughness= 0;
	globalParam.subRoughness= 0;
	globalParam.frenel = 0;
	globalParam.opacity= 1.0;
	globalParam.ior= 1.1;
	globalParam.cNormal= 1.0;
	globalParam.emi= 0.0;

	globalParam.debugMenu= 0;
	globalParam.shader= 0;

//カメラ露光
	globalParam.autoExposure=1;
	globalParam.exposure_level=0.18;
	globalParam.exposure_upper=1;
	globalParam.exposure_bloom=0.1;
	
	globalParam.source=0;
	globalParam.target=0;
	globalParam.reference=0;
	globalParam.actionAlpha=0;

	


var physicsTime;
var span;
var oldTime = 0;
var nowTime =0;
var drawgeometryTime=0;
var drawrasteriseTime=0;
var drawTime=0;
var mseccount=0;
var framecount=0;
var inittime=0;
var drawFlg=false;
var parentnode = (function (scripts) {
	return scripts[scripts.length - 1].parentNode;
}) (document.scripts || document.getElementsByTagName('script'));

var animationFunc = function(){
	window.requestAnimationFrame(animationFunc);
	drawFlg=true;
	//if(!drawFlg){
	//	//更新されていない場合スルー
	////	window.requestAnimationFrame(drawFunc);
	//	return;
	//}
	//drawFunc();
}




	


/** ブルーム画像を作成し、合成する **/
Engine.bloom = function(image,exposure_bloom){
	var shaders=ono3d.shaders;
	var addShader = shaders["add"];
	//var tex512 = tex512;

	var WIDTH = ono3d.viewport[2];
	var HEIGHT= ono3d.viewport[3];
	var emiSize=0.5;


	//光テクスチャをぼかす

	//レンダリング画像をコピー(まず1/2サイズにする)
	ono3d.setViewport(0,0,WIDTH*0.5,HEIGHT*0.5);
	Ono3d.postEffect(image,0,0,WIDTH/image.width,HEIGHT/image.height,shaders["half"]);
	Ono3d.copyImage(tex512,0,0,0,0,WIDTH*0.5,HEIGHT*0.5);

	gl.clearColor(0., 0., 0.,0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	var width=WIDTH*0.5; 
	var height=HEIGHT*0.5; 

	// 1/2 1/4 1/8...
	var ratio=0.5;
	ono3d.setViewport(0,0,width*ratio,height*ratio);
	Ono3d.postEffect(tex512,0,1-ratio*2,width/512*ratio*2,height/512*ratio*2,shaders["half"]);
	Ono3d.copyImage(tex512,0,0,0,0,512,512);
	ratio*=0.5;
	for(var i=0;i<3;i++){
		ono3d.setViewport(0,0,width*ratio,height*ratio);
		Ono3d.postEffect(tex512,0,1-ratio*4,width/512*ratio*2,height*ratio*2/512,shaders["half"]);
		Ono3d.copyImage(tex512,0,(1-ratio*2)*512,0,0,width*ratio,height*ratio);
		//ono3d.setViewport(0,0,size*0.5,size*0.5);
		//Ono3d.postEffect(transTexture,0,(1024-size*2)/bunbo,size/bunbo,size/bunbo,shaders["half"]);
		ratio*=0.5;
		//Ono3d.copyImage(transTexture,0,1024-size*2,0,0,size,size);
	}
	//ガウスぼかし
	ono3d.setViewport(0,0,256,512);
	Ono3d.gauss(256,512,100 ,tex512,0,0,0.5,1); 
	Ono3d.copyImage(tex512,0,0,0,0,256,512);

	//全サイズ足す
	ono3d.setViewport(0,0,512,512);
	Ono3d.postEffect(tex512,0,0,0.5,0.5,shaders["multiadd"]);
	Ono3d.copyImage(tex512,0,0,0,0,512,512);

	//画面に合成
	gl.bindFramebuffer(gl.FRAMEBUFFER,null );

	gl.useProgram(addShader.program);
	gl.uniform1i(addShader.unis["uSampler2"],1);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,tex512.glTexture);
	gl.uniform1f(addShader.unis["v1"],1.0);
	gl.uniform1f(addShader.unis["v2"],exposure_bloom);

	ono3d.setViewport(0,0,WIDTH,HEIGHT);
	Ono3d.postEffect(image,0,0 ,WIDTH/image.width,HEIGHT/image.height,addShader);
}


/** カメラの露光設定を現在のレンダリング画像から自動設定する**/
Engine.calcExpose = function(image,x,y,w,h){
	var shaders=ono3d.shaders;
	//ピクセル毎の光度と最大値を取得
	gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
	ono3d.setViewport(0,0,256,256);
	gl.bindTexture(gl.TEXTURE_2D,averageTexture.glTexture);
	Ono3d.postEffect(image,x,y,w,h,shaders["average"]); 
	Ono3d.copyImage(averageTexture,0,0,0,0,256,256);

	//1/2縮小を繰り返し平均と最大値を求める
	var size = 256;
	for(var i=0;size>1;i++){
		ono3d.setViewport(0,0,size/2,size/2);
		Ono3d.postEffect(averageTexture ,0 ,0,size/512,size/512,shaders["average2"]); 
		Ono3d.copyImage(averageTexture,0,0,0,0,size/2,size/2);
		size/=2;
	}
	ono3d.setViewport(0,511,1,1);
	Ono3d.postEffect(averageTexture ,0,511/512,1/512,1/512,shaders["average3"]); 
	Ono3d.copyImage(averageTexture,0,511,0,511,1,1);

}

/** カメラの露光設定をセットする**/
var packUFP16 = function (dst,raw){ 
	if(raw===0.0){
		dst[0]=0;
		dst[1]=0;
		return;
	}
	var geta=15.0;
	var idx = Math.min(Math.max((Math.floor(Math.log2(raw))),-geta),31.0-geta);
	var f;
	if(idx<0){
		f = raw *(1<<(-idx)) ;
	}else{
		f = raw /(1<<idx) ;
	}
	f=(f-1.0)*256.0;
	dst[0]=f|0;
	dst[1]=(((f-(f|0))*8.0)<<5) + (idx+geta);
	Vec2.mul(dst,dst,1.0/255.0);
	return;
} 
Engine.setExpose = function(level,upper){
	var a = new Vec2();
	var b = new Vec2();
	var shaders=ono3d.shaders;
	//Vec4.set(a,level,upper,0.5,0.5);
	gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
	ono3d.setViewport(0,511,1,1);
	gl.useProgram(shaders["fill"].program);
	packUFP16(a,level);
	packUFP16(b,upper);
	//encode2(a,a);
	gl.uniform4f(shaders["fill"].unis["uColor"]
		,a[0],a[1],b[0],b[1]);
		
	Ono3d.postEffect(averageTexture,0,0,0,0,shaders["fill"]); 
	Ono3d.copyImage(averageTexture,0,511,0,511,1,1);
}
Engine.toneMapping = function(image,w,h){
	var shaders=ono3d.shaders;
	var decodeShader = shaders["decode"];
	gl.useProgram(decodeShader.program);
	gl.uniform1i(decodeShader.unis["uSampler2"],1);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D,averageTexture.glTexture);
	Ono3d.postEffect(image,0,0 ,w,h,decodeShader); 
}


Engine.createSHcoeff= function(x,y,z,size,func){
	//ライトプローブの球面調和関数の係数を計算する
	var tex;
	if(!tex){
		tex =Ono3d.createTexture(size*4,size*4);
	}
	var envBuf = ono3d.envbufTexture;

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//キューブマップ作成
	ono3d.setNearFar(0.01,80.0);
	ono3d.createCubeMap(envBuf,x,y,z,256,func);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	for(var i=0;i<9;i++){
		//係数の数だけループ
		gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
		gl.clearColor(0,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		ono3d.setViewport(0,0,size*4,size*2);
		//係数ごとのシェーダで計算
		Ono3d.postEffect(envBuf,0,0,256*4/envBuf.width,256*2/envBuf.height,shShader[i]); 

		Ono3d.copyImage(tex,0,0,0,0,size*4,size);
		Ono3d.copyImage(tex,0,size,0,size,size*2,size);

		//計算結果を全て合計
		var texsize=tex.width;
		while(2<texsize){
			//積分
			texsize>>=1;
			ono3d.setViewport(0,0,texsize,texsize);
			Ono3d.postEffect(tex,0,0,texsize*2/tex.width,texsize*2/tex.width,sigmaShader); 
			Ono3d.copyImage(tex,0,0,0,0,texsize,texsize);
		}

		//ラストはメインのフレームに描く
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		texsize>>=1;
		ono3d.setViewport(i,0,1,1);
		Ono3d.postEffect(tex,0,0,texsize*2/tex.width,texsize*2/tex.width,sigmaShader); 
		Ono3d.copyImage(tex,0,0,0,0,texsize,texsize);
	}
	
	return tex;
}


Engine.createLightProbe=function(points,shcoefs){
	//位置と球面調和係数のリストからライトプローブを作成
	var triangles = Delaunay.create(points);
	var bspTree=Bsp.createBspTree(triangles);
	var lightProbe={};

	lightProbe.bspTree=bspTree;
	lightProbe.points=points;
	lightProbe.shcoefs=shcoefs;

	return lightProbe;
}


var lightArea_poses = [];
for(var pi=0;pi<8+1;pi++){
	lightArea_poses.push(new Vec3());
}

Engine.shadowGauss=function(width,height,d,src,x,y,w,h){
	//係数作成
	var weight = new Array(5);
	var t = 0.0;
	for(var i = 0; i < weight.length; i++){
		var r = 1.0 + 2.0 * i;
		var we = Math.exp(-0.5 * (r * r) / d);
		weight[i] = we;
		if(i > 0){we *= 2.0;}
		t += we;
	}
	for(i = 0; i < weight.length; i++){
		weight[i] /= t;
	}
	var shader =shadow_gauss_shader;
	var args=shader.unis;

	gl.useProgram(shader.program);

	gl.uniform1fv(args["weight"],weight);
	gl.bindBuffer(gl.ARRAY_BUFFER, Rastgl.fullposbuffer);

	//横ぼかし
	gl.uniform2f(args["uAxis"],1/width,0);
	Ono3d.postEffect(src,x,y,w,h,shader); 

	Ono3d.copyImage(src,0,0,0,0,width,height);


	//縦ぼかし
	gl.uniform2f(args["uAxis"],0,1/height);
	Ono3d.postEffect(src,0,0,width/src.width,height/src.height,shader); 
}
