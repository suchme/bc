import Ono3d from "../../lib/lib/ono3d.js"
import DATA from "./data.js";
import Rastgl from "../../lib/lib/rastgl.js"
import Util from "../../lib/lib/util.js"
import Engine from "../../lib/engine/engine.js"
import Obj from "../../lib/engine/obj.js"
import O3o from "../../lib/engine/o3o/o3o.js"
import O3oInstance from "../../lib/engine/o3o/o3oinstance.js"
import SceneObjectInstance from "../../lib/engine/o3o/sceneobjectinstance.js"
import AssetManager from "../../lib/engine/assetmanager.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/lib/vector.js"
import OnoPhy from "../../lib/lib/onophy/onophy.js"
import Base64Util from "../../lib/lib/base64.js"
import Zip from "../../lib/lib/zip.js"

var palette=null;
var primitives={};
var base_model;
var base_instance;
var o3o_head;
var o3o_tmp;
	var files=[];

var render_flg=false;

	var getPath=function(buso){
		var o3opath = "model/etc.o3o";
		var tsugarubx=DATA.class.indexOf("ツガルBX");
		var juvib=DATA.class.indexOf("ジュビジーB");
		if(buso.cd === 1){
		}else if(buso.class.indexOf(tsugarubx)>=0){
			o3opath = "model/s2.o3o";
		}else if(buso.class.indexOf(juvib)>=0){
			o3opath = "model/s4.o3o";
		}else if(buso.name.indexOf("バレンタイン")>=0){
			o3opath = "model/valentine.o3o";
		}else if(buso.name.indexOf("サンタ")>=0){
			o3opath = "model/xmas.o3o";
		}else if(buso.name.indexOf("[S]")>=0){
			o3opath = "model/silver.o3o";
		//}else if(buso.name.indexOf("[G]")>=0){
		//	o3opath = "model/gold.o3o";
		}else{
			var m=DATA.class.indexOf("水着");
			if(buso.class.indexOf(m)>=0){
				o3opath = "model/swimsuit.o3o";
			}else{
				if(buso.class.length > 0 && buso.class[0]>0){
					var scd = DATA.class_shinki[buso.class[0]]
					if(scd==="s32"){
						scd="s0";
					}
					if(scd==="s33"){
						scd="s1";
					}
					
					if(scd){
						o3opath = "model/" + scd +".o3o";
					}
				}
			}
		}

		return o3opath;
	}
	var getList=function(buso){
		if(buso === null){
			return [];
		}
		var cd = buso.cd;
		var type = cd.substring(0,1);
		var num = Number(cd.substring(1));
		var o3opath = "model/base.o3o";

		if(num === 0){
			return [];
		}
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

var update_flg = true;
class Scene1 extends Obj{
	constructor(){
		super();
		this.a=new Vec2();
		this.p=new Vec3();
		this.cameralen=3.5;
		this.target=new Vec3();
		this.instances=[];

		base_model = AssetManager.o3o("model/base.o3o");
		this.t=0;

		this.update_flg=true;
	}

	update(){
		update_flg=true;
	}
	update_(){
		if(base_model.objects.length===0){
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
			if(values.shinki.cd === "s999"){
				list = [];
			}else if(target_o3o.collections["h1"]){
				list = target_o3o.getCollectionObjectList("h1");
			}else{
				list = [target_o3o.objects_name_hash["Head"]];
			}
			list = list.filter((e)=>{
				var name = e.name;
				var reg=/^([^|.]*)/
				return headlist.findIndex((e)=>{return reg.exec(e.name)[0] == reg.exec(name)[0]}) <0;
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
			base_instance.joinPhyObj(engine.onoPhy);
		
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

		engine.camera.znear=0.01;
		engine.camera.zfar=100;
		engine.calcMatrix();
		//環境マップ作成
		engine.calcEnvironment();

		engine.skyTexture=null
		//カメラ初期位置セット
		this.a[1]=Math.PI;
		var camera = engine.camera;
		camera.p[0]=0;
		camera.p[1]=0;
		camera.p[2]=this.cameralen;

	}
	draw(){

		if(!base_instance)return;



		//行列リセット
		Mat43.setInit(ono3d.worldMatrix);

		//インスタンス描画
		base_instance.draw();
		
	}

	move(){

		if((!this.hoge) && Util.getLoadingCount()===0){
			this.create();
			this.hoge=true;
		}
		if(render_flg && !update_flg && Util.getLoadingCount()===0){
			render2();
		}

		if(update_flg){
			this.update_();
		}

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
		Engine.Camera.homing(camera.a,this.target,camera.p);

		//ライト角度とかセット
		var light = engine.ono3d.environments[0].sun;
		Vec3.setValue(light.color,1,1,1);
		var jiku = new Vec3();
		Vec3.setValue(jiku,1,1,0);
		Vec3.norm(jiku);
		Mat44.fromRotVector(light.matrix,Math.PI*0.7,jiku[0],jiku[1],jiku[2]);
		engine.calcLightMatrix();

		Mat44.dot(light.viewmatrix2,engine.ono3d.projectionMatrix,engine.ono3d.viewMatrix);

		if(base_model.scenes[0]){
			//ベースモデルが読み込まれているならアニメーションさせる
			var scene= base_model.scenes[0];
			scene.setFrame(this.t*60/globalParam.fps);
		}
		if(base_instance){
			//ベースモデルインスタンスがあるならアニメーションを反映させる
			base_instance.calcMatrix(1.0/globalParam.fps);
		}

	}
};

export default class Visualizer{
	constructor(){
		this.engine = new Engine();
		this.step=0;
		this.engine.step=2;
		this.engine.autoExposure=false;
		this.engine.exposure_level = 0.3;
		this.engine.exposure_upper = 1.0;
	}
	main(){
		this.engine.userInit=()=>{

			palette =Ono3d.createTexture(4,4);

			var scene1 = new Scene1();
			this.engine.objMan.addObj(scene1);
			window.engine = this.engine;
			window.ono3d = this.engine.ono3d;

			this.scene=scene1;
		}
		this.engine.init(document.getElementById("aaa"),400,460);
		
	}
}
Ono3d.mainshader_path ="main.shader";


var render2=function(){
	if(base_model.scenes[0]){
		//ベースモデルが読み込まれているならアニメーションさせる
		var scene= base_model.scenes[0];
		scene.setFrame(0);
	}
	if(base_instance){
		//ベースモデルインスタンスがあるならアニメーションを反映させる
		base_instance.calcMatrix(1.0/globalParam.fps);
	}
	engine.ono3d.clear();
	//行列リセット
	Mat44.setInit(ono3d.worldMatrix);

	var camera = engine.camera;
	camera.aov=0.2;
	var target = new Vec3();
	//body
	//Vec3.setValue(camera.p,1.2,1,2);
	//Vec3.setValue(target,0,0,0); /
	//leg
//	Vec3.setValue(target,0,-1.0,0);
//	Vec3.setValue(camera.p,1.2,0.5,2);
//	Vec3.madd(camera.p,target,camera.p,2);
	//head
	Vec3.setValue(target,0,1.0,0);
	Vec3.setValue(camera.p,1.2,0.5,1);
	Vec3.madd(camera.p,target,camera.p,1.5);
	//ターゲット注目
	Engine.Camera.homing(camera.a,target,camera.p);

	//インスタンス描画
	base_instance.draw();

	engine.drawFunc();

	var src =  engine.canvasgl.toDataURL();
	//var img = document.createElement("img");
	//img.src = src;
	//document.body.appendChild(img);
	src = src.substring(src.indexOf(",")+1);
	var arr = Base64Util.base64ToArray(src);


	//ドキュメント情報をdoc.txtとして書き込む
	var file = {}
	file.data = arr;
	//file.name=values.head.cd +".png"
	file.name=values.head.cd +".png"
	files.push(file);



	render_count++;
	if(render_count>=render_cds.length){
		//doc.txtと画像ファイルを無圧縮zipにする
		var buffer = Zip.create(files,0);
		var a= document.querySelector("a#download");
		var blob = new Blob([buffer], {type: "application/octet-stream"});

		a.textContent="hoeg";
		a.href =  window.URL.createObjectURL(blob);
		a.target = '_blank';
		a.download = "test.zip";
		render_flg = false;
	}else{
	//	values.head.cd=render_cds[render_count];
	//	main.reCalc();
		render();
	}


}


var bui =["head","body","arm","leg","rear"];
var findArmor = function(a){
	a.org = DATA.armors.find(function(elem){return elem.cd === a.cd;});
}

var render_count=0;
var render_cds=[];
for(var i=1;i<=473;i+=4){
	render_cds.push("h"+i);
}

window.render=function(){
	values.shinki.cd="s999";
	values.head.cd="a0";
	values.body.cd="b0";
	values.arm.cd="a0";
	values.leg.cd="l0";
	values.rear.cd="r0";

	//values.body.cd=render_cds[render_count];
	values.head.cd=render_cds[render_count];


	main.reCalc();
		
	if(render_count===0){
		files=[];
		render_flg = true;
	}

}
