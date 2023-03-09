//环境建立
//npm install axios

//命令行
//node aliDir.js 目录深度0表示只列出第一级别999 应该能列出所有了  输入文件input.txt  输出文件outinfo.json
//例如 刷新顶层文件夹
//node aliDir.js 0 input.txt outinfo.json
//例如 刷新全部目录
//node aliDir.js 999 input.txt outinfo.json



const axios = require('axios')
var fs = require('fs');

function writefsync(name,str){
	fs.writeFileSync(name,str,(err)=>{if(err) console.log(err)});
}
var args = process.argv.splice(2)
function LOG(msg){
	console.log(msg);
}
function sleep(ms){
    return new Promise((r,j)=>{setTimeout(()=>{r();}, ms)});
}
let waitcount=0;
async function apireq(uri,msg,hd=null)
{
	let hds={
			"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
			"sec-ch-ua-platform":"Windows",
			"Accept":"application/json, text/plain, */*",
			"Origin":"https://www.aliyundrive.com",
			//Sec-Fetch-Site: same-site
			//Sec-Fetch-Mode: cors
			//Sec-Fetch-Dest: empty
			"Referer":"https://www.aliyundrive.com/"
		};
	if(hd!=null){
		Object.keys(hd).forEach((k)=>{
			hds[k]=hd[k];
		});
	}
	while(true){
		try{
			//LOG(uri);
			await sleep(1000);
			//LOG(msg);
			return await axios.post(uri,msg,{headers:hds});
		}
		catch(err){
			if(err.response.status===400){
				return {wokaocode:400};
			}
			else if(err.response.status===401){
				return {wokaocode:401};
			}
			else if(err.response.status===429){
				let waitms=Math.random()*3000+15*1000;
				LOG(`请求频繁被发现了，机智的我${waitcount>0?"又":""}要躲起来观察一会(等待${parseInt(waitms/1000)}秒再搞事情)`);
				waitcount++;
				savefile();
				await sleep(waitms);
			}
			else{
				LOG(err.response.status);
			}
		}
	}
	
}

async function listdir(ite,fileid,marker){
	let res=await apireq("https://api.aliyundrive.com/adrive/v2/file/list_by_share",
			{
			"share_id": ite.share_id,
			"parent_file_id": fileid,
			"limit": 20,
			//"image_thumbnail_process": "image/resize,w_256/format,jpeg",
			//"image_url_process": "image/resize,w_1920/format,jpeg/interlace,1",
			//"video_thumbnail_process": "video/snapshot,t_1000,f_jpg,ar_auto,w_256",
			"order_by": "name",
			"order_direction": "DESC",
			"marker":marker,
			},{"x-share-token":ite.share_token});
	return res.data;
}
var map_files={};

async function listall(ite,tracein,fileid="root",path="")
{
	ite["share_token"]=await get_share_token(ite);
	if(ite["share_token"]=="") return;
	if(path==""){
		path=ite.share_id;
	}
	let marker="";
	do{
		let objs=await listdir(ite,fileid,marker);
		marker=objs.next_marker;
		
		for(let i=0;i<objs.items.length;i++){
			o=objs.items[i];
			let npath=`${path}/${o.name}`;
			LOG(npath);
			map_files[npath]={
				share_id:o.share_id,
				name:o.name,
				parent_file_id:o.parent_file_id,
				type:o.type,
			};
			if(o.type=="folder"&&tracein>0){
				await listall(o,tracein-1,o.file_id,npath);
			}
		}
		
		//items
	}while(marker!="");
	
}

var map_share_token={};
async function get_share_token(ite)
{
	let pshare_id=ite.share_id;
	if(!map_share_token.hasOwnProperty(pshare_id)){
		LOG(ite);
		let res=await apireq(`https://api.aliyundrive.com/v2/share_link/get_share_token`,{"share_id":ite.share_id,"share_pwd":ite.share_pwd});
		if(res.hasOwnProperty("wokaocode")){
			map_share_token[pshare_id]="";
		}
		else{
			map_share_token[pshare_id]=res.data.share_token;
		}
	}
	return map_share_token[pshare_id];
}
async function get_share_by_anonymous(pshare_id)
{
	let res=await apireq(`https://api.aliyundrive.com/adrive/v3/share_link/get_share_by_anonymous?${pshare_id}`,{share_id: pshare_id});
	return res.data;
}


async function main()
{
	LOG(args);
	let tracein=0;
	tracein=parseInt(args[0]);
	let lines=fs.readFileSync(args[1],'utf-8').split("\n");
	for(let i=0;i<lines.length;i++){
		let linestr=lines[i];
		if(linestr.indexOf("www.aliyundrive.com/s/")!=-1){
			let shareid=linestr.split("www.aliyundrive.com/s/")[1];
			shareid=shareid.replace(/\s+/g,"").replace(/[\r\n]/g,"");
			LOG(shareid);
			await listall({
				share_id:shareid,
				share_pwd:"",
			},tracein);
		}
		
	}
	if(waitcount>10){
		LOG(`就这么会躲起来${waitcount}次，我太难了`);
	}
	savefile();
}
function savefile()
{
	writefsync(args[2]||"outinfo.json",JSON.stringify(map_files));
	writefsync(args[3]||"index.json",Object.keys(map_files).join("\n\r"));
	
}

main()
