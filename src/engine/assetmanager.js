
import O3o from "./o3o/o3o.js";
import Ono3d from "../lib/ono3d.js"
var AssetManager=(function(){
	var AssetManager={};
	var ret=AssetManager;
	var ono3d;

	ret.assetList=[];
	ret.texture=function(path,func){
		if(!this.assetList[path]){
			this.assetList[path]=Ono3d.loadTexture(path,func);
		}
		return this.assetList[path];
	}
	ret.bumpTexture=function(path,func){
		if(!this.assetList[path]){
			this.assetList[path]=Ono3d.loadBumpTexture(path,func);
		}
		return this.assetList[path];
	}

	ret.o3o=function(path,func){
		if(!this.assetList[path]){
			this.assetList[path] ={data:null,status:"loading"};
		}
		if(this.assetList[path].status !== "loaded"){
			var _path = path;
			var _func= func;
			this.assetList[path].data=O3o.load(path,(e)=>{
				if(!e){
					this.assetList[path].status="failed";
				}else{
					this.assetList[path].status="loaded";

				}
				if(_func){
					_func(e);
				}
			});
		}
		return this.assetList[path].data;
	}

	ret.getStatus = function(path){
		var asset = this.assetList[path];
		if(!asset){
			return "noload";
		}
		return asset.status;
	}


	return ret;
})();
export default AssetManager;
