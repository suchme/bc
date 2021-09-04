
export default class TypedClass{
		constructor(){
		}
	};
	TypedClass.array= function(n){
			var size=this.size;
			var buffer=new ArrayBuffer(size*n);
			var arr=[];
			for(var i=0;i<n;i++){
				var obj = new this(buffer,size*i);
				arr.push(obj);
			}
			arr.buf=new Int8Array(buffer);
			return arr;
		}
	TypedClass.size = 0;
