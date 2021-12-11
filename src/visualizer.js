import Ono3d from "./lib/ono3d.js"
import DATA from "./data.js";
import Rastgl from "./lib/rastgl.js"
import Util from "./lib/util.js"
import Engine from "./engine/engine.js"
import Scene from "./engine/scene.js"
import O3o from "./engine/o3o/o3o.js"
import O3oInstance from "./engine/o3o/o3oinstance.js"
import SceneObjectInstance from "./engine/o3o/sceneobjectinstance.js"
import AssetManager from "./engine/assetmanager.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "./lib/vector.js"
import OnoPhy from "./lib/onophy/onophy.js"

var homingCamera=function(angle,target,camera){
		var dx=target[0]-camera[0]
		var dy=target[1]-camera[1]
		var dz=target[2]-camera[2]
		angle[0]=Math.atan2(dy,Math.sqrt(dz*dz+dx*dx));
		angle[1]=Math.atan2(dx,dz);
		angle[2]=0;
		
	}
var palette=null;
var primitives={};
var base_model;
var base_instance;
var o3o_head;
var o3o_tmp;

	var getPath=function(buso){
		var o3opath = "model/etc.o3o";
		var tsugarubx=DATA.class.indexOf("ツガルBX");
		if(buso.cd === 1){
		}else if(buso.class.indexOf(tsugarubx)>=0){
			o3opath = "model/s2.o3o";
		}else if(buso.name.indexOf("[15th]")>=0){
			o3opath = "model/15th.o3o";
		}else if(buso.name.indexOf("[S]")>=0){
			o3opath = "model/silver.o3o";
		}else if(buso.name.indexOf("[G]")>=0){
			o3opath = "model/gold.o3o";
		}else{
			var m=DATA.class.indexOf("水着");
			if(buso.class.indexOf(m)>=0){
				o3opath = "model/swimsuit.o3o";
			}else{
				if(buso.class.length > 0 && buso.class[0]>0){
					var scd = DATA.class_shinki[buso.class[0]]
					if(scd){
						o3opath = "model/" + scd +".o3o";
					}
				}
			}
		}

		return o3opath;
	}
	var getList=function(buso){
		var cd = buso.cd;
		var type = cd.substring(0,1);
		var num = Number(cd.substring(1));
		var o3opath = "model/base.o3o";

		if(num>0){
			o3opath = getPath(buso);
		}

		if(num>1){
			cd = type  + ((((num-2)>>2)<<2)+2);
		}

		var model=AssetManager.o3o(o3opath);
		var status = AssetManager.getStatus(o3opath);
		if(status === "loading"){
			throw "loading";
		}
		if(!model.collections[cd]){
			var list=[];
			if(num === 1){
				var path = "model/"+values.shinki.cd+".o3o";
				model =AssetManager.o3o(path);
				var status = AssetManager.getStatus(path);
				if(status === "loading"){
					throw "loading";
				}
				//バトルスキン
				var name ="";
				switch(type){
				case 'h':
					name="Head";
					break;
				case 'b':
					name="Body";
					break;
				case 'a':
					name="Arm.L";
					break;
				case 'l':
					name="Leg.L";
					break;
				case 'r':
					name="Rear";
					break;
				}
				var obj = model.objects_name_hash[name];
				if(obj){
					list=[obj];
				}
			}else{
				model=AssetManager.o3o("model/base.o3o");
				list = model.getCollectionObjectList(type+"0");
			}
			return list;
		}

		var list = model.getCollectionObjectList(cd);
		return list;
	}

var update=null;
var update_flg = true;
class Scene1 extends Scene{
	constructor(){
		super();
		this.a=new Vec2();
		this.p=new Vec3();
		this.cameralen=3.5;
		this.target=new Vec3();
		this.instances=[];

		base_model = AssetManager.o3o("model/base.o3o");
		this.t=0;
		globalParam.autoExposure=false;
		globalParam.exposure_level = 0.5;
		globalParam.exposure_upper = 1;
	}

	update(){
		update_flg=true;
	}
	update_(){
		if(!update_flg){
			return;
		}
//		if(!update){
//			update = this.update;
//		}
		if(base_model.objects.length===0){
//			setTimeout(update,1000);
			return;
		}

		try{
			var path = "model/"+values.shinki.cd+".o3o";
			var target_o3o=AssetManager.o3o(path);
			var status = AssetManager.getStatus(path);
			if(status === "loading"){
				throw "loading";
			}

			var list=[];
			var headlist=getList(values.head.org);
			if(target_o3o.collections["h1"]){
				list = target_o3o.collections["h1"];
			}else{
				list = [target_o3o.objects_name_hash["Head"]];
			}
			list = list.filter((e)=>{
				var name = e.name;
				var reg=/^([^|]*)/
				return headlist.findIndex((e)=>{return reg.exec(e.name)[0] ==name}) <0;
			});
			list=list.concat(headlist);
			var armature=base_model.objects_name_hash["Armature"];
			if(armature)list.push(armature);

			list=list.concat(getList(values.body.org));
			list=list.concat(getList(values.arm.org));
			list=list.concat(getList(values.leg.org));
			list=list.concat(getList(values.rear.org));

			//パレットセット
			var map = target_o3o.materials[0].baseColorMap;
			if(map){
				if(!map.glTexture){
					throw "loading";
				}
				ono3d.setViewport(0,0,4,4);
				var gl = ono3d.gl;
				gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
				Ono3d.drawCopy(0,0,1,1,map,31.5/32,0,0/32,1);
				Ono3d.copyImage(palette,0,0,0,0,4,4);
				globalParam.palette=palette;
			}
			if(values.head.org.name.indexOf("オリジナル")>=0){
				ono3d.setViewport(0,0,4,4);
				var gl = globalParam.gl;
				gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
				var matname=headlist[0].material_slots[0];
				var materials=headlist[0].o3o.materials;
				var mat = materials.find((e)=>{return e.name_full == matname;});
				var map = mat.baseColorMap;
				//var map = model.materials[0].baseColorMap;
				if(!map.glTexture){
					throw "loading";
				}
				Ono3d.drawCopy(0,0,1,1,map,31.5/32,0,0/32,1);
				Ono3d.copyImage(palette,0,2,0,2,4,1);
			}

			list.forEach((e)=>{
				var o3o = e.o3o;
				o3o.materials.forEach((e)=>{
					e.orgMap  = palette;//target_o3o.materials[0].baseColorMap;
				});

			});
			base_instance = new O3oInstance(null,list);
			base_instance.objectInstances.forEach((object,idx,arr)=>{
				object.o3oInstance = base_instance;

				if(object.phyObj){
					if(object.phyObj.type ==OnoPhy.CLOTH){
						engine.onoPhy.clothes.push(object.phyObj);
						object.phyObj.onophy = engine.onoPhy;
					}
				}
			});
		
			update_flg=false;

		}catch(e){
			if(e==="loading"){
	//			setTimeout(update,1000);
				return;
			}
			throw e;
			
		}

	}
	create(){

		ono3d.clear();

		engine.calcEnvironment();
		this.a[1]=Math.PI;

		var camera = engine.camera;
		camera.p[0]=0;
		camera.p[1]=0;
		camera.p[2]=this.cameralen;

		update_flg=true;
		this.update_();
	}
	draw(){
		if((!this.hoge) && Util.getLoadingCount()===0){
			this.create();
			this.hoge=true;
		}
//		if(values.selected_tab!=="visualize"){
//			return;
//		}
		if(!base_instance)return;


		Mat44.setInit(ono3d.worldMatrix);
		base_instance.draw();
		
	}

	move(){
		this.update_();

		if(Util.pressOn){
			//クリックされていた場合は視点変更
			this.a[1]-=(Util.cursorX-Util.oldcursorX)/engine.WIDTH*2;
			this.a[0]-=((Util.cursorY-Util.oldcursorY)/engine.HEIGHT)*2;
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
		var jiku = new Vec3();
		Vec3.set(jiku,1,1,0);
		Vec3.norm(jiku);
		Mat44.fromRotVector(light.matrix,Math.PI*0.7,jiku[0],jiku[1],jiku[2]);
		engine.calcLightMatrix();

		Mat44.dot(light.viewmatrix2,engine.ono3d.projectionMatrix,engine.ono3d.viewMatrix);

		//this.instance = primitives[values.shinki.cd];
		if(base_model.scenes[0]){
			var scene= base_model.scenes[0];
			scene.setFrame(this.t*60/globalParam.fps);
		}
		//naked_instance.calcMatrix(1.0/globalParam.fps);
		if(base_instance){
			base_instance.calcMatrix(1.0/globalParam.fps);
		}

		this.t++;
	}
};

export default class Visualizer{
	constructor(){
		this.engine = new Engine();
		this.step=0;
	}
	main(){
		globalParam.step=2;
		if(Util.getLoadingCount()>0){
			//初期ロードが未完了の場合はメイン処理は開始しない
			setTimeout(()=>{
				this.main();
			},1000);
			return;
		}

		switch(this.step){
		case 0:
			this.engine.init(document.getElementById("aaa"),400,460);
			setTimeout(()=>{
				this.main();
			},1000);
			this.step++;
			break;
		case 1:
			this.engine.start();
			palette =Ono3d.createTexture(4,4);

			var scene1 = new Scene1();
			this.engine.scenes.push(scene1);
			window.engine = this.engine;
			window.ono3d = this.engine.ono3d;

			this.scene=scene1;
			this.step++;
			break;
		}
		
	}
}
