//変数監視

class Watch{
	constructor(variable_root,variable_name,callback){
		this.variable_root=variable_root;
		this.variable_direction = variable_name.split(".");
		this.callback=callback;
		this.old_value={};
	}

	getValue(n){
		//監視対象の変数の値を取得
		var value=this.variable_root;
		var v=this.variable_direction;
		for(var j=0;j<v.length-n;j++){
			value = value[v[j]];
			if(value == undefined){
				value=null;
				break;
			}
		}
		return value;
	}
	setValue(value){
		//監視変数に値をセットする
		var val =this.getValue(1); //対象の変数の親を取得
		val[this.variable_direction[this.variable_direction.length-1]]=value;
	}

	refresh(){
		//バインドされた変数の値をノード属性にセット
		var value = this.getValue(0);
		if(value && (value instanceof HTMLElement || value.nodeName)){
		}else{
			if(typeof value === 'object' ){
				value = JSON.stringify(value);
			}
		}
		this.change_flg = (this.old_value !== value);
		this.old_value = value;
	}
}

export default class Watcher {
	constructor(){
		this.watches=[];
	}

	init(){
		//初期化&バインド
//		var func =()=>{
//			this.refresh();
//			window.requestAnimationFrame(func);
//		}
//		func();
	}

	watch(variable_root,variable_name,func){
		//監視変数を追加
		var watch = new Watch(variable_root,variable_name,func);
		this.watches.push(watch);
		return watch;
	}
	refresh(){
		//監視対象をチェック
		this.watches.forEach((w)=>{
			w.refresh();
		});
	}
}

