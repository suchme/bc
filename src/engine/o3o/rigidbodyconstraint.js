
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
export default class RigidBodyConstraint{
	constructor(){
		//剛体コンストレイント設定
		this.breaking_threshold=0.0;
		this.disable_collisions=false;
		this.enabled= false;
		this.limit_ang_lower=new Vec3();
		this.limit_ang_upper=new Vec3();
		this.limit_lin_lower=new Vec3();
		this.limit_lin_upper=new Vec3();
		this.motor_ang_max_impulse=1;
		this.motor_ang_target_velocity=1;
		this.motor_lin_max_impulse=1;
		this.motor_lin_target_velocity=1;
		this.object1=null;
		this.object2=null;
		this.spring_damping=new Vec3();
		this.spring_stiffness=new Vec3();
		this.spring_damping_ang=new Vec3();
		this.spring_stiffness_ang=new Vec3();
		this.use_breaking=0;
		this.use_limit_ang=new Vec3();
		this.use_limit_lin=new Vec3();
		this.use_motor_ang=0;
		this.use_motor_lin=0;
		this.use_spring=new Vec3();
		this.use_spring_ang=new Vec3();
		this.type="";
	}
};
