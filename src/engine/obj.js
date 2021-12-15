
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../lib/vector.js"
import ObjMan from "./objman.js"

export default class Obj{
	constructor(){
		this.p=new Vec3();
		this.scale=new Vec3();
		this.rotq = new Vec4();
		this.v=new Vec3();
		this.a=new Vec3();
		this.stat=ObjMan.STAT_CREATE;
		this.type=0;
		this.hp=1;
		this.t=0;
		this.hitareas=[];
		this.matrix=new Mat43();
		this.phyObjs = [];
	}
	init(){};
	move(){};
	draw(){};
	drawShadow(){
		this.draw();
	};
	hit(){};
	delete(){};
	drawhud(){};
}
