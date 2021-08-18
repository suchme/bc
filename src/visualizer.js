import Ono3d from "./lib/ono3d.js"
import SH from "./lib/spherical_harmonics/sh.js";
import Rastgl from "./lib/rastgl.js"
import Util from "./lib/util.js"
import Engine from "./engine/engine.js"
import Scene from "./engine/scene.js"
import O3o from "./engine/o3o/o3o.js"
import AssetManager from "./engine/assetmanager.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "./lib/vector.js"

var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
		
	}
var o3o;
class Scene1 extends Scene{
	constructor(){
		super();
		this.a=new Vec2();
		this.p=new Vec3();
		this.cameralen=10;
		this.target=new Vec3();
		o3o = AssetManager.o3o("human.o3o",(o3o)=>{
			this.instance= o3o.createInstance();
		});
	}
	create(){

		ono3d.clear();

		//環境マップ
		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		ono3d.environments[0].envTexture = ono3d.createEnv(null,0,0,0,(x,y,w,h)=>{engine.drawSub(x,y,w,h)});

		Engine.createSHcoeff(0,0,0,(x,y,w,h)=>{engine.drawSub(x,y,w,h)});
		var gl = Rastgl.gl;
		var u8 = new Uint8Array(9*4);
		gl.readPixels(0, 0, 9, 1, gl.RGBA, gl.UNSIGNED_BYTE, u8);
		var ratio = 1/(255*16*16*Math.PI*4);
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
		SH.mulA(shcoef);

		var points=[];
		var shcoefs=[];
		var MAX=1000;
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
	draw(){
		if(!this.instance)return;

		if(!this.hoge){
			this.create();
			this.hoge=true;
		}

		var objects = this.instance.o3o.objects;
		for(var i=0;i<objects.length;i++){
			if(objects[i].hide_render){
				continue;
			}
			var instance = this.instance.objectInstances[i];
			instance.draw();
		}
		
	}

	move(){
//		console.log("HOGE");
		if(Util.pressOn){
			this.a[1]-=(Util.cursorX-Util.oldcursorX)/Engine.WIDTH;
			this.a[0]-=((Util.cursorY-Util.oldcursorY)/Engine.HEIGHT);

		}
		this.a[0] =Math.min(this.a[0],Math.PI/2);
		this.a[0] =Math.max(this.a[0],-Math.PI/2);
		this.p[2]=Math.cos(this.a[0]);
		this.p[1]=-Math.sin(this.a[0]);
		this.p[0]=-Math.sin(this.a[1])*this.p[2];
		this.p[2]=-Math.cos(this.a[1])*this.p[2];

		Vec3.mul(this.p,this.p,this.cameralen);

		Vec3.add(this.p,this.p,this.target);

		var camera = engine.camera;

		camera.p[0]+=(this.p[0]-camera.p[0])*0.3
		camera.p[1]+=(this.p[1]-camera.p[1])*0.3
		camera.p[2]+=(this.p[2]-camera.p[2])*0.3


		homingCamera(camera.a,this.target,camera.p);

		var light = engine.ono3d.environments[0].sun;
		Mat44.dot(light.viewmatrix2,engine.ono3d.projectionMatrix,engine.ono3d.viewMatrix);
	}
};

export default class Visualizer{
	constructor(){
		this.engine = new Engine();


	}
	main(){
		if(Util.getLoadingCount()>0){
			//初期ロードが未完了の場合はメイン処理は開始しない
			setTimeout(this.main,100);
		}else{
			if(globalParam.debugMenu){
				debugClose();
			}
			this.engine.init(document.getElementById("aaa"));
			this.engine.start();

			var scene1 = new Scene1();
			this.engine.scenes.push(scene1);
			window.engine = this.engine;
			window.ono3d = this.engine.ono3d;

		}
	}
}
