import Util from "./util.js"

export default class DataStream{
	constructor(arraybuffer,offset,length){
		if(typeof arraybuffer === "number"){
			this.byteBuffer=new Uint8Array(arraybuffer);
		}else{
			if(length){
				this.byteBuffer=new Uint8Array(arraybuffer,offset,length);
			}else{
				this.byteBuffer=new Uint8Array(arraybuffer);
			}
		}
		this.dv=new DataView(this.byteBuffer.buffer,this.byteBuffer.byteOffset,this.byteBuffer.byteLength);
		this.idx=0;
	};

	getByteIndex(){
		return this.idx>>>3;
	}
	fill(value,n){
		//nバイト書き込む
		for(var i=0;i<n;i++){
			this.setUint8(value);
		}
		return;
	}

	setInt32(value,le){
		this.dv.setInt32(this.idx>>3,value,le);
		this.idx+=32;
		return;
	}
	getInt32(le){
		var ret =this.dv.getInt32(this.idx>>3,le);
		this.idx+=32;
		return ret;
	}

	setUint8 (value){
		this.dv.setUint8(this.idx>>3,value);
		this.idx+=8;
	}
	getUint8 (le){
		var ret=this.dv.getUint8(this.idx>>3,le);
		this.idx+=8;
		return ret;
	}

	setUint32(value,le){
		this.dv.setUint32(this.idx>>3,value,le);
		this.idx+=32;
		return;
	}
	getUint32 (le){
		var ret=this.dv.getUint32(this.idx>>3,le);
		this.idx+=32;
		return ret;
	}
	setUint16(value,le){
		this.dv.setUint16(this.idx>>3,value,le);
		this.idx+=16;
		return;
	}
	getUint16(le){
		var ret=this.dv.getUint16(this.idx>>3,le);
		this.idx+=16;
		return ret;
	}

	setUint64(value,le){
		var h=value/(65536*65536)|0;
		var l=value&0xffffffff;
		if(le){
			this.setUint32(l,le);
			this.setUint32(h,le);
		}else{
			this.setUint32(h,le);
			this.setUint32(l,le);
		}
	}
	getUint64(le){
		var ret=this.getUint32(le);
		var ret2=this.getUint32(le);
		if(le){
			return (ret2<<32)+ret;
		}else{
			return (ret<<32)+ret2;
		}
	}
	setFloat32(value,le){
		this.dv.setFloat32(this.idx>>3,value,le);
		this.idx+=32;
	}
	getFloat32(le){
		var ret=this.dv.getFloat32(this.idx>>3,le);
		this.idx+=32;
		return ret;
	}

	setBytes(bytes){
		for(var si=0;si<bytes.length;si++){
			this.setUint8(bytes[si]);
		}
		return ;
	}
	getBytes(length){
		var array = new Uint8Array(length);
		for(var si=0;si<length;si++){
			array[si]=this.getUint8();
		}
		return array;
	}
	setTextBuf(str,flg){
		var utf8array = Util.stringToUtf8(str);
		var dv = this.dv;
		for(var si=0;si<utf8array.length;si++){
			this.setUint8(utf8array[si]);
		}
		if(flg){
			this.setUint8(0);
		}
		return ;
	}
	readTextBuf(){
		var dv = this.dv;
		var array=[];
		var a;
		while((a=dv.getUint8(this.idx>>3)) !== 0){
			array.push(a);
			this.idx+=1<<3;
		}
		this.idx+=1<<3;
		return Util.utf8ToString(array);
	}

	setFloat16(value,le){
		var dv = this.dv;
		var s = (-Math.sign(value)+1)>>1;
		var val = Math.abs(value);
		var e = Math.floor(Math.log2(val));
		val = val/Math.pow(2,e)-1;
		
		var u = (s<<15) | ((e+15)<<10) | (val*1024 & 1023);

		this.setUint16(u,le);

//		this.idx-=16;
//		var val2= this.readFloat16(le);
	}
	readFloat16(le){
		var dv = this.dv;
		var data = this.getUint16(le);
		if(data === 0)return 0.0; 
		var sign = (data>>15) &1;
		sign = 1-sign*2 ;

		var idx = ((data>>10)&31) -15;
		var b = (data & 1023)*1.0/1024.0+ 1.0;
		return sign * b * Math.pow(2.0,idx);
	}




	outputBit(bit){ 
		//1ビットouput_bufferに書き込む
		//書き込んだあとindexを1ビットすすめる
		this.byteBuffer[this.idx>>3] &=  ~(1<<(this.idx&7));
		this.byteBuffer[this.idx>>3] |=bit<<(this.idx&7);

		this.idx++;
	}
	outputBits(bits,len){
		//ビット列をoutput_bufferに書き込む
		for(var i=0;i<len;i++){
			this.outputBit((bits>>i)&1);
		}
	}
	outputBitsReverse(bits,len){
		//ビット列を逆順(上位ビットから順番)にoutput_bufferに書き込む
		//ハフマン符号格納用

		for(var i=len-1;i>=0;i--){
			this.outputBit((bits>>i)&1);
		}
	}

	readBit(){
		//bufferからoutput_indexの位置のビットを読み込み
		//読み込んだあとoutput_indexを1つすすめる
		var bit=(this.byteBuffer[this.idx>>3] >> (this.idx&7))&1;
		this.idx++;
		return bit;

	}

	readBits(len){
		//output_bufferからlen分読み込み
		var bits=0;
		for(var i=0;i<len;i++){
			bits=bits | (this.readBit()<<i);
		}
		return bits;
	}
	readBitsReverse(len){
		//output_bufferからlen分読み込み
		//読み込んだビットは高次ビットから格納される
		//ハフマン符号読み込み用
		var bits=0;
		for(var i=0;i<len;i++){
			bits=(bits<<1) | this.readBit();
		}
		return bits;
	}

}
