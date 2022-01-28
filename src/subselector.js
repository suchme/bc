//サブ画面
//
var html = `
	<div class="subwindow" id="subwindow" style="display:none;">
		<div style="" class="back">
		</div>
		<div style="" class="submain">
			<button class="closebutton">close</button>
			<table>
				<thead id="sub_head">
					<tr class="header_filter"></tr>
					<tr class="header_sort"></tr>
				</thead>
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
		this.rowhtml="";

		document.body.insertAdjacentHTML('beforeend',html);
		var back = document.body.querySelector("#subwindow .back");
		back.addEventListener("click",(e)=>{this.close();});
		back = document.body.querySelector("#subwindow .closebutton");
		back.addEventListener("click",(e)=>{this.close();});

		this.dom = document.querySelector(".submain");
	}

	open(callback){
		this.close_callback=callback;
		var cols = this.cols;
		var tmp = this;


		//ヘッダ作る
		if(this.rowhtml !==""){
			this.rowhtml  = this.rowhtml.replace(/>\s+?</g,"><");

			document.querySelector(".header_filter").innerHTML="";
			document.querySelector(".header_sort").innerHTML="";
			var th = document.createElement("th");
			th.className="pick";
			document.querySelector(".header_filter").appendChild(th);
			th = document.createElement("th");
			th.className="pick";
			document.querySelector(".header_sort").appendChild(th);

			th = document.createElement("th");
			th.insertAdjacentHTML('beforeend',this.rowhtml);
			document.querySelector(".header_filter").appendChild(th);

			th = document.createElement("th");
			th.insertAdjacentHTML('beforeend',this.rowhtml);
			document.querySelector(".header_sort").appendChild(th);

			var dom = this.dom;
			cols.forEach(function(col){
				var th_sort = dom.querySelector(".header_sort [column='"+col.data+"']");
				if(!th_sort)return;
				var a= document.createElement("button");
				a.textContent=col.label?col.label:col.data;
				a.onclick=(function(cd){return function(e){tmp.setSort(cd);}})(col);
				th_sort.appendChild(a);

//				th_sort.classList.add(col.data);
				if(col.class){
					th_sort.classList.add(col.class);
				}
			});

			th = document.createElement("td");
			th.className="dummy_pick";
			document.querySelector(".header_filter").appendChild(th);
			th = document.createElement("td");
			th.className="dummy_pick";
			document.querySelector(".header_sort").appendChild(th);



		}else{
			var tr_sort = document.createElement("tr");
			tr_sort.classList.add("header_sort");
			var tr_filter = document.createElement("tr");
			tr_filter.classList.add("header_filter");

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
				th_filter.setAttribute("column",col.data);
				th_sort.setAttribute("column",col.data);
				if(col.class){
					th_filter.classList.add(col.class);
					th_sort.classList.add(col.class);
				}
				tr_filter.appendChild(th_filter);
				tr_sort.appendChild(th_sort);
			});
			var trs= document.querySelectorAll("#sub_head tr");
			trs[0].parentNode.replaceChild(tr_filter,trs[0]);
			trs[1].parentNode.replaceChild(tr_sort,trs[1]);
			
			th = document.createElement("th");
			th.className="dummy_pick";
			tr_filter.appendChild(th);
			th = document.createElement("th");
			th.className="dummy_pick";
			tr_sort.appendChild(th);
		}




		this.createTable();
		var subwindow= document.querySelector("#subwindow");
		subwindow.style.display="block";
		


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
		
	var filRemoveFunc=function(e){
		var t = e.target;
		var cd = t.getAttribute("column");
		var value = t.getAttribute("content");
		if(!Number.isNaN(parseInt(value))){
			value = parseInt(value);
		}
		tmp.removeFilter(cd,value);
	};

		var filters = this.filter;
		var sort = this.sort;
		var keys = Object.keys(filters);
		var source = this.source;
		var cols = this.cols;

		//フィルタ
		var data= source.filter(function(e){
			var flg=true;
			keys.forEach(function(key){
				var data = e[key];
				if(Array.isArray(data)){
					filters[key].forEach((fil)=>{
						flg &= (data.indexOf(fil)>=0);
					});
				}else{
					filters[key].forEach((fil)=>{
						flg &= (data == fil);
					});
				}
				return flg;
				
			});
			return flg;
		});

		cols.forEach(function(cols){
			var filter= filters[cols.data];
			var th = document.querySelector(".header_filter [column='"+cols.data+"']");
			if(!th)return;

			th.innerHTML="";
			if(filter){
				filter.forEach(function(e,idx){
					var button = document.createElement("button");
					th.appendChild(button);
					var obj={};
					obj[cols.data]=e;
					var content = cols.disp?cols.disp(obj,button,e):e;

					button.setAttribute("column",cols.data);
					button.setAttribute("content",content);
					button.onclick=filRemoveFunc;

					if(content === null){
						return;
						}
					if(content instanceof HTMLElement ){
						button.appendChild(content);
					}else{
						button.textContent=content;
					}
					var target = filter[idx];
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


		var filFunc=function(e){
			var t = e.target;
			var cd = t.getAttribute("column");
			var value = t.getAttribute("content");
			if(!Number.isNaN(parseInt(value))){
				value = parseInt(value);
			}
			tmp.setFilter(cd,[value]);
		};
	//ボディ作る
		var tbody = document.querySelector("#sub_body");
		tbody.innerHTML="";

		var template = document.createElement("tr");
		var th = document.createElement("th");
		th.className="pick";
		var span = document.createElement("button");
		span.textContent = "選択";
		span.className="pick";
		th.appendChild(span);
		template.appendChild(th);
		var td = document.createElement("td");
		td.insertAdjacentHTML('beforeend',this.rowhtml);
		template.appendChild(td);

		var th = document.createElement("td");
		th.className="dummy_pick";
		template.appendChild(th);

		data.forEach((e)=>{
			var rowdata = e;

			var clone = template.cloneNode(true);
			var span = clone.querySelector("button.pick");
			span.onclick=(function(r){return function(e){tmp.close(r);}})(rowdata);

			var template_columns ={};
			clone.querySelectorAll("[column]").forEach((e)=>{
				var column_name = e.getAttribute("column");
				template_columns[column_name]=e;
			});

			tbody.appendChild(clone);

			cols.forEach(function(col){
				var span= template_columns[col.data];
				if(!span)return;

				var data = rowdata[col.data];
					var content =  typeof col.disp === "function"?col.disp(rowdata,span,data):data;

					if(col.filter){
						span.classList.add("filtertarget");
						span.addEventListener("click",filFunc);
					}
					if(content === null){
						return;
					}
					var node = span;
					if(content instanceof HTMLElement ){
						span.appendChild(content);
					}else{
						node = span;
						node.setAttribute("content",data);
						node.textContent = content;
					}
			});
		});
		


	}
	removeFilter(name,value){
		var filter = this.filter[name];
		var idx = filter.indexOf(value);
		if(idx>=0){
			filter.splice(idx,1);
			this.createTable();
		}
	}
	setFilter(name,value){
		var filter = this.filter;
		if(!value){
			delete filter[name];
		}else if(value.length===0){
			delete filter[name];
		}else{
			if(!filter[name]){
				filter[name]=[];
			}
			filter[name]=filter[name].concat(value);
		}

		this.createTable();
	}

	setSort(col){
		var data=col.data;
		var sort = this.sort;
		if(col.sort === 0){
			return;
		}

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


