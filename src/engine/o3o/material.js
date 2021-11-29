import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
export default class Material{
	constructor(){
		//マテリアル
		this.name="";
		this.blend_method="OPAQUE";
		this.baseColor=new Vec3();
		Vec3.set(this.baseColor,1,1,1);
		this.baseColorMap="";
		this.opacity=1.0;
		this.specular=0.0;
		this.metallic=0.0;
		this.roughness=0.0;
		this.ior=1.0;
		this.subRoughness=0.0;
		this.emt=0.0;
		this.pbrMap="";
		this.hightMap="";
		this.hightMapPower=0;
		this.hightBase=0.5;
		this.lightMap="";
		this.uv="";
		this.fresnel=0.0;

		this.shader="";
	}
}
