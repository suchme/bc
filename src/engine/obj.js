export default class Obj{
	constructor(){
		this.p=new Vec3();
		this.scale=new Vec3();
		this.rotq = new Vec4();
		this.v=new Vec3();
		this.a=new Vec3();
		this.stat=STAT_EMPTY;
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
