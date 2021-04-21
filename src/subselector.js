//サブ画面
//
var html = `
	<div class="subwindow" id="subwindow" style="display:none;">
		<div  class="back" >
		</div>
		<div style="" class="submain">
			<table>
				<thead id="sub_head"> <tr> </tr> <tr> </tr> </thead>
				<tbody id="sub_body"> <tr> </tr> </tbody>
			</table>
		</div>
	</div>
`;
export default class Subselector{
	constructor(){
		this.cols=[];
		this.source=[];
		this.close_callback=null;
		this.sort=[];
		this.filter=[];

		document.body.insertAdjacentHTML('beforeend',html);
		this.back = document.body.querySelector("#subwindow .back");
	}

	open(callback){
		this.close_callback=callback;
		var cols = this.cols;
	

		//ヘッダ作る
		var tr_sort = document.createElement("tr");
		tr_sort.classList.add("sort");
		var tr_filter = document.createElement("tr");
		tr_filter.classList.add("filter");

		var th = document.createElement("th");
		th.className="pick";
		tr_filter.appendChild(th);
		th = document.createElement("th");
		th.className="pick";
		tr_sort.appendChild(th);


		cols.forEach(function(col){
			var th_filter = document.createElement("th");

			var th_sort = document.createElement("th");
			var a= document.createElement("button");
			a.textContent=col.label?col.label:col.data;
			a.onclick=(function(cd){return function(e){tmp.setSort(cd);}})(col);
			th_sort.appendChild(a);

			th_filter.classList.add(col.data);
			th_sort.classList.add(col.data);
			if(col.class){
				th_filter.classList.add(col.class);
				th_sort.classList.add(col.class);
			}
			tr_filter.appendChild(th_filter);
			tr_sort.appendChild(th_sort);
		});


		var cols = document.querySelectorAll("#sub_head tr");
		cols[0].parentNode.replaceChild(tr_filter,cols[0]);
		cols[1].parentNode.replaceChild(tr_sort,cols[1]);


		this.createTable();
		var subwindow= document.querySelector("#subwindow");
		subwindow.style.display="block";
		
		this.back.addEventListener("click",(e)=>{this.close();});


	}

	close(e){
		var subwindow= document.querySelector("#subwindow");
		subwindow.style.display="none";

		if(this.close_callback){
			this.close_callback(e);
		}
	}

	createTable(){
		var tmp = this;

		var filters = this.filter;
		var sort = this.sort;
		var keys = Object.keys(filters);
		var source = this.source;
		var cols = this.cols;

		//フィルタ
		var data= source.filter(function(e){
			var flg=true;
			keys.forEach(function(key){
				flg &= (filters[key].indexOf(e[key])>=0);
			});
			return flg;
		});

		cols.forEach(function(cols){
			var filter= filters[cols.data];
			var th = document.querySelector("tr.filter th."+cols.data);
			th.innerHTML="";
			if(filter){
				filter.forEach(function(e,idx){
					var button = document.createElement("button");
					var obj={};
					obj[cols.data]=e;
					button.textContent=cols.disp?cols.disp(obj,button):e;
					button.onclick=function(){
						filter.splice(idx,1);
						tmp.setFilter(cols.data,filter)
					};
					th.appendChild(button);
				});
				
			}
		});

		
		//ソート
		data.sort(function(a,b){
			var result=0;
			sort.some(function(e){
			
				if(e.indexOf("!")!=0){
					result =a[e]> b[e]?1:-1;
				}else{
					e = e.substr(1);
					result =a[e]< b[e]?1:-1;
				}
				if(a[e] !== b[e]){return true;}
			});
			return result;
		});


	//ボディ作る
		var tbody = document.querySelector("#sub_body");
		tbody.innerHTML="";

		for(var i=0;i<data.length;i++){
			var rowdata = data[i];
			var tr;
			tr = document.createElement("tr");

			var th = document.createElement("th");
			th.className="pick";
			var span = document.createElement("button");
			span.textContent = "選択";
			span.className="pick";
			span.onclick=(function(r){return function(e){tmp.close(r);}})(rowdata);
			th.appendChild(span);
			tr.appendChild(th);

			cols.forEach(function(col){
				var td = document.createElement("td");
				var content =  typeof col.disp == "function"?col.disp(rowdata,td):rowdata[col.data];
				td.classList.add(col.data);
				if(col.class){
					td.classList.add(col.class);
				}
				if(content===0){
					td.classList.add("zero");
				}
				if(content<0){
					td.classList.add("minus");
				}
				var span = td;//document.createElement("span");
				span.innerHTML= content;
				//td.appendChild(span);
				if(col.filter){
					span.classList.add("filtertarget");
					span.onclick=(function(cd,value){return function(e){tmp.setFilter(cd,[value]);}})(col.data,rowdata[col.data]);
				}
				tr.appendChild(td);
			});


			tbody.appendChild(tr);
		}


	}
	setFilter(name,value){
		var filter = this.filter;
		if(!value){
			delete filter[name];
		}else if(value.length===0){
			delete filter[name];
		}else{
			filter[name]=value;
		}

		this.createTable();
	}

	setSort(col){
		var data=col.data;
		var sort = this.sort;

		var idx = sort.indexOf(data);
		if(idx<0){
			idx = sort.indexOf("!"+data);
		}else{
			data = "!"+data;
		}
		if(idx>=0){
			sort.splice(idx,1);
		}else{
			if(col.sort<0){
				data = "!"+data;
			}
		}
		sort.unshift(data);
		this.createTable();

	}
}


