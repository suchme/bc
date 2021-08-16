import Ono3d from "./lib/ono3d.js"
import Rastgl from "./lib/rastgl.js"
import Util from "./lib/util.js"
import Engine from "./engine/engine.js"


export default class Visualizer{
	constructor(){
		this.engine = new Engine();

	}
	main(){
//		var canvas = document.getElementById("canvas");
//		var ctx= canvas.getContext("2d");
//		ctx.fillStyle="white";
//		ctx.fillRect(0,0,100,100);
		if(Util.getLoadingCount()>0){
			//初期ロードが未完了の場合はメイン処理は開始しない
			setTimeout(this.main,100);
		}else{
			if(globalParam.debugMenu){
				debugClose();
			}
			this.engine.init(document.getElementById("aaa"));
			this.engine.start();
		}

		var a = document.getElementById("aaa");
		a.onresize=function(){

		}
	}
}
