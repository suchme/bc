import ObjMan from "./objman.js"
import Engine from "./engine.js"

export default class Scene{
	constructor(){
		this.objMan = new ObjMan();
		this.objMan.scene = this;
	};
	move(){
		this.objMan.update();
		this.objMan.move();
	}
	hudDraw(){
		var objMan=this.objMan;
		for(var i=0;i<objMan.objs.length;i++){
			//HUD•`‰æ
			var obj = objMan.objs[i];
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			obj.drawhud();
		}


	}

	draw(){
		var objMan=this.objMan;
		//•`‰æŠÖ”


		var environment = engine.ono3d.environments[0];


		//Util.str2rgba(environment.sun.color,globalParam.lightColor1)
		//Util.str2rgba(environment.area.color,globalParam.lightColor2)

		//if(globalParam.cMaterial){
		//	var cMat = ono3d.materials[ono3d.materials_index];
		//	ono3d.materials_index++;
		//	var a=new Vec3();
		//	Util.hex2rgb(cMat.baseColor,globalParam.baseColor);
		//	cMat.opacity=globalParam.opacity;
		//	cMat.emt=globalParam.emi;
		//	cMat.metallic=globalParam.metallic;
		//	cMat.specular=globalParam.specular;
		//	cMat.ior=globalParam.ior;
		//	cMat.roughness=globalParam.roughness;
		//	cMat.subRoughness=globalParam.subRoughness;
		//	Util.hex2rgb(cMat.metalColor,globalParam.metalColor);
		//	cMat.texture=globalParam.cTexture;

		//	cMat.shader=Ono3d.calcMainShaderName(cMat);
		//	customMaterial=cMat;
		//}

			

		var camera =engine.camera;
		var ono3d = engine.ono3d;
		engine.calcMatrix();
		camera.calcCollision(camera.cameracol);
		var lightSource= null;

		if(globalParam.shadow){
			lightSource = ono3d.environments[0].sun
			if(lightSource){
//				camera.calcCollision(camera.cameracol2,lightSource.viewmatrix);
			}
		}
		for(var i=0;i<objMan.objs.length;i++){
			var obj = objMan.objs[i];
			ono3d.setTargetMatrix(0)
			ono3d.loadIdentity()
			ono3d.rf=0;
			obj.draw();
		}
		

		engine.calcLightMatrix();
		// ƒXƒeƒŒƒI•`‰æÝ’è
		globalParam.stereo=-globalParam.stereoVolume * globalParam.stereomode*0.4;
	}

}
