import Ono3d from "./lib/ono3d.js"
import Rastgl from "./lib/rastgl.js"
import Util from "./lib/util.js"
import Engine from "./engine/engine.js"
import Scene from "./engine/scene.js"
import O3o from "./engine/o3o/o3o.js"
import SceneObjectInstance from "./engine/o3o/sceneobjectinstance.js"
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
var primitives={};
var base_model;
var base_instance;
var tmp_instance;
var tmp_model;
var o3o_head;
var o3o_tmp;
class Scene1 extends Scene{
	constructor(){
		super();
		this.a=new Vec2();
		this.p=new Vec3();
		this.cameralen=3.5;
		this.target=new Vec3();
		this.instances=[];

		base_model = AssetManager.o3o("model/base.o3o",(o3o)=>{
			base_instance = o3o.createInstance();
			

			for(var i=0;i<30;i++){

				primitives["s"+i]=AssetManager.o3o("model/s"+i+".o3o");
			}	
			tmp_model = AssetManager.o3o("model/tmp.o3o",(o3o)=>{
				o3o.objects.forEach((object,idx,arr)=>{
					if(object.name==="Head"){
						arr[idx] = base_model.objects_name_hash["Head"];
						o3o.objects_name_hash[object.name] = base_model.objects_name_hash["Head"];
					}
				});
				tmp_instance = o3o.createInstance();
				o3o.collections["h1"].objects.forEach((object,idx,arr)=>{
					tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
				});
				//tmp_instance.objectInstances["Head"].o3oInstance = base_instance;
			});
		});
		this.t=0;
		globalParam.autoExposure=false;
		globalParam.exposure_level = 0.2;
		globalParam.exposure_upper = 1;
	}
	update(){
		if(!tmp_model)return;
		var target_o3o = primitives[values.shinki.cd];
		var targets = ["Head","Body","Arm.L","Arm.R","Leg.L","Leg.R","Rear"];
		tmp_model.objects.forEach((object,idx,arr)=>{
			var name = object.name;
			if(!targets.includes(name))return;
			if(!target_o3o.objects_name_hash[name])return;

			arr[idx] = target_o3o.objects_name_hash[name];
			tmp_model.objects_name_hash[object.name] = target_o3o.objects_name_hash[name];
			
		});
		tmp_instance = tmp_model.createInstance();
		tmp_model.collections["h1"].objects.forEach((object,idx,arr)=>{
			tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
		});
		tmp_model.collections["b1"].objects.forEach((object,idx,arr)=>{
			tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
		});
		tmp_model.collections["a1"].objects.forEach((object,idx,arr)=>{
			tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
		});
		tmp_model.collections["l1"].objects.forEach((object,idx,arr)=>{
			tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
		});
		tmp_model.collections["r1"].objects.forEach((object,idx,arr)=>{
			tmp_instance.objectInstances[object.name].o3oInstance = base_instance;
		});

	}
	create(){

		ono3d.clear();

		engine.calcEnvironment();
		this.a[1]=Math.PI;
	}
	draw(){
		//this.instance = primitives[values.shinki.cd];
		//if(!this.instance)return;
		if(!base_instance)return;
		//if(!tmp_instance)return;

		if(!this.hoge){
			this.create();
			this.hoge=true;
		}

		Mat44.setInit(ono3d.worldMatrix);
//		ono3d.worldMatrix[13]=-1;
	//	var org_matrices=naked_instance.objectInstances["Armature"].boneMatrices;
		//var matrices=this.instance.objectInstances["Armature"].boneMatrices;
		//for(var i=0;i<matrices.length;i++){
		//	Mat44.copy(matrices[i],org_matrices[i]);
		//}

		//matrices=this.instance.objectInstances["Armature"].boneMatrices;
		//for(var i=0;i<matrices.length;i++){
		//	Mat44.copy(matrices[i],org_matrices[i]);
		//}

		//base_instance.draw();
		tmp_instance.drawCollections("h1");
		tmp_instance.drawCollections("b1");
		tmp_instance.drawCollections("a1");
		tmp_instance.drawCollections("l1");
		tmp_instance.drawCollections("r1");
//		tmp_instance.objectInstances["Head"].draw();
		//this.instances[0].draw();
		//this.instance_tmp.draw("Arm");
		
	}

	move(){

		if(Util.pressOn){
			//クリックされていた場合は視点変更
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

		//ターゲット注目
		homingCamera(camera.a,this.target,camera.p);

		var light = engine.ono3d.environments[0].sun;
		Vec3.set(light.color,1,1,1);
		Mat44.fromRotVector(light.matrix,Math.PI*0.7,1,1,0);

		Mat44.dot(light.viewmatrix2,engine.ono3d.projectionMatrix,engine.ono3d.viewMatrix);

		//this.instance = primitives[values.shinki.cd];
		var scene= base_model.scenes[0];
		scene.setFrame(this.t);
		//naked_instance.calcMatrix(1.0/globalParam.fps);
		base_instance.calcMatrix(1.0/globalParam.fps);

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
			this.engine.init(document.getElementById("aaa"),400,460);
			this.engine.start();

			var scene1 = new Scene1();
			this.engine.scenes.push(scene1);
			window.engine = this.engine;
			window.ono3d = this.engine.ono3d;

			this.scene=scene1;

		}
	}
}
