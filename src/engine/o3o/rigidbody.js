
export default class RigidBody{
	constructor(){
		//剛体設定
		this.type="";
		this.mass=1.0;
		this.collision_shape="";
		this.friction=0.5;
		this.restitution=0.0;
		this.collision_groups=0;
	}
}
