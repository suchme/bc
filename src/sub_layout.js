var SubLayout={};

var pub=`
		<span column="atk" class="atk status "></span>
		<span column="def" class="def status "></span>
		<span column="spd" class="spd status "></span>
		<span column="dash" class="dash status  "></span>
		<span column="lp" class="lp status  "></span>
		<span column="bst" class="bst status "></span>
		<span class="sep"></span>
		<span column="extend" class="extend status "></span>
		<span column="increase" class="increase status "></span>
		<span column="cri" class="cri status "></span>
		<span column="cdef" class="cdef status "></span>
		<span column="sdef" class="sdef status "></span>
		<span column="ldef" class="ldef status "></span>
		<span column="recover" class="recover status "></span>
		<span class="sep"></span>
	<span class="cost">
		<span column="dash_cost" class="dash_cost status "></span>
		<span column="guard_cost" class="guard_cost status "></span>
		<span column="jump_cost" class="jump_cost status "></span>
		<span column="hover_cost" class="hover_cost status "></span>
	</span>
`

SubLayout.shinki_html =`
	<span>
	<div>
		<span class="rarelity" column="rarelity"></span>
		<span column="name" class="shinki"></span>
		<span column="short_regist" class="short_regist status"></span>
		<span column="long_regist" class="long_regist status"></span>
		<span column="height" class="height status"></span>
		<span column="expassive" class=""></span>
	</div>
	<div class="param">
${pub}
	<span class="short cat" >
		<span column="cat1" class=" status "></span>
		<span column="cat2" class=" status "></span>
		<span column="cat3" class=" status "></span>
		<span column="cat4" class=" status "></span>
		<span column="cat5" class=" status "></span>
		<span column="cat6" class=" status "></span>
		<span column="cat7" class=" status "></span>
		<span column="cat8" class=" status "></span>
	</span>
	<span class="long cat" >
		<span column="cat9" class="   status "></span>
		<span column="cat10" class="  status "></span>
		<span column="cat11" class="  status "></span>
		<span column="cat12" class="  status "></span>
		<span column="cat13" class="  status "></span>
		<span column="cat14" class="  status "></span>
		<span column="cat15" class="  status "></span>
	</span>
	<span class="bougu cat" >
		<span column="cat16" class=" status "></span>
		<span column="cat17" class=" status "></span>
	</span>
	</div>
	</span>
`;

SubLayout.head_html =`
	<span class="iconarea">
		<img column="icon">
		<span class="class" ></span>
	</span>
	<span class="namearea">
		<div class="info">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div class="param">
${pub}
		</div>
	</span>
	<span>
		<div>
			<span class="sep"></span>
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
		</div>
	</span>

`;
SubLayout.body_html =`
	<span class="iconarea">
		<img column="icon">
		<span class="class" ></span>
	</span>
	<span class="namearea">
		<div class="info">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div class="param">
${pub}
		</div>
	</span>
	<span class="sep"></span>
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.arm_html =`
	<span class="iconarea">
		<img column="icon">
		<span class="class" ></span>
	</span>
	<span class="namearea">
		<div class="info">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div class="param">
${pub}
		</div>
	</span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.leg_html =`
	<span class="iconarea">
		<img column="icon">
		<span class="class" ></span>
	</span>
	<span class="namearea">
		<div class="info">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div class="param">
${pub}
		</div>
	</span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.rear_html =`
	<span class="iconarea">
		<img column="icon">
		<span class="class" ></span>
	</span>
	<span class="namearea">
		<div class="info">
			<span class="part" column="part"></span>
			<span column="flying" class="flying"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div class="param">
		${pub}
		</div>
	</span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.weapon_html =`
	<span>
		<div class="info">
			<span class="part" column="part"></span>
			<span class="category" column="category"></span>
			<span class="distance" column="distance"></span>
			<span class="class" column="class"></span>
		</div>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		<span class="active" column="active"></span>
		<span class="biko" column="biko"></span>
		</div>
		<div class="param">
${pub}
			<span class="sep"></span>
				<span column="recast" class="guarge">
					<span></span>
					<span class="guarge_parent">
						<div class="guarge_child" ></div>
					</span>
				</span>
				<span column="reload" class="guarge">
					<span></span>
					<span class="guarge_parent">
						<div class="guarge_child" ></div>
					</span>
				</span>
				<span column="range" class="guarge">
					<span></span>
					<span class="guarge_parent">
						<div class="guarge_child" ></div>
					</span>
				</span>
				<span column="bullet_spd" class="bullet_spd "></span>
				<span column="bullet_num" class="bullet_num"></span>
		</div>
	</span>
	<span>
	</span>
`;

SubLayout.arr=[
	SubLayout.shinki_html
	,SubLayout.head_html
	,SubLayout.body_html
	,SubLayout.arm_html
	,SubLayout.leg_html
	,SubLayout.rear_html
	,SubLayout.weapon_html
]


SubLayout.guarge = function(e,parent){
	var data=e[this.data];
	if(data<0){
		parent.children[1].children[0].style.width="0";
	}else{
		parent.children[1].children[0].style.width=data +"%";
	}
	parent.title=data*0.01;

	var node = parent.children[0];
	if(data===100){
		node.innerText="";
	}else{
		node.innerText=((1-data*0.01)*3).toFixed(2) +"sec";
	}
	return null;
};

SubLayout.guarge_range = function(e,parent){
	parent.children[1].children[0].style.width=e[this.data] +"%";

	var node = parent.children[0];
	node.innerText=(e[this.data]).toFixed(1);
	return null;
};
export default SubLayout ;
