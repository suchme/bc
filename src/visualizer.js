import Ono3d from "./lib/ono3d.js"
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
var o3o_arm;
class Scene1 extends Scene{
	constructor(){
		super();
		this.a=new Vec2();
		this.p=new Vec3();
		this.cameralen=5;
		this.target=new Vec3();
		o3o = AssetManager.o3o("anval.o3o",(o3o)=>{
			this.instance= o3o.createInstance();
		});
		o3o_arm = AssetManager.o3o("arm.o3o",(o3o)=>{
			this.instance_arm= o3o.createInstance();
		});
		this.t=0;
	}
	create(){

		ono3d.clear();

		engine.calcEnvironment();
		this.a[1]=Math.PI;
	}
	draw(){
		if(!this.instance)return;

		if(!this.hoge){
			this.create();
			this.hoge=true;
		}

		Mat44.setInit(ono3d.worldMatrix);
//		ono3d.worldMatrix[13]=-1;
		this.instance.draw();
		this.instance_arm.draw();
		
	}

	move(){
		if(Util.pressOn){
			this.a[1]-=(Util.cursorX-Util.oldcursorX)/engine.WIDTH;
			this.a[0]-=((Util.cursorY-Util.oldcursorY)/engine.HEIGHT);

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
		Vec3.set(light.color,1,1,1);
		Mat44.fromRotVector(light.matrix,Math.PI*0.7,1,1,0);

		Mat44.dot(light.viewmatrix2,engine.ono3d.projectionMatrix,engine.ono3d.viewMatrix);

		var scene= o3o.scenes[0];
		scene.setFrame(this.t);
		this.instance.calcMatrix(1.0/globalParam.fps);
		this.t++;
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
			this.engine.init(document.getElementById("aaa"),400,400);
			this.engine.start();

			var scene1 = new Scene1();
			this.engine.scenes.push(scene1);
			window.engine = this.engine;
			window.ono3d = this.engine.ono3d;

		}
	}
}
